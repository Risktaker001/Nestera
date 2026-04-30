import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { Role } from '../enums/role.enum';
import { EventDlqService } from './event-dlq.service';
import { FailedEventStatus } from './entities/failed-event.entity';
import { ReplayEventsDto } from './dto/replay-events.dto';

@ApiTags('admin: event-dlq')
@ApiBearerAuth()
@Controller('admin/event-dlq')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class EventDlqController {
  constructor(private readonly dlqService: EventDlqService) {}

  @Get('stats')
  @ApiOperation({ summary: 'DLQ summary stats for monitoring dashboards' })
  @ApiResponse({ status: 200, description: 'Counts by status & event name' })
  async getStats() {
    return this.dlqService.getStats();
  }

  @Get()
  @ApiOperation({ summary: 'List failed events' })
  @ApiQuery({ name: 'status', enum: FailedEventStatus, required: false })
  @ApiQuery({ name: 'eventName', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async list(
    @Query('status') status?: FailedEventStatus,
    @Query('eventName') eventName?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.dlqService.list({
      status,
      eventName,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a failed event by id' })
  async getOne(@Param('id', new ParseUUIDPipe()) id: string) {
    const record = await this.dlqService.getOne(id);
    if (!record) throw new NotFoundException('Failed event not found');
    return record;
  }

  @Post(':id/replay')
  @ApiOperation({ summary: 'Replay a single failed event' })
  async replayOne(@Param('id', new ParseUUIDPipe()) id: string) {
    const result = await this.dlqService.replay(id);
    if (!result.success && result.error === 'Failed event not found') {
      throw new NotFoundException(result.error);
    }
    return result;
  }

  @Post('replay')
  @ApiOperation({ summary: 'Replay multiple failed events' })
  async replayMany(@Body() dto: ReplayEventsDto) {
    return this.dlqService.replayMany(dto.ids);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Discard a failed event without replaying' })
  async discard(@Param('id', new ParseUUIDPipe()) id: string) {
    const ok = await this.dlqService.discard(id);
    if (!ok) throw new NotFoundException('Failed event not found');
    return { discarded: true };
  }
}
