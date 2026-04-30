import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { EventDlqService } from './event-dlq.service';
import { EVENT_DLQ_QUEUE, EVENT_DLQ_RETRY_JOB } from './event-bus.constants';

interface RetryJobData {
  failedEventId: string;
}

@Processor(EVENT_DLQ_QUEUE)
export class EventDlqProcessor {
  private readonly logger = new Logger(EventDlqProcessor.name);

  constructor(private readonly dlqService: EventDlqService) {}

  @Process(EVENT_DLQ_RETRY_JOB)
  async handleRetry(job: Job<RetryJobData>): Promise<void> {
    const { failedEventId } = job.data;
    this.logger.debug(
      `Processing retry job ${job.id} for failed event ${failedEventId} (Bull attempt ${job.attemptsMade + 1})`,
    );
    await this.dlqService.runRetryJob(failedEventId);
  }
}
