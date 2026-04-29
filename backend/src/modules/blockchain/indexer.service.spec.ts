import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DataSource } from 'typeorm';
import { IndexerService } from './indexer.service';
import { IndexerState } from './entities/indexer-state.entity';
import { DeadLetterEvent } from './entities/dead-letter-event.entity';
import { SavingsProduct } from '../savings/entities/savings-product.entity';
import { LedgerTransaction } from './entities/transaction.entity';
import { StellarService } from './stellar.service';
import { DepositHandler } from './event-handlers/deposit.handler';
import { WithdrawHandler } from './event-handlers/withdraw.handler';
import { YieldHandler } from './event-handlers/yield.handler';
import { createHash } from 'crypto';

describe('IndexerService', () => {
  let service: IndexerService;
  let stellarService: StellarService;
  let indexerStateRepo: any;
  let savingsProductRepo: any;
  let deadLetterRepo: any;
  let transactionRepo: any;
  let eventEmitter: any;
  let dataSource: any;
  let depositHandler: any;
  let withdrawHandler: any;
  let yieldHandler: any;

  const mockIndexerState = {
    id: 'uuid',
    lastProcessedLedger: 100,
    totalEventsProcessed: 0,
    totalEventsFailed: 0,
    updatedAt: new Date(),
  };

  const mockSavingsProducts = [
    { contractId: 'CC1', isActive: true },
    { contractId: 'CC2', isActive: true },
  ];

  beforeEach(async () => {
    indexerStateRepo = {
      findOne: jest.fn().mockResolvedValue(mockIndexerState),
      save: jest.fn().mockImplementation((val) => Promise.resolve(val)),
      create: jest.fn().mockImplementation((val) => val),
    };

    savingsProductRepo = {
      find: jest.fn().mockResolvedValue(mockSavingsProducts),
    };

    deadLetterRepo = {
      save: jest.fn().mockImplementation((val) => Promise.resolve(val)),
      create: jest.fn().mockImplementation((val) => val),
    };

    transactionRepo = {
      find: jest.fn().mockResolvedValue([]),
      delete: jest.fn(),
    };

    eventEmitter = {
      emitAsync: jest.fn().mockResolvedValue(undefined),
    };

    dataSource = {
      transaction: jest.fn(async (callback: any) =>
        callback({
          getRepository: () => ({
            findOne: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          }),
        }),
      ),
    };

    stellarService = {
      getRpcServer: jest.fn().mockReturnValue({
        getEvents: jest.fn(),
      }),
      getEvents: jest.fn(),
    } as any;

    depositHandler = { handle: jest.fn().mockResolvedValue(true) };
    withdrawHandler = { handle: jest.fn().mockResolvedValue(false) };
    yieldHandler = { handle: jest.fn().mockResolvedValue(false) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IndexerService,
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: StellarService, useValue: stellarService },
        { provide: EventEmitter2, useValue: eventEmitter },
        { provide: DataSource, useValue: dataSource },
        {
          provide: getRepositoryToken(IndexerState),
          useValue: indexerStateRepo,
        },
        {
          provide: getRepositoryToken(DeadLetterEvent),
          useValue: deadLetterRepo,
        },
        {
          provide: getRepositoryToken(SavingsProduct),
          useValue: savingsProductRepo,
        },
        {
          provide: getRepositoryToken(LedgerTransaction),
          useValue: transactionRepo,
        },
        { provide: DepositHandler, useValue: depositHandler },
        { provide: WithdrawHandler, useValue: withdrawHandler },
        { provide: YieldHandler, useValue: yieldHandler },
      ],
    }).compile();

    service = module.get<IndexerService>(IndexerService);
    // Suppress logger output during tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => null);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => null);
    jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => null);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => null);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should initialize state and load contract IDs', async () => {
      await service.onModuleInit();
      expect(indexerStateRepo.findOne).toHaveBeenCalled();
      expect(savingsProductRepo.find).toHaveBeenCalledWith({
        where: { isActive: true },
      });
      expect(service.getMonitoredContracts()).toContain('CC1');
      expect(service.getMonitoredContracts()).toContain('CC2');
    });
  });

  describe('runIndexerCycle', () => {
    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('should fetch and process events successfully', async () => {
      const mockEvents = [
        {
          id: '1',
          ledger: 101,
          topic: ['deposit'],
          value: '100',
          txHash: 'hash1',
        },
      ];
      (stellarService.getEvents as jest.Mock).mockResolvedValue(mockEvents);

      await service.runIndexerCycle();

      expect(stellarService.getEvents).toHaveBeenCalledWith(89, ['CC1', 'CC2']);
      expect(depositHandler.handle).toHaveBeenCalled();
      expect(indexerStateRepo.save).toHaveBeenCalled();
      expect(service.getIndexerState()?.lastProcessedLedger).toBe(101);
    });

    it('should handle failed events by logging to dead letter queue', async () => {
      const DEPOSIT_HASH_HEX = createHash('sha256')
        .update('Deposit')
        .digest('hex');

      const mockEvents = [
        {
          id: '1',
          ledger: 102, // ← Changed from 101 to 102
          topic: [DEPOSIT_HASH_HEX],
          value: {
            publicKey: 'GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
            amount: '1000',
          },
          txHash: 'hash1',
        },
      ];
      (stellarService.getEvents as jest.Mock).mockResolvedValue(mockEvents);

      // Spy on detectReorg to ensure it returns null (no reorg)
      jest.spyOn(service as any, 'detectReorg').mockResolvedValue(null);

      // Reset and reassign the mock to throw
      depositHandler.handle = jest
        .fn()
        .mockRejectedValue(new Error('Processing failed'));

      await service.runIndexerCycle();

      expect(deadLetterRepo.save).toHaveBeenCalled();
      expect(service.getIndexerState()?.totalEventsFailed).toBe(1);

      const savedDlqEntry = deadLetterRepo.save.mock.calls[0][0];
      expect(savedDlqEntry.ledgerSequence).toBe(102); // ← Updated
      expect(savedDlqEntry.errorMessage).toBe('Processing failed');
    });

    it('should skip cycle if no active contracts', async () => {
      savingsProductRepo.find.mockResolvedValue([]);
      await service.runIndexerCycle();
      expect(stellarService.getEvents).not.toHaveBeenCalled();
    });
  });
});
