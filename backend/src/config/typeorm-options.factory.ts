import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

/**
 * Pool tuning knobs read from environment.
 * `extra` is forwarded by typeorm to the underlying `pg.Pool`, so the keys
 * here are the names exposed by `node-postgres`.
 */
interface PoolExtras {
  max: number;
  min: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
  statement_timeout: number;
  query_timeout: number;
}

interface ReplicaTarget {
  host: string;
  port: number;
  username?: string;
  password?: string;
  database?: string;
}

function buildPoolExtras(
  config: ConfigService,
  isProduction: boolean,
): PoolExtras {
  return {
    max: config.get<number>('database.pool.max', isProduction ? 30 : 10),
    min: config.get<number>('database.pool.min', isProduction ? 5 : 2),
    idleTimeoutMillis: config.get<number>(
      'database.pool.idleTimeoutMs',
      30_000,
    ),
    connectionTimeoutMillis: config.get<number>(
      'database.pool.connectionTimeoutMs',
      5_000,
    ),
    statement_timeout: config.get<number>(
      'database.pool.statementTimeoutMs',
      30_000,
    ),
    query_timeout: config.get<number>('database.pool.queryTimeoutMs', 30_000),
  };
}

/**
 * Parse `DB_READ_HOSTS` (comma-separated host[:port]) into replica targets.
 * Empty / unset → no replicas; the factory will return a single-pool config.
 */
function parseReplicas(
  raw: string | undefined,
  defaultPort: number,
  username: string | undefined,
  password: string | undefined,
  database: string | undefined,
): ReplicaTarget[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [host, portRaw] = entry.split(':');
      const port = portRaw ? parseInt(portRaw, 10) : defaultPort;
      return { host, port, username, password, database };
    });
}

/**
 * Build the TypeOrmModuleOptions with explicit connection-pool configuration
 * and optional read-replica routing.
 *
 * Behaviour:
 * - Honours `DATABASE_URL` first (typical for managed/PaaS setups). When using
 *   a URL, replicas are not split out — the URL is the master and read
 *   replicas should be configured at the platform level (PgBouncer / RDS
 *   proxy) or via `DB_HOST`-based config below.
 * - Falls back to `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USER` / `DB_PASS`.
 * - When `DB_READ_HOSTS` is set in host-mode, returns a `replication` config
 *   so TypeORM routes SELECTs to replicas and writes to the master.
 */
export function createTypeOrmOptions(
  config: ConfigService,
): TypeOrmModuleOptions {
  const nodeEnv = config.get<string>('NODE_ENV', 'development');
  const isProduction = nodeEnv === 'production';
  const synchronize = !isProduction;

  const poolExtras = buildPoolExtras(config, isProduction);

  const url = config.get<string>('database.url');
  if (url) {
    return {
      type: 'postgres',
      url,
      autoLoadEntities: true,
      synchronize,
      extra: poolExtras,
    };
  }

  const host = config.get<string>('database.host');
  if (!host) {
    throw new Error(
      'Database configuration error: set either DATABASE_URL or DB_HOST in your environment.',
    );
  }

  const port = config.get<number>('database.port') ?? 5432;
  const username = config.get<string>('database.user');
  const password = config.get<string>('database.pass');
  const database = config.get<string>('database.name');

  const replicas = parseReplicas(
    config.get<string>('database.replicaHosts'),
    port,
    username,
    password,
    database,
  );

  if (replicas.length > 0) {
    return {
      type: 'postgres',
      replication: {
        master: { host, port, username, password, database },
        slaves: replicas,
      },
      autoLoadEntities: true,
      synchronize,
      extra: poolExtras,
    };
  }

  return {
    type: 'postgres',
    host,
    port,
    username,
    password,
    database,
    autoLoadEntities: true,
    synchronize,
    extra: poolExtras,
  };
}
