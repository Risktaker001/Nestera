import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateTransactionBatchOperationDto {
  @ApiProperty({
    description: 'Soroban contract ID to call',
    example: 'CCJZ5DGASBWQXR5MPFCJXMBI333XE5U3FSJTNQU7RIKE3P5GN2K2WYD5',
  })
  @IsString()
  contractId: string;

  @ApiProperty({
    description: 'Contract function name to invoke',
    example: 'deposit',
  })
  @IsString()
  functionName: string;

  @ApiPropertyOptional({
    description: 'Arguments passed to the contract function',
    type: [Object],
    example: [
      'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN',
      '10000000',
    ],
  })
  @IsOptional()
  @IsArray()
  args?: unknown[];

  @ApiPropertyOptional({
    description: 'Caller metadata stored with this operation',
    example: { requestId: 'withdrawal-123' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({
    description:
      'Caller-provided idempotency key for correlating operation status',
    example: 'withdrawal-123',
  })
  @IsOptional()
  @IsString()
  idempotencyKey?: string;

  @ApiPropertyOptional({
    description: 'Alias for idempotencyKey for client integrations',
    example: 'client-op-123',
  })
  @IsOptional()
  @IsString()
  clientKey?: string;
}

export class CreateTransactionBatchDto {
  @ApiProperty({
    description:
      'Source Stellar secret key used to sign this batch. It is never persisted or returned.',
    example: 'SBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  })
  @IsString()
  sourceSecretKey: string;

  @ApiProperty({
    description:
      'Contract operations to execute with the same signer/source account',
    type: [CreateTransactionBatchOperationDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(1000)
  @ValidateNested({ each: true })
  @Type(() => CreateTransactionBatchOperationDto)
  operations: CreateTransactionBatchOperationDto[];

  @ApiPropertyOptional({
    description:
      'Maximum operations per Stellar transaction chunk. Values above 100 are capped to 100.',
    minimum: 1,
    maximum: 100,
    default: 25,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  maxBatchSize?: number;

  @ApiPropertyOptional({
    description: 'Metadata stored on the batch record',
    example: { source: 'api' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
