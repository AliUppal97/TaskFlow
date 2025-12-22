import { Injectable, ExecutionContext, UnauthorizedException, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../modules/auth/auth.service';

/**
 * JWT Authentication Guard
 *
 * Protects routes by validating JWT access tokens
 *
 * Flow:
 * 1. Extract Bearer token from Authorization header
 * 2. Verify token signature and expiration
 * 3. Check if token is blacklisted (revoked)
 * 4. Attach decoded payload to request.user
 * 5. Allow/deny request based on token validity
 *
 * Security:
 * - Validates token signature (prevents tampering)
 * - Checks expiration (prevents use of old tokens)
 * - Validates against blacklist (prevents use of revoked tokens)
 * - Throws UnauthorizedException for invalid/missing/blacklisted tokens
 *
 * Usage: Apply to routes with @UseGuards(JwtAuthGuard)
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super();
  }

  /**
   * Validate JWT token and attach user to request
   *
   * @param context - Execution context (contains request/response)
   * @returns true if token is valid, throws UnauthorizedException otherwise
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      // Verify token signature and expiration
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('jwt.accessTokenSecret'),
      });

      // Check if token is blacklisted (revoked)
      const isBlacklisted = await this.authService.isTokenBlacklisted(token);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }

      // Attach user payload to request for use in controllers/services
      request.user = payload;
      return true;
    } catch (error) {
      // Token invalid, expired, blacklisted, or malformed
      throw new UnauthorizedException('Invalid token');
    }
  }

  /**
   * Extract Bearer token from Authorization header
   * Format: "Bearer <token>"
   *
   * @param request - HTTP request object
   * @returns Token string or undefined if not found
   */
  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}



