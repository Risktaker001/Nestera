import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionBatchStatus } from '../entities/transaction-batch.entity';
import { TransactionBatchOperationStatus } from '../entities/transaction-batch-operation.entity';

export class TransactionBatchOperationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  operationIndex: number;

  @ApiProperty()
  contractId: string;

  @ApiProperty()
  functionName: string;

  @ApiPropertyOptional({ type: [Object] })
  args: unknown[] | null;

  @ApiPropertyOptional()
  metadata: Record<string, unknown> | null;

  @ApiPropertyOptional()
  idempotencyKey: string | null;

  @ApiProperty({ enum: TransactionBatchOperationStatus })
  status: TransactionBatchOperationStatus;

  @ApiPropertyOptional()
  txHash: string | null;

  @ApiPropertyOptional()
  errorMessage: string | null;

  @ApiPropertyOptional()
  startedAt: Date | null;

  @ApiPropertyOptional()
  completedAt: Date | null;
}

export class TransactionBatchResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: TransactionBatchStatus })
  status: TransactionBatchStatus;

  @ApiProperty()
  requestedOperationCount: number;

  @ApiProperty()
  completedCount: number;

  @ApiProperty()
  failedCount: number;

  @ApiProperty()
  maxBatchSize: number;

  @ApiProperty({ type: [String] })
  transactionHashes: string[];

  @ApiProperty()
  estimatedIndividualFee: string;

  @ApiProperty()
  actualBatchFee: string;

  @ApiProperty()
  estimatedCostSavings: string;

  @ApiProperty()
  savingsPercentage: string;

  @ApiProperty()
  costMetricSource: string;

  @ApiPropertyOptional()
  errorMessage: string | null;

  @ApiPropertyOptional()
  metadata: Record<string, unknown> | null;

  @ApiPropertyOptional()
  startedAt: Date | null;

  @ApiPropertyOptional()
  completedAt: Date | null;

  @ApiProperty({ type: [TransactionBatchOperationResponseDto] })
  operations: TransactionBatchOperationResponseDto[];
}
