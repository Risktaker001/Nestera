import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  SavingsProductType,
  RiskLevel,
} from '../entities/savings-product.entity';

/**
 * Detailed product response combining static DB attributes with live Soroban contract data
 */
export class ProductDetailsDto {
  @ApiProperty({
    description: 'Product UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Product name',
    example: 'Fixed 12-Month Plan',
  })
  name: string;

  @ApiProperty({
    enum: SavingsProductType,
    description: 'Product type',
    example: SavingsProductType.FIXED,
  })
  type: SavingsProductType;

  @ApiPropertyOptional({
    description: 'Product description',
    nullable: true,
    example: 'A fixed-term savings plan with 8.5% annual interest rate',
  })
  description: string | null;

  @ApiProperty({
    description: 'Annual interest rate (%)',
    example: 8.5,
  })
  interestRate: number;

  @ApiProperty({
    description: 'Minimum subscription amount (in XLM)',
    example: 1000,
  })
  minAmount: number;

  @ApiProperty({
    description: 'Maximum subscription amount (in XLM)',
    example: 1000000,
  })
  maxAmount: number;

  @ApiPropertyOptional({
    description: 'Tenure in months (e.g., for fixed deposits)',
    nullable: true,
    example: 12,
  })
  tenureMonths: number | null;

  @ApiProperty({
    description: 'Whether the product is currently active and accepting subscriptions',
    example: true,
  })
  isActive: boolean;

  @ApiPropertyOptional({
    description: 'Soroban vault contract ID (if deployed)',
    nullable: true,
    example: 'CDLZFC3T7B4G4H5H3H4G5H6G7H8G9H0G1H2I3J4K5L6M7N',
  })
    description: 'Maximum active subscriptions allowed per user',
  })
  maxSubscriptionsPerUser: number | null;
  @ApiProperty({ description: 'Current product version' })
  version: number;

  @ApiPropertyOptional({ description: 'Soroban vault contract ID' })
  contractId: string | null;

  @ApiProperty({
    description: 'Live total assets from Soroban contract (in stroops)',
    example: 15000000000,
  })
  totalAssets: number;

  @ApiProperty({
    description: 'Live total assets formatted as XLM (1 XLM = 10000000 stroops)',
    example: 1500,
  })
  totalAssetsXlm: number;

  @ApiProperty({
    description: 'Product creation timestamp',
    type: Date,
    example: '2025-01-15T10:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Risk level classification for this product',
    example: 'Low',
  })
  riskLevel: string;
  @ApiPropertyOptional({
    description: 'Maximum liquidity-backed capacity for the product',
  })
  maxCapacity: number | null;

  @ApiProperty({ description: 'Current utilized capacity amount' })
  utilizedCapacity: number;

  @ApiProperty({ description: 'Remaining capacity amount' })
  availableCapacity: number;

  @ApiProperty({ description: 'Capacity utilization percentage' })
  utilizationPercentage: number;

  @ApiProperty({ description: 'Whether the product is fully utilized' })
  isFull: boolean;

  @ApiProperty({ description: 'Product creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Risk level classification', enum: RiskLevel })
  riskLevel: RiskLevel;

  @ApiProperty({
    description: 'Product last update timestamp',
    type: Date,
    example: '2025-01-20T15:30:00Z',
  })
  updatedAt: Date;
}
