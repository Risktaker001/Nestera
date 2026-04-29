import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum FailedEventStatus {
  PENDING_RETRY = 'pending_retry',
  DEAD = 'dead',
  REPLAYED = 'replayed',
  DISCARDED = 'discarded',
}

/**
 * General-purpose Dead Letter Queue record for events whose
 * EventEmitter2 listeners failed after all retry attempts were exhausted.
 *
 * Distinct from `DeadLetterEvent`, which is scoped to raw Soroban indexer events.
 */
@Entity('failed_events')
@Index('idx_failed_events_status_created', ['status', 'createdAt'])
@Index('idx_failed_events_event_name', ['eventName'])
export class FailedEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  eventName: string;

  /** Original event payload, serialised. */
  @Column({ type: 'jsonb' })
  payload: unknown;

  @Column({ type: 'text', nullable: true })
  errorMessage: string | null;

  @Column({ type: 'text', nullable: true })
  errorStack: string | null;

  @Column({ type: 'int', default: 0 })
  attempts: number;

  @Column({ type: 'int', default: 3 })
  maxAttempts: number;

  @Column({
    type: 'enum',
    enum: FailedEventStatus,
    default: FailedEventStatus.PENDING_RETRY,
  })
  status: FailedEventStatus;

  /** Optional source identifier (service, module) that emitted the event. */
  @Column({ type: 'varchar', length: 255, nullable: true })
  source: string | null;

  /** Optional correlation id for distributed tracing. */
  @Column({ type: 'varchar', length: 255, nullable: true })
  correlationId: string | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastAttemptAt: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  nextRetryAt: Date | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
