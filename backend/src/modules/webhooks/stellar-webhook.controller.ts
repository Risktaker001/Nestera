import {
  Controller,
  Post,
  Body,
  Headers,
  UnauthorizedException,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Controller('webhooks/stellar')
@ApiTags('Webhooks')
@ApiBearerAuth()
export class StellarWebhookController {
  private readonly logger = new Logger(StellarWebhookController.name);

  constructor(private configService: ConfigService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Handle Stellar webhook events',
    description: 'Receives and processes webhook events from the Stellar network. Verifies the X-Stellar-Signature header before processing payment events.',
  })
  @ApiHeader({
    name: 'x-stellar-signature',
    description: 'HMAC-SHA256 signature of the webhook payload for verification',
    required: true,
    example: 'a1b2c3d4e5f60718293a4b5c6d7e8f9...',
  })
  @ApiBody({
    description: 'Stellar webhook payload containing transaction details',
    schema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['payment', 'create_account', 'account_credited', 'account_debited'],
          example: 'payment',
          description: 'Type of Stellar event',
        },
        from: {
          type: 'string',
          example: 'GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGSNFHEYVXM3XOJMDS674JZ',
          description: 'Source account ID (public key)',
        },
        to: {
          type: 'string',
          example: 'GCNYNZX2QSOUUNBHT5KQ3BMA5XKNLAWUK57FZZRFLEH7M242CC4OTZLM',
          description: 'Destination account ID (public key)',
        },
        amount: {
          type: 'string',
          example: '100.50',
          description: 'Transaction amount',
        },
        asset_code: {
          type: 'string',
          example: 'USDC',
          description: 'Asset code (null for native XLM)',
        },
        asset_issuer: {
          type: 'string',
          nullable: true,
          example: 'GCNYNZX2QSOUUNBHT5KQ3BMA5XKNLAWUK57FZZRFLEH7M242CC4OTZLM',
          description: 'Asset issuer account ID (for custom assets)',
        },
        transaction_hash: {
          type: 'string',
          example: 'a1b2c3d4e5f60718293a4b5c6d7e8f9...',
          description: 'Stellar transaction hash',
        },
        timestamp: {
          type: 'string',
          format: 'date-time',
          example: '2025-01-15T10:30:00Z',
          description: 'Event timestamp',
        },
        ledger: {
          type: 'integer',
          example: 12345678,
          description: 'Ledger sequence number',
        },
      },
      required: ['type', 'from', 'to', 'amount', 'transaction_hash'],
    },
    examples: {
      payment: {
        value: {
          type: 'payment',
          from: 'GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGSNFHEYVXM3XOJMDS674JZ',
          to: 'GCNYNZX2QSOUUNBHT5KQ3BMA5XKNLAWUK57FZZRFLEH7M242CC4OTZLM',
          amount: '100.50',
          asset_code: 'USDC',
          asset_issuer: 'GA5ZSEJYB37JRC5AVCIJ5PPKX5H3LXFA7J3I5BMNCD euEu',
          transaction_hash: 'abc123def456789...',
          timestamp: '2025-01-15T10:30:00Z',
          ledger: 12345678,
        },
        summary: 'Payment webhook with custom asset',
      },
      xlmTransfer: {
        value: {
          type: 'payment',
          from: 'GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGSNFHEYVXM3XOJMDS674JZ',
          to: 'GCNYNZX2QSOUUNBHT5KQ3BMA5XKNLAWUK57FZZRFLEH7M242CC4OTZLM',
          amount: '50.00',
          transaction_hash: 'def456abc123789...',
          timestamp: '2025-01-15T11:00:00Z',
          ledger: 12345679,
        },
        summary: 'XLM (native asset) transfer',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook processed successfully',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        message: { type: 'string', example: 'Payment event processed' },
        processedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Missing or invalid X-Stellar-Signature header',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Missing signature' },
        error: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid payload or missing required fields',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error during webhook processing',
  })
  async handleWebhook(
    @Body() payload: any,
    @Headers('x-stellar-signature') signature?: string,
  ) {
    this.logger.log('Received Stellar webhook');

    if (!signature) {
      this.logger.warn('Missing x-stellar-signature header');
      throw new UnauthorizedException('Missing signature');
    }

    const secret =
      this.configService.get<string>('stellar.webhookSecret') || '';
    const payloadString = JSON.stringify(payload);

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payloadString)
      .digest('hex');

    if (!this.verifySignature(signature, expectedSignature)) {
      this.logger.warn('Invalid webhook signature');
      throw new UnauthorizedException('Invalid signature');
    }

    this.logger.log('Webhook signature verified');
    this.processPayment(payload);

    return { status: 'success' };
  }

  private verifySignature(
    signature: string,
    expectedSignature: string,
  ): boolean {
    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex'),
      );
    } catch (error) {
      return false;
    }
  }

  private processPayment(payload: any) {
    const {
      type,
      from,
      to,
      amount,
      asset_code,
      asset_issuer,
      transaction_hash,
    } = payload;

    this.logger.log(`Processing ${type}:
      Hash: ${transaction_hash}
      From: ${from}
      To: ${to}
      Amount: ${amount} ${asset_code || 'XLM'}
      Issuer: ${asset_issuer || 'native'}
    `);

    // TODO: Add further logic here (e.g., updating database, notifying user)
  }
}
