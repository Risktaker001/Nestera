import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Queue } from 'bull';
import { FindManyOptions, FindOptionsWhere, Repository } from 'typeorm';
import { FailedEvent, FailedEventStatus } from './entities/failed-event.entity';
import {
  EVENT_DLQ_QUEUE,
  EVENT_DLQ_RETRY_JOB,
  MAX_BACKOFF_MS,
} from './event-bus.constants';

export interface RecordFailureInput {
  eventName: string;
  payload: unknown;
  error: Error;
  attempts: number;
  maxAttempts: number;
  source?: string;
  correlationId?: string;
}

export interface ListFailedEventsQuery {
  status?: FailedEventStatus;
  eventName?: string;
  limit?: number;
  offset?: number;
}

export interface FailedEventStats {
  total: number;
  byStatus: Record<FailedEventStatus, number>;
  byEventName: Array<{ eventName: string; count: number }>;
  oldestPending: Date | null;
}

/**
 * Persists failed events to the database, drives async Bull-backed retries
 * (when Redis is configured) and exposes replay/monitoring helpers.
 */
@Injectable()
export class EventDlqService {
  private readonly logger = new Logger(EventDlqService.name);

  constructor(
    @InjectRepository(FailedEvent)
    private readonly failedEventRepo: Repository<FailedEvent>,
    private readonly eventEmitter: EventEmitter2,
    @Optional()
    @Inject(`BullQueue_${EVENT_DLQ_QUEUE}`)
    private readonly retryQueue: Queue | null,
  ) {}

  /**
   * Persist a failed event to the DLQ. If Bull is configured, enqueue an async
   * retry job with exponential backoff; otherwise mark it dead immediately.
   */
  async recordFailure(input: RecordFailureInput): Promise<FailedEvent> {
    const status = this.retryQueue
      ? FailedEventStatus.PENDING_RETRY
      : FailedEventStatus.DEAD;

    const failed = this.failedEventRepo.create({
      eventName: input.eventName,
      payload: input.payload ?? null,
      errorMessage: input.error?.message ?? null,
      errorStack: input.error?.stack ?? null,
      attempts: input.attempts,
      maxAttempts: input.maxAttempts,
      status,
      source: input.source ?? null,
      correlationId: input.correlationId ?? null,
      lastAttemptAt: new Date(),
    });

    const saved = await this.failedEventRepo.save(failed);

    this.logger.warn(
      `Event "${input.eventName}" failed after ${input.attempts} attempt(s). DLQ id=${saved.id}, status=${status}, error="${input.error?.message ?? 'unknown'}"`,
    );

    if (this.retryQueue) {
      await this.scheduleRetry(saved);
    }

    return saved;
  }

  /**
   * Replay a single DLQ entry by re-emitting it through the event bus.
   * Idempotent listeners are required for safe replay.
   */
  async replay(id: string): Promise<{ success: boolean; error?: string }> {
    const record = await this.failedEventRepo.findOne({ where: { id } });
    if (!record) {
      return { success: false, error: 'Failed event not found' };
    }

    if (record.status === FailedEventStatus.REPLAYED) {
      return { success: true };
    }

    try {
      const results = await this.eventEmitter.emitAsync(
        record.eventName,
        record.payload,
      );

      const handlerError = (results ?? []).find((r) => r instanceof Error);
      if (handlerError) {
        throw handlerError;
      }

      record.status = FailedEventStatus.REPLAYED;
      record.lastAttemptAt = new Date();
      record.errorMessage = null;
      record.errorStack = null;
      await this.failedEventRepo.save(record);
      return { success: true };
    } catch (err) {
      const error = err as Error;
      record.attempts += 1;
      record.lastAttemptAt = new Date();
      record.errorMessage = error.message;
      record.errorStack = error.stack ?? null;
      await this.failedEventRepo.save(record);
      return { success: false, error: error.message };
    }
  }

  async replayMany(ids: string[]): Promise<{
    replayed: string[];
    failed: Array<{ id: string; error: string }>;
  }> {
    const replayed: string[] = [];
    const failed: Array<{ id: string; error: string }> = [];

    for (const id of ids) {
      const result = await this.replay(id);
      if (result.success) {
        replayed.push(id);
      } else {
        failed.push({ id, error: result.error ?? 'unknown' });
      }
    }

    return { replayed, failed };
  }

  async discard(id: string): Promise<boolean> {
    const result = await this.failedEventRepo.update(
      { id },
      { status: FailedEventStatus.DISCARDED },
    );
    return (result.affected ?? 0) > 0;
  }

