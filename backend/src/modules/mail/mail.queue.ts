import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { MailService } from './mail.service';

@Processor('mail')
export class MailProcessor {
  constructor(private readonly mailService: MailService) {}

  @Process()
  async handleSend(job: Job) {
    const { to, subject, html } = job.data;
    await this.mailService.sendMail(to, subject, html);
  }

  @Process('send-email')
  async handleSend(job: Job) {
    const { to, subject, html } = job.data;

    await this.mailService.sendMail(to, subject, html);
  }
}
