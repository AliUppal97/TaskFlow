import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from './user.service';
import { User } from '../../entities/user.entity';

export interface JwtRefreshPayload {
  sub: string;
  email: string;
  role: string;
  refreshTokenId: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    private configService: ConfigService,
    private userService: UserService,
  ) {
    // Type-safe extraction of JWT from cookies
    // ExtractJwt is properly typed from passport-jwt, but ESLint needs explicit assertion
    const extractorFunction = (request: Request): string | null => {
      // Type-safe access to cookies
      if (request && typeof request === 'object' && 'cookies' in request) {
        const cookies = request.cookies as { refreshToken?: string } | undefined;
        const refreshToken = cookies?.refreshToken;
        if (!refreshToken || typeof refreshToken !== 'string') {
          return null;
        }
        return refreshToken;
      }
      return null;
    };
    
    const jwtExtractor = ExtractJwt.fromExtractors([extractorFunction]) as (request: Request) => string | null;
    
    const secretOrKey = configService.get<string>('jwt.refreshTokenSecret');
    
    if (!secretOrKey) {
      throw new Error('JWT refresh token secret is not configured');
    }
    
    super({
      jwtFromRequest: jwtExtractor,
      ignoreExpiration: false,
      secretOrKey,
      passReqToCallback: true,
    });
  }

  async validate(request: Request, payload: JwtRefreshPayload): Promise<User> {
    const { sub: userId, refreshTokenId } = payload;

    // Verify the refresh token exists in Redis/database
    const storedRefreshTokenId = await this.userService.getStoredRefreshToken(userId);

    if (!storedRefreshTokenId || storedRefreshTokenId !== refreshTokenId) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.userService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }
}








