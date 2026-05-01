import { ApiProperty } from '@nestjs/swagger';

export class YieldBreakdownDto {
  @ApiProperty({
    description: 'Array of liquidity pools or savings products with earned interest',
    type: Array,
    example: [
      { pool: 'USDC-Pool', earned: 45.50 },
      { pool: 'XLM-Staking', earned: 12.30 },
      { pool: 'Flexible-Savings', earned: 8.75 },
    ],
  })
  pools: Array<{
    pool: string;
    earned: number;
  }>;

  @ApiProperty({
    description: 'Total interest earned across all pools',
    example: 66.55,
  })
  totalInterestEarned: number;
}
