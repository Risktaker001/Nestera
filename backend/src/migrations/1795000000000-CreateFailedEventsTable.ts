import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFailedEventsTable1795000000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE failed_event_status_enum AS ENUM (
        'pending_retry', 'dead', 'replayed', 'discarded'
      );

      CREATE TABLE failed_events (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "eventName"     VARCHAR(255) NOT NULL,
        payload         JSONB NOT NULL,
        "errorMessage"  TEXT,
        "errorStack"    TEXT,
        attempts        INT NOT NULL DEFAULT 0,
        "maxAttempts"   INT NOT NULL DEFAULT 3,
        status          failed_event_status_enum NOT NULL DEFAULT 'pending_retry',
        source          VARCHAR(255),
        "correlationId" VARCHAR(255),
        "lastAttemptAt" TIMESTAMP WITH TIME ZONE,
        "nextRetryAt"   TIMESTAMP WITH TIME ZONE,
        "createdAt"     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt"     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      );

      CREATE INDEX idx_failed_events_status_created
        ON failed_events (status, "createdAt" DESC);

      CREATE INDEX idx_failed_events_event_name
        ON failed_events ("eventName");
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS failed_events;
      DROP TYPE IF EXISTS failed_event_status_enum;
    `);
  }
}
