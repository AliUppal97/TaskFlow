/**
 * Enums for the application
 * All enums are exported from this file for easy importing
 */

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  DONE = 'done',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum TaskEventType {
  TASK_CREATED = 'task.created',
  TASK_UPDATED = 'task.updated',
  TASK_ASSIGNED = 'task.assigned',
  TASK_DELETED = 'task.deleted',
  TASK_STATUS_CHANGED = 'task.status_changed',
}

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system',
}

export enum Language {
  EN = 'en',
  ES = 'es',
  FR = 'fr',
  DE = 'de',
}

export enum ProfileVisibility {
  PUBLIC = 'public',
  TEAM = 'team',
  PRIVATE = 'private',
}

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}





