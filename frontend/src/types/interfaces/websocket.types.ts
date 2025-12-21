/**
 * WebSocket-related interfaces
 */

import { TaskEventType } from '../enums';
import { User, UserProfile } from './user.types';

export interface TaskEventActor {
  id: string;
  email: string;
  profile: UserProfile;
}

export interface TaskEventPayload {
  [key: string]: unknown;
}

export interface TaskEvent {
  type: TaskEventType;
  taskId: string;
  actor: TaskEventActor | null;
  payload: TaskEventPayload;
  timestamp: Date;
}

export interface WebSocketNotification {
  type: string;
  taskId?: string;
  assigneeId?: string | null;
  assignor?: User | null;
  daysUntilDue?: number;
  timestamp: Date;
}

