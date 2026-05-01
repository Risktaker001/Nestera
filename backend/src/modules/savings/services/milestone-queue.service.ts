import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MilestoneService } from './milestone.service';

interface MilestoneJob {
  goalId: string;
  userId: string;
  percentageComplete: number;
  attempts: number;
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;
const BATCH_SIZE = 10;
const FLUSH_INTERVAL_MS = 500;

/**
 * In-process async queue for milestone detection.
 * Batches jobs and processes them outside the request lifecycle.
 * Uses EventEmitter2 to emit milestone.achieved events (delegated to MilestoneService).
 */
@Injectable()
export class MilestoneQueueService implements OnModuleDestroy {
  private readonly logger = new Logger(MilestoneQueueService.name);
  private readonly queue: MilestoneJob[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private processing = false;

  constructor(
    private readonly milestoneService: MilestoneService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.scheduleFlush();
  }

  enqueue(goalId: string, userId: string, percentageComplete: number): void {
    this.queue.push({ goalId, userId, percentageComplete, attempts: 0 });
  }

  onModuleDestroy(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
    }
  }

  private scheduleFlush(): void {
    this.flushTimer = setTimeout(() => {
      this.flush().finally(() => this.scheduleFlush());
    }, FLUSH_INTERVAL_MS);
  }

  private async flush(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;

    const batch = this.queue.splice(0, BATCH_SIZE);

    await Promise.all(
      batch.map((job) => this.processJob(job)),
    );

    this.processing = false;
  }

  private async processJob(job: MilestoneJob): Promise<void> {
    try {
      const achieved = await this.milestoneService.detectAndAchieveMilestones(
        job.goalId,
        job.userId,
        job.percentageComplete,
      );

      if (achieved.length > 0) {
        this.eventEmitter.emit('milestone.batch.achieved', {
          goalId: job.goalId,
          userId: job.userId,
          milestones: achieved,
        });
      }
    } catch (err) {
      if (job.attempts < MAX_RETRIES) {
        job.attempts++;
        this.logger.warn(
          `Milestone job failed for goal ${job.goalId}, retry ${job.attempts}/${MAX_RETRIES}: ${(err as Error).message}`,
        );
        setTimeout(() => this.queue.push(job), RETRY_DELAY_MS * job.attempts);
      } else {
        this.logger.error(
          `Milestone job permanently failed for goal ${job.goalId} after ${MAX_RETRIES} retries: ${(err as Error).message}`,
        );
        this.eventEmitter.emit('milestone.detection.failed', {
          goalId: job.goalId,
          userId: job.userId,
          error: (err as Error).message,
        });
      }
    }
  }
}
