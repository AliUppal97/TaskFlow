import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

import { UserService } from '../auth/user.service';
import { EventsService } from '../events/events.service';
import { User } from '../../entities/user.entity';
import { JwtPayload } from '../auth/jwt.strategy';

interface AuthenticatedSocket extends Socket {
  user?: User;
}

export enum TaskEventType {
  TASK_CREATED = 'task.created',
  TASK_UPDATED = 'task.updated',
  TASK_ASSIGNED = 'task.assigned',
  TASK_DELETED = 'task.deleted',
  TASK_STATUS_CHANGED = 'task.status_changed',
}

export interface TaskEvent {
  type: TaskEventType;
  taskId: string;
  actorId: string;
  payload: Record<string, any>;
  timestamp: Date;
}

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/tasks',
})
export class TaskGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TaskGateway.name);
  private connectedClients = new Map<string, AuthenticatedSocket>();

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private userService: UserService,
    private eventsService: EventsService,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}

  afterInit(server: Server) {
    this.logger.log('Task WebSocket Gateway initialized');
  }

  async handleConnection(client: AuthenticatedSocket, ...args: any[]) {
    try {
      const token = this.extractTokenFromSocket(client);
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('jwt.accessTokenSecret'),
      }) as JwtPayload;

      const user = await this.userService.findById(payload.sub);
      if (!user) {
        client.disconnect();
        return;
      }

      client.user = user;
      this.connectedClients.set(client.id, client);

      // Join user-specific room for personalized events
      client.join(`user:${user.id}`);

      // Join admin room if user is admin
      if (user.role === 'admin') {
        client.join('admin');
      }

      this.logger.log(`Client connected: ${client.id} (User: ${user.email})`);

      // Send welcome message
      client.emit('connected', {
        message: 'Successfully connected to TaskFlow real-time updates',
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      });

    } catch (error) {
      this.logger.error(`Connection failed for client ${client.id}:`, error);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.connectedClients.delete(client.id);
    if (client.user) {
      this.logger.log(`Client disconnected: ${client.id} (User: ${client.user.email})`);
    } else {
      this.logger.log(`Client disconnected: ${client.id}`);
    }
  }

  @SubscribeMessage('subscribe-to-task')
  handleSubscribeToTask(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { taskId: string },
  ) {
    if (!client.user) return;

    const { taskId } = data;
    client.join(`task:${taskId}`);

    this.logger.log(`User ${client.user.email} subscribed to task ${taskId}`);

    return { event: 'subscribed', taskId };
  }

  @SubscribeMessage('unsubscribe-from-task')
  handleUnsubscribeFromTask(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { taskId: string },
  ) {
    if (!client.user) return;

    const { taskId } = data;
    client.leave(`task:${taskId}`);

    this.logger.log(`User ${client.user.email} unsubscribed from task ${taskId}`);

    return { event: 'unsubscribed', taskId };
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: AuthenticatedSocket) {
    return { event: 'pong', timestamp: new Date() };
  }

  // Public methods to emit events from other services
  async emitTaskEvent(event: TaskEvent): Promise<void> {
    const { type, taskId, actorId, payload } = event;

    // Get actor information
    const actor = await this.userService.findById(actorId);

    const eventData = {
      type,
      taskId,
      actor: actor ? {
        id: actor.id,
        email: actor.email,
        profile: actor.profile,
      } : null,
      payload,
      timestamp: event.timestamp,
    };

    // Emit to task-specific room
    this.server.to(`task:${taskId}`).emit('task-event', eventData);

    // Emit to all connected clients (for global task list updates)
    this.server.emit('task-event', eventData);

    // Log the real-time event
    await this.eventsService.logEvent({
      type: type as any,
      actorId,
      entityId: taskId,
      entityType: 'task',
      payload: {
        ...payload,
        realTimeBroadcast: true,
      },
    });

    this.logger.log(`Emitted task event: ${type} for task ${taskId}`);
  }

  async notifyTaskAssignment(taskId: string, assigneeId: string | null, assignorId: string): Promise<void> {
    const assignor = await this.userService.findById(assignorId);

    const notification = {
      type: 'task-assigned',
      taskId,
      assigneeId,
      assignor: assignor ? {
        id: assignor.id,
        email: assignor.email,
        profile: assignor.profile,
      } : null,
      timestamp: new Date(),
    };

    // Notify the assignee if they exist
    if (assigneeId) {
      this.server.to(`user:${assigneeId}`).emit('notification', notification);
    }

    // Notify the assignor
    this.server.to(`user:${assignorId}`).emit('notification', notification);

    this.logger.log(`Task ${taskId} assignment notification sent`);
  }

  async notifyTaskDueSoon(taskId: string, userId: string, daysUntilDue: number): Promise<void> {
    const notification = {
      type: 'task-due-soon',
      taskId,
      daysUntilDue,
      timestamp: new Date(),
    };

    this.server.to(`user:${userId}`).emit('notification', notification);

    this.logger.log(`Due date notification sent for task ${taskId} to user ${userId}`);
  }

  // Get connection statistics
  getConnectionStats() {
    return {
      totalConnections: this.connectedClients.size,
      adminConnections: Array.from(this.connectedClients.values())
        .filter(client => client.user?.role === 'admin').length,
      userConnections: Array.from(this.connectedClients.values())
        .filter(client => client.user?.role === 'user').length,
    };
  }

  private extractTokenFromSocket(client: AuthenticatedSocket): string | null {
    const token = client.handshake.auth?.token ||
                  client.handshake.headers?.authorization?.replace('Bearer ', '') ||
                  client.handshake.query?.token;

    return token as string || null;
  }
}



