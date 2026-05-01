import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MailService } from './mail.service';
import { accountLockedTemplate } from './templates/account-locked.template';

@Injectable()
export class MailHandlers {
  constructor(private readonly mailService: MailService) {}

  @OnEvent('user.account.locked')
  async handleAccountLocked(event: any) {
    const { email, name } = event;

    await this.mailService.sendMail(
      email,
      'Account Locked',
      accountLockedTemplate(name),
    );
  }

  @OnEvent('user.account.locked')
  async handleAccountLocked(event: any) {
    if (!event.user?.emailNotifications) return;

    await this.mailQueue.add(
      'send-email',
      {
        to: event.user.email,
        subject: 'Account Locked',
        html: `<p>Your account has been locked.</p>`,
      },
      {
        attempts: 5,
        backoff: 5000,
      },
    );
  }
  
  @OnEvent('goal.milestone')
  async handleGoalMilestone(event: any) {
    await this.mailService.sendMail(
      event.email,
      'Goal Milestone Achieved',
      `<p>You reached a milestone 🎉</p>`,
    );
  }

  @OnEvent('governance.created')
  async handleGovernanceCreated(event: any) {
    await this.mailService.sendMail(
      event.email,
      'New Proposal Created',
      `<p>A new governance proposal was created.</p>`,
    );
  }

  @OnEvent('vote.cast')
  async handleVoteCast(event: any) {
    await this.mailService.sendMail(
      event.email,
      'Vote Confirmation',
      `<p>Your vote has been recorded.</p>`,
    );
  }
}