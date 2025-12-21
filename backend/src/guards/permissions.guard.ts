import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY, Permission, ROLE_PERMISSIONS } from '../decorators/permissions.decorator';
import { UserRole } from '../entities/user.entity';

/**
 * Permissions Guard - Role-Based Access Control (RBAC)
 * 
 * Validates that the authenticated user has required permissions for the route
 * 
 * Permission model:
 * - Permissions are mapped to roles (see ROLE_PERMISSIONS)
 * - Routes can require multiple permissions (all must be satisfied)
 * - Admins have all permissions by default
 * 
 * Usage:
 * @RequirePermissions(Permission.TASK_DELETE)
 * @UseGuards(JwtAuthGuard, PermissionsGuard)
 * 
 * Flow:
 * 1. Extract required permissions from route metadata
 * 2. Get user's role and associated permissions
 * 3. Check if user has ALL required permissions
 * 4. Allow or deny access accordingly
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  /**
   * Check if user has required permissions
   * 
   * @param context - Execution context
   * @returns true if user has all required permissions
   * @throws ForbiddenException if permissions insufficient
   */
  canActivate(context: ExecutionContext): boolean {
    // Extract required permissions from route decorator (@RequirePermissions)
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(), // Method-level permissions
      context.getClass(),    // Class-level permissions (fallback)
    ]);

    // No permissions required = public route, allow access
    if (!requiredPermissions) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      return false; // No user = unauthenticated
    }

    // Get user's permissions based on their role
    const userRole = user.role as UserRole;
    const userPermissions = ROLE_PERMISSIONS[userRole] || [];

    // User must have ALL required permissions (AND logic, not OR)
    const hasAllPermissions = requiredPermissions.every(permission =>
      userPermissions.includes(permission)
    );

    if (!hasAllPermissions) {
      throw new ForbiddenException(
        `Insufficient permissions. Required: ${requiredPermissions.join(', ')}`
      );
    }

    return true;
  }
}



