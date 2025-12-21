import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, IsNull } from 'typeorm';

import { Task, TaskStatus, TaskPriority } from '../../entities/task.entity';
import { User } from '../../entities/user.entity';
import { CreateTaskDto, UpdateTaskDto, TaskQueryDto } from '../../dto/task.dto';
import { EventsService } from '../events/events.service';
import { TaskGateway, TaskEvent, TaskEventType } from './task.gateway';
import { CacheService } from '../../common/cache/cache.service';
import { CacheResult, InvalidateCache } from '../../common/cache/cache.decorators';
import { EventType } from '../../entities/event-log.entity';

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
  ) {}

  @InvalidateCache('task:*')
  async create(createTaskDto: CreateTaskDto, creator: User): Promise<Task> {
    const { assigneeId, ...taskData } = createTaskDto;

    // Validate assignee if provided
    if (assigneeId) {
      const assignee = await this.userRepository.findOne({ where: { id: assigneeId } });
      if (!assignee) {
        throw new NotFoundException('Assignee not found');
      }
    }

    const task = this.taskRepository.create({
      ...taskData,
      creatorId: creator.id,
      assigneeId: assigneeId || undefined,
      status: TaskStatus.TODO,
      priority: createTaskDto.priority || TaskPriority.MEDIUM,
    });

    const savedTask = await this.taskRepository.save(task);

    // Log event
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

    // Emit real-time event
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

    return savedTask;
  }

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
    const { page = 1, limit = 10, status, priority, assigneeId, creatorId, search } = query;

    const queryBuilder = this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.creator', 'creator')
      .leftJoinAndSelect('task.assignee', 'assignee')
      .where('task.deletedAt IS NULL'); // Soft delete filter

    // Apply user-specific filters (users can only see tasks they created or are assigned to, unless admin)
    if (user.role !== 'admin') {
      queryBuilder.andWhere('(task.creatorId = :userId OR task.assigneeId = :userId)', {
        userId: user.id,
      });
    }

    // Apply filters
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

    if (search) {
      queryBuilder.andWhere(
        '(LOWER(task.title) LIKE LOWER(:search) OR LOWER(task.description) LIKE LOWER(:search))',
        { search: `%${search}%` }
      );
    }

    // Apply sorting (default to createdAt DESC)
    queryBuilder.orderBy('task.createdAt', 'DESC');

    // Apply pagination
    queryBuilder.skip((page - 1) * limit).take(limit);

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

  @InvalidateCache('task:*')
  async update(id: string, updateTaskDto: UpdateTaskDto, user: User): Promise<Task> {
    const task = await this.findOne(id, user);

    // Optimistic locking check
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

    // Update fields
    Object.assign(task, updateData);
    task.updatedAt = new Date();

    // Set completedAt when status changes to DONE
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

    // Log assignment event if assignee changed
    if (assigneeId !== undefined && assigneeId !== task.assigneeId) {
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

      // Notify assignee via WebSocket
      await this.taskGateway.notifyTaskAssignment(id, assigneeId, user.id);
    }

    return savedTask;
  }

  @InvalidateCache('task:*')
  async remove(id: string, user: User): Promise<void> {
    const task = await this.findOne(id, user);

    // Soft delete
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
    const task = await this.findOne(id, user);

    const oldAssigneeId = task.assigneeId;

    // Validate assignee if provided
    if (assigneeId) {
      const assignee = await this.userRepository.findOne({ where: { id: assigneeId } });
      if (!assignee) {
        throw new NotFoundException('Assignee not found');
      }
    }

    task.assigneeId = assigneeId ?? null;
    task.updatedAt = new Date();

    const savedTask = await this.taskRepository.save(task);

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
          id: savedTask.id,
          title: savedTask.title,
          assigneeId: savedTask.assigneeId,
          updatedAt: savedTask.updatedAt,
        },
      },
      timestamp: new Date(),
    });

    // Notify assignee via WebSocket
    await this.taskGateway.notifyTaskAssignment(id, assigneeId, user.id);

    return savedTask;
  }

  @CacheResult({ ttl: 300, keyPrefix: 'task:stats' }) // 5 minutes cache
  async getTaskStats(user: User): Promise<{
    total: number;
    byStatus: Record<TaskStatus, number>;
    byPriority: Record<TaskPriority, number>;
    overdue: number;
  }> {

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
      .where('task.deletedAt IS NULL');

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
