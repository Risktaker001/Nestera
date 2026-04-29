import { createHash } from 'crypto';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DataSource, Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { rpc, scValToNative, xdr } from '@stellar/stellar-sdk';
import { DeadLetterEvent } from './entities/dead-letter-event.entity';
import { IndexerState } from './entities/indexer-state.entity';
import {
  AuditAction,
  AuditLog,
  AuditResourceType,
} from '../../common/entities/audit-log.entity';
import { DepositHandler } from './event-handlers/deposit.handler';
import { WithdrawHandler } from './event-handlers/withdraw.handler';
import { YieldHandler } from './event-handlers/yield.handler';
import { StellarService } from './stellar.service';
import { SavingsProduct } from '../savings/entities/savings-product.entity';
import {
  LedgerTransaction,
  LedgerTransactionType,
} from './entities/transaction.entity';
import {
  SubscriptionStatus,
  UserSubscription,
} from '../savings/entities/user-subscription.entity';
import { User } from '../user/entities/user.entity';

/** Shape of a raw Soroban event as returned by the RPC. */
interface SorobanEvent {
  id?: string;
  ledger: number;
  topic?: unknown[];
  value?: unknown;
  txHash?: string;
  [key: string]: unknown;
}

interface ReorgRecoverySummary {
  userId: string;
  transactionCount: number;
  earliestLedger: number;
  latestLedger: number;
  transactionTypes: Set<LedgerTransactionType>;
  totalAmount: number;
}

const CONFIRMATION_DEPTH = 12;
const DEPOSIT_HASH_HEX = createHash('sha256').update('Deposit').digest('hex');
const WITHDRAW_HASH_HEX = createHash('sha256').update('Withdraw').digest('hex');
const YIELD_HASH_HEX = createHash('sha256').update('Yield').digest('hex');
const YIELD_DISTRIBUTION_HASH_HEX = createHash('sha256')
  .update('yld_dist')
  .digest('hex');
const YIELD_PAYOUT_HASH_HEX = createHash('sha256')
  .update('YieldPayout')
  .digest('hex');

@Injectable()
export class IndexerService implements OnModuleInit {
  private readonly logger = new Logger(IndexerService.name);

  private rpcServer: rpc.Server | null = null;

  /** In-memory cache of contract IDs to monitor */
  private contractIds: Set<string> = new Set();

