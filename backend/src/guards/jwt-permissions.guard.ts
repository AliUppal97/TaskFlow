import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Request } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Permission, PERMISSIONS_KEY, ROLE_PERMISSIONS } from '../decorators/permissions.decorator';
import { UserRole } from '../entities/user.entity';
import { JwtPayload } from '../modules/auth/jwt.strategy';
import { UserService } from '../modules/auth/user.service';

@Injectable()
export class JwtPermissionsGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private reflector: Reflector,
    private userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Extract and verify JWT token
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const payload: JwtPayload = this.jwtService.verify(token, {
        secret: this.configService.get('jwt.accessTokenSecret'),
      });

      // Load full User entity from database (not just JWT payload)
      // This ensures req.user has all User properties including 'id'
      const user = await this.userService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      request.user = user;
    } catch (error: unknown) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid token');
    }

    // Check permissions if required
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions) {
      return true; // No permissions required
    }

    const userRole = request.user.role as UserRole;
    const userPermissions = ROLE_PERMISSIONS[userRole] || [];

    const hasAllPermissions = requiredPermissions.every(permission =>
      userPermissions.includes(permission)
    );

    if (!hasAllPermissions) {
      throw new UnauthorizedException(
        `Insufficient permissions. Required: ${requiredPermissions.join(', ')}`
      );
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers['authorization'] as string | undefined;
    const [type, token] = authHeader?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}


