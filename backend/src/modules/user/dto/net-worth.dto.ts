import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class NetWorthDto {
  @ApiProperty({
    description: 'Total balance in user\'s Stellar wallet (XLM)',
    example: 1500.75,
  })
  walletBalance: number;

  @ApiProperty({
    description: 'Total funds in flexible savings products (available for withdrawal)',
    example: 5000.00,
  })
  savingsFlexible: number;

  @ApiProperty({
    description: 'Total funds in locked/vested savings (not yet withdrawable)',
    example: 10000.50,
  })
  savingsLocked: number;

  @ApiProperty({
    description: 'Combined total of all savings (flexible + locked)',
    example: 15000.50,
  })
  totalSavings: number;

  @ApiProperty({
    description: 'Total net worth across all accounts (wallet + savings)',
    example: 16501.25,
  })
  totalNetWorth: number;

  @ApiProperty({
    description: 'Detailed breakdown of asset allocation percentages',
    example: {
      wallet: {
        amount: 1500.75,
        percentage: 9.09,
      },
      savings: {
        amount: 15000.50,
        percentage: 90.91,
        flexibleAmount: 5000.00,
        lockedAmount: 10000.50,
      },
    },
  })
  balanceBreakdown: {
    wallet: {
      amount: number;
      percentage: number;
    };
    savings: {
      amount: number;
      percentage: number;
      flexibleAmount: number;
      lockedAmount: number;
    };
  };
}
