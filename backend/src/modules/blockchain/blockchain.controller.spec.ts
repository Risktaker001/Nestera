import { Test, TestingModule } from '@nestjs/testing';
import { BlockchainController } from './blockchain.controller';
import { StellarService } from './stellar.service';
import { BalanceSyncService } from './balance-sync.service';
import { TransactionDto } from './dto/transaction.dto';
import { TransactionBatchingService } from './transaction-batching.service';
import { TransactionBatchStatus } from './entities/transaction-batch.entity';

const MOCK_PUBLIC_KEY =
  'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN';

const MOCK_TRANSACTIONS: TransactionDto[] = [
  {
    date: '2024-01-15T10:30:00Z',
    amount: '10.5000000',
    token: 'XLM',
    hash: 'abc123def456',
  },
  {
    date: '2024-01-14T08:00:00Z',
    amount: '25.0000000',
    token: 'USDC',
    hash: 'xyz789uvw012',
  },
];

describe('BlockchainController', () => {
  let controller: BlockchainController;
  let stellarService: jest.Mocked<StellarService>;
  let transactionBatchingService: jest.Mocked<TransactionBatchingService>;

  beforeEach(async () => {
    const mockStellarService: Partial<jest.Mocked<StellarService>> = {
      generateKeypair: jest.fn().mockReturnValue({
        publicKey: 'G_PUBLIC_KEY',
        secretKey: 'S_SECRET',
      }),
      getRecentTransactions: jest.fn().mockResolvedValue(MOCK_TRANSACTIONS),
    };

    const mockBalanceSyncService = {
      // Add any methods if needed, but since the controller doesn't use it in tests, empty is fine
      getMetricsSummary: jest.fn().mockReturnValue({}),
    };

    const mockTransactionBatchingService = {
      createAndProcessBatch: jest.fn().mockResolvedValue({
        id: 'batch-1',
        status: TransactionBatchStatus.COMPLETED,
        requestedOperationCount: 1,
        completedCount: 1,
        failedCount: 0,
        operations: [],
      }),
      getBatchStatus: jest.fn().mockResolvedValue({
        id: 'batch-1',
        status: TransactionBatchStatus.COMPLETED,
        requestedOperationCount: 1,
        completedCount: 1,
        failedCount: 0,
        operations: [],
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BlockchainController],
      providers: [
        { provide: StellarService, useValue: mockStellarService },
        { provide: BalanceSyncService, useValue: mockBalanceSyncService },
        {
          provide: TransactionBatchingService,
          useValue: mockTransactionBatchingService,
        },
      ],
    }).compile();

    controller = module.get<BlockchainController>(BlockchainController);
    stellarService = module.get(StellarService);
    transactionBatchingService = module.get(TransactionBatchingService);
  });

  describe('getWalletTransactions', () => {
    it('should call StellarService.getRecentTransactions with the correct public key', async () => {
      await controller.getWalletTransactions(MOCK_PUBLIC_KEY);

      expect(stellarService.getRecentTransactions).toHaveBeenCalledWith(
        MOCK_PUBLIC_KEY,
      );
    });

    it('should return the array returned by StellarService', async () => {
      const result = await controller.getWalletTransactions(MOCK_PUBLIC_KEY);

      expect(result).toBe(MOCK_TRANSACTIONS);
      expect(result).toHaveLength(2);
    });

    it('should return an empty array when the service returns no transactions', async () => {
      stellarService.getRecentTransactions.mockResolvedValue([]);

      const result = await controller.getWalletTransactions(MOCK_PUBLIC_KEY);

      expect(result).toEqual([]);
    });

    it('each returned item should have date, amount, token and hash fields', async () => {
      const result = await controller.getWalletTransactions(MOCK_PUBLIC_KEY);

      result.forEach((tx) => {
        expect(tx).toHaveProperty('date');
        expect(tx).toHaveProperty('amount');
        expect(tx).toHaveProperty('token');
        expect(tx).toHaveProperty('hash');
      });
    });
  });

  describe('generateWallet', () => {
    it('should call StellarService.generateKeypair and return the result', () => {
      const result = controller.generateWallet();

      expect(stellarService.generateKeypair).toHaveBeenCalled();
      expect(result).toMatchObject({
        publicKey: expect.any(String),
        secretKey: expect.any(String),
      });
    });
  });

  describe('transaction batches', () => {
    it('should submit a batch without returning or persisting the source secret key in the controller', async () => {
      const dto = {
        sourceSecretKey: 'S_SECRET',
        maxBatchSize: 10,
        operations: [
          {
            contractId: 'C1',
            functionName: 'deposit',
            args: ['100'],
            idempotencyKey: 'op-1',
          },
        ],
      };

      const result = await controller.createBatch(dto);

      expect(
        transactionBatchingService.createAndProcessBatch,
      ).toHaveBeenCalledWith('S_SECRET', dto.operations, {
        maxBatchSize: 10,
        metadata: undefined,
      });
      expect(JSON.stringify(result)).not.toContain('S_SECRET');
    });

    it('should fetch batch status by id', async () => {
      const result = await controller.getBatch('batch-1');

      expect(transactionBatchingService.getBatchStatus).toHaveBeenCalledWith(
        'batch-1',
      );
      expect(result).toMatchObject({ id: 'batch-1' });
    });
  });
});
