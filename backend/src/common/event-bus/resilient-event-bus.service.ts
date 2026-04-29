import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventDlqService } from './event-dlq.service';
import {
  DEFAULT_BASE_BACKOFF_MS,
  DEFAULT_MAX_ATTEMPTS,
  MAX_BACKOFF_MS,
} from './event-bus.constants';

export interface ResilientEmitOptions {
  /** Maximum number of synchronous in-process attempts before parking in the DLQ. */
  maxAttempts?: number;
  /** Base backoff delay in ms; doubled on each subsequent attempt. */
  baseBackoffMs?: number;
  /** Identifier of the emitter (service or module) — surfaced in DLQ records. */
  source?: string;
  /** Optional correlation id for distributed tracing. */
  correlationId?: string;
}

export interface ResilientEmitResult {
  success: boolean;
  attempts: number;
  failedEventId?: string;
  error?: string;
}

/**
 * Drop-in companion to `EventEmitter2.emitAsync` that adds:
 *   - synchronous retry with exponential backoff when handlers reject
 *   - Dead Letter Queue persistence after retries are exhausted
 *
 * Listeners must be idempotent: a retry re-fires every listener for the event.
 * Existing call-sites are not migrated automatically — callers opt in by
 * injecting `ResilientEventBus` instead of `EventEmitter2`.
 */
@Injectable()
export class ResilientEventBus {
  private readonly logger = new Logger(ResilientEventBus.name);

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly dlqService: EventDlqService,
  ) {}

  async emit<T = unknown>(
    eventName: string,
    payload: T,
    options: ResilientEmitOptions = {},
  ): Promise<ResilientEmitResult> {
    const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
    const baseBackoff = options.baseBackoffMs ?? DEFAULT_BASE_BACKOFF_MS;

    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt < maxAttempts) {
      attempt += 1;
      try {
        const results = await this.eventEmitter.emitAsync(eventName, payload);

        const handlerError = (results ?? []).find((r) => r instanceof Error);
        if (handlerError) {
          throw handlerError;
        }

        if (attempt > 1) {
          this.logger.log(
            `Event "${eventName}" succeeded after ${attempt} attempt(s)`,
          );
        }
        return { success: true, attempts: attempt };
      } catch (err) {
        lastError = err as Error;
        if (attempt < maxAttempts) {
          const delay = Math.min(
            baseBackoff * Math.pow(2, attempt - 1),
            MAX_BACKOFF_MS,
          );
          this.logger.warn(
            `Event "${eventName}" attempt ${attempt}/${maxAttempts} failed: ${lastError.message}. Retrying in ${delay}ms`,
          );
          await this.sleep(delay);
        }
      }
    }

    const failed = await this.dlqService.recordFailure({
      eventName,
      payload,
      error: lastError ?? new Error('unknown event handler failure'),
      attempts: attempt,
      maxAttempts,
      source: options.source,
      correlationId: options.correlationId,
    });

    return {
      success: false,
      attempts: attempt,
      failedEventId: failed.id,
      error: lastError?.message,
    };
  }

  /**
   * Fire-and-forget variant — does not block the caller. Failures are still
   * captured to the DLQ and retried asynchronously when Bull is configured.
   */
  emitAndForget<T = unknown>(
    eventName: string,
    payload: T,
    options: ResilientEmitOptions = {},
  ): void {
    void this.emit(eventName, payload, options).catch((err) => {
      this.logger.error(
        `Unexpected ResilientEventBus error for "${eventName}": ${(err as Error).message}`,
      );
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
