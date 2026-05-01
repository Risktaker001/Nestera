import {
  IsOptional,
  IsBoolean,
  IsEnum,
  IsString,
  Matches,
  ValidateIf,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { DigestFrequency } from '../entities/notification-preference.entity';

export class UpdateNotificationPreferenceDto {
  @ApiPropertyOptional({
    description: 'Receive email notifications for account activity',
    example: true,
  })
  // Channel preferences
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @ApiPropertyOptional({
    description: 'Receive in-app notifications',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  inAppNotifications?: boolean;

  @ApiPropertyOptional({
    description: 'Receive notifications about sweep events',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  pushNotifications?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  smsNotifications?: boolean;

  // Notification type preferences
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  depositNotifications?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  withdrawalNotifications?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  goalNotifications?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  governanceNotifications?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  marketingNotifications?: boolean;

  // Legacy
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  sweepNotifications?: boolean;

  @ApiPropertyOptional({
    description: 'Receive notifications about claim status updates',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  claimNotifications?: boolean;

  @ApiPropertyOptional({
    description: 'Receive notifications about yield earnings',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  yieldNotifications?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  milestoneNotifications?: boolean;

  // Quiet hours
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  quietHoursEnabled?: boolean;

  @ApiPropertyOptional({ example: '22:00' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'quietHoursStart must be HH:MM',
  })
  quietHoursStart?: string;

  @ApiPropertyOptional({ example: '08:00' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'quietHoursEnd must be HH:MM',
  })
  quietHoursEnd?: string;

  @ApiPropertyOptional({ example: 'America/New_York' })
  @IsOptional()
  @IsString()
  timezone?: string;

  // Digest frequency
  @ApiPropertyOptional({ enum: DigestFrequency })
  @IsOptional()
  @IsEnum(DigestFrequency)
  digestFrequency?: DigestFrequency;
}
