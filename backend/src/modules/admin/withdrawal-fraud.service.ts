import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  WithdrawalRequest,
  WithdrawalStatus,
} from '../../savings/entities/withdrawal-request.entity';
import { User } from '../user/entities/user.entity';

export enum FraudRiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export interface FraudCheckResult {
  approved: boolean;
  riskLevel: FraudRiskLevel;
  flags: string[];
  requiresManualReview: boolean;
}

/** Max total withdrawal amount per user per 24 hours */
const DAILY_VELOCITY_LIMIT = 50_000;
/** Max number of withdrawal requests per user per hour */
const HOURLY_REQUEST_LIMIT = 5;
/** Amounts above this threshold require additional verification */
const LARGE_AMOUNT_THRESHOLD = 10_000;
/** New accounts (days since creation) subject to cooling-off */
const COOLING_OFF_DAYS = 30;
/** Max withdrawal for new accounts during cooling-off period */
const COOLING_OFF_MAX_AMOUNT = 5_000;

@Injectable()
export class WithdrawalFraudService {
  private readonly logger = new Logger(WithdrawalFraudService.name);

  constructor(
    @InjectRepository(WithdrawalRequest)
    private readonly withdrawalRepo: Repository<WithdrawalRequest>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async checkWithdrawal(
    userId: string,
    amount: number,
  ): Promise<FraudCheckResult> {
    const flags: string[] = [];
    let riskLevel = FraudRiskLevel.LOW;

    const [user, hourlyRequests, dailyWithdrawals] = await Promise.all([
      this.userRepo.findOne({ where: { id: userId } }),
      this.getHourlyRequestCount(userId),
      this.getDailyWithdrawalTotal(userId),
    ]);

    // Velocity check: too many requests in the last hour
    if (hourlyRequests >= HOURLY_REQUEST_LIMIT) {
      flags.push(
        `Velocity limit: ${hourlyRequests} requests in the last hour (max ${HOURLY_REQUEST_LIMIT})`,
      );
      riskLevel = FraudRiskLevel.HIGH;
    }

    // Velocity check: daily amount limit
    const projectedDailyTotal = dailyWithdrawals + amount;
    if (projectedDailyTotal > DAILY_VELOCITY_LIMIT) {
      flags.push(
        `Daily velocity limit exceeded: projected total ${projectedDailyTotal} > ${DAILY_VELOCITY_LIMIT}`,
      );
      riskLevel = FraudRiskLevel.HIGH;
    }

    // Large amount check
    if (amount >= LARGE_AMOUNT_THRESHOLD) {
      flags.push(`Large withdrawal amount: ${amount} >= ${LARGE_AMOUNT_THRESHOLD}`);
      if (riskLevel === FraudRiskLevel.LOW) riskLevel = FraudRiskLevel.MEDIUM;
    }

    // Cooling-off period for new accounts
    if (user?.createdAt) {
      const accountAgeDays =
        (Date.now() - new Date(user.createdAt).getTime()) /
        (1000 * 60 * 60 * 24);

      if (
        accountAgeDays < COOLING_OFF_DAYS &&
        amount > COOLING_OFF_MAX_AMOUNT
      ) {
        flags.push(
          `Cooling-off period: account is ${Math.floor(accountAgeDays)} days old, max withdrawal is ${COOLING_OFF_MAX_AMOUNT}`,
        );
        riskLevel = FraudRiskLevel.HIGH;
      }
    }

    // Suspicious pattern: rapid succession of near-identical amounts
    const suspiciousPattern = await this.detectSuspiciousPattern(userId, amount);
    if (suspiciousPattern) {
      flags.push('Suspicious pattern: repeated similar amounts in short window');
      if (riskLevel !== FraudRiskLevel.HIGH) riskLevel = FraudRiskLevel.MEDIUM;
    }

    const requiresManualReview =
      riskLevel === FraudRiskLevel.HIGH ||
      (riskLevel === FraudRiskLevel.MEDIUM && amount >= LARGE_AMOUNT_THRESHOLD);

    const approved = riskLevel !== FraudRiskLevel.HIGH;

    if (flags.length > 0) {
      this.logger.warn(
        `Fraud check for user ${userId}, amount ${amount}: ${riskLevel} — ${flags.join('; ')}`,
      );

      this.eventEmitter.emit('withdrawal.fraud.flagged', {
        userId,
        amount,
        riskLevel,
        flags,
        requiresManualReview,
        timestamp: new Date(),
      });
    }

    return { approved, riskLevel, flags, requiresManualReview };
  }

  private async getHourlyRequestCount(userId: string): Promise<number> {
    const since = new Date(Date.now() - 60 * 60 * 1000);
    return this.withdrawalRepo.count({
      where: {
        userId,
        createdAt: MoreThan(since),
      },
    });
  }

  private async getDailyWithdrawalTotal(userId: string): Promise<number> {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const result = await this.withdrawalRepo
      .createQueryBuilder('w')
      .select('COALESCE(SUM(w.amount), 0)', 'total')
      .where('w.userId = :userId', { userId })
      .andWhere('w.createdAt > :since', { since })
      .andWhere('w.status != :failed', { failed: WithdrawalStatus.FAILED })
      .getRawOne<{ total: string }>();

    return Number(result?.total ?? 0);
  }

  private async detectSuspiciousPattern(
    userId: string,
    amount: number,
  ): Promise<boolean> {
    const since = new Date(Date.now() - 30 * 60 * 1000); // last 30 minutes
    const recentRequests = await this.withdrawalRepo.find({
      where: { userId, createdAt: MoreThan(since) },
      select: ['amount'],
    });

    if (recentRequests.length < 2) return false;

    // Flag if 2+ recent requests are within 5% of the current amount
    const tolerance = amount * 0.05;
    const similarCount = recentRequests.filter(
      (r) => Math.abs(Number(r.amount) - amount) <= tolerance,
    ).length;

    return similarCount >= 2;
  }
}
