/**
 * Notification-related interfaces
 */

export enum NotificationType {
  TASK_ASSIGNED = 'task_assigned',
  TASK_COMPLETED = 'task_completed',
  TASK_DUE_SOON = 'deadline_approaching',
  TASK_UPDATED = 'task_updated',
  TASK_CREATED = 'task_created',
  SYSTEM = 'system',
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  userId: string;
  taskId?: string | null;
  actionUrl?: string | null;
  metadata?: Record<string, any> | null;
  createdAt: Date;
}

export interface NotificationStats {
  total: number;
  unread: number;
  thisWeek: number;
}

export interface NotificationQueryParams {
  page?: number;
  limit?: number;
  read?: boolean;
  type?: NotificationType;
}

