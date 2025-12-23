/**
 * Form-related interfaces
 */

import { TaskPriority } from '../enums';

export interface CreateTaskFormData {
  title: string;
  description?: string;
  priority: TaskPriority;
  dueDate?: Date;
}

export interface UpdateTaskFormData extends CreateTaskFormData {
  version: number;
}






