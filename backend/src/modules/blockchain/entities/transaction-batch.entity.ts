import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TransactionBatchOperation } from './transaction-batch-operation.entity';

export enum TransactionBatchStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  PARTIAL_FAILED = 'PARTIAL_FAILED',
  FAILED = 'FAILED',
}

@Entity('transaction_batches')
export class TransactionBatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_transaction_batches_status')
  @Column({
    type: 'enum',
    enum: TransactionBatchStatus,
    default: TransactionBatchStatus.PENDING,
  })
  status: TransactionBatchStatus;

  @Column({ type: 'integer' })
  requestedOperationCount: number;

  @Column({ type: 'integer', default: 0 })
  completedCount: number;

  @Column({ type: 'integer', default: 0 })
  failedCount: number;

  @Column({ type: 'integer' })
  maxBatchSize: number;

  @Column('text', { array: true, default: () => 'ARRAY[]::text[]' })
  transactionHashes: string[];

  @Column({ type: 'varchar', default: '0' })
  estimatedIndividualFee: string;

  @Column({ type: 'varchar', default: '0' })
  actualBatchFee: string;

  @Column({ type: 'varchar', default: '0' })
  estimatedCostSavings: string;

  @Column({ type: 'decimal', precision: 9, scale: 4, default: 0 })
  savingsPercentage: string;

  @Column({ type: 'varchar', default: 'base_fee_estimate' })
  costMetricSource: string;

  @Column({ type: 'varchar', nullable: true })
  errorMessage: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => TransactionBatchOperation, (operation) => operation.batch, {
    cascade: true,
  })
  operations: TransactionBatchOperation[];
}
