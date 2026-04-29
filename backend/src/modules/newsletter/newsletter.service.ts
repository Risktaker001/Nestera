import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NewsletterSubscription } from './entities/newsletter-subscription.entity';

@Injectable()
export class NewsletterService {
  constructor(
    @InjectRepository(NewsletterSubscription)
    private readonly newsletterRepository: Repository<NewsletterSubscription>,
  ) {}

  async subscribe(rawEmail: string): Promise<NewsletterSubscription> {
    const email = rawEmail.trim().toLowerCase();

    const existing = await this.newsletterRepository.findOne({
      where: { email },
    });

    if (existing) {
      throw new ConflictException('This email is already subscribed.');
    }

    const subscription = this.newsletterRepository.create({ email });
    return await this.newsletterRepository.save(subscription);
  }
}
