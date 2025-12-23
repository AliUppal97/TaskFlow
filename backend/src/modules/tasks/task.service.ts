import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, IsNull } from 'typeorm';

import { Task, TaskStatus, TaskPriority } from '../../entities/task.entity';
import { User } from '../../entities/user.entity';
import { CreateTaskDto, UpdateTaskDto, TaskQueryDto } from '../../dto/task.dto';
import { EventsService } from '../events/events.service';
import { TaskGateway, TaskEvent, TaskEventType } from './task.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { CacheService } from '../../common/cache/cache.service';
import { CacheResult, InvalidateCache } from '../../common/cache/cache.decorators';
import { EventType } from '../../entities/event-log.entity';

/**
 * Task service - core business logic for task management
 * 
 * Responsibilities:
 * - Task CRUD operations with permission checks
 * - Task assignment and reassignment
 * - Real-time event broadcasting via WebSocket
 * - Audit logging for compliance
 * - Cache management for performance
 * 
 * Security:
 * - User-specific data filtering (users see only their tasks unless admin)
 * - Permission checks via TaskPolicy
 * - Optimistic locking to prevent concurrent update conflicts
 * 
 * Performance:
 * - Query result caching (5-10 min TTL)
 * - Cache invalidation on mutations
 * - Efficient pagination and filtering
 */
