import { Injectable } from '@nestjs/common';
import { User, UserRole } from '../../entities/user.entity';
import { Task } from '../../entities/task.entity';
import { PolicyContext, ResourceOwnerPolicy } from '../interfaces/policy.interface';

/**
 * Task Policy - Resource-level authorization rules
 * 
 * Implements fine-grained access control for task operations
 * 
 * Authorization rules:
 * - Create: Any authenticated user
 * - Read: Creator, assignee, or admin
 * - Update: Creator, assignee, or admin
 * - Delete: Creator or admin (assignees cannot delete)
 * - Assign: Creator, assignee, or admin
 * 
 * Rationale:
 * - Assignees can update tasks they're working on (collaboration)
 * - Only creators can delete (prevents accidental deletion by assignees)
 * - Admins have full access (system administration)
 * 
 * Usage: Applied via @UsePolicy(TaskPolicy) decorator
 */
@Injectable()
export class TaskPolicy implements ResourceOwnerPolicy {
  /**
   * Route authorization requests to appropriate permission check
   * 
   * @param context - Contains user, resource (task), and action
   * @returns true if action is allowed, false otherwise
   */
  async handle(context: PolicyContext): Promise<boolean> {
    const { user, resource: task, action } = context;

    switch (action) {
      case 'create':
        return this.canCreate(user);

      case 'read':
        return this.canRead(user, task);

      case 'update':
        return this.canUpdate(user, task);

      case 'delete':
        return this.canDelete(user, task);

      case 'assign':
        return this.canAssign(user, task);

      default:
        return false; // Unknown action = deny
    }
  }

  /**
   * Create permission: Any authenticated user can create tasks
   * No restrictions on task creation (encourages collaboration)
   */
  canCreate(user: User): boolean {
    return !!user;
  }

  /**
   * Read permission: Users can see tasks they created or are assigned to
   * Admins can see all tasks (for management purposes)
   */
  canRead(user: User, task: Task): boolean {
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    return task.creatorId === user.id || task.assigneeId === user.id;
  }

  /**
   * Update permission: Creators and assignees can update tasks
   * Allows collaboration - assignees can update tasks they're working on
   */
  canUpdate(user: User, task: Task): boolean {
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    return task.creatorId === user.id || task.assigneeId === user.id;
  }

  /**
   * Delete permission: Only creators can delete (not assignees)
   * Prevents accidental deletion by assignees
   * Admins can delete any task (system administration)
   */
  canDelete(user: User, task: Task): boolean {
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    return task.creatorId === user.id;
  }

  /**
   * Assign permission: Creators, assignees, and admins can assign tasks
   * Allows reassignment by current assignee (workflow flexibility)
   */
  canAssign(user: User, task: Task): boolean {
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    return task.creatorId === user.id || task.assigneeId === user.id;
  }

  /**
   * Check if user is the task creator (owner)
   * Used for ownership-based UI features
   */
  isOwner(user: User, task: Task): boolean {
    return task.creatorId === user.id;
  }
}



