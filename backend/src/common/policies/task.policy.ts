import { Injectable } from '@nestjs/common';
import { User, UserRole } from '../../entities/user.entity';
import { Task } from '../../entities/task.entity';
import { PolicyContext, ResourceOwnerPolicy } from '../interfaces/policy.interface';

@Injectable()
export class TaskPolicy implements ResourceOwnerPolicy {
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
        return false;
    }
  }

  canCreate(user: User): boolean {
    // Any authenticated user can create tasks
    return !!user;
  }

  canRead(user: User, task: Task): boolean {
    // Users can read tasks they created, are assigned to, or if they're admin
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    return task.creatorId === user.id || task.assigneeId === user.id;
  }

  canUpdate(user: User, task: Task): boolean {
    // Users can update tasks they created or are assigned to, or if they're admin
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    return task.creatorId === user.id || task.assigneeId === user.id;
  }

  canDelete(user: User, task: Task): boolean {
    // Only task creators or admins can delete tasks
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    return task.creatorId === user.id;
  }

  canAssign(user: User, task: Task): boolean {
    // Task creators, assignees, or admins can assign tasks
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    return task.creatorId === user.id || task.assigneeId === user.id;
  }

  isOwner(user: User, task: Task): boolean {
    return task.creatorId === user.id;
  }
}



