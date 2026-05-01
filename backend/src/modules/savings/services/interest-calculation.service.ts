import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import {
  UserSubscription,
  SubscriptionStatus,
} from '../entities/user-subscription.entity';
import { InterestHistory } from '../entities/interest-history.entity';
import { SavingsProductType } from '../entities/savings-product.entity';

/** Supported compounding frequencies (periods per year) */
export enum CompoundingFrequency {
  DAILY = 365,
  WEEKLY = 52,
  MONTHLY = 12,
  QUARTERLY = 4,
  ANNUALLY = 1,
  CONTINUOUS = 0, // uses e^(rt) formula
}

export interface InterestCreditedEvent {
  userId: string;
  subscriptionId: string;
  productName: string;
  interestEarned: string;
  newBalance: string;
  calculationDate: Date;
}

@Injectable()
export class InterestCalculationService {
  private readonly logger = new Logger(InterestCalculationService.name);

  constructor(
    @InjectRepository(UserSubscription)
    private readonly subscriptionRepo: Repository<UserSubscription>,
    @InjectRepository(InterestHistory)
    private readonly interestHistoryRepo: Repository<InterestHistory>,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Runs daily at midnight UTC.
   * Calculates and distributes daily accrued interest for all active subscriptions.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, { timeZone: 'UTC' })
  async runDailyInterestCalculation(): Promise<void> {
    const runId = uuidv4();
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    this.logger.log(
      `[runId=${runId}] Starting daily interest calculation for ${today.toISOString().split('T')[0]}`,
    );

    const subscriptions = await this.subscriptionRepo.find({
      where: { status: SubscriptionStatus.ACTIVE },
      relations: ['product'],
    });

    this.logger.log(
      `[runId=${runId}] Found ${subscriptions.length} active subscriptions`,
    );

    let processed = 0;
    let skipped = 0;
    let errors = 0;

    for (const subscription of subscriptions) {
      try {
        const credited = await this.processSubscription(
          subscription,
          today,
          runId,
        );
        if (credited) {
          processed++;
        } else {
          skipped++;
        }
      } catch (err) {
        errors++;
        this.logger.error(
          `[runId=${runId}] Failed to process subscription ${subscription.id}`,
          err,
        );
      }
    }

    this.logger.log(
      `[runId=${runId}] Completed: processed=${processed}, skipped=${skipped}, errors=${errors}`,
    );
  }

  /**
   * Processes a single subscription: calculates daily interest, persists it,
   * updates the subscription balance, and emits a notification event.
   * Returns true if interest was credited, false if skipped.
   */
  async processSubscription(
    subscription: UserSubscription,
    calculationDate: Date,
    runId: string,
  ): Promise<boolean> {
    const product = subscription.product;

    if (!product || !product.isActive) {
      return false;
    }

    // For FIXED products, skip if past end date (matured / early withdrawal handled separately)
    if (
      product.type === SavingsProductType.FIXED &&
      subscription.endDate &&
      calculationDate > new Date(subscription.endDate)
    ) {
      return false;
    }

    const principal = parseFloat(subscription.amount as unknown as string);
    const annualRate = parseFloat(product.interestRate as unknown as string);

    if (principal <= 0 || annualRate <= 0) {
      return false;
    }

    const periodDays = this.getPeriodDays(calculationDate);
    const daysInYear = this.getDaysInYear(calculationDate.getUTCFullYear());

    // Compound interest accrued over one day, compounded per-second:
    // A = P * (1 + r/n)^n  where n = seconds in a day
    // Daily accrual = A - P
    const secondsInDay = 86400;
    const frequencyRaw = this.configService.get<number>(
      'savings.compoundingFrequency',
      CompoundingFrequency.DAILY,
    );
    const frequency: CompoundingFrequency =
      frequencyRaw === 0 ? CompoundingFrequency.CONTINUOUS : frequencyRaw;

    let dailyInterest: number;
    const rateDecimal = annualRate / 100;
    const timeInYears = (periodDays * secondsInDay) / (daysInYear * secondsInDay);

    if (frequency === CompoundingFrequency.CONTINUOUS) {
      // Continuous compounding: A = P * e^(r*t)
      dailyInterest = principal * (Math.exp(rateDecimal * timeInYears) - 1);
    } else {
      // Discrete compounding: A = P * (1 + r/n)^(n*t)
      const compoundedAmount =
        principal * Math.pow(1 + rateDecimal / frequency, frequency * timeInYears);
      dailyInterest = compoundedAmount - principal;
    }

    if (dailyInterest <= 0) {
      return false;
    }

    const interestEarned = parseFloat(dailyInterest.toFixed(7));
    const currentTotal = parseFloat(subscription.totalInterestEarned) || 0;
    const newTotal = parseFloat((currentTotal + interestEarned).toFixed(7));

    await this.dataSource.transaction(async (manager) => {
      // Update subscription total interest
      await manager.update(
        UserSubscription,
        { id: subscription.id },
        {
          totalInterestEarned: newTotal.toString(),
        },
      );

      // Insert audit record
      const record = manager.create(InterestHistory, {
        subscriptionId: subscription.id,
        userId: subscription.userId,
        productId: subscription.productId,
        principalAmount: principal.toString(),
        interestRate: annualRate.toString(),
        interestEarned: interestEarned.toString(),
        calculationDate,
        periodDays,
        runId,
      });
      await manager.save(InterestHistory, record);
    });

    // Emit event for notification handler
    const event: InterestCreditedEvent = {
      userId: subscription.userId,
      subscriptionId: subscription.id,
      productName: product.name,
      interestEarned: interestEarned.toFixed(7),
      newBalance: newTotal.toFixed(7),
      calculationDate,
    };
    this.eventEmitter.emit('interest.credited', event);

    return true;
  }

  /** Returns 1 for daily runs (can be extended for other periods). */
  private getPeriodDays(_date: Date): number {
    return 1;
  }

  /** Returns 366 for leap years, 365 otherwise. */
  private getDaysInYear(year: number): number {
    return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 366 : 365;
  }
}
