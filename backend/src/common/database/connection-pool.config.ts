import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

export interface PoolMetrics {
  /** Total clients currently checked out and running queries. */
  activeConnections: number;
  /** Connections currently idle in the pool. */
  idleConnections: number;
  /** Requests waiting for a connection. > 0 means the pool is saturated. */
  waitingRequests: number;
  /** Total clients tracked by the pool (active + idle). */
  totalConnections: number;
  /** Configured max for the pool, used to compute utilisation. */
  maxConnections: number;
  /** active / max as a percentage (0–100). */
  utilizationPercentage: number;
  timestamp: Date;
}

export interface PoolStatsSnapshot {
  current: PoolMetrics | null;
  /** Average utilisation over the last `windowMinutes` minutes. */
  averageUtilization: number;
  windowMinutes: number;
  /** Length of the in-memory metrics history. */
  samples: number;
}

interface PgPoolLike {
  totalCount?: number;
  idleCount?: number;
  waitingCount?: number;
  options?: { max?: number };
}

interface DriverPools {
  master?: PgPoolLike;
  slaves?: PgPoolLike[];
  pool?: PgPoolLike;
}

@Injectable()
export class ConnectionPoolService {
  private readonly logger = new Logger(ConnectionPoolService.name);
  private readonly metrics: PoolMetrics[] = [];
  private readonly maxMetricsHistory = 1000;
  private readonly collectIntervalMs = 30_000;
  private readonly highUtilisationThreshold = 80;
  private readonly waitingRequestsThreshold = 5;
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {
    this.timer = setInterval(
      () => this.collectMetrics(),
      this.collectIntervalMs,
    );
    if (typeof this.timer.unref === 'function') {
      // Don't keep the process alive just for metrics collection.
      this.timer.unref();
    }
  }

  /** Resolve the master pg-pool from TypeORM's driver, regardless of replication mode. */
  private getMasterPool(): PgPoolLike | null {
    const driver = this.dataSource.driver as unknown as DriverPools;
    return driver.master ?? driver.pool ?? null;
  }

  private collectMetrics(): void {
    try {
      const pool = this.getMasterPool();
      if (!pool) return;

      const total = pool.totalCount ?? 0;
      const idle = pool.idleCount ?? 0;
      const waiting = pool.waitingCount ?? 0;
      const active = Math.max(0, total - idle);
      const max = pool.options?.max ?? this.configuredMax();

      const utilization = max > 0 ? (active / max) * 100 : 0;

      const snapshot: PoolMetrics = {
        activeConnections: active,
        idleConnections: idle,
        waitingRequests: waiting,
        totalConnections: total,
        maxConnections: max,
        utilizationPercentage: Number(utilization.toFixed(2)),
        timestamp: new Date(),
      };

      this.metrics.push(snapshot);
      if (this.metrics.length > this.maxMetricsHistory) {
        this.metrics.shift();
      }

      if (snapshot.utilizationPercentage > this.highUtilisationThreshold) {
        this.logger.warn(
          `High connection pool utilization: ${snapshot.utilizationPercentage}% (${active}/${max})`,
        );
      }

      if (snapshot.waitingRequests > this.waitingRequestsThreshold) {
        this.logger.warn(
          `Connection pool queue building up: ${snapshot.waitingRequests} waiting requests`,
        );
      }
    } catch (error) {
      this.logger.error('Failed to collect pool metrics', error as Error);
    }
  }

  private configuredMax(): number {
    return this.configService.get<number>('database.pool.max', 20);
  }

  getMetrics(): PoolMetrics[] {
    return [...this.metrics];
  }

  getLatestMetrics(): PoolMetrics | null {
    return this.metrics.length > 0
      ? this.metrics[this.metrics.length - 1]
      : null;
  }

  getAverageUtilization(minutes = 5): number {
    const cutoff = Date.now() - minutes * 60_000;
    const recent = this.metrics.filter((m) => m.timestamp.getTime() > cutoff);
    if (recent.length === 0) return 0;
    const sum = recent.reduce((acc, m) => acc + m.utilizationPercentage, 0);
    return Number((sum / recent.length).toFixed(2));
  }

  getStatsSnapshot(windowMinutes = 5): PoolStatsSnapshot {
    return {
      current: this.getLatestMetrics(),
      averageUtilization: this.getAverageUtilization(windowMinutes),
      windowMinutes,
      samples: this.metrics.length,
    };
  }

  async checkPoolHealth(): Promise<boolean> {
    try {
      const result = await this.dataSource.query('SELECT 1');
      return Array.isArray(result) && result.length > 0;
    } catch (error) {
      this.logger.error('Pool health check failed', error as Error);
      return false;
    }
  }

  /**
   * Returns the active-connection count when it is suspiciously close to the
   * configured max (≥ 90%). Persistent high values typically indicate a leak
   * (e.g. a code path that obtains a query runner but never releases it).
   */
  async detectConnectionLeaks(): Promise<number> {
    const pool = this.getMasterPool();
    if (!pool) return 0;

    const total = pool.totalCount ?? 0;
    const idle = pool.idleCount ?? 0;
    const active = Math.max(0, total - idle);
    const max = pool.options?.max ?? this.configuredMax();

    if (max > 0 && active >= max * 0.9) {
      this.logger.warn(
        `Potential connection leak detected: ${active}/${max} active connections`,
      );
      return active;
    }

    return 0;
  }
}
