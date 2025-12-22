/**
 * Task-related interfaces
 */

import { TaskStatus, TaskPriority, SortOrder } from '../enums';
import { User } from './user.types';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string | null;
  creatorId: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  dueDate: Date | null;
  version: number;
  assignee?: User | null;
  creator?: User;
  isOverdue: boolean;
  daysUntilDue: number | null;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority?: TaskPriority;
  assigneeId?: string;
  dueDate?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string | null;
  dueDate?: string | null;
  version: number;
}

export interface TaskQueryParams {
  page?: number;
  limit?: number;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  creatorId?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: SortOrder;
}

export interface TaskStats {
  total: number;
  byStatus: Record<TaskStatus, number>;
  byPriority: Record<TaskPriority, number>;
  overdue: number;
}

export interface TaskFilters {
  page: number;
  limit: number;
  status?: TaskStatus;
  priority?: TaskPriority;
  search: string;
}





