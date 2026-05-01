import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  BadRequestException,
  Post,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { UserService } from '../user/user.service';
import { GovernanceService } from '../governance/governance.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { RateLimitMonitorService } from '../../common/services/rate-limit-monitor.service';
import { ApproveKycDto, RejectKycDto } from '../user/dto/update-user.dto';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiTags('Admin')
@ApiBearerAuth()
export class AdminController {
  constructor(
    private readonly userService: UserService,
    private readonly governanceService: GovernanceService,
    private readonly rateLimitMonitor: RateLimitMonitorService,
  ) {}

  @Patch('users/:id/kyc/approve')
  @ApiOperation({
    summary: 'Approve user KYC',
    description: 'Approves the KYC (Know Your Customer) verification for a specified user. Only administrators can perform this action.',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID to approve KYC for',
    type: String,
    example: 'user_123456789',
  })
  @ApiResponse({
    status: 200,
    description: 'KYC approval successful',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'KYC approved successfully' },
        data: {
          type: 'object',
          properties: {
            userId: { type: 'string', example: 'user_123456789' },
            kycStatus: { type: 'string', example: 'approved' },
            approvedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid request - User ID is required or invalid format' })
  @ApiResponse({ status: 401, description: 'Unauthorized - No valid JWT token provided' })
  @ApiResponse({ status: 403, description: 'Forbidden - User does not have admin privileges' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async approveKyc(@Param('id') userId: string) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
    return this.userService.approveKyc(userId);
  }

  @Patch('users/:id/kyc/reject')
  @ApiOperation({
    summary: 'Reject user KYC',
    description: 'Rejects the KYC verification for a specified user with a provided reason. Only administrators can perform this action.',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID to reject KYC for',
    type: String,
    example: 'user_123456789',
  })
  @ApiBody({
    description: 'Rejection details including reason',
    type: RejectKycDto,
    examples: {
      example1: {
        value: { reason: 'Invalid identification document' },
        summary: 'Standard rejection',
      },
      example2: {
        value: { reason: 'Mismatch between provided information and official records' },
        summary: 'Detailed rejection',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'KYC rejection successful',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'KYC rejected successfully' },
        data: {
          type: 'object',
          properties: {
            userId: { type: 'string', example: 'user_123456789' },
            kycStatus: { type: 'string', example: 'rejected' },
            reason: { type: 'string', example: 'Invalid identification document' },
            rejectedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid request - Missing user ID or rejection reason' })
  @ApiResponse({ status: 401, description: 'Unauthorized - No valid JWT token provided' })
  @ApiResponse({ status: 403, description: 'Forbidden - User does not have admin privileges' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async rejectKyc(@Param('id') userId: string, @Body() dto: RejectKycDto) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
    if (!dto.reason) {
      throw new BadRequestException('Rejection reason is required');
    }
    return this.userService.rejectKyc(userId, dto.reason);
  }

  @Patch('users/:id/kyc')
  @ApiOperation({
    summary: 'Update KYC status',
    description: 'Unified endpoint to update user KYC status (approve or reject). Only administrators can perform this action.',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID to update KYC status for',
    type: String,
    example: 'user_123456789',
  })
  @ApiBody({
    description: 'Action and optional reason',
    schema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['approve', 'reject'],
          example: 'approve',
          description: 'Action to perform: approve or reject',
        },
        reason: {
          type: 'string',
          example: 'Document verification failed',
          description: 'Required for reject action',
        },
      },
      required: ['action'],
    },
    examples: {
      approve: {
        value: { action: 'approve' },
        summary: 'Approve KYC',
      },
      reject: {
        value: { action: 'reject', reason: 'Invalid document provided' },
        summary: 'Reject KYC with reason',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'KYC status updated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'KYC status updated successfully' },
        data: {
          type: 'object',
          properties: {
            userId: { type: 'string', example: 'user_123456789' },
            kycStatus: { type: 'string', example: 'approved' },
            action: { type: 'string', example: 'approve' },
            reason: { type: 'string', nullable: true },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid request - Missing user ID, invalid action, or missing rejection reason' })
  @ApiResponse({ status: 401, description: 'Unauthorized - No valid JWT token provided' })
  @ApiResponse({ status: 403, description: 'Forbidden - User does not have admin privileges' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async updateKycStatus(
    @Param('id') userId: string,
    @Body() body: { action: 'approve' | 'reject'; reason?: string },
  ) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    if (body.action === 'approve') {
      return this.userService.approveKyc(userId);
    } else if (body.action === 'reject') {
      if (!body.reason) {
        throw new BadRequestException('Rejection reason is required');
      }
      return this.userService.rejectKyc(userId, body.reason);
    } else {
      throw new BadRequestException(
        'Action must be either "approve" or "reject"',
      );
    }
  }

  @Get('rate-limits/summary')
  @ApiOperation({ summary: 'Get rate limit violation summary' })
  @ApiResponse({ status: 200, description: 'Rate limit violation summary' })
  getRateLimitSummary() {
    return this.rateLimitMonitor.getViolationSummary();
  }

  @Get('rate-limits/violations')
  @ApiOperation({ summary: 'Get recent rate limit violations' })
  @ApiResponse({ status: 200, description: 'Recent rate limit violations' })
  getRecentViolations(@Query('limit') limit?: string) {
    return this.rateLimitMonitor.getRecentViolations(
      limit ? parseInt(limit, 10) : 50,
    );
  }

  @Post('governance/proposals/:id/cancel')
  @ApiOperation({ summary: 'Admin emergency cancellation of a proposal' })
  @ApiResponse({ status: 200, description: 'Proposal cancelled successfully' })
  async cancelProposal(
    @Param('id') proposalId: string,
    @Body() body: { reason: string },
    @Req() req: any,
  ) {
    if (!proposalId) {
      throw new BadRequestException('Proposal ID is required');
    }
    if (!body.reason || body.reason.trim().length === 0) {
      throw new BadRequestException('Cancellation reason is required');
    }
    const adminId = req.user?.id;
    if (!adminId) {
      throw new BadRequestException('Admin authentication required');
    }
    return this.governanceService.adminCancelProposal(
      proposalId,
      adminId,
      body.reason.trim(),
    );
  }
}
