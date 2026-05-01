# Backend E2E Test Plan

Critical E2E paths:
1. Authentication flow
2. Wallet linking lifecycle
3. Savings subscription lifecycle
4. Withdrawal process
5. Governance proposal + voting
6. Transaction processing

## Test environment
- PostgreSQL test database (`DATABASE_URL`)
- Redis test instance (`REDIS_URL`)
- Stellar testnet/soroban endpoints (or mocked adapters)

## Coverage target
- Minimum 80% of defined critical-path scenarios.

## Implementation notes
- Reuse `backend/test/factories/e2e.factory.ts` for deterministic test data.
- Keep tests independent and idempotent.
- Use database cleanup hooks between suites.
