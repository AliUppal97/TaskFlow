import {
  Controller,
  Get,
  Patch,
  Param,
  Delete,
  Query,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

import { NotificationsService } from './notifications.service';
import { JwtPermissionsGuard } from '../../guards/jwt-permissions.guard';
import { Permission, RequirePermissions } from '../../decorators/permissions.decorator';
import {
  NotificationResponseDto,
  NotificationListResponseDto,
  UpdateNotificationDto,
  NotificationStatsDto,
} from '../../dto/notification.dto';
import type { RequestWithUser } from '../../common/interfaces/request-with-user.interface';
import { Notification, NotificationType } from '../../entities/notification.entity';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtPermissionsGuard)
@RequirePermissions(Permission.TASK_READ) // Users need task read permission to see notifications
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all notifications for the current user' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiQuery({ name: 'read', required: false, type: Boolean, description: 'Filter by read status' })
  @ApiQuery({ name: 'type', required: false, enum: NotificationType, description: 'Filter by notification type' })
  @ApiResponse({
    status: 200,
    description: 'Notifications retrieved successfully',
    type: NotificationListResponseDto,
  })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('read') read?: string,
    @Query('type') type?: NotificationType,
    @Request() req?: RequestWithUser,
  ): Promise<NotificationListResponseDto> {
    const userId = req?.user?.id;
    if (!userId) {
      throw new Error('User not found in request');
    }

    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const readFilter = read === 'true' ? true : read === 'false' ? false : undefined;

    const result = await this.notificationsService.findAll(userId, pageNum, limitNum, readFilter, type);
    
    return {
      data: result.data.map(notification => this.transformNotificationResponse(notification)),
      pagination: result.pagination,
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get notification statistics' })
  @ApiResponse({
    status: 200,
    description: 'Notification statistics retrieved successfully',
    type: NotificationStatsDto,
  })
  async getStats(@Request() req: RequestWithUser): Promise<NotificationStatsDto> {
    return this.notificationsService.getStats(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a notification by ID' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({
    status: 200,
    description: 'Notification retrieved successfully',
    type: NotificationResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async findOne(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<NotificationResponseDto> {
    const notification = await this.notificationsService.findOne(id, req.user.id);
    return this.transformNotificationResponse(notification);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a notification (e.g., mark as read)' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({
    status: 200,
    description: 'Notification updated successfully',
    type: NotificationResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async update(
    @Param('id') id: string,
    @Body() updateNotificationDto: UpdateNotificationDto,
    @Request() req: RequestWithUser,
  ): Promise<NotificationResponseDto> {
    const notification = await this.notificationsService.update(id, req.user.id, updateNotificationDto);
    return this.transformNotificationResponse(notification);
  }

  @Patch('read/all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({
    status: 200,
    description: 'All notifications marked as read',
  })
  async markAllAsRead(@Request() req: RequestWithUser) {
    const count = await this.notificationsService.markAllAsRead(req.user.id);
    return { count, message: `${count} notifications marked as read` };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ status: 204, description: 'Notification deleted successfully' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async remove(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<void> {
    await this.notificationsService.remove(id, req.user.id);
  }

  private transformNotificationResponse(notification: Notification): NotificationResponseDto {
    return {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      read: notification.read,
      userId: notification.userId,
      taskId: notification.taskId,
      actionUrl: notification.actionUrl,
      metadata: notification.metadata,
      createdAt: notification.createdAt,
    };
  }
}