  async list(query: ListFailedEventsQuery = {}): Promise<{
    items: FailedEvent[];
    total: number;
  }> {
    const where: FindOptionsWhere<FailedEvent> = {};
    if (query.status) where.status = query.status;
    if (query.eventName) where.eventName = query.eventName;

    const options: FindManyOptions<FailedEvent> = {
      where,
      take: Math.min(query.limit ?? 50, 200),
      skip: query.offset ?? 0,
      order: { createdAt: 'DESC' },
    };

    const [items, total] = await this.failedEventRepo.findAndCount(options);
    return { items, total };
  }

  async getOne(id: string): Promise<FailedEvent | null> {
    return this.failedEventRepo.findOne({ where: { id } });
  }

  async getStats(): Promise<FailedEventStats> {
    const [byStatusRaw, byNameRaw, oldestPendingRow, total] = await Promise.all(
      [
        this.failedEventRepo
          .createQueryBuilder('e')
          .select('e.status', 'status')
          .addSelect('COUNT(*)', 'count')
          .groupBy('e.status')
          .getRawMany<{ status: FailedEventStatus; count: string }>(),
        this.failedEventRepo
          .createQueryBuilder('e')
          .select('e.eventName', 'eventName')
          .addSelect('COUNT(*)', 'count')
          .groupBy('e.eventName')
          .orderBy('count', 'DESC')
          .limit(20)
          .getRawMany<{ eventName: string; count: string }>(),
        this.failedEventRepo
          .createQueryBuilder('e')
          .select('MIN(e.createdAt)', 'oldest')
          .where('e.status = :status', {
            status: FailedEventStatus.PENDING_RETRY,
          })
          .getRawOne<{ oldest: Date | null }>(),
        this.failedEventRepo.count(),
      ],
    );

    const byStatus: Record<FailedEventStatus, number> = {
      [FailedEventStatus.PENDING_RETRY]: 0,
      [FailedEventStatus.DEAD]: 0,
      [FailedEventStatus.REPLAYED]: 0,
      [FailedEventStatus.DISCARDED]: 0,
    };
    for (const row of byStatusRaw) {
      byStatus[row.status] = Number(row.count);
    }

    return {
      total,
      byStatus,
      byEventName: byNameRaw.map((r) => ({
        eventName: r.eventName,
        count: Number(r.count),
      })),
      oldestPending: oldestPendingRow?.oldest ?? null,
    };
  }

  /**
   * Called by the Bull processor when an async retry job runs.
   * Re-emits the event and updates DLQ state accordingly.
   */
  async runRetryJob(failedEventId: string): Promise<void> {
    const record = await this.failedEventRepo.findOne({
      where: { id: failedEventId },
    });
    if (!record || record.status !== FailedEventStatus.PENDING_RETRY) {
      return;
    }

    try {
      const results = await this.eventEmitter.emitAsync(
        record.eventName,
        record.payload,
      );
      const handlerError = (results ?? []).find((r) => r instanceof Error);
      if (handlerError) {
        throw handlerError;
      }

      record.status = FailedEventStatus.REPLAYED;
      record.lastAttemptAt = new Date();
      record.errorMessage = null;
      record.errorStack = null;
      await this.failedEventRepo.save(record);
      this.logger.log(
        `Async retry succeeded for event "${record.eventName}" (id=${record.id})`,
      );
    } catch (err) {
      const error = err as Error;
      record.attempts += 1;
      record.lastAttemptAt = new Date();
      record.errorMessage = error.message;
      record.errorStack = error.stack ?? null;

      if (record.attempts >= record.maxAttempts) {
        record.status = FailedEventStatus.DEAD;
        this.logger.error(
          `Async retry exhausted for event "${record.eventName}" (id=${record.id}). Marking dead.`,
        );
      }

      await this.failedEventRepo.save(record);

      if (record.status === FailedEventStatus.PENDING_RETRY) {
        throw error;
      }
    }
  }

  private async scheduleRetry(record: FailedEvent): Promise<void> {
    if (!this.retryQueue) return;

    const delay = Math.min(
      Math.pow(2, Math.max(record.attempts - 1, 0)) * 1000,
      MAX_BACKOFF_MS,
    );

    record.nextRetryAt = new Date(Date.now() + delay);
    await this.failedEventRepo.save(record);

    await this.retryQueue.add(
      EVENT_DLQ_RETRY_JOB,
      { failedEventId: record.id },
      {
        delay,
        attempts: Math.max(record.maxAttempts - record.attempts, 1),
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
  }
}
