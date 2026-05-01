import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { DisputesService } from './disputes.service';
import {
  CreateDisputeDto,
  UpdateDisputeDto,
  AddDisputeMessageDto,
} from './dto/dispute.dto';
import { Dispute, DisputeMessage } from './entities/dispute.entity';

@ApiTags('disputes')
@Controller('disputes')
export class DisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Open a new dispute',
    description: 'Create a new dispute for a claim with optional initial message.',
  })
  @ApiBody({ type: CreateDisputeDto })
  @ApiResponse({
    status: 201,
    description: 'Dispute created',
    type: Dispute,
  })
  @ApiResponse({ status: 400, description: 'Invalid claim ID or dispute data' })
  @ApiResponse({ status: 404, description: 'Claim not found' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async createDispute(
    @Body() createDisputeDto: CreateDisputeDto,
  ): Promise<Dispute> {
    return await this.disputesService.createDispute(createDisputeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all disputes' })
  @ApiResponse({
    status: 200,
    description: 'List of disputes',
    type: [Dispute],
  })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async getAllDisputes(): Promise<Dispute[]> {
    return await this.disputesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get dispute by ID' })
  @ApiParam({
    name: 'id',
    description: 'Dispute UUID',
    type: 'string',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Dispute details',
    type: Dispute,
  })
  @ApiResponse({ status: 404, description: 'Dispute not found' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async getDispute(@Param('id') id: string): Promise<Dispute> {
    return await this.disputesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update dispute status' })
  @ApiParam({
    name: 'id',
    description: 'Dispute UUID',
    type: 'string',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({ type: UpdateDisputeDto })
  @ApiResponse({
    status: 200,
    description: 'Dispute updated',
    type: Dispute,
  })
  @ApiResponse({ status: 400, description: 'Invalid status' })
  @ApiResponse({ status: 404, description: 'Dispute not found' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async updateDispute(
    @Param('id') id: string,
    @Body() updateDisputeDto: UpdateDisputeDto,
  ): Promise<Dispute> {
    return await this.disputesService.updateDispute(id, updateDisputeDto);
  }

  @Post(':id/messages')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add message/evidence to dispute' })
  @ApiParam({
    name: 'id',
    description: 'Dispute UUID',
    type: 'string',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({ type: AddDisputeMessageDto })
  @ApiResponse({
    status: 201,
    description: 'Message added',
    type: DisputeMessage,
  })
  @ApiResponse({ status: 404, description: 'Dispute not found' })
  @ApiResponse({ status: 400, description: 'Invalid message data' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async addMessage(
    @Param('id') id: string,
    @Body() addMessageDto: AddDisputeMessageDto,
  ): Promise<DisputeMessage> {
    return await this.disputesService.addMessage(id, addMessageDto);
  }
}
