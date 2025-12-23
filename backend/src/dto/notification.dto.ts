import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsString, IsBoolean, IsOptional, IsUUID, IsObject } from 'class-validator';
import { NotificationType } from '../entities/notification.entity';

export class CreateNotificationDto {
  @ApiProperty({ enum: NotificationType, description: 'Type of notification' })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ description: 'Notification title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Notification message' })
  @IsString()
  message: string;

  @ApiPropertyOptional({ description: 'Task ID if notification is task-related' })
  @IsOptional()
  @IsUUID()
  taskId?: string;

  @ApiPropertyOptional({ description: 'Action URL for the notification' })
  @IsOptional()
  @IsString()
  actionUrl?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class NotificationResponseDto {
  @ApiProperty({ description: 'Notification ID' })
  id: string;

  @ApiProperty({ enum: NotificationType, description: 'Notification type' })
  type: NotificationType;

  @ApiProperty({ description: 'Notification title' })
  title: string;

  @ApiProperty({ description: 'Notification message' })
  message: string;

  @ApiProperty({ description: 'Whether notification has been read' })
  read: boolean;

  @ApiProperty({ description: 'User ID who should receive this notification' })
  userId: string;

  @ApiPropertyOptional({ description: 'Task ID if notification is task-related' })
  taskId?: string | null;

  @ApiPropertyOptional({ description: 'Action URL for the notification' })
  actionUrl?: string | null;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  metadata?: Record<string, any> | null;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;
}

export class NotificationListResponseDto {
  @ApiProperty({ type: [NotificationResponseDto], description: 'List of notifications' })
  data: NotificationResponseDto[];

  @ApiProperty({ description: 'Pagination metadata' })
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class UpdateNotificationDto {
  @ApiPropertyOptional({ description: 'Mark notification as read' })
  @IsOptional()
  @IsBoolean()
  read?: boolean;
}

export class NotificationStatsDto {
  @ApiProperty({ description: 'Total notifications' })
  total: number;

  @ApiProperty({ description: 'Unread notifications count' })
  unread: number;

  @ApiProperty({ description: 'Notifications from this week' })
  thisWeek: number;
}

