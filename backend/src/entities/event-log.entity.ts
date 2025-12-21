import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum EventType {
  TASK_CREATED = 'task.created',
  TASK_UPDATED = 'task.updated',
  TASK_ASSIGNED = 'task.assigned',
  TASK_DELETED = 'task.deleted',
  TASK_STATUS_CHANGED = 'task.status_changed',
  USER_REGISTERED = 'user.registered',
  USER_LOGIN = 'user.login',
  USER_LOGOUT = 'user.logout',
}

@Schema({ collection: 'event_logs', timestamps: true })
export class EventLog extends Document {
  @Prop({ required: true, enum: EventType })
  type: EventType;

  @Prop({ required: true, type: String })
  actorId: string; // User who performed the action

  @Prop({ required: true, type: String })
  entityId: string; // ID of the entity being acted upon (task ID, user ID, etc.)

  @Prop({ required: true, type: String })
  entityType: string; // 'task', 'user', etc.

  @Prop({ type: Object })
  payload: Record<string, any>; // Event-specific data

  @Prop({ type: Object })
  metadata: {
    userAgent?: string;
    ipAddress?: string;
    sessionId?: string;
    timestamp: Date;
  };

  @Prop({ type: String })
  correlationId?: string; // For tracking related events

  // Timestamps are added by Mongoose when timestamps: true
  createdAt?: Date;
  updatedAt?: Date;

  // Virtual property for easier querying
  get eventAge(): number {
    return this.createdAt ? Date.now() - this.createdAt.getTime() : 0;
  }
}

export const EventLogSchema = SchemaFactory.createForClass(EventLog);

// Indexes for performance
EventLogSchema.index({ type: 1, createdAt: -1 });
EventLogSchema.index({ actorId: 1, createdAt: -1 });
EventLogSchema.index({ entityId: 1, entityType: 1, createdAt: -1 });
EventLogSchema.index({ correlationId: 1 });
EventLogSchema.index({ createdAt: -1 }); // For time-based queries



