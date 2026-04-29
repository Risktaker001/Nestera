import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTransactionBatchTables1799300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_batches_status_enum') THEN
          CREATE TYPE "transaction_batches_status_enum" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'PARTIAL_FAILED', 'FAILED');
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_batch_operations_status_enum') THEN
          CREATE TYPE "transaction_batch_operations_status_enum" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "transaction_batches" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "status" "transaction_batches_status_enum" NOT NULL DEFAULT 'PENDING',
        "requestedOperationCount" integer NOT NULL,
        "completedCount" integer NOT NULL DEFAULT 0,
        "failedCount" integer NOT NULL DEFAULT 0,
        "maxBatchSize" integer NOT NULL,
        "transactionHashes" text[] NOT NULL DEFAULT ARRAY[]::text[],
        "estimatedIndividualFee" varchar NOT NULL DEFAULT '0',
        "actualBatchFee" varchar NOT NULL DEFAULT '0',
        "estimatedCostSavings" varchar NOT NULL DEFAULT '0',
        "savingsPercentage" numeric(9,4) NOT NULL DEFAULT 0,
        "costMetricSource" varchar NOT NULL DEFAULT 'base_fee_estimate',
        "errorMessage" varchar,
        "metadata" jsonb,
        "startedAt" timestamp,
        "completedAt" timestamp,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "transaction_batch_operations" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "batchId" uuid NOT NULL,
        "operationIndex" integer NOT NULL,
        "contractId" varchar NOT NULL,
        "functionName" varchar NOT NULL,
        "args" jsonb,
        "metadata" jsonb,
        "idempotencyKey" varchar,
        "status" "transaction_batch_operations_status_enum" NOT NULL DEFAULT 'PENDING',
        "txHash" varchar,
        "errorMessage" varchar,
        "startedAt" timestamp,
        "completedAt" timestamp,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_transaction_batch_operations_batch'
        ) THEN
          ALTER TABLE "transaction_batch_operations"
          ADD CONSTRAINT "FK_transaction_batch_operations_batch"
          FOREIGN KEY ("batchId") REFERENCES "transaction_batches"("id") ON DELETE CASCADE;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_transaction_batches_status"
      ON "transaction_batches" ("status");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_transaction_batch_operations_status"
      ON "transaction_batch_operations" ("status");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_transaction_batch_operations_batch_order"
      ON "transaction_batch_operations" ("batchId", "operationIndex");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_transaction_batch_operations_batch_order";
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_transaction_batch_operations_status";
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_transaction_batches_status";
    `);

    await queryRunner.query(`
      ALTER TABLE "transaction_batch_operations"
      DROP CONSTRAINT IF EXISTS "FK_transaction_batch_operations_batch";
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS "transaction_batch_operations";
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS "transaction_batches";
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_batch_operations_status_enum') THEN
          DROP TYPE "transaction_batch_operations_status_enum";
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_batches_status_enum') THEN
          DROP TYPE "transaction_batches_status_enum";
        END IF;
      END
      $$;
    `);
  }
}
