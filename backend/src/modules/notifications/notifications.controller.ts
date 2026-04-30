import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';
import { UpdateNotificationPreferenceDto } from './dto/update-notification-preference.dto';
import { User } from '../user/entities/user.entity';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get user notifications',
    description: 'Retrieve paginated list of notifications for the authenticated user. Supports page and limit query parameters.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 20, max: 100)',
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: 'List of user notifications',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'notif_123' },
          type: { type: 'string', example: 'KYC_APPROVED' },
          title: { type: 'string', example: 'KYC Verification Approved' },
          message: { type: 'string', example: 'Your KYC verification has been approved.' },
          isRead: { type: 'boolean', example: false },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - No valid JWT token' })
  @ApiResponse({ status: 429, description: 'Too many requests - rate limit exceeded' })
  async getNotifications(
    @CurrentUser() user: User,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return await this.notificationsService.getUserNotifications(
      user.id,
      page,
      limit,
    );
  }

  @Get('unread-count')
  @ApiOperation({
    summary: 'Get unread notification count',
    description: 'Returns the number of unread notifications for the authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Unread count returned',
    schema: {
      type: 'object',
      properties: {
        unreadCount: { type: 'number', example: 5 },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async getUnreadCount(@CurrentUser() user: User) {
    const count = await this.notificationsService.getUnreadCount(user.id);
    return { unreadCount: count };
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark notification as read',
    description: 'Marks a specific notification as read for the authenticated user.',
  })
  @ApiParam({
    name: 'id',
    description: 'Notification ID',
    type: 'string',
    example: 'notif_123',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification marked as read',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        isRead: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async markAsRead(@Param('id') notificationId: string) {
    return await this.notificationsService.markAsRead(notificationId);
  }

  @Patch('mark-all-read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark all notifications as read',
    description: 'Marks all notifications for the authenticated user as read.',
  })
  @ApiResponse({
    status: 200,
    description: 'All notifications marked as read',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'All notifications marked as read' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async markAllAsRead(@CurrentUser() user: User) {
    await this.notificationsService.markAllAsRead(user.id);
    return { message: 'All notifications marked as read' };
  }

  @Get('preferences')
  @ApiOperation({
    summary: 'Get notification preferences',
    description: 'Retrieve the authenticated user\'s notification preference settings.',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification preferences retrieved',
    type: UpdateNotificationPreferenceDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async getPreferences(@CurrentUser() user: User) {
    return await this.notificationsService.getOrCreatePreferences(user.id);
  }

  @Patch('preferences')
  @ApiOperation({
    summary: 'Update notification preferences',
    description: 'Update the authenticated user\'s notification preferences. All fields are optional; only provided fields will be updated.',
  })
  @ApiBody({
    description: 'Notification preference updates',
    type: UpdateNotificationPreferenceDto,
    examples: {
      emailOnly: {
        value: { emailNotifications: true, inAppNotifications: false },
        summary: 'Enable email only',
      },
      disableAll: {
        value: { emailNotifications: false, inAppNotifications: false, sweepNotifications: false, claimNotifications: false, yieldNotifications: false },
        summary: 'Disable all notifications',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Preferences updated successfully',
    type: UpdateNotificationPreferenceDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Invalid preference data' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
    summary:
      'Update notification preferences (channels, types, quiet hours, digest)',
  })
  async updatePreferences(
    @CurrentUser() user: User,
    @Body() updateDto: UpdateNotificationPreferenceDto,
  ) {
    return await this.notificationsService.updatePreferences(
      user.id,
      updateDto,
    );
  }
}
