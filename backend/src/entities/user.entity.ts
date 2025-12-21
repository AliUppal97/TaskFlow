import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Task } from './task.entity';
import { Exclude } from 'class-transformer';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

/**
 * User Entity - User account and authentication
 * 
 * Security:
 * - passwordHash: Excluded from serialization (@Exclude) - never sent to client
 * - Email: Unique constraint prevents duplicate accounts
 * 
 * Profile:
 * - JSONB column for flexible profile data (firstName, lastName, avatar)
 * - Allows future profile extensions without schema changes
 */
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 255 })
  email: string; // Unique: used as login identifier

  /**
   * Password hash (bcrypt)
   * @Exclude decorator ensures it's never serialized in API responses
   * Security: Password never exposed to client
   */
  @Column({ length: 255 })
  @Exclude()
  passwordHash: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER, // Default role: regular user
  })
  role: UserRole;

  /**
   * User profile data (JSONB for flexibility)
   * Allows storing additional profile fields without schema changes
   * PostgreSQL JSONB provides indexing and querying capabilities
   */
  @Column({ type: 'jsonb', nullable: true })
  profile: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // TypeORM relations (lazy-loaded)
  @OneToMany(() => Task, task => task.creator)
  createdTasks: Task[];

  @OneToMany(() => Task, task => task.assignee)
  assignedTasks: Task[];

  /**
   * Computed property: User's full name
   * Falls back to email if name not available
   * Used for display purposes throughout the application
   */
  get fullName(): string {
    if (this.profile?.firstName && this.profile?.lastName) {
      return `${this.profile.firstName} ${this.profile.lastName}`;
    }
    return this.email; // Fallback to email if name unavailable
  }
}



