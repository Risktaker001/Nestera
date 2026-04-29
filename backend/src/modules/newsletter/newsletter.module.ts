import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NewsletterController } from './newsletter.controller';
import { NewsletterService } from './newsletter.service';
import { NewsletterSubscription } from './entities/newsletter-subscription.entity';

@Module({
  imports: [TypeOrmModule.forFeature([NewsletterSubscription])],
  controllers: [NewsletterController],
  providers: [NewsletterService],
})
export class NewsletterModule {}
