# Database connection pooling

TypeORM connections are managed by a single source of truth:
`backend/src/config/typeorm-options.factory.ts`. It is wired into
`AppModule` via `TypeOrmModule.forRootAsync(...)` and applies the same pool
settings whether the app is configured by `DATABASE_URL` or by `DB_HOST`.

Runtime monitoring lives in
`backend/src/common/database/connection-pool.config.ts`
(`ConnectionPoolService`) and is exposed for ops via
`GET /health/pool/metrics` and the Terminus indicator at `GET /health`.

## Settings

All knobs are optional. Sensible defaults apply when unset.

| Env var | Default (prod / dev) | Pool-level field | Purpose |
|---|---|---|---|
| `DB_POOL_MAX` | `30` / `10` | `extra.max` | Max concurrent connections per pool |
| `DB_POOL_MIN` | `5` / `2` | `extra.min` | Connections kept warm when idle |
| `DB_POOL_IDLE_TIMEOUT_MS` | `30000` | `extra.idleTimeoutMillis` | Idle client eviction window |
| `DB_POOL_CONNECTION_TIMEOUT_MS` | `5000` | `extra.connectionTimeoutMillis` | Time the app waits for a free connection before erroring |
| `DB_STATEMENT_TIMEOUT_MS` | `30000` | `extra.statement_timeout` | PostgreSQL `statement_timeout` per session |
| `DB_QUERY_TIMEOUT_MS` | `30000` | `extra.query_timeout` | Driver-side query timeout |
| `DB_READ_HOSTS` | unset | `replication.slaves` | Comma-separated host[:port] list of read replicas (host-based mode only) |

### Picking pool size

Postgres allocates ~10MB per backend, so `DB_POOL_MAX × replicas of this
service` should stay well below the database's `max_connections`. As a
starting point: `min(2 × CPU cores on the database, 30)` per app instance.
Tune by watching `GET /health/pool/metrics` under load.

If the rolling utilisation sits ≥ 80% or `waitingRequests > 0`, raise
`DB_POOL_MAX` (and inspect for connection leaks). If utilisation hovers near
0 with many idle connections, lower `DB_POOL_MIN` to release them.

## Read/write split

When `DB_READ_HOSTS` is set in host-based mode, the factory returns a
`replication` config: SELECTs go round-robin to replicas, writes always go to
`DB_HOST`. In `DATABASE_URL` mode the factory keeps the URL as-is — split
read traffic at the platform layer (PgBouncer, RDS Proxy, etc.) so connection
strings still resolve.

Each replica gets its own pool with the same `extra.*` settings, so
`DB_POOL_MAX` is the per-pool ceiling, not a global ceiling.

## Health checks and metrics

- `GET /health` and `GET /health/ready` include `database_pool`, which calls
  `SELECT 1` against the master and surfaces leak warnings when active
  connections approach `DB_POOL_MAX`.
- `GET /health/pool/metrics?window=5` returns the latest sample plus a
  rolling utilisation average over the requested window (minutes, default 5).
  Sample shape:

  ```json
  {
    "current": {
      "activeConnections": 4,
      "idleConnections": 6,
      "waitingRequests": 0,
      "totalConnections": 10,
      "maxConnections": 30,
      "utilizationPercentage": 13.33,
      "timestamp": "2026-04-29T12:34:56.000Z"
    },
    "averageUtilization": 18.7,
    "windowMinutes": 5,
    "samples": 240
  }
  ```

- Internally, `ConnectionPoolService` samples every 30 seconds and warns when
  utilisation crosses 80% or the wait queue exceeds 5 — those warnings are
  emitted via the standard Nest logger.

## Operational notes

- The factory throws if neither `DATABASE_URL` nor `DB_HOST` is set, so
  bad configs fail fast at boot rather than at first query.
- `synchronize` stays off in production regardless of pool settings; schema
  changes go through the migrations under `backend/src/migrations/`.
- The metrics collector uses `setInterval(...).unref()` so it does not keep
  the Node process alive on shutdown.