  /** In-memory state synced with DB */
  private indexerState: IndexerState | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly stellarService: StellarService,
    private readonly eventEmitter: EventEmitter2,
    @InjectRepository(DeadLetterEvent)
    private readonly dlqRepo: Repository<DeadLetterEvent>,
    @InjectRepository(IndexerState)
    private readonly indexerStateRepo: Repository<IndexerState>,
    @InjectRepository(SavingsProduct)
    private readonly savingsProductRepo: Repository<SavingsProduct>,
    @InjectRepository(LedgerTransaction)
    private readonly transactionRepo: Repository<LedgerTransaction>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly depositHandler: DepositHandler,
    private readonly withdrawHandler: WithdrawHandler,
    private readonly yieldHandler: YieldHandler,
  ) {}

  async onModuleInit() {
    this.logger.log('Initializing Blockchain Event Indexer...');

    this.rpcServer = this.stellarService.getRpcServer();

    await this.initializeIndexerState();
    await this.loadContractIds();

    this.logger.log(
      `Blockchain indexer initialized. Monitoring ${this.contractIds.size} contract(s).`,
    );
  }

  @Cron(CronExpression.EVERY_5_SECONDS)
  async runIndexerCycle(): Promise<void> {
    if (!this.indexerState) return;

    // Reload contract IDs to ensure we're watching any new active products
    await this.loadContractIds();
    if (this.contractIds.size === 0) {
      this.logger.debug('No active contracts to monitor');
      return;
    }

    try {
      const scanStartLedger = this.getReorgScanStartLedger();
      const events = await this.fetchEvents(scanStartLedger);

      if (events.length === 0) {
        this.logger.debug('No new events found');
        return;
      }

      const divergentLedger = await this.detectReorg(
        scanStartLedger,
        this.indexerState.lastProcessedLedger,
        events,
      );

      if (divergentLedger !== null) {
        const affectedUsers =
          await this.rollbackTransactionsFromLedger(divergentLedger);

        this.indexerState.lastProcessedLedger = Math.max(
          0,
          divergentLedger - 1,
        );
        this.indexerState.lastProcessedTimestamp = Date.now();
        await this.saveIndexerState();

        await this.notifyAffectedUsers(affectedUsers, divergentLedger);
      }

      const processFromLedger = this.indexerState.lastProcessedLedger + 1;
      const eventsToProcess = events.filter(
        (event) => event.ledger >= processFromLedger,
      );

      if (eventsToProcess.length === 0) {
        this.logger.debug('No canonical events require processing');
        return;
      }

      let processed = 0;
      let failed = 0;

      for (const event of eventsToProcess) {
        const ok = await this.processEvent(event);
        if (ok) {
          processed++;
        } else {
          failed++;
        }
      }

      this.logger.log(
        `Processed ${processed} events (Failed: ${failed}) from ledger ${eventsToProcess[0].ledger} to ${eventsToProcess[eventsToProcess.length - 1].ledger}`,
      );

      this.indexerState.totalEventsProcessed += processed;
      this.indexerState.totalEventsFailed += failed;
      this.indexerState.updatedAt = new Date();

      await this.saveIndexerState();
    } catch (err) {
      this.logger.error(`Indexer cycle failed: ${(err as Error).message}`);
    }
  }

  private async initializeIndexerState() {
    let state = await this.indexerStateRepo.findOne({ where: {} });

    if (!state) {
      state = await this.indexerStateRepo.save(
        this.indexerStateRepo.create({
          lastProcessedLedger: 0,
          lastProcessedTimestamp: null,
          totalEventsProcessed: 0,
          totalEventsFailed: 0,
        }),
      );
    }

    this.indexerState = state;
  }

  private async loadContractIds() {
    const products = await this.savingsProductRepo.find({
      where: { isActive: true },
    });

    const newSet = new Set<string>();
    for (const p of products) {
      if (p.contractId) newSet.add(p.contractId);
    }

    this.contractIds = newSet;
  }

  private async saveIndexerState() {
    if (this.indexerState) {
      await this.indexerStateRepo.save(this.indexerState);
    }
  }

  private getReorgScanStartLedger(): number {
    if (!this.indexerState) {
      return 1;
    }

    return Math.max(
      1,
      this.indexerState.lastProcessedLedger - CONFIRMATION_DEPTH + 1,
    );
  }

  private async detectReorg(
    scanStartLedger: number,
    currentLedger: number,
    events: SorobanEvent[],
  ): Promise<number | null> {
    if (currentLedger < scanStartLedger) {
      return null;
    }

    const remoteSnapshots = this.buildLedgerSnapshots(
      events,
      scanStartLedger,
      currentLedger,
    );
    const localSnapshots = await this.buildLocalLedgerSnapshots(
      scanStartLedger,
      currentLedger,
    );

    // Only compare ledgers we have local data for (already processed)
    // Fresh ledgers with no local data are not reorg indicators
    const localLedgers = Array.from(localSnapshots.keys()).sort(
      (left, right) => left - right,
    );

    for (const ledger of localLedgers) {
      const remote = this.normalizeSignatures(remoteSnapshots.get(ledger));
      const local = this.normalizeSignatures(localSnapshots.get(ledger));

      if (remote.length !== local.length || !this.areEqual(remote, local)) {
        this.logger.warn(
          `Blockchain reorganization detected at ledger ${ledger}`,
        );
        return ledger;
      }
    }

    return null;
  }

  private buildLedgerSnapshots(
    events: SorobanEvent[],
    startLedger: number,
    endLedger: number,
  ): Map<number, string[]> {
    const snapshots = new Map<number, string[]>();

    for (const event of events) {
      if (event.ledger < startLedger || event.ledger > endLedger) {
        continue;
      }

      const type = this.classifyEvent(event);
      if (!type) {
        continue;
      }

      const signatures = snapshots.get(event.ledger) ?? [];
      signatures.push(this.buildEventSignature(type, event));
      snapshots.set(event.ledger, signatures);
    }

    for (const signatures of snapshots.values()) {
      signatures.sort();
    }

    return snapshots;
  }

  private async buildLocalLedgerSnapshots(
    startLedger: number,
    endLedger: number,
  ): Promise<Map<number, string[]>> {
    const snapshots = new Map<number, string[]>();
    const transactions = await this.transactionRepo.find();

    for (const transaction of transactions) {
      const ledger = this.parseLedgerSequence(transaction.ledgerSequence);
      if (
        ledger === null ||
        ledger < startLedger ||
        ledger > endLedger ||
        !this.isTrackedTransactionType(transaction.type)
      ) {
        continue;
      }

      const signatures = snapshots.get(ledger) ?? [];
      signatures.push(this.buildTransactionSignature(transaction));
      snapshots.set(ledger, signatures);
    }

    for (const signatures of snapshots.values()) {
      signatures.sort();
    }

    return snapshots;
  }

  private async rollbackTransactionsFromLedger(
    divergentLedger: number,
  ): Promise<ReorgRecoverySummary[]> {
    const affectedTransactions = (await this.transactionRepo.find())
      .filter((transaction) => {
        const ledger = this.parseLedgerSequence(transaction.ledgerSequence);
        return ledger !== null && ledger >= divergentLedger;
      })
      .sort((left, right) => {
        const leftLedger = this.parseLedgerSequence(left.ledgerSequence) ?? 0;
        const rightLedger = this.parseLedgerSequence(right.ledgerSequence) ?? 0;
        return rightLedger - leftLedger;
      });

    if (affectedTransactions.length === 0) {
      return [];
    }

    const summaries = new Map<string, ReorgRecoverySummary>();
    const correlationId = `blockchain-reorg-${Date.now()}`;

    await this.dataSource.transaction(async (manager) => {
      const txRepo = manager.getRepository(LedgerTransaction);
      const subRepo = manager.getRepository(UserSubscription);
      const auditRepo = manager.getRepository(AuditLog);

      await auditRepo.save(
        auditRepo.create({
          correlationId,
          action: AuditAction.RESOLVE,
          actor: 'system:blockchain-indexer',
          resourceType: AuditResourceType.SYSTEM,
          resourceId: null,
          statusCode: 200,
          durationMs: 0,
          success: true,
          errorMessage: null,
          previousValue: null,
          newValue: { divergentLedger },
          description: `Detected blockchain reorganization at ledger ${divergentLedger}`,
        }),
      );

      for (const transaction of affectedTransactions) {
        await this.reverseTransactionSideEffects(manager, transaction);

        await auditRepo.save(
          auditRepo.create({
            correlationId,
            action: AuditAction.DELETE,
            actor: 'system:blockchain-indexer',
            resourceType: AuditResourceType.TRANSACTION,
            resourceId: transaction.id,
            statusCode: 200,
            durationMs: 0,
            success: true,
            errorMessage: null,
            previousValue: {
              id: transaction.id,
              userId: transaction.userId,
              type: transaction.type,
              amount: transaction.amount,
              txHash: transaction.transactionHash ?? null,
              eventId: transaction.eventId,
              ledgerSequence: transaction.ledgerSequence,
              metadata: transaction.metadata,
            },
            newValue: null,
            description: `Reverted ${transaction.type} transaction ${transaction.eventId} during blockchain reorganization`,
          }),
        );

        await txRepo.delete({ id: transaction.id });

        const ledger =
          this.parseLedgerSequence(transaction.ledgerSequence) ?? 0;
        const summary = summaries.get(transaction.userId) ?? {
          userId: transaction.userId,
          transactionCount: 0,
          earliestLedger: ledger,
          latestLedger: ledger,
          transactionTypes: new Set<LedgerTransactionType>(),
          totalAmount: 0,
        };

        summary.transactionCount += 1;
        summary.earliestLedger = Math.min(summary.earliestLedger, ledger);
        summary.latestLedger = Math.max(summary.latestLedger, ledger);
        summary.transactionTypes.add(transaction.type);
        summary.totalAmount += Number(transaction.amount);
        summaries.set(transaction.userId, summary);
      }
    });

    return Array.from(summaries.values());
  }

  private async reverseTransactionSideEffects(
    manager: DataSource['manager'],
    transaction: LedgerTransaction,
  ): Promise<void> {
    const subRepo = manager.getRepository(UserSubscription);
    const metadata = transaction.metadata;
    const subscriptionId = this.extractSubscriptionId(metadata);
    const amount = Number(transaction.amount);

    const subscription = subscriptionId
      ? await subRepo.findOne({ where: { id: subscriptionId } })
      : await subRepo.findOne({
          where: {
            userId: transaction.userId,
            status: SubscriptionStatus.ACTIVE,
          },
          order: { createdAt: 'DESC' },
        });

    if (!subscription) {
      this.logger.warn(
        `No subscription found while reverting ${transaction.type} transaction ${transaction.eventId}`,
      );
      return;
    }

    if (transaction.type === LedgerTransactionType.DEPOSIT) {
      const nextAmount = Math.max(Number(subscription.amount) - amount, 0);

      if (metadata?.subscriptionCreated === true && nextAmount <= 0) {
        await subRepo.delete(subscription.id);
        return;
      }

      subscription.amount = nextAmount;
      await subRepo.save(subscription);
      return;
    }

    if (transaction.type === LedgerTransactionType.WITHDRAW) {
      subscription.amount = Number(subscription.amount) + amount;
      await subRepo.save(subscription);
      return;
    }

    if (transaction.type === LedgerTransactionType.YIELD) {
      subscription.totalInterestEarned = String(
        Math.max(Number(subscription.totalInterestEarned ?? '0') - amount, 0),
      );
      await subRepo.save(subscription);
    }
  }

  private async notifyAffectedUsers(
    summaries: ReorgRecoverySummary[],
    divergentLedger: number,
  ): Promise<void> {
    for (const summary of summaries) {
      await this.eventEmitter.emitAsync('blockchain.transaction.reverted', {
        userId: summary.userId,
        transactionCount: summary.transactionCount,
        earliestLedger: summary.earliestLedger,
        latestLedger: summary.latestLedger,
        transactionTypes: Array.from(summary.transactionTypes),
        totalAmount: summary.totalAmount.toString(),
        reason: `chain reorganization detected at ledger ${divergentLedger}`,
      });
    }
  }

  private buildEventSignature(
    type: LedgerTransactionType,
    event: SorobanEvent,
  ): string {
    const eventId = typeof event.id === 'string' ? event.id : 'unknown';
    const txHash = typeof event.txHash === 'string' ? event.txHash : 'unknown';
    return `${type}|${event.ledger}|${eventId}|${txHash}`;
  }

  private buildTransactionSignature(transaction: LedgerTransaction): string {
    return `${transaction.type}|${transaction.ledgerSequence ?? 'unknown'}|${transaction.eventId ?? 'unknown'}|${transaction.transactionHash ?? 'unknown'}`;
  }

  private normalizeSignatures(signatures: string[] | undefined): string[] {
    return (signatures ?? []).filter(Boolean).sort();
  }

  private areEqual(left: string[], right: string[]): boolean {
    if (left.length !== right.length) {
      return false;
    }

    return left.every((value, index) => value === right[index]);
  }

  private parseLedgerSequence(ledgerSequence: string | null): number | null {
    if (ledgerSequence === null) {
      return null;
    }

    const parsed = Number(ledgerSequence);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private extractSubscriptionId(
    metadata: Record<string, unknown> | null,
  ): string | null {
    const value = metadata?.subscriptionId;
    return typeof value === 'string' && value.length > 0 ? value : null;
  }

  private isTrackedTransactionType(
    type: LedgerTransactionType | string,
  ): type is LedgerTransactionType {
    const t = type as LedgerTransactionType;
    return (
      t === LedgerTransactionType.DEPOSIT ||
      t === LedgerTransactionType.WITHDRAW ||
      t === LedgerTransactionType.YIELD
    );
  }

  private classifyEvent(event: SorobanEvent): LedgerTransactionType | null {
    if (!Array.isArray(event.topic) || event.topic.length === 0) {
      return null;
    }

    const first = event.topic[0];
    const normalized = this.toHex(first);

    if (normalized === DEPOSIT_HASH_HEX) {
      return LedgerTransactionType.DEPOSIT;
    }

    if (normalized === WITHDRAW_HASH_HEX) {
      return LedgerTransactionType.WITHDRAW;
    }

    if (
      normalized === YIELD_HASH_HEX ||
      normalized === YIELD_DISTRIBUTION_HASH_HEX ||
      normalized === YIELD_PAYOUT_HASH_HEX
    ) {
      return LedgerTransactionType.YIELD;
    }

    if (typeof first === 'string') {
      try {
        const scVal = xdr.ScVal.fromXDR(first, 'base64');
        const symbol = scValToNative(scVal);

        if (symbol === 'Deposit') {
          return LedgerTransactionType.DEPOSIT;
        }

        if (symbol === 'Withdraw') {
          return LedgerTransactionType.WITHDRAW;
        }

        if (
          symbol === 'Yield' ||
          symbol === 'YieldPayout' ||
          symbol === 'yld_dist'
        ) {
          return LedgerTransactionType.YIELD;
        }
      } catch {
        // ignore malformed event topics
      }
    }

    return null;
  }

  private toHex(topicPart: unknown): string | null {
    if (typeof topicPart === 'string') {
      const clean = topicPart.toLowerCase().replace(/^0x/, '');
      if (/^[0-9a-f]{64}$/i.test(clean)) {
        return clean;
      }

      try {
        return Buffer.from(topicPart, 'base64').toString('hex');
      } catch {
        return null;
      }
    }

    if (
      topicPart &&
      typeof topicPart === 'object' &&
      'toXDR' in topicPart &&
      typeof (topicPart as { toXDR?: unknown }).toXDR === 'function'
    ) {
      try {
        return Buffer.from(
          (topicPart as { toXDR: (encoding?: string) => string }).toXDR(
            'base64',
          ),
          'base64',
        ).toString('hex');
      } catch {
        return null;
      }
    }

    return null;
  }

  private async processEvent(event: SorobanEvent): Promise<boolean> {
    try {
      await this.handleEvent(event);

      if (
        this.indexerState &&
        event.ledger > this.indexerState.lastProcessedLedger
      ) {
        this.indexerState.lastProcessedLedger = event.ledger;
        this.indexerState.lastProcessedTimestamp = Date.now();
      }

      return true;
    } catch (err) {
      const msg = (err as Error).message;
      this.logger.error(
        `FAILURE at Ledger ${event.ledger}: Processing of event ${event.id} crashed. JSON: ${JSON.stringify(event)}. Error: ${msg}`,
      );

      await this.dlqRepo.save(
        this.dlqRepo.create({
          ledgerSequence: event.ledger,
          rawEvent: JSON.stringify(event),
          errorMessage: msg,
        }),
      );

      return false;
    }
  }

  private async handleEvent(event: SorobanEvent): Promise<void> {
    if (await this.depositHandler.handle(event)) return;
    if (await this.withdrawHandler.handle(event)) return;
    if (await this.yieldHandler.handle(event)) return;

    this.logger.debug(`Unhandled event: ${JSON.stringify(event.topic)}`);
  }

  private async fetchEvents(startLedger: number): Promise<SorobanEvent[]> {
    if (!this.indexerState) return [];

    const rpcEvents = await this.stellarService.getEvents(
      startLedger,
      Array.from(this.contractIds),
    );

    return rpcEvents
      .map((e) => ({
        id: e.id,
        ledger: parseInt(e.ledger, 10),
        topic: e.topic,
        value: e.value,
        txHash: e.txHash,
      }))
      .sort((a, b) => a.ledger - b.ledger);
  }

  getIndexerState() {
    return this.indexerState;
  }

  getLastProcessedTimestamp(): number | null {
    return this.indexerState?.lastProcessedTimestamp ?? null;
  }

  async reloadContractIds() {
    await this.loadContractIds();
  }

  getMonitoredContracts(): string[] {
    return Array.from(this.contractIds);
  }
}
