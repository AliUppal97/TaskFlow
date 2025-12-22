import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

import { UserService } from './user.service';
import { User } from '../../entities/user.entity';
import { LoginDto, RegisterDto, AuthResponseDto } from '../../dto/auth.dto';
import { JwtPayload } from './jwt.strategy';
import { JwtRefreshPayload } from './jwt-refresh.strategy';
import { EventsService } from '../events/events.service';
import { CacheService } from '../../common/cache/cache.service';
import { EventType } from '../../entities/event-log.entity';

/**
 * Authentication service - handles user authentication and authorization
 *
 * Responsibilities:
 * - User registration and login
 * - JWT token generation (access + refresh tokens)
 * - Token refresh and blacklisting
 * - Audit logging of authentication events
 *
 * Security features:
 * - Refresh tokens stored in Redis with expiration
 * - Access token blacklisting for logout
 * - Event logging for security audit trail
 */
@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private cacheService: CacheService,
    private eventsService: EventsService,
  ) {}

  /**
   * Register a new user
   * - Creates user account with hashed password
   * - Logs registration event for audit trail
   * - Returns user entity (password hash excluded via @Exclude decorator)
   */
  async register(registerDto: RegisterDto): Promise<User> {
    const user = await this.userService.create(registerDto);

    // Log registration event for security audit and compliance
    await this.eventsService.logEvent({
      type: EventType.USER_REGISTERED,
      actorId: user.id,
      entityId: user.id,
      entityType: 'user',
      payload: {
        email: user.email,
        role: user.role,
      },
    });

    return user;
  }

  /**
   * Authenticate user and generate JWT tokens
   *
   * Token strategy:
   * - Access token: Short-lived (15min), stored in localStorage, used for API requests
   * - Refresh token: Long-lived (7 days), stored in HttpOnly cookie, used to refresh access token
   * - Refresh token ID: Stored in Redis to enable token revocation
   *
   * Security:
   * - Password validation using bcrypt comparison
   * - Refresh token ID stored in Redis for revocation capability
   * - Login events logged for security monitoring
   */
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // Check if account is locked out
    const user = await this.userService.findByEmail(email);
    if (user) {
      // Check account lockout
      if (user.lockoutUntil && user.lockoutUntil > new Date()) {
        const remainingTime = Math.ceil((user.lockoutUntil.getTime() - Date.now()) / 60000); // minutes
        throw new UnauthorizedException(`Account locked due to too many failed login attempts. Try again in ${remainingTime} minutes.`);
      }

      // Check if account is active
      if (!user.isActive) {
        throw new UnauthorizedException('Account is deactivated. Contact administrator.');
      }
    }

    // Validate credentials - throws UnauthorizedException if invalid
    const validUser = await this.userService.validatePassword(email, password);
    if (!validUser) {
      // Track failed login attempt
      if (user) {
        await this.userService.recordFailedLoginAttempt(user.id);
      }
      throw new UnauthorizedException('Invalid credentials');
    }

    // Reset failed login attempts on successful login
    await this.userService.resetFailedLoginAttempts(validUser.id);

    const tokens = await this.generateTokens(user);

    /**
     * Generate refresh token with unique ID for revocation tracking
     * The refreshTokenId is embedded in the token payload and stored in Redis
     * This allows us to invalidate tokens on logout or security breach
     */
    const refreshTokenId = randomUUID();
    const refreshPayload: JwtRefreshPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      refreshTokenId,
    };
    const newRefreshToken = await this.jwtService.signAsync(refreshPayload, {
      secret: this.configService.get('jwt.refreshTokenSecret'),
      expiresIn: this.configService.get('jwt.refreshTokenExpiresIn'),
    });
    tokens.refreshToken = newRefreshToken;

    // Store refresh token ID in Redis for revocation capability
    await this.userService.storeRefreshToken(user.id, refreshTokenId);

    // Log login event for security audit (userAgent and ipAddress set by interceptor)
    await this.eventsService.logEvent({
      type: EventType.USER_LOGIN,
      actorId: user.id,
      entityId: user.id,
      entityType: 'user',
      payload: {
        email: user.email,
        userAgent: '', // Populated by RequestLoggingInterceptor
        ipAddress: '', // Populated by RequestLoggingInterceptor
      },
    });

    return tokens;
  }

  async refreshToken(user: User): Promise<AuthResponseDto> {
    const tokens = await this.generateTokens(user);

    // Update stored refresh token ID
    const refreshTokenId = randomUUID();
    const refreshPayload: JwtRefreshPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      refreshTokenId,
    };
    const refreshToken = await this.jwtService.signAsync(refreshPayload, {
      secret: this.configService.get('jwt.refreshTokenSecret'),
      expiresIn: this.configService.get('jwt.refreshTokenExpiresIn'),
    });
    await this.userService.storeRefreshToken(user.id, refreshTokenId);
    tokens.refreshToken = refreshToken;

    return tokens;
  }

  async logout(userId: string): Promise<void> {
    // Remove refresh token
    await this.userService.removeRefreshToken(userId);

    // Log logout event
    await this.eventsService.logEvent({
      type: EventType.USER_LOGOUT,
      actorId: userId,
      entityId: userId,
      entityType: 'user',
      payload: {},
    });
  }

  /**
   * Generate access and refresh token pair
   *
   * Token structure:
   * - Access token: Contains user ID, email, role (minimal payload for performance)
   * - Refresh token: Contains same data + unique refreshTokenId for revocation
   *
   * Performance: Tokens generated in parallel using Promise.all for efficiency
   *
   * @param user - User entity to generate tokens for
   * @returns Token pair with expiration metadata
   */
  private async generateTokens(user: User): Promise<AuthResponseDto> {
    // Access token payload - minimal data for performance
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    // Refresh token payload - includes unique ID for revocation tracking
    const refreshTokenId = randomUUID();
    const refreshPayload: JwtRefreshPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      refreshTokenId,
    };

    // Generate both tokens in parallel for better performance
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt.accessTokenSecret'),
        expiresIn: this.configService.get('jwt.accessTokenExpiresIn'),
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: this.configService.get('jwt.refreshTokenSecret'),
        expiresIn: this.configService.get('jwt.refreshTokenExpiresIn'),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 15 * 60, // 15 minutes in seconds (access token lifetime)
    };
  }

  async validateUser(userId: string): Promise<User | null> {
    return this.userService.findById(userId);
  }

  /**
   * Blacklist an access token (for logout or security breach)
   *
   * Stores token in Redis cache with TTL matching token expiration
   * This enables immediate token invalidation without waiting for natural expiration
   *
   * Use cases:
   * - User logout (invalidate current session)
   * - Security breach (invalidate all user tokens)
   * - Password change (invalidate all sessions)
   *
   * @param token - JWT access token to blacklist
   * @param expiresIn - Token expiration time in seconds (used as cache TTL)
   */
  async blacklistToken(token: string, expiresIn: number): Promise<void> {
    await this.cacheService.set(
      this.cacheService.generateKey(CacheService.KEYS.BLACKLIST, token),
      true,
      { ttl: expiresIn },
    );
  }

  /**
   * Check if an access token is blacklisted
   * Used by JWT guards to reject blacklisted tokens
   * 
   * @param token - JWT access token to check
   * @returns true if token is blacklisted, false otherwise
   */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    const isBlacklisted = await this.cacheService.get(
      this.cacheService.generateKey(CacheService.KEYS.BLACKLIST, token)
    );
    return !!isBlacklisted;
  }
}
