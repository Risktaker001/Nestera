import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  Post,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  ClassSerializerInterceptor,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { StorageService } from '../storage/storage.service';
import { UserService } from './user.service';
import { SavingsService } from '../blockchain/savings.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { NetWorthDto } from './dto/net-worth.dto';
import { UserProfileResponseDto } from './dto/user-profile-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ThrottlerGuard } from '@nestjs/throttler';
import { FileValidator } from '@nestjs/common';

// File upload configuration
const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_KYC_DOC_SIZE = 10 * 1024 * 1024; // 10MB

class ImageTypeValidator extends FileValidator {
  constructor() {
    super({});
  }

  isValid(file: any): boolean {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    return allowedTypes.includes(file.mimetype);
  }

  buildErrorMessage(): string {
    return 'Invalid file type. Only jpeg, png, and webp are allowed.';
  }
}

class KycDocumentValidator extends FileValidator {
  constructor() {
    super({});
  }

  isValid(file: any): boolean {
    const allowedTypes = ['application/pdf', 'image/jpeg'];
    return allowedTypes.includes(file.mimetype);
  }

  buildErrorMessage(): string {
    return 'Invalid file type. Only PDF and JPEG formats are allowed for KYC documents.';
  }
}

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly storageService: StorageService,
    private readonly savingsService: SavingsService,
  ) {}

  @Get('profile')
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({
    summary: "Get the authenticated user's full profile",
    description:
      'Returns id, email, name, bio, avatarUrl, walletAddress (linked Stellar key), ' +
      'role, kycStatus, createdAt, and computed daysActive. ' +
      'Password hashes and internal fields are always excluded.',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile returned successfully',
    type: UserProfileResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT' })
  @ApiResponse({ status: 404, description: 'User not found' })
  getProfile(
    @CurrentUser() user: { id: string },
  ): Promise<UserProfileResponseDto> {
    return this.userService.getProfile(user.id);
  }

  @Get('me')
  @ApiOperation({
    summary: 'Get basic info for the authenticated user',
    description: 'Returns basic user information (id, email, name, bio, avatarUrl, publicKey, role, kycStatus, createdAt)',
  })
  @ApiResponse({
    status: 200,
    description: 'User information retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440000' },
        email: { type: 'string', example: 'alice@example.com' },
        name: { type: 'string', example: 'Alice Johnson' },
        bio: { type: 'string', nullable: true, example: 'Crypto enthusiast' },
        avatarUrl: { type: 'string', nullable: true, format: 'uri' },
        publicKey: { type: 'string', nullable: true, example: 'GABCDEF...' },
        role: { type: 'string', enum: ['USER', 'ADMIN'], example: 'USER' },
        kycStatus: { type: 'string', enum: ['PENDING', 'APPROVED', 'REJECTED'], example: 'APPROVED' },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - No valid JWT token' })
  getMe(@CurrentUser() user: { id: string }) {
    return this.userService.findById(user.id);
  }

  @Get('me/net-worth')
  @ApiOperation({
    summary: 'Get authenticated user\'s net worth breakdown',
    description: 'Calculates total net worth including wallet balance and all savings (flexible + locked) with percentage breakdown',
  })
  @ApiResponse({
    status: 200,
    description: 'Net worth calculated successfully',
    type: NetWorthDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - No valid JWT token' })
  async getNetWorth(@CurrentUser() user: { id: string }): Promise<NetWorthDto> {
    const userEntity = await this.userService.findById(user.id);

    if (!userEntity.publicKey) {
      return this.createZeroNetWorthResponse();
    }

    const [walletBalance, savingsBalance] = await Promise.all([
      this.savingsService.getWalletBalance(userEntity.publicKey),
      this.savingsService.getUserSavingsBalance(userEntity.publicKey),
    ]);

    const totalSavings = savingsBalance.total;
    const totalNetWorth = walletBalance + totalSavings;

    const walletPercentage =
      totalNetWorth > 0 ? (walletBalance / totalNetWorth) * 100 : 0;
    const savingsPercentage =
      totalNetWorth > 0 ? (totalSavings / totalNetWorth) * 100 : 0;

    return {
      walletBalance,
      savingsFlexible: savingsBalance.flexible,
      savingsLocked: savingsBalance.locked,
      totalSavings,
      totalNetWorth,
      balanceBreakdown: {
        wallet: {
          amount: walletBalance,
          percentage: walletPercentage,
        },
        savings: {
          amount: totalSavings,
          percentage: savingsPercentage,
          flexibleAmount: savingsBalance.flexible,
          lockedAmount: savingsBalance.locked,
        },
      },
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Retrieve user information by unique identifier (admin or self only)',
  })
  @ApiParam({
    name: 'id',
    description: 'User UUID',
    type: 'string',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'User found',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        email: { type: 'string' },
        name: { type: 'string', nullable: true },
        bio: { type: 'string', nullable: true },
        publicKey: { type: 'string', nullable: true },
        role: { type: 'string', enum: ['USER', 'ADMIN'] },
        kycStatus: { type: 'string', enum: ['PENDING', 'APPROVED', 'REJECTED'] },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('id') id: string) {
    return this.userService.findById(id);
  }

  @Patch('me')
  @ApiOperation({
    summary: 'Update authenticated user profile',
    description: 'Update user name and bio. All fields are optional - only provided fields will be updated.',
  })
  @ApiBody({
    description: 'User update data',
    type: UpdateUserDto,
    examples: {
      nameOnly: {
        value: { name: 'Alice Updated' },
        summary: 'Update name only',
      },
      bioOnly: {
        value: { bio: 'Updated bio description' },
        summary: 'Update bio only',
      },
      both: {
        value: { name: 'Alice Johnson', bio: 'Updated bio' },
        summary: 'Update both name and bio',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        email: { type: 'string' },
        name: { type: 'string' },
        bio: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  updateMe(@CurrentUser() user: { id: string }, @Body() dto: UpdateUserDto) {
    return this.userService.update(user.id, dto);
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete authenticated user account',
    description: 'Permanently deletes the user account associated with the JWT token. This action cannot be undone.',
  })
  @ApiResponse({ status: 204, description: 'Account deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  deleteMe(@CurrentUser() user: { id: string }) {
    return this.userService.remove(user.id);
  }

  @Post('avatar')
  @UseGuards(ThrottlerGuard)
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload profile avatar',
    description: 'Upload a profile picture (JPEG, PNG, or WebP, max 5MB). The file is uploaded to storage and the avatarUrl is updated.',
  })
  @ApiBody({
    description: 'Avatar image file',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file (JPEG, PNG, WebP) - max 5MB',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Avatar uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        avatarUrl: {
          type: 'string',
          format: 'uri',
          example: 'https://cdn.nestera.io/avatars/user-123.jpg',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid file type or size (must be JPEG, PNG, or WebP under 5MB)' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async uploadAvatar(
    @CurrentUser() user: { id: string },
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }),
          new MaxFileSizeValidator({ maxSize: MAX_AVATAR_SIZE }),
          new ImageTypeValidator(),
        ],
        fileIsRequired: true,
      }),
    )
    file: any,
  ) {
    const avatarUrl = await this.storageService.saveFile(file);
    return this.userService.updateAvatar(user.id, avatarUrl);
  }

  @Post('me/kyc-docs')
  @UseGuards(ThrottlerGuard)
  @UseInterceptors(FileInterceptor('document'))
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload KYC verification document',
    description: 'Upload KYC documents (PDF or JPEG, max 10MB) for identity verification. Document will be stored and linked to user account.',
  })
  @ApiBody({
    description: 'KYC document file',
    schema: {
      type: 'object',
      properties: {
        document: {
          type: 'string',
          format: 'binary',
          description: 'KYC document (PDF or JPEG) - max 10MB',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'KYC document uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        kycDocumentUrl: {
          type: 'string',
          format: 'uri',
          example: 'https://cdn.nestera.io/kyc/user-123-doc.pdf',
        },
        message: { type: 'string', example: 'KYC document uploaded' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid file type or size (must be PDF or JPEG under 10MB)' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async uploadKycDocument(
    @CurrentUser() user: { id: string },
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 10 }),
          new MaxFileSizeValidator({ maxSize: MAX_KYC_DOC_SIZE }),
          new KycDocumentValidator(),
        ],
        fileIsRequired: true,
      }),
    )
    file: any,
  ) {
    const kycDocumentUrl = await this.storageService.saveFile(file);
    return this.userService.updateKycDocument(user.id, kycDocumentUrl);
  }

  private createZeroNetWorthResponse(): NetWorthDto {
    return {
      walletBalance: 0,
      savingsFlexible: 0,
      savingsLocked: 0,
      totalSavings: 0,
      totalNetWorth: 0,
      balanceBreakdown: {
        wallet: {
          amount: 0,
          percentage: 0,
        },
        savings: {
          amount: 0,
          percentage: 0,
          flexibleAmount: 0,
          lockedAmount: 0,
        },
      },
    };
  }
}