@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private cacheService: CacheService,
    private eventsService: EventsService,
    private taskGateway: TaskGateway,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Create a new task
   * 
   * Business rules:
   * - Default status: TODO
   * - Default priority: MEDIUM (if not specified)
   * - Assignee validation: Must be existing user if provided
   * 
   * Side effects:
   * - Invalidates task list cache
   * - Emits real-time WebSocket event
   * - Logs creation event for audit
   * 
   * @param createTaskDto - Task creation data
   * @param creator - User creating the task
   * @returns Created task entity
   */
  @InvalidateCache('task:*')
  async create(createTaskDto: CreateTaskDto, creator: User): Promise<Task> {
    const { assigneeId, ...taskData } = createTaskDto;

    // Validate assignee exists if provided (prevents orphaned task assignments)
    if (assigneeId) {
      const assignee = await this.userRepository.findOne({ where: { id: assigneeId } });
      if (!assignee) {
        throw new NotFoundException('Assignee not found');
      }
    }

    // Create task entity with defaults
    const task = this.taskRepository.create({
      ...taskData,
      creatorId: creator.id,
      assigneeId: assigneeId || undefined, // Allow null for unassigned tasks
      status: TaskStatus.TODO, // All tasks start as TODO
      priority: createTaskDto.priority || TaskPriority.MEDIUM, // Default priority
    });

    const savedTask = await this.taskRepository.save(task);

    // Log creation event for audit trail and compliance
    await this.eventsService.logEvent({
      type: EventType.TASK_CREATED,
      actorId: creator.id,
      entityId: savedTask.id,
      entityType: 'task',
      payload: {
        title: savedTask.title,
        priority: savedTask.priority,
        assigneeId: savedTask.assigneeId,
      },
    });

    // Broadcast real-time event to all connected clients
    // This enables instant UI updates without polling
    await this.taskGateway.emitTaskEvent({
      type: TaskEventType.TASK_CREATED,
      taskId: savedTask.id,
      actorId: creator.id,
      payload: {
        task: {
          id: savedTask.id,
          title: savedTask.title,
          description: savedTask.description,
          status: savedTask.status,
          priority: savedTask.priority,
          assigneeId: savedTask.assigneeId,
          creatorId: savedTask.creatorId,
          createdAt: savedTask.createdAt,
          dueDate: savedTask.dueDate,
        },
        creator: {
          id: creator.id,
          email: creator.email,
          profile: creator.profile,
        },
      },
      timestamp: new Date(),
    });

    // Create notification for assignee if task was assigned
    if (createTaskDto.assigneeId && createTaskDto.assigneeId !== creator.id) {
      const creatorName = creator.profile?.firstName && creator.profile?.lastName
        ? `${creator.profile.firstName} ${creator.profile.lastName}`
        : creator.email;
      await this.notificationsService.createTaskAssignmentNotification(
        createTaskDto.assigneeId,
        savedTask.id,
        savedTask.title,
        creatorName,
      );
    }

    // Reload task with relations for response transformation
    // The controller's transformTaskResponse needs creator and assignee relations
    const taskWithRelations = await this.taskRepository.findOne({
      where: { id: savedTask.id },
      relations: ['creator', 'assignee'],
    });

    return taskWithRelations || savedTask;
  }

  /**
   * Find all tasks with filtering, pagination, and user-specific access control
   * 
   * Access control:
   * - Regular users: Only see tasks they created or are assigned to
   * - Admins: See all tasks
   * 
   * Performance:
   * - Results cached for 5 minutes (frequent queries benefit from cache)
   * - Soft delete filter applied (deletedAt IS NULL)
   * - Eager loading of creator/assignee relations (prevents N+1 queries)
   * 
   * @param query - Filtering and pagination parameters
   * @param user - Current user (for access control)
   * @returns Paginated task list with metadata
   */
  @CacheResult({ ttl: 300, keyPrefix: 'tasks:list' }) // 5 minutes cache
  async findAll(query: TaskQueryDto, user: User): Promise<{
    data: Task[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const { page = 1, limit = 10, status, priority, assigneeId, creatorId, search, sortBy, sortOrder = 'DESC' } = query;

    // Build query with eager loading to prevent N+1 query problem
    const queryBuilder = this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.creator', 'creator')
      .leftJoinAndSelect('task.assignee', 'assignee')
      .where('task.deletedAt IS NULL'); // Soft delete: exclude deleted tasks

    /**
     * User-specific access control
     * Security: Regular users can only access their own tasks (created or assigned)
     * Admins bypass this restriction to see all tasks
     */
    if (user.role !== 'admin') {
      queryBuilder.andWhere('(task.creatorId = :userId OR task.assigneeId = :userId)', {
        userId: user.id,
      });
    }

    // Apply optional filters (only if provided)
    if (status) {
      queryBuilder.andWhere('task.status = :status', { status });
    }

    if (priority) {
      queryBuilder.andWhere('task.priority = :priority', { priority });
    }

    if (assigneeId) {
      queryBuilder.andWhere('task.assigneeId = :assigneeId', { assigneeId });
    }

    if (creatorId) {
      queryBuilder.andWhere('task.creatorId = :creatorId', { creatorId });
    }

    // Full-text search across title and description (case-insensitive)
    if (search) {
      queryBuilder.andWhere(
        '(LOWER(task.title) LIKE LOWER(:search) OR LOWER(task.description) LIKE LOWER(:search))',
        { search: `%${search}%` }
      );
    }

    // Sorting: Use provided sortBy and sortOrder, or default to createdAt DESC
    // Validate sortBy to prevent SQL injection by only allowing known fields
    const allowedSortFields = ['createdAt', 'updatedAt', 'dueDate', 'completedAt', 'title', 'status', 'priority', 'assigneeId', 'creatorId'];
    const sortField = sortBy && allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sortDirection = sortOrder === 'ASC' ? 'ASC' : 'DESC';
    queryBuilder.orderBy(`task.${sortField}`, sortDirection);

    // Pagination: skip and take for efficient data loading
    queryBuilder.skip((page - 1) * limit).take(limit);

    // Execute query and get total count in single database round-trip
    const [tasks, total] = await queryBuilder.getManyAndCount();

    return {
      data: tasks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  @CacheResult({ ttl: 600, keyPrefix: 'task' }) // 10 minutes cache
  async findOne(id: string, user: User): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['creator', 'assignee'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Check permissions
    if (user.role !== 'admin' && task.creatorId !== user.id && task.assigneeId !== user.id) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  /**
   * Update an existing task
   * 
   * Concurrency control:
   * - Optimistic locking via version field prevents lost updates
   * - If version mismatch, throws ConflictException (client must refresh)
   * 
   * Business logic:
   * - Automatically sets completedAt when status changes to DONE
   * - Clears completedAt if task is reopened
   * - Validates assignee if changed
   * 
   * Side effects:
   * - Invalidates cache
   * - Emits real-time update event
   * - Logs assignment event if assignee changed
   * - Sends notification to new assignee
   * 
   * @param id - Task ID
   * @param updateTaskDto - Update data (includes version for optimistic locking)
   * @param user - User performing the update
   * @returns Updated task entity
   */
  @InvalidateCache('task:*')
  async update(id: string, updateTaskDto: UpdateTaskDto, user: User): Promise<Task> {
    const task = await this.findOne(id, user);

    /**
     * Optimistic locking: Prevent concurrent update conflicts
     * Client sends current version, server checks if it matches database version
     * If mismatch, another user modified the task - client must refresh and retry
     */
    if (updateTaskDto.version !== undefined && task.version !== updateTaskDto.version) {
      throw new ConflictException('Task has been modified by another user. Please refresh and try again.');
    }

    const { assigneeId, ...updateData } = updateTaskDto;

    // Validate assignee if provided
    if (assigneeId !== undefined) {
      if (assigneeId) {
        const assignee = await this.userRepository.findOne({ where: { id: assigneeId } });
        if (!assignee) {
          throw new NotFoundException('Assignee not found');
        }
      }
      task.assigneeId = assigneeId ?? null;
    }

    // Apply updates to task entity
    Object.assign(task, updateData);
    task.updatedAt = new Date();

    /**
     * Automatic completion timestamp management
     * - When task is marked DONE: Set completedAt timestamp
     * - When task is reopened: Clear completedAt (task is no longer completed)
     * This enables analytics on completion times and task lifecycle tracking
     */
    if (updateTaskDto.status === TaskStatus.DONE && task.status !== TaskStatus.DONE) {
      task.completedAt = new Date();
    } else if (updateTaskDto.status !== TaskStatus.DONE && task.status === TaskStatus.DONE) {
      task.completedAt = null;
    }

    const savedTask = await this.taskRepository.save(task);

    // Log event
    const changes = this.getTaskChanges(task, updateTaskDto);
    await this.eventsService.logEvent({
      type: EventType.TASK_UPDATED,
      actorId: user.id,
      entityId: id,
      entityType: 'task',
      payload: changes,
    });

    // Emit real-time event
    await this.taskGateway.emitTaskEvent({
      type: TaskEventType.TASK_UPDATED,
      taskId: id,
      actorId: user.id,
      payload: {
        changes,
        task: {
          id: savedTask.id,
          title: savedTask.title,
          description: savedTask.description,
          status: savedTask.status,
          priority: savedTask.priority,
          assigneeId: savedTask.assigneeId,
          updatedAt: savedTask.updatedAt,
          dueDate: savedTask.dueDate,
        },
      },
      timestamp: new Date(),
    });

    /**
     * Handle assignment change notifications
     * Only triggers if assignee actually changed (not just reassigned to same person)
     */
    if (assigneeId !== undefined && assigneeId !== task.assigneeId) {
      // Log assignment change for audit trail
      await this.eventsService.logEvent({
        type: EventType.TASK_ASSIGNED,
        actorId: user.id,
        entityId: id,
        entityType: 'task',
        payload: {
          oldAssigneeId: task.assigneeId,
          newAssigneeId: assigneeId,
        },
      });

      // Send real-time notification to new assignee
      await this.taskGateway.notifyTaskAssignment(id, assigneeId, user.id);

      // Create database notification for new assignee
      if (assigneeId) {
        const assignorName = user.profile?.firstName && user.profile?.lastName
          ? `${user.profile.firstName} ${user.profile.lastName}`
          : user.email;
        await this.notificationsService.createTaskAssignmentNotification(
          assigneeId,
          id,
          savedTask.title,
          assignorName,
        );
      }
    }

    /**
     * Handle task completion notifications
     * Notify task creator and assignee when task is completed
     */
    if (updateTaskDto.status === TaskStatus.DONE && task.status !== TaskStatus.DONE) {
      const completedByName = user.profile?.firstName && user.profile?.lastName
        ? `${user.profile.firstName} ${user.profile.lastName}`
        : user.email;

      // Notify task creator (if different from completer)
      if (task.creatorId !== user.id) {
        await this.notificationsService.createTaskCompletionNotification(
          task.creatorId,
          id,
          savedTask.title,
          completedByName,
        );
      }

      // Notify assignee (if different from completer and creator)
      if (task.assigneeId && task.assigneeId !== user.id && task.assigneeId !== task.creatorId) {
        await this.notificationsService.createTaskCompletionNotification(
          task.assigneeId,
          id,
          savedTask.title,
          completedByName,
        );
      }
    }

    /**
     * Handle task update notifications (for assignee)
     * Notify assignee when task is updated (but not when they're the one updating)
     */
    if (task.assigneeId && task.assigneeId !== user.id && updateTaskDto.status !== TaskStatus.DONE) {
      const updatedByName = user.profile?.firstName && user.profile?.lastName
        ? `${user.profile.firstName} ${user.profile.lastName}`
        : user.email;
      await this.notificationsService.createTaskUpdatedNotification(
        task.assigneeId,
        id,
        savedTask.title,
        updatedByName,
      );
    }

    return savedTask;
  }

  /**
   * Delete a task (soft delete)
   * 
   * Soft delete strategy:
   * - Sets deletedAt timestamp instead of removing from database
   * - Preserves data for audit trail and recovery
   * - Excluded from queries via WHERE deletedAt IS NULL
   * 
   * Benefits:
   * - Data recovery capability
   * - Audit compliance
   * - Referential integrity maintained
   * 
   * @param id - Task ID to delete
   * @param user - User performing the deletion
   */
  @InvalidateCache('task:*')
  async remove(id: string, user: User): Promise<void> {
    const task = await this.findOne(id, user);

    // Soft delete: Mark as deleted but preserve data
    task.deletedAt = new Date();
    await this.taskRepository.save(task);

    // Log event
    await this.eventsService.logEvent({
      type: EventType.TASK_DELETED,
      actorId: user.id,
      entityId: id,
      entityType: 'task',
      payload: {
        title: task.title,
        softDelete: true,
      },
    });

    // Emit real-time event
    await this.taskGateway.emitTaskEvent({
      type: TaskEventType.TASK_DELETED,
      taskId: id,
      actorId: user.id,
      payload: {
        taskId: id,
        softDelete: true,
      },
      timestamp: new Date(),
    });
  }

  @InvalidateCache('task:*')
  async assignTask(id: string, assigneeId: string | null, user: User): Promise<Task> {
    // Invalidate cache BEFORE fetching to ensure fresh data
    await this.cacheService.deletePattern('task:*');
    
    const task = await this.taskRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['creator', 'assignee'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Check permissions
    if (user.role !== 'admin' && task.creatorId !== user.id && task.assigneeId !== user.id) {
      throw new NotFoundException('Task not found');
    }

    const oldAssigneeId = task.assigneeId;

    // Validate assignee if provided
    if (assigneeId) {
      const assignee = await this.userRepository.findOne({ where: { id: assigneeId } });
      if (!assignee) {
        throw new NotFoundException('Assignee not found');
      }
    }

    // Use update query builder to directly update the database
    // This bypasses any entity manager caching issues
    await this.taskRepository
      .createQueryBuilder()
      .update(Task)
      .set({ 
        assigneeId: assigneeId ?? null, 
        updatedAt: new Date() 
      })
      .where('id = :id', { id: task.id })
      .execute();

    // Reload task with relations using query builder to bypass any entity manager cache
    // This ensures we get fresh data from the database with the correct assignee relation
    const updatedTask = await this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.creator', 'creator')
      .leftJoinAndSelect('task.assignee', 'assignee')
      .where('task.id = :id', { id: task.id })
      .andWhere('task.deletedAt IS NULL')
      .getOne();

    if (!updatedTask) {
      throw new NotFoundException('Task not found after update');
    }

    // Log assignment event
    await this.eventsService.logEvent({
      type: EventType.TASK_ASSIGNED,
      actorId: user.id,
      entityId: id,
      entityType: 'task',
      payload: {
        oldAssigneeId,
        newAssigneeId: assigneeId,
      },
    });

    // Emit real-time event
    await this.taskGateway.emitTaskEvent({
      type: TaskEventType.TASK_ASSIGNED,
      taskId: id,
      actorId: user.id,
      payload: {
        oldAssigneeId,
        newAssigneeId: assigneeId,
        task: {
          id: updatedTask.id,
          title: updatedTask.title,
          assigneeId: updatedTask.assigneeId,
          updatedAt: updatedTask.updatedAt,
        },
      },
      timestamp: new Date(),
    });

    // Notify assignee via WebSocket
    await this.taskGateway.notifyTaskAssignment(id, assigneeId, user.id);

    // Create database notification for new assignee
    if (assigneeId && assigneeId !== oldAssigneeId) {
      const assignorName = user.profile?.firstName && user.profile?.lastName
        ? `${user.profile.firstName} ${user.profile.lastName}`
        : user.email;
      await this.notificationsService.createTaskAssignmentNotification(
        assigneeId,
        id,
        updatedTask.title,
        assignorName,
      );
    }

    return updatedTask;
  }

  /**
   * Get task statistics aggregated by status, priority, and overdue count
   * 
   * Performance:
   * - Single database query with conditional aggregation (efficient)
   * - Results cached for 5 minutes (stats don't change frequently)
   * - User-specific filtering applied (users see only their stats)
   * 
   * Aggregations:
   * - Total task count
   * - Count by status (TODO, IN_PROGRESS, REVIEW, DONE)
   * - Count by priority (LOW, MEDIUM, HIGH, URGENT)
   * - Overdue count (dueDate < now AND status != DONE)
   * 
   * @param user - Current user (for access control)
   * @returns Aggregated statistics
   */
  @CacheResult({ ttl: 300, keyPrefix: 'task:stats' }) // 5 minutes cache
  async getTaskStats(user: User): Promise<{
    total: number;
    byStatus: Record<TaskStatus, number>;
    byPriority: Record<TaskPriority, number>;
    overdue: number;
  }> {

    /**
     * Single-query aggregation using conditional COUNT
     * More efficient than multiple queries or application-level aggregation
     * Uses CASE WHEN for conditional counting in SQL
     */
    const queryBuilder = this.taskRepository
      .createQueryBuilder('task')
      .select('COUNT(*)', 'total')
      .addSelect('COUNT(CASE WHEN task.status = :todo THEN 1 END)', 'todo')
      .addSelect('COUNT(CASE WHEN task.status = :inProgress THEN 1 END)', 'inProgress')
      .addSelect('COUNT(CASE WHEN task.status = :review THEN 1 END)', 'review')
      .addSelect('COUNT(CASE WHEN task.status = :done THEN 1 END)', 'done')
      .addSelect('COUNT(CASE WHEN task.priority = :low THEN 1 END)', 'low')
      .addSelect('COUNT(CASE WHEN task.priority = :medium THEN 1 END)', 'medium')
      .addSelect('COUNT(CASE WHEN task.priority = :high THEN 1 END)', 'high')
      .addSelect('COUNT(CASE WHEN task.priority = :urgent THEN 1 END)', 'urgent')
      .addSelect('COUNT(CASE WHEN task.dueDate < NOW() AND task.status != :done THEN 1 END)', 'overdue')
      .where('task.deletedAt IS NULL'); // Exclude soft-deleted tasks

    // Apply user-specific filters
    if (user.role !== 'admin') {
      queryBuilder.andWhere('(task.creatorId = :userId OR task.assigneeId = :userId)', {
        userId: user.id,
      });
    }

    queryBuilder.setParameters({
      todo: TaskStatus.TODO,
      inProgress: TaskStatus.IN_PROGRESS,
      review: TaskStatus.REVIEW,
      done: TaskStatus.DONE,
      low: TaskPriority.LOW,
      medium: TaskPriority.MEDIUM,
      high: TaskPriority.HIGH,
      urgent: TaskPriority.URGENT,
    });

    const result = await queryBuilder.getRawOne();

    return {
      total: parseInt(result.total),
      byStatus: {
        [TaskStatus.TODO]: parseInt(result.todo),
        [TaskStatus.IN_PROGRESS]: parseInt(result.inProgress),
        [TaskStatus.REVIEW]: parseInt(result.review),
        [TaskStatus.DONE]: parseInt(result.done),
      },
      byPriority: {
        [TaskPriority.LOW]: parseInt(result.low),
        [TaskPriority.MEDIUM]: parseInt(result.medium),
        [TaskPriority.HIGH]: parseInt(result.high),
        [TaskPriority.URGENT]: parseInt(result.urgent),
      },
      overdue: parseInt(result.overdue),
    };
  }

  private getTaskChanges(oldTask: Task, updates: Partial<UpdateTaskDto>): Record<string, any> {
    const changes: Record<string, any> = {};

    Object.keys(updates).forEach(key => {
      if (key !== 'version' && oldTask[key] !== updates[key]) {
        changes[key] = {
          from: oldTask[key],
          to: updates[key],
        };
      }
    });

    return changes;
  }
}
