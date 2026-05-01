import { Controller, Get, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { StellarEventListenerService } from './stellar-event-listener.service';

@ApiTags('stellar-events')
@Controller('stellar-events')
export class StellarEventListenerController {
  constructor(
    private readonly eventListenerService: StellarEventListenerService,
  ) {}

  @Get('status')
  @ApiOperation({
    summary: 'Get event listener status',
    description: 'Retrieve the current status of the Stellar event listener service, including whether it is running and last processed ledger.',
  })
  @ApiResponse({
    status: 200,
    description: 'Event listener status',
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['running', 'stopped', 'error'],
          example: 'running',
        },
        lastProcessedLedger: {
          type: 'number',
          example: 12345678,
        },
        lastProcessedTime: {
          type: 'string',
          format: 'date-time',
          example: '2025-01-15T10:30:00Z',
        },
        error: {
          type: 'string',
          nullable: true,
          example: null,
        },
      },
    },
  })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  getStatus() {
    return this.eventListenerService.getStatus();
  }

  @Post('sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Manually trigger event synchronization',
    description: 'Initiates a manual sync with the Stellar network to process any missed events.',
  })
  @ApiResponse({
    status: 200,
    description: 'Manual sync completed',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Manual sync completed' },
        processed: { type: 'number', example: 15 },
        errors: { type: 'number', example: 0 },
      },
    },
  })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  @ApiResponse({ status: 500, description: 'Sync failed due to internal error' })
  async triggerSync() {
    const result = await this.eventListenerService.triggerManualSync();
    return {
      message: 'Manual sync completed',
      ...result,
    };
  }

  @Post('start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Start event listener',
    description: 'Start the Stellar event listener service to process events automatically.',
  })
  @ApiResponse({
    status: 200,
    description: 'Listener started',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Event listener started' },
        status: { type: 'string', example: 'running' },
      },
    },
  })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  @ApiResponse({ status: 500, description: 'Failed to start listener' })
  async startListener() {
    await this.eventListenerService.startListening();
    return { message: 'Event listener started' };
  }

  @Post('stop')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Stop event listener',
    description: 'Stop the Stellar event listener service.',
  })
  @ApiResponse({
    status: 200,
    description: 'Listener stopped',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Event listener stopped' },
        status: { type: 'string', example: 'stopped' },
      },
    },
  })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  @ApiResponse({ status: 500, description: 'Failed to stop listener' })
  stopListener() {
    this.eventListenerService.stopListening();
    return { message: 'Event listener stopped' };
  }
}
