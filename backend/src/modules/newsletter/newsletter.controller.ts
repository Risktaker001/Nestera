import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { NewsletterService } from './newsletter.service';
import { SubscribeNewsletterDto } from './dto/subscribe-newsletter.dto';

@ApiTags('newsletter')
@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  @Post('subscribe')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Subscribe an email address to the newsletter' })
  @ApiBody({ type: SubscribeNewsletterDto })
  @ApiResponse({ status: 201, description: 'Subscription created' })
  @ApiResponse({ status: 409, description: 'Email already subscribed' })
  async subscribe(@Body() dto: SubscribeNewsletterDto) {
    const subscription = await this.newsletterService.subscribe(dto.email);

    return {
      id: subscription.id,
      email: subscription.email,
      message: 'Subscribed successfully.',
    };
  }
}
