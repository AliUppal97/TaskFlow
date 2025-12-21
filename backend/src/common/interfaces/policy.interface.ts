import { User } from '../../entities/user.entity';

export interface PolicyContext {
  user: User;
  resource?: any;
  action: string;
  resourceType: string;
}

export interface IPolicy {
  handle(context: PolicyContext): Promise<boolean> | boolean;
}

export interface ResourceOwnerPolicy extends IPolicy {
  // Checks if user owns the resource
  isOwner(user: User, resource: any): boolean;
}

export interface RoleBasedPolicy extends IPolicy {
  // Checks role-based permissions
  hasRole(user: User, requiredRoles: string[]): boolean;
}




