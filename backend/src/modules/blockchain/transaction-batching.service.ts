import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { BASE_FEE } from '@stellar/stellar-sdk';
import { Repository } from 'typeorm';
import {
  ContractBatchExecutionResult,
  ContractBatchOperation,
  StellarService,
} from './stellar.service';
import {
  TransactionBatch,
  TransactionBatchStatus,
} from './entities/transaction-batch.entity';
import {
  TransactionBatchOperation as TransactionBatchOperationEntity,
  TransactionBatchOperationStatus,
} from './entities/transaction-batch-operation.entity';

const STELLAR_MAX_TRANSACTION_OPERATIONS = 100;
const DEFAULT_BATCH_MAX_SIZE = 25;
const MAX_REQUEST_OPERATIONS = 1000;

export interface BatchableContractOperation extends ContractBatchOperation {
  idempotencyKey?: string;
  clientKey?: string;
}

export interface CreateBatchOptions {
  maxBatchSize?: number;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class TransactionBatchingService {
  constructor(
    private readonly stellarService: StellarService,
    private readonly configService: ConfigService,
    @InjectRepository(TransactionBatch)
    private readonly batchRepository: Repository<TransactionBatch>,
    @InjectRepository(TransactionBatchOperationEntity)
    private readonly operationRepository: Repository<TransactionBatchOperationEntity>,
  ) {}

  async createAndProcessBatch(
    secretKey: string,
    operations: BatchableContractOperation[],
    options: CreateBatchOptions = {},
  ): Promise<TransactionBatch> {
    this.validateSecretKey(secretKey);
    this.validateOperations(operations);

    const maxBatchSize = this.resolveMaxBatchSize(options.maxBatchSize);
    const estimatedIndividualFee = this.calculateEstimatedIndividualFee(
      operations.length,
    );

    let batch = this.batchRepository.create({
      status: TransactionBatchStatus.PENDING,
      requestedOperationCount: operations.length,
      completedCount: 0,
      failedCount: 0,
      maxBatchSize,
      transactionHashes: [],
      estimatedIndividualFee,
      actualBatchFee: '0',
      estimatedCostSavings: '0',
      savingsPercentage: '0',
      costMetricSource: 'base_fee_estimate',
      errorMessage: null,
      metadata: options.metadata ?? null,
      startedAt: null,
      completedAt: null,
    });
    batch = await this.batchRepository.save(batch);

    const operationRows = await this.operationRepository.save(
      operations.map((operation, index) =>
        this.operationRepository.create({
          batchId: batch.id,
          operationIndex: index,
          contractId: operation.contractId,
          functionName: operation.functionName,
          args: operation.args ?? [],
          metadata: operation.metadata ?? null,
          idempotencyKey:
            operation.idempotencyKey ?? operation.clientKey ?? null,
          status: TransactionBatchOperationStatus.PENDING,
          txHash: null,
          errorMessage: null,
          startedAt: null,
          completedAt: null,
        }),
      ),
    );

    batch.status = TransactionBatchStatus.PROCESSING;
    batch.startedAt = new Date();
    batch = await this.batchRepository.save(batch);

    let actualBatchFee = 0n;
    const transactionHashes = new Set<string>();

    for (const chunk of this.chunkOperations(operationRows, maxBatchSize)) {
      const result = await this.processChunk(secretKey, chunk);
      actualBatchFee += result.actualFee;
      result.transactionHashes.forEach((hash) => transactionHashes.add(hash));
    }

    const refreshedOperations = await this.operationRepository.find({
      where: { batchId: batch.id },
      order: { operationIndex: 'ASC' },
    });

    const completedCount = refreshedOperations.filter(
      (operation) =>
        operation.status === TransactionBatchOperationStatus.COMPLETED,
    ).length;
    const failedCount = refreshedOperations.filter(
      (operation) =>
        operation.status === TransactionBatchOperationStatus.FAILED,
    ).length;

    batch.completedCount = completedCount;
    batch.failedCount = failedCount;
    batch.transactionHashes = Array.from(transactionHashes);
    batch.actualBatchFee = actualBatchFee.toString();
    this.applyCostMetrics(batch);
    batch.errorMessage = this.buildBatchErrorMessage(refreshedOperations);
    batch.completedAt = new Date();
    batch.status = this.resolveFinalStatus(completedCount, failedCount);
    await this.batchRepository.save(batch);

    return this.getBatchStatus(batch.id);
  }

  async getBatchStatus(id: string): Promise<TransactionBatch> {
    const batch = await this.batchRepository.findOne({
      where: { id },
      relations: { operations: true },
      order: { operations: { operationIndex: 'ASC' } },
    });

    if (!batch) {
      throw new NotFoundException(`Transaction batch ${id} was not found`);
    }

    return batch;
  }

  getEffectiveMaxBatchSize(requestedMaxBatchSize?: number): number {
    return this.resolveMaxBatchSize(requestedMaxBatchSize);
  }

  private async processChunk(
    secretKey: string,
    chunk: TransactionBatchOperationEntity[],
  ): Promise<{ actualFee: bigint; transactionHashes: string[] }> {
    await this.markOperationsProcessing(chunk);

    try {
      const result = await this.stellarService.invokeContractBatchWrite(
        chunk.map((operation) => this.toContractOperation(operation)),
        secretKey,
      );
      await this.markOperationsCompleted(chunk, result.hash);
      return {
        actualFee: BigInt(result.fees.totalFee),
        transactionHashes: [result.hash],
      };
    } catch (error) {
      if (chunk.length === 1) {
        await this.markOperationFailed(chunk[0], error);
        return { actualFee: 0n, transactionHashes: [] };
      }

      return this.retryIndividually(secretKey, chunk);
    }
  }

  private async retryIndividually(
    secretKey: string,
    chunk: TransactionBatchOperationEntity[],
  ): Promise<{ actualFee: bigint; transactionHashes: string[] }> {
    let actualFee = 0n;
    const transactionHashes: string[] = [];

    for (const operation of chunk) {
      operation.status = TransactionBatchOperationStatus.PROCESSING;
      operation.startedAt = operation.startedAt ?? new Date();
      operation.errorMessage = null;
      await this.operationRepository.save(operation);

      try {
        const result = await this.stellarService.invokeContractBatchWrite(
          [this.toContractOperation(operation)],
          secretKey,
        );
        actualFee += BigInt(result.fees.totalFee);
        transactionHashes.push(result.hash);
        await this.markOperationsCompleted([operation], result.hash);
      } catch (error) {
        await this.markOperationFailed(operation, error);
      }
    }

    return { actualFee, transactionHashes };
  }

  private async markOperationsProcessing(
    operations: TransactionBatchOperationEntity[],
  ): Promise<void> {
    const now = new Date();
    await this.operationRepository.save(
      operations.map((operation) => ({
        ...operation,
        status: TransactionBatchOperationStatus.PROCESSING,
        startedAt: operation.startedAt ?? now,
        errorMessage: null,
      })),
    );
  }

  private async markOperationsCompleted(
    operations: TransactionBatchOperationEntity[],
    txHash: string,
  ): Promise<void> {
    const now = new Date();
    await this.operationRepository.save(
      operations.map((operation) => ({
        ...operation,
        status: TransactionBatchOperationStatus.COMPLETED,
        txHash,
        errorMessage: null,
        completedAt: now,
      })),
    );
  }

  private async markOperationFailed(
    operation: TransactionBatchOperationEntity,
    error: unknown,
  ): Promise<void> {
    await this.operationRepository.save({
      ...operation,
      status: TransactionBatchOperationStatus.FAILED,
      errorMessage: this.toErrorMessage(error),
      completedAt: new Date(),
    });
  }

  private toContractOperation(
    operation: TransactionBatchOperationEntity,
  ): ContractBatchOperation {
    return {
      contractId: operation.contractId,
      functionName: operation.functionName,
      args: operation.args ?? [],
      metadata: operation.metadata ?? undefined,
    };
  }

  private validateSecretKey(secretKey: string): void {
    if (
      !secretKey ||
      typeof secretKey !== 'string' ||
      secretKey.trim() === ''
    ) {
      throw new BadRequestException('sourceSecretKey is required');
    }
  }

  private validateOperations(operations: BatchableContractOperation[]): void {
    if (!Array.isArray(operations) || operations.length === 0) {
      throw new BadRequestException('At least one operation is required');
    }

    if (operations.length > MAX_REQUEST_OPERATIONS) {
      throw new BadRequestException(
        `A batch request cannot contain more than ${MAX_REQUEST_OPERATIONS} operations`,
      );
    }

    operations.forEach((operation, index) => {
      if (!operation.contractId || operation.contractId.trim() === '') {
        throw new BadRequestException(
          `Operation ${index} must include a contractId`,
        );
      }

      if (!operation.functionName || operation.functionName.trim() === '') {
        throw new BadRequestException(
          `Operation ${index} must include a functionName`,
        );
      }

      if (operation.args !== undefined && !Array.isArray(operation.args)) {
        throw new BadRequestException(
          `Operation ${index} args must be an array`,
        );
      }
    });
  }

  private resolveMaxBatchSize(requestedMaxBatchSize?: number): number {
    const configuredMaxBatchSize = this.parseConfiguredBatchSize();
    const candidate = requestedMaxBatchSize ?? configuredMaxBatchSize;

    if (!Number.isInteger(candidate) || candidate <= 0) {
      throw new BadRequestException('maxBatchSize must be a positive integer');
    }

    return Math.min(candidate, STELLAR_MAX_TRANSACTION_OPERATIONS);
  }

  private parseConfiguredBatchSize(): number {
    const configured =
      this.configService.get<number>('stellar.batchMaxSize') ??
      this.configService.get<number>('TRANSACTION_BATCH_MAX_SIZE') ??
      DEFAULT_BATCH_MAX_SIZE;
    const parsed = Number(configured);

    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new BadRequestException(
        'Configured transaction batch max size must be a positive integer',
      );
    }

    return parsed;
  }

