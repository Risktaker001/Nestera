import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TransactionBatchingService } from './transaction-batching.service';
import { StellarService } from './stellar.service';
import {
  TransactionBatch,
  TransactionBatchStatus,
} from './entities/transaction-batch.entity';
import {
  TransactionBatchOperation,
  TransactionBatchOperationStatus,
} from './entities/transaction-batch-operation.entity';

class MemoryRepository<T extends { id?: string }> {
  rows: T[] = [];
  private counter = 0;

  create(input: Partial<T>): T {
    return input as T;
  }

  async save(input: T | T[]): Promise<T | T[]> {
    if (Array.isArray(input)) {
      return Promise.all(input.map((item) => this.saveOne(item)));
    }

    return this.saveOne(input);
  }

  async find(options?: {
    where?: Partial<T>;
    order?: Record<string, 'ASC' | 'DESC'>;
  }): Promise<T[]> {
    let result = [...this.rows];

    if (options?.where) {
      result = result.filter((row) =>
        Object.entries(options.where ?? {}).every(
          ([key, value]) => row[key as keyof T] === value,
        ),
      );
    }

    if (options?.order) {
      const [key, direction] = Object.entries(options.order)[0];
      result.sort((left, right) => {
        const leftValue = left[key as keyof T] as number;
        const rightValue = right[key as keyof T] as number;
        return direction === 'ASC'
          ? leftValue - rightValue
          : rightValue - leftValue;
      });
    }

    return result;
  }

  async findOne(options: { where: Partial<T> }): Promise<T | null> {
    const row = this.rows.find((candidate) =>
      Object.entries(options.where).every(
        ([key, value]) => candidate[key as keyof T] === value,
      ),
    );

    if (!row) return null;

    if ('operations' in row) {
      (row as unknown as TransactionBatch).operations =
        (this as unknown as { operationRows?: TransactionBatchOperation[] })
          .operationRows ?? [];
    }

    return row;
  }

  private async saveOne(item: T): Promise<T> {
    if (!item.id) {
      item.id = `id-${++this.counter}`;
      this.rows.push(item);
      return item;
    }

    const index = this.rows.findIndex((row) => row.id === item.id);
    if (index >= 0) {
      this.rows[index] = { ...this.rows[index], ...item };
      return this.rows[index];
    }

    this.rows.push(item);
    return item;
  }
}

describe('TransactionBatchingService', () => {
  let service: TransactionBatchingService;
  let stellarService: jest.Mocked<StellarService>;
  let batchRepository: MemoryRepository<TransactionBatch>;
  let operationRepository: MemoryRepository<TransactionBatchOperation>;

  const operations = [
    { contractId: 'C1', functionName: 'deposit', args: ['a'] },
    { contractId: 'C1', functionName: 'deposit', args: ['b'] },
    { contractId: 'C1', functionName: 'deposit', args: ['c'] },
  ];

  beforeEach(() => {
    stellarService = {
      invokeContractBatchWrite: jest.fn(),
    } as unknown as jest.Mocked<StellarService>;
    batchRepository = new MemoryRepository<TransactionBatch>();
    operationRepository = new MemoryRepository<TransactionBatchOperation>();
    (
      batchRepository as unknown as {
        operationRows: TransactionBatchOperation[];
      }
    ).operationRows = operationRepository.rows;

    service = new TransactionBatchingService(
      stellarService,
      {
        get: jest.fn((key: string) =>
          key === 'stellar.batchMaxSize' ? 25 : undefined,
        ),
      } as unknown as ConfigService,
      batchRepository as never,
      operationRepository as never,
    );
  });

  it('chunks operations according to the requested max batch size', async () => {
    stellarService.invokeContractBatchWrite.mockResolvedValue({
      hash: 'hash',
      status: 'SUCCESS',
      operationCount: 2,
      fees: { resourceFee: '0', baseFee: '100', totalFee: '100' },
    });

    await service.createAndProcessBatch('S_SECRET', operations, {
      maxBatchSize: 2,
    });

    expect(stellarService.invokeContractBatchWrite).toHaveBeenCalledTimes(2);
    expect(
      stellarService.invokeContractBatchWrite.mock.calls[0][0],
    ).toHaveLength(2);
    expect(
      stellarService.invokeContractBatchWrite.mock.calls[1][0],
    ).toHaveLength(1);
  });

  it('marks every operation completed for a successful multi-operation batch', async () => {
    stellarService.invokeContractBatchWrite.mockResolvedValue({
      hash: 'batch-hash',
      status: 'SUCCESS',
      operationCount: 3,
      fees: { resourceFee: '0', baseFee: '100', totalFee: '100' },
    });

    const batch = await service.createAndProcessBatch('S_SECRET', operations);

    expect(batch.status).toBe(TransactionBatchStatus.COMPLETED);
    expect(batch.completedCount).toBe(3);
    expect(batch.failedCount).toBe(0);
    expect(batch.transactionHashes).toEqual(['batch-hash']);
    expect(operationRepository.rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          status: TransactionBatchOperationStatus.COMPLETED,
          txHash: 'batch-hash',
        }),
      ]),
    );
  });

  it('falls back to individual operations and records partial failures', async () => {
    stellarService.invokeContractBatchWrite
      .mockRejectedValueOnce(new Error('chunk failed'))
      .mockResolvedValueOnce({
        hash: 'single-success-1',
        status: 'SUCCESS',
        operationCount: 1,
        fees: { resourceFee: '0', baseFee: '100', totalFee: '100' },
      })
      .mockRejectedValueOnce(new Error('bad op'))
      .mockResolvedValueOnce({
        hash: 'single-success-2',
        status: 'SUCCESS',
        operationCount: 1,
        fees: { resourceFee: '0', baseFee: '100', totalFee: '100' },
      });

    const batch = await service.createAndProcessBatch('S_SECRET', operations);

    expect(batch.status).toBe(TransactionBatchStatus.PARTIAL_FAILED);
    expect(batch.completedCount).toBe(2);
    expect(batch.failedCount).toBe(1);
    expect(batch.transactionHashes).toEqual([
      'single-success-1',
      'single-success-2',
    ]);
    expect(operationRepository.rows[1]).toMatchObject({
      status: TransactionBatchOperationStatus.FAILED,
      errorMessage: 'bad op',
    });
  });

  it('marks the batch failed when all operations fail', async () => {
    stellarService.invokeContractBatchWrite.mockRejectedValue(
      new Error('down'),
    );

    const batch = await service.createAndProcessBatch('S_SECRET', operations);

    expect(batch.status).toBe(TransactionBatchStatus.FAILED);
    expect(batch.completedCount).toBe(0);
    expect(batch.failedCount).toBe(3);
  });

  it('persists cost metrics from estimated individual and actual batch fees', async () => {
    stellarService.invokeContractBatchWrite.mockResolvedValue({
      hash: 'cheap-hash',
      status: 'SUCCESS',
      operationCount: 3,
      fees: { resourceFee: '0', baseFee: '100', totalFee: '100' },
    });

    const batch = await service.createAndProcessBatch('S_SECRET', operations);

    expect(batch.estimatedIndividualFee).toBe('300');
    expect(batch.actualBatchFee).toBe('100');
    expect(batch.estimatedCostSavings).toBe('200');
    expect(batch.savingsPercentage).toBe('66.6667');
    expect(batch.costMetricSource).toBe('base_fee_estimate');
  });

  it('rejects non-positive batch sizes', async () => {
    await expect(
      service.createAndProcessBatch('S_SECRET', operations, {
        maxBatchSize: 0,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
