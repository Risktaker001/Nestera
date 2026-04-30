import { DynamicModule, Global, Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { FailedEvent } from './entities/failed-event.entity';
import { EventDlqService } from './event-dlq.service';
import { ResilientEventBus } from './resilient-event-bus.service';
import { EventDlqController } from './event-dlq.controller';
import { EventDlqProcessor } from './event-dlq.processor';
import { EVENT_DLQ_QUEUE } from './event-bus.constants';

/**
 * Wires the Resilient Event Bus + DLQ infrastructure.
 *
 * Bull-backed async retries are activated only when REDIS_URL is configured.
 * Without Redis, failed events are still recorded to the DB and can be
 * replayed manually via the admin endpoints — they are simply marked DEAD
 * immediately rather than retried in the background.
 */
@Global()
@Module({})
export class EventBusModule {
  private static readonly logger = new Logger(EventBusModule.name);

  static forRoot(): DynamicModule {
    const redisUrl = process.env.REDIS_URL;

    const bullImports = redisUrl
      ? [
          BullModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
              const url = config.get<string>('REDIS_URL');
              return {
                redis: url,
                defaultJobOptions: {
                  attempts: 3,
                  backoff: { type: 'exponential', delay: 1000 },
                  removeOnComplete: true,
                  removeOnFail: false,
                },
              };
            },
          }),
          BullModule.registerQueue({ name: EVENT_DLQ_QUEUE }),
        ]
      : [];

    if (!redisUrl) {
      this.logger.warn(
        'REDIS_URL not configured — Event DLQ will run without async Bull retries. Failed events will be persisted and available for manual replay only.',
      );
    }

    const providers = redisUrl
      ? [ResilientEventBus, EventDlqService, EventDlqProcessor]
      : [ResilientEventBus, EventDlqService];

    return {
      module: EventBusModule,
      imports: [TypeOrmModule.forFeature([FailedEvent]), ...bullImports],
      controllers: [EventDlqController],
      providers,
      exports: [ResilientEventBus, EventDlqService],
    };
  }
}