  private calculateEstimatedIndividualFee(operationCount: number): string {
    return (BigInt(operationCount) * BigInt(BASE_FEE)).toString();
  }

  private applyCostMetrics(batch: TransactionBatch): void {
    const estimated = BigInt(batch.estimatedIndividualFee);
    const actual = BigInt(batch.actualBatchFee);
    const savings = estimated > actual ? estimated - actual : 0n;

    batch.estimatedCostSavings = savings.toString();
    batch.savingsPercentage =
      estimated === 0n
        ? '0'
        : ((Number(savings) / Number(estimated)) * 100).toFixed(4);
  }

  private resolveFinalStatus(
    completedCount: number,
    failedCount: number,
  ): TransactionBatchStatus {
    if (completedCount > 0 && failedCount === 0) {
      return TransactionBatchStatus.COMPLETED;
    }

    if (completedCount > 0 && failedCount > 0) {
      return TransactionBatchStatus.PARTIAL_FAILED;
    }

    return TransactionBatchStatus.FAILED;
  }

  private buildBatchErrorMessage(
    operations: TransactionBatchOperationEntity[],
  ): string | null {
    const failedMessages = operations
      .filter(
        (operation) =>
          operation.status === TransactionBatchOperationStatus.FAILED,
      )
      .map((operation) => operation.errorMessage)
      .filter((message): message is string => Boolean(message));

    if (!failedMessages.length) {
      return null;
    }

    return Array.from(new Set(failedMessages)).join('; ');
  }

  private chunkOperations(
    operations: TransactionBatchOperationEntity[],
    maxBatchSize: number,
  ): TransactionBatchOperationEntity[][] {
    const chunks: TransactionBatchOperationEntity[][] = [];

    for (let index = 0; index < operations.length; index += maxBatchSize) {
      chunks.push(operations.slice(index, index + maxBatchSize));
    }

    return chunks;
  }

  private toErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return String(error);
  }
}
