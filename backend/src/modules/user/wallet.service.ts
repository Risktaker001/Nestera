import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { createHash } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Keypair, StrKey } from '@stellar/stellar-sdk';
import { UserWallet } from './entities/user-wallet.entity';
import { LinkWalletDto } from './dto/link-wallet.dto';

@Injectable()
export class WalletService {
  private readonly REPLAY_TTL_MS = 5 * 60 * 1000;

  constructor(
    @InjectRepository(UserWallet)
    private readonly walletRepository: Repository<UserWallet>,
    private readonly eventEmitter: EventEmitter2,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async linkWallet(userId: string, dto: LinkWalletDto): Promise<UserWallet> {
    const replayKey = this.buildReplayKey(
      dto.address,
      dto.message,
      dto.signature,
    );
    const replayed = await this.cacheManager.get<boolean>(replayKey);
    if (replayed) {
      throw new ForbiddenException('Signature replay detected');
    }

    // Verify ownership via signed message
    this.verifySignature(dto.address, dto.message, dto.signature);

    // Prevent duplicate wallet across users
    const existing = await this.walletRepository.findOne({
      where: { address: dto.address },
    });
    if (existing) {
      if (existing.userId === userId) {
        throw new ConflictException('Wallet already linked to your account');
      }
      throw new ConflictException('Wallet already linked to another account');
    }

    const wallets = await this.walletRepository.find({ where: { userId } });
    const isPrimary = wallets.length === 0; // first wallet becomes primary

    const wallet = this.walletRepository.create({
      userId,
      address: dto.address,
      isPrimary,
    });
    const saved = await this.walletRepository.save(wallet);

    await this.cacheManager.set(replayKey, true, this.REPLAY_TTL_MS);

    this.eventEmitter.emit('wallet.linked', { userId, address: dto.address });
    return saved;
  }

  async unlinkWallet(userId: string, address: string): Promise<void> {
    const wallet = await this.walletRepository.findOne({
      where: { address, userId },
    });
    if (!wallet) throw new NotFoundException('Wallet not found');

    const count = await this.walletRepository.count({ where: { userId } });
    if (wallet.isPrimary && count > 1) {
      throw new BadRequestException(
        'Cannot unlink primary wallet while other wallets exist. Set a new primary first.',
      );
    }

    await this.walletRepository.remove(wallet);
    this.eventEmitter.emit('wallet.unlinked', { userId, address });
  }

  async listWallets(userId: string): Promise<UserWallet[]> {
    return this.walletRepository.find({
      where: { userId },
      order: { isPrimary: 'DESC', createdAt: 'ASC' },
    });
  }

  async setPrimary(userId: string, address: string): Promise<UserWallet> {
    const wallet = await this.walletRepository.findOne({
      where: { address, userId },
    });
    if (!wallet) throw new NotFoundException('Wallet not found');

    // Unset current primary
    await this.walletRepository.update(
      { userId, isPrimary: true },
      { isPrimary: false },
    );

    wallet.isPrimary = true;
    const saved = await this.walletRepository.save(wallet);

    this.eventEmitter.emit('wallet.primaryChanged', { userId, address });
    return saved;
  }

  private verifySignature(
    address: string,
    message: string,
    signature: string,
  ): void {
    try {
      if (!StrKey.isValidEd25519PublicKey(address)) {
        throw new BadRequestException('Invalid Stellar public key');
      }
      const keypair = Keypair.fromPublicKey(address);
      const messageBuffer = Buffer.from(message, 'utf8');
      const signatureBuffer = Buffer.from(signature, 'base64');
      const valid = keypair.verify(messageBuffer, signatureBuffer);
      if (!valid) {
        throw new ForbiddenException('Signature verification failed');
      }
    } catch (err) {
      if (
        err instanceof ForbiddenException ||
        err instanceof BadRequestException
      ) {
        throw err;
      }
      throw new ForbiddenException('Signature verification failed');
    }
  }

  private buildReplayKey(
    address: string,
    message: string,
    signature: string,
  ): string {
    const digest = createHash('sha256')
      .update(`${message}:${signature}`)
      .digest('hex');
    return `wallet:signature:${address}:${digest}`;
  }
}
