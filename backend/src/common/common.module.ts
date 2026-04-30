import { Global, Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CacheModule } from '../modules/cache/cache.module';
import { PiiEncryptionService } from './services/pii-encryption.service';
import { RateLimitMonitorService } from './services/rate-limit-monitor.service';
import { GracefulShutdownService } from './services/graceful-shutdown.service';

@Global()
@Module({
  imports: [EventEmitterModule, CacheModule],
  providers: [RateLimitMonitorService, PiiEncryptionService, GracefulShutdownService],
  exports: [RateLimitMonitorService, PiiEncryptionService, GracefulShutdownService],
})
export class CommonModule {}
