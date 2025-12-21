import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../entities/user.entity';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Roles Guard - Role-Based Access Control (RBAC)
 * 
 * Validates that the authenticated user has one of the required roles for the route
 * 
 * Usage:
 * @Roles(UserRole.ADMIN)
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * 
 * Flow:
 * 1. Extract required roles from route metadata
 * 2. Get user's role from request
 * 3. Check if user's role matches any of the required roles
 * 4. Allow or deny access accordingly
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // No roles required, allow access
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // Check if user's role is in the list of required roles
    const hasRequiredRole = requiredRoles.includes(user.role as UserRole);

    if (!hasRequiredRole) {
      throw new ForbiddenException(
        `Insufficient permissions. Required roles: ${requiredRoles.join(', ')}`
      );
    }

    return true;
  }
}




