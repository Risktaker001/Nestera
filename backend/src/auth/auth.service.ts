import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Inject,
  forwardRef,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { UserService } from '../modules/user/user.service';
import {
  RegisterDto,
  LoginDto,
  VerifySignatureDto,
  LinkWalletDto,
  RefreshTokenDto,
} from './dto/auth.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import * as StellarSdk from '@stellar/stellar-sdk';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuthRateLimitService } from './services/auth-rate-limit.service';
import { RefreshToken } from './entities/refresh-token.entity';
import { Session } from './entities/session.entity';
import { ConfigService } from '@nestjs/config';
import { User } from '../modules/user/entities/user.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly NONCE_TTL = 300000; // 5 minutes in milliseconds
  private readonly RATE_LIMIT_WINDOW = 900000; // 15 minutes in milliseconds
  private readonly MAX_NONCE_REQUESTS = 5; // Max requests per window
  private readonly REFRESH_TOKEN_EXPIRY_DAYS = 7;
  private readonly MAX_FAILED_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION_MINUTES = 60;
  private readonly SESSION_EXPIRY_HOURS = 24;
  private readonly AUTH_MESSAGE_PREFIX = '[Nestera] Auth Login Nonce: ';

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly eventEmitter: EventEmitter2,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly authRateLimitService: AuthRateLimitService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto, ip?: string, userAgent?: string) {
    const existingUser = await this.userService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.userService.create({
      ...dto,
      password: hashedPassword,
    });

    // Apply referral code if provided
    if (dto.referralCode) {
      this.eventEmitter.emit('user.signup-with-referral', {
        userId: user.id,
        referralCode: dto.referralCode,
      });
    }

    // Generate tokens
    const session = await this.createSession(
      user.id,
      dto.deviceId || 'default',
      dto.deviceName,
      ip,
      userAgent,
    );
    const accessToken = this.generateToken(
      user.id,
      user.email,
      user.role,
      undefined,
      session.jti,
    );
    const refreshToken = await this.createRefreshToken(
      user.id,
      dto.deviceId || 'default',
      dto.deviceName,
      ip,
      userAgent,
    );

    return {
      user,
      accessToken,
      refreshToken: refreshToken.token,
      expiresIn: this.getExpiresInSeconds(),
    };
  }

  async login(dto: LoginDto, ip?: string, userAgent?: string) {
    const user = await this.validateUser(dto.email, dto.password);
    if (!user) {
      // Record failed attempt
      await this.handleFailedLogin(dto.email, ip);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if account is locked
    if (user.isLocked && user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException(
        'Account is temporarily locked due to too many failed login attempts. Please try again later.',
      );
    }

    // Clear failed attempts on successful login
    await this.clearFailedLoginAttempts(user.id);

    // Check if 2FA is enabled
    const fullUser = await this.userService.findByEmail(dto.email);
    if (fullUser?.twoFactorEnabled) {
      return {
        requiresTwoFactor: true,
        userId: user.id,
        message: 'Please provide your 2FA token',
      };
    }

    // Generate tokens
    const session = await this.createSession(
      user.id,
      dto.deviceId || 'default',
      dto.deviceName,
      ip,
      userAgent,
    );
    const accessToken = this.generateToken(
      user.id,
      user.email,
      user.role,
      user.kycStatus,
      session.jti,
    );
    const refreshToken = await this.createRefreshToken(
      user.id,
      dto.deviceId || 'default',
      dto.deviceName,
      ip,
      userAgent,
    );

    // Update last login
    await this.userService.update(user.id, { lastLoginAt: new Date() });

    return {
      accessToken,
      refreshToken: refreshToken.token,
      expiresIn: this.getExpiresInSeconds(),
    };
  }

  private async handleFailedLogin(email: string, ip?: string): Promise<void> {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      // Record failed attempt for non-existent user
      if (ip) {
        await this.authRateLimitService.recordFailedAttempt(
          email,
          ip,
          'invalid_credentials',
        );
      }
      return;
    }

    // Increment failed login attempts
    const newAttempts = (user.failedLoginAttempts || 0) + 1;
    const updateData: Partial<User> = { failedLoginAttempts: newAttempts };

    // Lock account if max attempts reached
    if (newAttempts >= this.MAX_FAILED_ATTEMPTS) {
      const lockedUntil = new Date();
      lockedUntil.setMinutes(
        lockedUntil.getMinutes() + this.LOCKOUT_DURATION_MINUTES,
      );
      updateData.isLocked = true;
      updateData.lockedUntil = lockedUntil;

      // Emit event for email notification
      this.eventEmitter.emit('account.locked', {
        userId: user.id,
        email: user.email,
        lockedUntil,
        ipAddress: ip,
      });

      this.logger.warn(
        `Account locked for user ${user.id} after ${newAttempts} failed attempts`,
      );
    }

    await this.userRepository.update(user.id, updateData);

    // Record rate limit
    if (ip) {
      await this.authRateLimitService.recordFailedAttempt(
        email,
        ip,
        'invalid_credentials',
      );
    }
  }

  private async clearFailedLoginAttempts(userId: string): Promise<void> {
    await this.userRepository.update(userId, {
      failedLoginAttempts: 0,
      isLocked: false,
      lockedUntil: null,
    });
  }

  async unlockUser(userId: string): Promise<boolean> {
    const result = await this.userRepository.update(userId, {
      failedLoginAttempts: 0,
      isLocked: false,
      lockedUntil: null,
    });
    return (result.affected || 0) > 0;
  }

  async isUserLocked(userId: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return false;
    return (
      user.isLocked === true &&
      user.lockedUntil != null &&
      user.lockedUntil > new Date()
    );
  }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.userService.findByEmail(email);
    if (user && user.password && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  private generateToken(
    userId: string,
    email: string,
    role = 'USER',
    kycStatus = 'NOT_SUBMITTED',
    jti?: string,
  ) {
    return this.jwtService.sign({ sub: userId, email, role, kycStatus, jti });
  }

  async generateNonce(publicKey: string): Promise<{ nonce: string }> {
    // Validate Stellar public key format
    if (!StellarSdk.StrKey.isValidEd25519PublicKey(publicKey)) {
      throw new BadRequestException('Invalid Stellar public key format');
    }

    // Implement rate limiting per public key
    const rateLimitKey = `nonce:ratelimit:${publicKey}`;
    const requestCount = await this.cacheManager.get<number>(rateLimitKey);

    if (requestCount && requestCount >= this.MAX_NONCE_REQUESTS) {
      this.logger.warn(
        `Rate limit exceeded for public key: ${publicKey.substring(0, 10)}...`,
      );
      throw new UnauthorizedException(
        `Too many nonce requests. Maximum ${this.MAX_NONCE_REQUESTS} requests per 15 minutes allowed.`,
      );
    }

    // Increment rate limit counter
    const newCount = (requestCount || 0) + 1;
    await this.cacheManager.set(rateLimitKey, newCount, this.RATE_LIMIT_WINDOW);

    // Generate nonce with timestamp for additional validation
    const nonce = randomUUID();
    const timestamp = Date.now();
    const nonceData = { nonce, timestamp };

    // Store nonce in cache with TTL
    const cacheKey = `nonce:${publicKey}`;
    await this.cacheManager.set(cacheKey, nonceData, this.NONCE_TTL);

    this.logger.debug(
      `Nonce generated for public key: ${publicKey.substring(0, 10)}... (TTL: ${this.NONCE_TTL}ms)`,
    );

    return { nonce };
  }

  async verifySignature(
    dto: VerifySignatureDto,
    ip?: string,
  ): Promise<{ accessToken: string }> {
    const { publicKey, signature, nonce } = dto;

    // Validate public key format
    if (!StellarSdk.StrKey.isValidEd25519PublicKey(publicKey)) {
      throw new BadRequestException('Invalid Stellar public key format');
    }

    // Retrieve and atomically consume nonce
    const cacheKey = `nonce:${publicKey}`;
    const storedNonceData = await this.cacheManager.get<{
      nonce: string;
      timestamp: number;
    }>(cacheKey);

    if (!storedNonceData) {
      this.logger.warn(
        `Nonce not found or expired for public key: ${publicKey.substring(0, 10)}...`,
      );
      if (ip) {
        await this.authRateLimitService.recordFailedAttempt(
          publicKey,
          ip,
          'nonce_mismatch',
        );
      }
      throw new UnauthorizedException(
        'Nonce not found or expired. Request a new nonce.',
      );
    }

    // Validate nonce timestamp (additional security layer)
    const nonceAge = Date.now() - storedNonceData.timestamp;
    if (nonceAge > this.NONCE_TTL) {
      await this.cacheManager.del(cacheKey);
      this.logger.warn(
        `Expired nonce used for public key: ${publicKey.substring(0, 10)}...`,
      );
      if (ip) {
        await this.authRateLimitService.recordFailedAttempt(
          publicKey,
          ip,
          'nonce_mismatch',
        );
      }
      throw new UnauthorizedException(
        'Nonce has expired. Request a new nonce.',
      );
    }

    // Verify nonce matches
    if (storedNonceData.nonce !== nonce) {
      this.logger.warn(
        `Nonce mismatch for public key: ${publicKey.substring(0, 10)}...`,
      );
      if (ip) {
        await this.authRateLimitService.recordFailedAttempt(
          publicKey,
          ip,
          'nonce_mismatch',
        );
      }
      throw new UnauthorizedException('Nonce mismatch');
    }

    // Verify signature against the prefixed nonce message
    const isValidSignature = this.verifyWalletSignature(
      publicKey,
      signature,
      this.AUTH_MESSAGE_PREFIX + storedNonceData.nonce,
    );

    if (!isValidSignature) {
      this.logger.warn(
        `Invalid signature for public key: ${publicKey.substring(0, 10)}...`,
      );
      if (ip) {
        await this.authRateLimitService.recordFailedAttempt(
          publicKey,
          ip,
          'invalid_signature',
        );
      }
      throw new UnauthorizedException('Invalid signature');
    }

    // Atomically consume the nonce (delete it immediately after successful verification)
    await this.cacheManager.del(cacheKey);
    this.logger.debug(
      `Nonce consumed for public key: ${publicKey.substring(0, 10)}...`,
    );

    // Clear failed attempts on successful verification
    await this.authRateLimitService.clearFailedAttempts(publicKey);

    // Find or create user by public key
    let user = await this.userService.findByPublicKey(publicKey);

    if (!user) {
      // Create new user with public key
      user = await this.userService.create({
        publicKey,
        email: `${publicKey.substring(0, 10)}@stellar.wallet`,
        name: `Stellar Wallet User`,
      });
      this.logger.log(
        `New user created with public key: ${publicKey.substring(0, 10)}...`,
      );
    }

    return {
      accessToken: this.generateToken(user.id, user.email, user.role),
    };
  }

  /**
   * Link a Stellar wallet to an already-authenticated email account.
   *
   * Flow:
   *  1. Caller fetches a nonce via GET /auth/nonce?publicKey=<key>
   *  2. Caller signs the nonce with the wallet's Ed25519 secret key
   *  3. Caller POSTs { publicKey, nonce, signature } + Bearer JWT to this endpoint
   *
   * The method:
   *  - Validates the Stellar key format
   *  - Verifies the Ed25519 signature with proper nonce validation
   *  - Delegates to UserService.linkWallet, which enforces uniqueness at the DB row level
   *
   * @param userId   Extracted from the verified JWT by JwtAuthGuard
   * @param dto      LinkWalletDto from request body
   */
  async linkWallet(
    userId: string,
    dto: LinkWalletDto,
  ): Promise<{ walletAddress: string; message: string }> {
    const { publicKey, nonce, signature } = dto;

    // 1. Validate Stellar public key format
    if (!StellarSdk.StrKey.isValidEd25519PublicKey(publicKey)) {
      throw new BadRequestException('Invalid Stellar public key format');
    }

    // 2. Retrieve and validate stored nonce
    const cacheKey = `nonce:${publicKey}`;
    const storedNonceData = await this.cacheManager.get<{
      nonce: string;
      timestamp: number;
    }>(cacheKey);

    if (!storedNonceData) {
      this.logger.warn(
        `Nonce not found for wallet linking: ${publicKey.substring(0, 10)}...`,
      );
      throw new UnauthorizedException(
        'Nonce not found or expired. Request a new nonce.',
      );
    }

    // Validate nonce timestamp
    const nonceAge = Date.now() - storedNonceData.timestamp;
    if (nonceAge > this.NONCE_TTL) {
      await this.cacheManager.del(cacheKey);
      this.logger.warn(
        `Expired nonce used for wallet linking: ${publicKey.substring(0, 10)}...`,
      );
      throw new UnauthorizedException(
        'Nonce has expired. Request a new nonce.',
      );
    }

    // Verify nonce matches
    if (storedNonceData.nonce !== nonce) {
      this.logger.warn(
        `Nonce mismatch for wallet linking: ${publicKey.substring(0, 10)}...`,
      );
      throw new UnauthorizedException('Nonce mismatch');
    }

    // 3. Verify the Ed25519 signature over the prefixed nonce
    //    This proves the caller controls the private key behind publicKey.
    const isValid = this.verifyWalletSignature(
      publicKey,
      signature,
      this.AUTH_MESSAGE_PREFIX + storedNonceData.nonce,
    );
    if (!isValid) {
      this.logger.warn(
        `Invalid signature for wallet linking: ${publicKey.substring(0, 10)}...`,
      );
      throw new UnauthorizedException(
        'Signature verification failed. Ensure you signed the exact nonce bytes.',
      );
    }

    // Atomically consume the nonce
    await this.cacheManager.del(cacheKey);
    this.logger.debug(
      `Nonce consumed for wallet linking: ${publicKey.substring(0, 10)}...`,
    );

    // 4. Persist the link; UserService throws ConflictException on duplicates
    const updatedUser = await this.userService.linkWalletAddress(
      userId,
      publicKey,
    );

    this.logger.log(
      `Wallet linked successfully for user ${userId}: ${publicKey.substring(0, 10)}...`,
    );

    return {
      walletAddress: updatedUser.walletAddress,
      message: 'Wallet linked successfully',
    };
  }

  private verifyWalletSignature(
    publicKey: string,
    signature: string,
    message: string,
  ): boolean {
    try {
      // Convert public key string to Keypair
      const keypair = StellarSdk.Keypair.fromPublicKey(publicKey);

      // Convert signature from hex to Buffer
      const signatureBuffer = Buffer.from(signature, 'hex');

      // Verify the signature against the message
      return keypair.verify(Buffer.from(message), signatureBuffer);
    } catch (error) {
      return false;
    }
  }

  // --- Refresh Token Methods ---

  private async createRefreshToken(
    userId: string,
    deviceId: string,
    deviceName?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<RefreshToken> {
    const token = randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.REFRESH_TOKEN_EXPIRY_DAYS);

    const refreshToken = this.refreshTokenRepository.create({
      userId,
      token,
      deviceId,
      deviceName,
      ipAddress,
      userAgent,
      expiresAt,
    });

    return this.refreshTokenRepository.save(refreshToken);
  }

  async refreshToken(dto: RefreshTokenDto): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const { token, deviceId } = dto;

    // Find the refresh token
    const refreshToken = await this.refreshTokenRepository.findOne({
      where: { token },
      relations: ['user'],
    });

    if (!refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check if token is revoked
    if (refreshToken.isRevoked) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    // Check if token is expired
    if (refreshToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    // Check if user is active
    if (!refreshToken.user || !refreshToken.user.isActive) {
      throw new UnauthorizedException('User account is not active');
    }

    // Check if user account is locked
    if (
      refreshToken.user.isLocked &&
      refreshToken.user.lockedUntil &&
      refreshToken.user.lockedUntil > new Date()
    ) {
      throw new UnauthorizedException('Account is locked');
    }

    // Rotate the token: revoke old and create new
    await this.revokeRefreshToken(token);

    // Create new session for token rotation
    const newSession = await this.createSession(
      refreshToken.user.id,
      deviceId || refreshToken.deviceId,
      refreshToken.deviceName,
      refreshToken.ipAddress,
      refreshToken.userAgent,
    );

    const newAccessToken = this.generateToken(
      refreshToken.user.id,
      refreshToken.user.email,
      refreshToken.user.role,
      refreshToken.user.kycStatus,
      newSession.jti,
    );

    const newRefreshToken = await this.createRefreshToken(
      refreshToken.user.id,
      deviceId || refreshToken.deviceId,
      refreshToken.deviceName,
      refreshToken.ipAddress,
      refreshToken.userAgent,
    );

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken.token,
      expiresIn: this.getExpiresInSeconds(),
    };
  }

  async revokeRefreshToken(token: string): Promise<boolean> {
    const result = await this.refreshTokenRepository.update(
      { token },
      { isRevoked: true },
    );
    return (result.affected || 0) > 0;
  }

  async revokeAllUserTokens(userId: string): Promise<number> {
    const result = await this.refreshTokenRepository.update(
      { userId, isRevoked: false },
      { isRevoked: true },
    );
    return result.affected || 0;
  }

  async revokeTokenByDevice(userId: string, deviceId: string): Promise<number> {
    const result = await this.refreshTokenRepository.update(
      { userId, deviceId, isRevoked: false },
      { isRevoked: true },
    );
    return result.affected || 0;
  }

  async getUserActiveSessions(userId: string): Promise<RefreshToken[]> {
    return this.refreshTokenRepository.find({
      where: { userId, isRevoked: false },
      select: [
        'id',
        'deviceId',
        'deviceName',
        'ipAddress',
        'userAgent',
        'createdAt',
        'expiresAt',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async cleanupExpiredTokens(): Promise<number> {
    const result = await this.refreshTokenRepository.delete({
      expiresAt: LessThan(new Date()),
    });
    return result.affected || 0;
  }

  // --- Session Management Methods ---

  private async createSession(
    userId: string,
    deviceId: string,
    deviceName?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<Session> {
    const jti = randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + this.SESSION_EXPIRY_HOURS);

    const session = this.sessionRepository.create({
      userId,
      jti,
      deviceId,
      deviceName,
      ipAddress,
      userAgent,
      expiresAt,
      lastAccessedAt: new Date(),
    });

    return this.sessionRepository.save(session);
  }

  async revokeSession(jti: string): Promise<boolean> {
    const result = await this.sessionRepository.update(
      { jti },
      { isRevoked: true },
    );
    return (result.affected || 0) > 0;
  }

  async revokeAllUserSessions(userId: string): Promise<number> {
    const result = await this.sessionRepository.update(
      { userId, isRevoked: false },
      { isRevoked: true },
    );
    return result.affected || 0;
  }

  async revokeUserSessionsByDevice(
    userId: string,
    deviceId: string,
  ): Promise<number> {
    const result = await this.sessionRepository.update(
      { userId, deviceId, isRevoked: false },
      { isRevoked: true },
    );
    return result.affected || 0;
  }

  async getUserSessions(userId: string): Promise<Session[]> {
    return this.sessionRepository.find({
      where: { userId, isRevoked: false },
      select: [
        'id',
        'jti',
        'deviceId',
        'deviceName',
        'ipAddress',
        'userAgent',
        'createdAt',
        'expiresAt',
        'lastAccessedAt',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async cleanupExpiredSessions(): Promise<number> {
    const result = await this.sessionRepository.delete({
      expiresAt: LessThan(new Date()),
    });
    return result.affected || 0;
  }

  private getExpiresInSeconds(): number {
    const expiration = this.configService.get<string>('jwt.expiration') || '1h';
    const match = expiration.match(/^(\d+)([smhd])$/);
    if (!match) return 3600;

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      default:
        return 3600;
    }
  }
}
