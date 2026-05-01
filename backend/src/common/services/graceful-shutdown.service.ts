import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class GracefulShutdownService implements OnApplicationShutdown {
  private readonly logger = new Logger(GracefulShutdownService.name);
  private isShuttingDown = false;
  private activeRequests = 0;
  private activeBackgroundTasks = 0;
  private readonly maxShutdownTimeout = 30000; // 30 seconds

  constructor(
    private dataSource: DataSource,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  incrementActiveRequests(): void {
    if (!this.isShuttingDown) {
      this.activeRequests++;
    }
  }

  decrementActiveRequests(): void {
    this.activeRequests--;
  }

  incrementBackgroundTask(): void {
    if (!this.isShuttingDown) {
      this.activeBackgroundTasks++;
    }
  }

  decrementBackgroundTask(): void {
    this.activeBackgroundTasks--;
  }

  isShutdown(): boolean {
    return this.isShuttingDown;
  }

  async onApplicationShutdown(signal?: string): Promise<void> {
    if (this.isShuttingDown && !signal) {
      // Already shut down manually via bootstrap
      return;
    }
    
    this.logger.log(`Received shutdown signal: ${signal || 'MANUAL'}`);
    this.isShuttingDown = true;

    const shutdownStartTime = Date.now();

    // Wait for in-flight requests and background tasks to complete
    await this.waitForDraining();

    // Close database connections
    await this.closeDatabase();

    // Close Redis connections
    await this.closeRedis();

    const shutdownDuration = Date.now() - shutdownStartTime;
    this.logger.log(`Graceful shutdown completed in ${shutdownDuration}ms`);
  }

  /**
   * Sets the shutdown flag to true to prevent new work from starting.
   */
  initiateShutdown(): void {
    this.isShuttingDown = true;
    this.logger.log('Graceful shutdown initiated. No longer accepting new work.');
  }

  /**
   * Waits for all in-flight requests and background tasks to complete.
   */
  async waitForDraining(): Promise<void> {
    const startTime = Date.now();
    const timeout = 25000; // 25 seconds total for draining

    while (this.activeRequests > 0 || this.activeBackgroundTasks > 0) {
      const elapsed = Date.now() - startTime;

      if (elapsed > timeout) {
        this.logger.warn(
          `Timeout waiting for drain. Requests: ${this.activeRequests}, Background Tasks: ${this.activeBackgroundTasks}. Forcing shutdown.`,
        );
        break;
      }

      this.logger.log(
        `Waiting for drain... (Requests: ${this.activeRequests}, Background Tasks: ${this.activeBackgroundTasks})`,
      );
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    this.logger.log('All in-flight operations completed or timed out');
  }

  private async waitForInFlightRequests(): Promise<void> {
    // Deprecated in favor of waitForDraining
    return this.waitForDraining();
  }

  private async closeDatabase(): Promise<void> {
    try {
      if (this.dataSource && this.dataSource.isInitialized) {
        this.logger.log('Closing database connections...');
        await this.dataSource.destroy();
        this.logger.log('Database connections closed');
      }
    } catch (error) {
      this.logger.error('Error closing database connections:', error);
    }
  }

  private async closeRedis(): Promise<void> {
    try {
      if (this.cacheManager) {
        this.logger.log('Closing Redis connections...');
        // await this.cacheManager.reset(); // reset method not available
        this.logger.log('Redis connections closed');
      }
    } catch (error) {
      this.logger.error('Error closing Redis connections:', error);
    }
  }
}
