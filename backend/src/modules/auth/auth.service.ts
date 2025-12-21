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

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private cacheService: CacheService,
    private eventsService: EventsService,
  ) {}

  async register(registerDto: RegisterDto): Promise<User> {
    const user = await this.userService.create(registerDto);

    // Log registration event
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

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    const user = await this.userService.validatePassword(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user);
    
    // Extract refreshTokenId from the generated refresh token payload
    // We need to decode it or store it during generation
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

    // Store refresh token ID
    await this.userService.storeRefreshToken(user.id, refreshTokenId);

    // Log login event
    await this.eventsService.logEvent({
      type: EventType.USER_LOGIN,
      actorId: user.id,
      entityId: user.id,
      entityType: 'user',
      payload: {
        email: user.email,
        userAgent: '', // Will be set by interceptor
        ipAddress: '', // Will be set by interceptor
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

  private async generateTokens(user: User): Promise<AuthResponseDto> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const refreshTokenId = randomUUID();
    const refreshPayload: JwtRefreshPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      refreshTokenId,
    };

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
      expiresIn: 15 * 60, // 15 minutes in seconds
    };
  }

  async validateUser(userId: string): Promise<User | null> {
    return this.userService.findById(userId);
  }

  // Blacklist access tokens (for logout from all devices)
  async blacklistToken(token: string, expiresIn: number): Promise<void> {
    await this.cacheService.set(
      this.cacheService.generateKey(CacheService.KEYS.BLACKLIST, token),
      true,
      { ttl: expiresIn }
    );
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const isBlacklisted = await this.cacheService.get(
      this.cacheService.generateKey(CacheService.KEYS.BLACKLIST, token)
    );
    return !!isBlacklisted;
  }
}
