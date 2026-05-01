import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ProposalCategory,
  ProposalStatus,
} from '../entities/governance-proposal.entity';

export class ProposalTimelineDto {
  @ApiProperty({
    description: 'Proposal start boundary as UNIX block number',
    nullable: true,
    example: 12345678,
  })
  startTime: number | null;

  @ApiProperty({
    description: 'Proposal end boundary as UNIX block number',
    nullable: true,
    example: 12346678,
  })
  endTime: number | null;
}

export class ProposalListItemDto {
  @ApiProperty({
    description: 'Unique proposal identifier (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'On-chain proposal ID (from Stellar/Soroban)',
    example: 42,
  })
  onChainId: number;

  @ApiProperty({
    description: 'Proposal title or short description',
    example: 'Increase Treasury Allocation for Community Grants',
  })
  title: string;

  @ApiPropertyOptional({
    description: 'Detailed proposal description (markdown supported)',
    nullable: true,
    example: 'This proposal seeks to allocate 100,000 XLM from the treasury...',
  })
  description: string | null;

  @ApiProperty({
    description: 'Category of the proposal',
    enum: ProposalCategory,
    example: ProposalCategory.TREASURY,
  })
  category: ProposalCategory;

  @ApiProperty({
    description: 'Current status of the proposal',
    enum: ProposalStatus,
    example: ProposalStatus.ACTIVE,
  })
  status: ProposalStatus;

  @ApiPropertyOptional({
    description: 'Address of the proposer (Stellar public key)',
    nullable: true,
    example: 'GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGSNFHEYVXM3XOJMDS674JZ',
  })
  proposer: string | null;

  @ApiProperty({
    description: 'Percentage of votes cast FOR (0–100)',
    example: 62.5,
  })
  forPercent: number;

  @ApiProperty({
    description: 'Percentage of votes cast AGAINST (0–100)',
    example: 37.5,
  })
  againstPercent: number;

  @ApiProperty({
    description: 'Proposal voting timeline',
    type: () => ProposalTimelineDto,
  })
    description: 'Percentage of votes cast ABSTAIN (0–100)',
    example: 10.0,
  })
  abstainPercent: number;

  @ApiProperty({ type: () => ProposalTimelineDto })
  timeline: ProposalTimelineDto;
}
