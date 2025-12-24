import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './user.entity';

export enum NotificationType {
  TASK_ASSIGNED = 'task_assigned',
  TASK_COMPLETED = 'task_completed',
  TASK_DUE_SOON = 'deadline_approaching',
  TASK_UPDATED = 'task_updated',
  TASK_CREATED = 'task_created',
  SYSTEM = 'system',
}

/**
 * Notification Entity - User notifications and alerts
 * 
 * Database optimizations:
 * - Index on userId for user-specific queries
 * - Index on read status for filtering unread notifications
 * - Index on createdAt for time-based queries
 * - Composite index on (userId, read) for common query patterns
 * 
 * Features:
 * - Soft delete: deletedAt field (preserves data for audit)
 * - Automatic timestamps: createdAt
 * - JSONB metadata for flexible notification data
 */
@Entity('notifications')
@Index(['userId', 'read']) // Composite index for user's unread notifications
@Index(['userId', 'createdAt']) // Composite index for user's notifications sorted by date
@Index(['read']) // Index for filtering unread notifications
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ default: false })
  read: boolean;

  /**
   * Foreign key to user who should receive this notification
   * Required: every notification is for a specific user
   */
  @Column({ type: 'uuid' })
  userId: string;

  /**
   * Task ID if this notification is related to a task
   * Nullable: system notifications may not be task-related
   */
  @Column({ type: 'uuid', nullable: true })
  taskId: string | null;

  /**
   * Action URL for the notification (e.g., link to task details)
   * Nullable: some notifications may not have actions
   */
  @Column({ type: 'text', nullable: true })
  actionUrl: string | null;

  /**
   * Additional metadata (JSONB for flexibility)
   * Can store task details, user info, or other notification-specific data
   */
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn()
  createdAt: Date;

  /**
   * Soft delete timestamp
   * When set, notification is considered deleted but data is preserved
   */
  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  // TypeORM relations (lazy-loaded)
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;
}


