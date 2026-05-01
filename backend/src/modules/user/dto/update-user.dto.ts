import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateUserDto {
  @ApiProperty({
    description: 'User full display name',
    example: 'Alice Johnson',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiProperty({
    description: 'User biography or personal description',
    example: 'Software engineer and crypto enthusiast',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  lastLoginAt?: Date;
}

export class ApproveKycDto {
  @ApiProperty({
    description: 'Unique identifier of the user to approve',
    example: 'user_123456789',
  })
  @IsString()
  userId: string;
}

export class RejectKycDto {
  @ApiProperty({
    description: 'Unique identifier of the user to reject',
    example: 'user_123456789',
  })
  @IsString()
  userId: string;

  @ApiProperty({
    description: 'Reason for KYC rejection',
    example: 'Invalid identification document provided',
    minLength: 10,
  })
  @IsString()
  reason: string;
}
