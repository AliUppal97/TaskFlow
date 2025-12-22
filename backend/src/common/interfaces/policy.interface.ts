import { User } from '../../entities/user.entity';

export interface PolicyContext<T = unknown> {
  user: User;
  resource?: T;
  action: string;
  resourceType: string;
}

export interface IPolicy {
  handle(context: PolicyContext): Promise<boolean> | boolean;
}

export interface ResourceOwnerPolicy<T = unknown> extends IPolicy {
  // Checks if user owns the resource
  isOwner(user: User, resource: T): boolean;
}

export interface RoleBasedPolicy extends IPolicy {
  // Checks role-based permissions
  hasRole(user: User, requiredRoles: string[]): boolean;
}







