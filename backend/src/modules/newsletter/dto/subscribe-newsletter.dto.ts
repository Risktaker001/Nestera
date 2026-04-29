import { IsEmail } from 'class-validator';

export class SubscribeNewsletterDto {
  @IsEmail({}, { message: 'A valid email address is required' })
  email: string;
}
