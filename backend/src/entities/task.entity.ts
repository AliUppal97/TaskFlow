import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index, VersionColumn } from 'typeorm';
import { User } from './user.entity';

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

/**
 * Task Entity - Core task management entity
 * 
 * Database optimizations:
 * - Composite index on (status, priority) for filtered queries
 * - Index on assigneeId for assignment-based queries
 * - Index on creatorId for creator-based queries
 * 
 * Features:
 * - Soft delete: deletedAt field (preserves data for audit)
 * - Optimistic locking: version field (prevents concurrent update conflicts)
 * - Automatic timestamps: createdAt, updatedAt
 * - Computed properties: isOverdue, daysUntilDue
 */
@Entity('tasks')
@Index(['status', 'priority']) // Composite index for status/priority filtering
@Index(['assigneeId'])          // Index for assignment queries
@Index(['creatorId'])           // Index for creator queries
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.TODO, // All tasks start as TODO
  })
  status: TaskStatus;

  @Column({
    type: 'enum',
    enum: TaskPriority,
    default: TaskPriority.MEDIUM, // Default priority if not specified
  })
  priority: TaskPriority;

  // Foreign key relationships
  @Column({ type: 'uuid', nullable: true })
  assigneeId: string | null; // Nullable: tasks can be unassigned

  @Column({ type: 'uuid' })
  creatorId: string; // Required: every task has a creator

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Completion timestamp - automatically set when status changes to DONE
   * Used for analytics and completion time tracking
   */
  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  dueDate: Date;

  /**
   * Soft delete timestamp
   * When set, task is considered deleted but data is preserved
   * Enables data recovery and audit trail
   */
  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date;

  /**
   * Optimistic locking version field
   * Incremented on each update to detect concurrent modifications
   * Prevents lost updates in multi-user scenarios
   */
  @VersionColumn()
  version: number;

  // TypeORM relations (lazy-loaded unless explicitly joined)
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assigneeId' })
  assignee: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'creatorId' })
  creator: User;

  /**
   * Computed property: Check if task is overdue
   * 
   * Business logic:
   * - Task is overdue if dueDate has passed AND status is not DONE
   * - Completed tasks are never considered overdue
   * - Tasks without dueDate are never overdue
   * 
   * @returns true if task is overdue, false otherwise
   */
  get isOverdue(): boolean {
    if (!this.dueDate || this.status === TaskStatus.DONE) {
      return false;
    }
    return new Date() > this.dueDate;
  }

  /**
   * Computed property: Calculate days until due date
   * 
   * @returns Number of days until due (negative if overdue), null if no dueDate
   */
  get daysUntilDue(): number | null {
    if (!this.dueDate) return null;
    const diffTime = this.dueDate.getTime() - new Date().getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Convert ms to days
  }
}



