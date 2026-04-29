import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TransactionBatch } from './transaction-batch.entity';

export enum TransactionBatchOperationStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

@Entity('transaction_batch_operations')
@Index('idx_transaction_batch_operations_batch_order', [
  'batchId',
  'operationIndex',
])
export class TransactionBatchOperation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  batchId: string;

  @ManyToOne(() => TransactionBatch, (batch) => batch.operations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'batchId' })
  batch: TransactionBatch;

  @Column({ type: 'integer' })
  operationIndex: number;

  @Column({ type: 'varchar' })
  contractId: string;

  @Column({ type: 'varchar' })
  functionName: string;

  @Column({ type: 'jsonb', nullable: true })
  args: unknown[] | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ type: 'varchar', nullable: true })
  idempotencyKey: string | null;

  @Index('idx_transaction_batch_operations_status')
  @Column({
    type: 'enum',
    enum: TransactionBatchOperationStatus,
    default: TransactionBatchOperationStatus.PENDING,
  })
  status: TransactionBatchOperationStatus;

  @Column({ type: 'varchar', nullable: true })
  txHash: string | null;

  @Column({ type: 'varchar', nullable: true })
  errorMessage: string | null;

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
