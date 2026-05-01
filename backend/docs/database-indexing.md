# Database indexing strategy

This backend uses PostgreSQL with TypeORM. Migrations under `src/migrations/`
are the source of truth for production schema; entity `@Index()` decorators
keep the ORM model aligned with the database.

## Principles

1. **Foreign keys and ownership** — index columns used in `WHERE` / `JOIN`
   for parent keys (e.g. `userId`, `proposalId`).
2. **Filters and sorts** — add composite indexes that match common predicates
   together (e.g. `(userId, status)` for "this user's active subscriptions").
3. **Uniqueness** — prefer `UNIQUE` constraints where appropriate; PostgreSQL
   builds a btree index for each unique constraint, so do not duplicate that
   with a second single-column index unless there is a measured need.
4. **New entities** — when adding a table, add explicit indexes in the same
   migration that creates the table (or in an immediate follow-up). Mirror
   them with `@Index()` on the entity so the ORM model matches.
5. **Naming** — use lowercase `idx_<table>_<columns>` for non-unique indexes
   so migrations stay grep-friendly.

## Issue #660 indexes

Added by migration `1800000000000-AddFrequentQueryIndexes`.

| Table | Indexes |
|------|---------|
| `users` | `email`, `publicKey`, `walletAddress` already have btree indexes via their `UNIQUE` constraints — no extra indexes added. |
| `user_subscriptions` | `(userId, status)`, `(productId, status)`, `(userId, productId)` |
| `savings_goals` | `(userId, status)` |
| `transactions` | `(userId, status)`, `(status)` — `userId` and `txHash` already covered by existing index / unique constraint. |
| `governance_proposals` | `(status)`, `(status, onChainId)` |
| `votes` | `(proposalId, walletAddress)` for proposal-scoped reads. Existing unique `(walletAddress, proposalId)` is unchanged. |

## Verifying performance

On a staging database with representative row counts:

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM user_subscriptions
WHERE "userId" = $1 AND status = 'ACTIVE';
```

Compare plans before and after applying migration `AddFrequentQueryIndexes1800000000000`.
Prefer index scans over sequential scans on large tables for these predicates.

## Production rollouts on large tables

For very large tables, `CREATE INDEX` takes an exclusive lock for the duration
of the build. Consider running heavy index creation during a maintenance window,
or use `CREATE INDEX CONCURRENTLY` outside a transaction (TypeORM's default
migration transaction must be disabled for that statement via
`transaction = false` on the migration).
