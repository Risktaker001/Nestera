import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';
import { StellarService } from './stellar.service';
import { BalanceSyncService } from './balance-sync.service';
import { TransactionDto } from './dto/transaction.dto';
import { TransactionBatchingService } from './transaction-batching.service';
import { CreateTransactionBatchDto } from './dto/create-transaction-batch.dto';
import { TransactionBatchResponseDto } from './dto/transaction-batch-response.dto';

@ApiTags('Blockchain')
@Controller('blockchain')
export class BlockchainController {
  constructor(
    private readonly stellarService: StellarService,
    private readonly balanceSyncService: BalanceSyncService,
    private readonly transactionBatchingService: TransactionBatchingService,
  ) {}

  @Post('wallets/generate')
  @ApiOperation({ summary: 'Generate a new Stellar keypair' })
  generateWallet() {
    return this.stellarService.generateKeypair();
  }

  @Get('wallets/:publicKey/transactions')
  @ApiOperation({
    summary: 'Get paginated recent on-chain transactions for a Stellar wallet',
  })
  @ApiParam({
    name: 'publicKey',
    description: 'The Stellar public key (starting with G) of the wallet',
    example: 'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN',
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of transactions per page (default 10, max 200)',
    required: false,
    example: 10,
  })
  @ApiQuery({
    name: 'cursor',
    description: 'Pagination cursor (transaction hash) for fetching next page',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description:
      'Paginated transactions with cursor for pagination and hasMore flag',
    schema: {
      type: 'object',
      properties: {
        records: {
          type: 'array',
          items: { $ref: '#/components/schemas/TransactionDto' },
        },
        nextCursor: { type: 'string', nullable: true },
        hasMore: { type: 'boolean' },
      },
    },
  })
  async getWalletTransactions(
    @Param('publicKey') publicKey: string,
    @Query('limit') limit?: number,
    @Query('cursor') cursor?: string,
  ): Promise<any> {
    const sanitizedLimit = limit ? Math.min(Math.max(limit, 1), 200) : 10;
    const res =
      limit === undefined && cursor === undefined
        ? await this.stellarService.getRecentTransactions(publicKey)
        : await this.stellarService.getRecentTransactions(
            publicKey,
            sanitizedLimit,
            cursor,
          );

    if (Array.isArray(res)) return res;
    // If paginated result returned and no cursor provided, return records for backward compatibility
    if (!cursor && res && typeof res === 'object' && 'records' in res) {
      return (res as { records: TransactionDto[] }).records;
    }

    return res;
  }

  @Get('rpc/status')
  @ApiOperation({
    summary: 'Get status of all configured RPC endpoints',
    description:
      'Returns information about primary and fallback RPC/Horizon endpoints for monitoring and debugging',
  })
  @ApiResponse({
    status: 200,
    description:
      'Status of all RPC endpoints including current active endpoint',
  })
  getRpcStatus() {
    return this.stellarService.getEndpointsStatus();
  }

  @Post('batches')
  @ApiOperation({
    summary: 'Create and process a Soroban transaction batch',
    description:
      'Executes compatible contract operations using one source signer, tracks partial failures, and returns fee savings metrics. The sourceSecretKey is never persisted or returned.',
  })
  @ApiResponse({
    status: 201,
    description: 'Persisted batch status including per-operation results',
    type: TransactionBatchResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid batch request' })
  async createBatch(
    @Body() dto: CreateTransactionBatchDto,
  ): Promise<TransactionBatchResponseDto> {
    return this.transactionBatchingService.createAndProcessBatch(
      dto.sourceSecretKey,
      dto.operations,
      { maxBatchSize: dto.maxBatchSize, metadata: dto.metadata },
    );
  }

  @Get('batches/:id')
  @ApiOperation({
    summary:
      'Get transaction batch status, operation results, and cost metrics',
  })
  @ApiParam({ name: 'id', description: 'Transaction batch UUID' })
  @ApiResponse({
    status: 200,
    description: 'Batch status including operations and cost-savings metrics',
    type: TransactionBatchResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Transaction batch not found' })
  async getBatch(
    @Param('id') id: string,
  ): Promise<TransactionBatchResponseDto> {
    return this.transactionBatchingService.getBatchStatus(id);
  }

  @Get('balance-sync/metrics')
  @ApiOperation({
    summary: 'Get WebSocket connection health metrics for balance sync',
  })
  @ApiResponse({
    status: 200,
    description: 'Connection metrics summary for all subscribed accounts',
  })
  getBalanceSyncMetrics() {
    return this.balanceSyncService.getMetricsSummary();
  }
}
