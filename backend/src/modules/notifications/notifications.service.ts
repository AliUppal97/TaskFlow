import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, IsNull } from 'typeorm';
import { Notification, NotificationType } from '../../entities/notification.entity';
import { User } from '../../entities/user.entity';
import { CreateNotificationDto, UpdateNotificationDto, NotificationStatsDto } from '../../dto/notification.dto';

/**
 * Notifications Service - Manages user notifications
 * 
 * Features:
 * - Create notifications for users
 * - Mark notifications as read/unread
 * - Delete notifications (soft delete)
 * - Get notification statistics
 * - Query notifications with pagination
 */
@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Create a notification for a user
   * 
   * @param userId - User ID who should receive the notification
   * @param createNotificationDto - Notification data
   * @returns Created notification
   */
  async create(userId: string, createNotificationDto: CreateNotificationDto): Promise<Notification> {
    // Verify user exists
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const notification = this.notificationRepository.create({
      ...createNotificationDto,
      userId,
    });

    return await this.notificationRepository.save(notification);
  }

  /**
   * Get all notifications for a user with pagination
   * 
   * @param userId - User ID
   * @param page - Page number (1-indexed)
   * @param limit - Items per page
   * @param read - Filter by read status (optional)
   * @param type - Filter by notification type (optional)
   * @returns Paginated list of notifications
   */
  async findAll(
    userId: string,
    page: number = 1,
    limit: number = 20,
    read?: boolean,
    type?: NotificationType,
  ) {
    const skip = (page - 1) * limit;
    const where: FindOptionsWhere<Notification> = {
      userId,
      deletedAt: IsNull(), // Only get non-deleted notifications
    };

    if (read !== undefined) {
      where.read = read;
    }

    if (type) {
      where.type = type;
    }

    const [notifications, total] = await this.notificationRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single notification by ID
   * 
   * @param id - Notification ID
   * @param userId - User ID (for authorization)
   * @returns Notification
   */
  async findOne(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id, userId, deletedAt: IsNull() },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return notification;
  }

  /**
   * Update a notification (e.g., mark as read)
   * 
   * @param id - Notification ID
   * @param userId - User ID (for authorization)
   * @param updateNotificationDto - Update data
   * @returns Updated notification
   */
  async update(
    id: string,
    userId: string,
    updateNotificationDto: UpdateNotificationDto,
  ): Promise<Notification> {
    const notification = await this.findOne(id, userId);

    Object.assign(notification, updateNotificationDto);
    return await this.notificationRepository.save(notification);
  }

  /**
   * Mark all notifications as read for a user
   * 
   * @param userId - User ID
   * @returns Number of notifications updated
   */
  async markAllAsRead(userId: string): Promise<number> {
    const result = await this.notificationRepository.update(
      { userId, read: false, deletedAt: IsNull() },
      { read: true },
    );

    return result.affected || 0;
  }

  /**
   * Delete a notification (soft delete)
   * 
   * @param id - Notification ID
   * @param userId - User ID (for authorization)
   */
  async remove(id: string, userId: string): Promise<void> {
    const notification = await this.findOne(id, userId);
    notification.deletedAt = new Date();
    await this.notificationRepository.save(notification);
  }

  /**
   * Get notification statistics for a user
   * 
   * @param userId - User ID
   * @returns Notification statistics
   */
  async getStats(userId: string): Promise<NotificationStatsDto> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const [total, unread, thisWeekCount] = await Promise.all([
      this.notificationRepository.count({
        where: { userId, deletedAt: IsNull() },
      }),
      this.notificationRepository.count({
        where: { userId, read: false, deletedAt: IsNull() },
      }),
      this.notificationRepository
        .createQueryBuilder('notification')
        .where('notification.userId = :userId', { userId })
        .andWhere('notification.deletedAt IS NULL')
        .andWhere('notification.createdAt >= :oneWeekAgo', { oneWeekAgo })
        .getCount(),
    ]);

    return {
      total,
      unread,
      thisWeek: thisWeekCount,
    };
  }

  /**
   * Create a task assignment notification
   * Helper method for creating task-related notifications
   */
  async createTaskAssignmentNotification(
    userId: string,
    taskId: string,
    taskTitle: string,
    assignorName?: string,
  ): Promise<Notification> {
    return this.create(userId, {
      type: NotificationType.TASK_ASSIGNED,
      title: 'Task Assigned',
      message: assignorName
        ? `${assignorName} assigned you to "${taskTitle}"`
        : `You have been assigned to "${taskTitle}"`,
      taskId,
      actionUrl: `/tasks/${taskId}`,
      metadata: {
        taskId,
        taskTitle,
        assignorName,
      },
    });
  }

  /**
   * Create a task completion notification
   */
  async createTaskCompletionNotification(
    userId: string,
    taskId: string,
    taskTitle: string,
    completedByName?: string,
  ): Promise<Notification> {
    return this.create(userId, {
      type: NotificationType.TASK_COMPLETED,
      title: 'Task Completed',
      message: completedByName
        ? `${completedByName} completed "${taskTitle}"`
        : `Task "${taskTitle}" has been completed`,
      taskId,
      actionUrl: `/tasks/${taskId}`,
      metadata: {
        taskId,
        taskTitle,
        completedByName,
      },
    });
  }

  /**
   * Create a task due soon notification
   */
  async createTaskDueSoonNotification(
    userId: string,
    taskId: string,
    taskTitle: string,
    daysUntilDue: number,
  ): Promise<Notification> {
    return this.create(userId, {
      type: NotificationType.TASK_DUE_SOON,
      title: 'Deadline Approaching',
      message: `Task "${taskTitle}" is due in ${daysUntilDue} ${daysUntilDue === 1 ? 'day' : 'days'}`,
      taskId,
      actionUrl: `/tasks/${taskId}`,
      metadata: {
        taskId,
        taskTitle,
        daysUntilDue,
      },
    });
  }

  /**
   * Create a task updated notification
   */
  async createTaskUpdatedNotification(
    userId: string,
    taskId: string,
    taskTitle: string,
    updatedByName?: string,
  ): Promise<Notification> {
    return this.create(userId, {
      type: NotificationType.TASK_UPDATED,
      title: 'Task Updated',
      message: updatedByName
        ? `${updatedByName} updated "${taskTitle}"`
        : `Task "${taskTitle}" has been updated`,
      taskId,
      actionUrl: `/tasks/${taskId}`,
      metadata: {
        taskId,
        taskTitle,
        updatedByName,
      },
    });
  }
}

