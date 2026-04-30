import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { SavingsController } from './savings.controller';
import { SavingsService } from './savings.service';
import { PredictiveEvaluatorService } from './services/predictive-evaluator.service';
import { MilestoneService } from './services/milestone.service';
import { RecommendationService } from './services/recommendation.service';
import { SavingsProduct } from './entities/savings-product.entity';
import { UserSubscription } from './entities/user-subscription.entity';
import { SavingsGoal } from './entities/savings-goal.entity';
import { SavingsGoalMilestone } from './entities/savings-goal-milestone.entity';
import { ProductApySnapshot } from './entities/product-apy-snapshot.entity';
import { WithdrawalRequest } from './entities/withdrawal-request.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { User } from '../user/entities/user.entity';
import { WaitlistEntry } from './entities/waitlist-entry.entity';
import { WaitlistEvent } from './entities/waitlist-event.entity';
import { WaitlistService } from './waitlist.service';
import { WaitlistController } from './waitlist.controller';
import { SavingsExperiment } from './entities/savings-experiment.entity';
import { SavingsExperimentAssignment } from './entities/savings-experiment-assignment.entity';
import { ExperimentsService } from './experiments.service';
import { GroupSavingsPool } from './entities/group-savings-pool.entity';
import { GroupPoolMember } from './entities/group-pool-member.entity';
import { SavingsGroupActivity } from './entities/savings-group-activity.entity';
import { GroupSavingsService } from './group-savings.service';
import { GroupSavingsController } from './group-savings.controller';
import { AutoDepositSchedule } from './entities/auto-deposit-schedule.entity';
import { AutoDepositService } from './services/auto-deposit.service';
import { MilestoneQueueService } from './services/milestone-queue.service';
import { InterestCalculationService } from './services/interest-calculation.service';
import { InterestHistory } from './entities/interest-history.entity';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([
      SavingsProduct,
      UserSubscription,
      SavingsGoal,
      SavingsGoalMilestone,
      ProductApySnapshot,
      WithdrawalRequest,
      Transaction,
      User,
      WaitlistEntry,
      WaitlistEvent,
      SavingsExperiment,
      SavingsExperimentAssignment,
      GroupSavingsPool,
      GroupPoolMember,
      SavingsGroupActivity,
      AutoDepositSchedule,
      InterestHistory,
    ]),
  ],
  controllers: [SavingsController, WaitlistController, GroupSavingsController],
  providers: [
    SavingsService,
    PredictiveEvaluatorService,
    MilestoneService,
    MilestoneQueueService,
    RecommendationService,
    WaitlistService,
    ExperimentsService,
    GroupSavingsService,
    AutoDepositService,
    InterestCalculationService,
  ],
  exports: [SavingsService, WaitlistService, ExperimentsService],
})
export class SavingsModule {}
