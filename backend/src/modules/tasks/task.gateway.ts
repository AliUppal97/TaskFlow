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
import { Logger, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

import { UserService } from '../auth/user.service';
import { EventsService } from '../events/events.service';
import { User, UserRole } from '../../entities/user.entity';
import { EventType } from '../../entities/event-log.entity';
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

/**
 * WebSocket Gateway for real-time task updates
 * 
 * Architecture:
 * - Namespace: /tasks (isolated from other WebSocket connections)
 * - Authentication: JWT token required for connection
 * - Room-based messaging: Clients join task-specific rooms for targeted updates
 * 
 * Connection lifecycle:
 * 1. Client connects with JWT token
 * 2. Server validates token and loads user
 * 3. Client joins user-specific room (user:{userId})
 * 4. Admin clients also join 'admin' room
 * 5. Clients can subscribe to specific tasks (task:{taskId})
 * 
 * Event broadcasting:
 * - Task events broadcast to task-specific room
 * - Also broadcast globally for list updates
 * - Assignment notifications sent to user-specific rooms
 */
@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true, // Required for cookie-based auth
  },
  namespace: '/tasks', // Isolated namespace for task events
})
export class TaskGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TaskGateway.name);
  // Track connected clients for connection management and statistics
  private connectedClients = new Map<string, AuthenticatedSocket>();

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private userService: UserService,
    private eventsService: EventsService,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}

  afterInit(_server: Server) {
    void _server; // Explicitly ignore unused parameter
    this.logger.log('Task WebSocket Gateway initialized');
  }

  /**
   * Handle new WebSocket connection
   * 
   * Authentication flow:
   * 1. Extract JWT token from handshake (auth, headers, or query)
   * 2. Verify token signature and expiration
   * 3. Load user from database
   * 4. Attach user to socket for authorization checks
   * 
   * Room management:
   * - user:{userId}: Personal notifications (assignments, updates)
   * - admin: Admin-only events (if user is admin)
   * - task:{taskId}: Task-specific updates (joined via subscribe)
   * 
   * @param client - Socket.IO client connection
   */
  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract JWT token from handshake (supports multiple methods for flexibility)
      const token = this.extractTokenFromSocket(client);
      if (!token) {
        client.disconnect(); // No token = unauthorized connection
        return;
      }

      // Verify token signature and expiration
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.configService.get('jwt.accessTokenSecret'),
      });

      // Load user to ensure they still exist and get latest role/permissions
      const user = await this.userService.findById(payload.sub);
      if (!user) {
        client.disconnect(); // User deleted or invalid
        return;
      }

      // Attach user to socket for authorization in message handlers
      client.user = user;
      this.connectedClients.set(client.id, client);

      // Join user-specific room for personalized notifications (assignments, etc.)
      await client.join(`user:${user.id}`);

      // Admins get access to admin-only room for system-wide events
      if (user.role === UserRole.ADMIN) {
        await client.join('admin');
      }

      this.logger.log(`Client connected: ${client.id} (User: ${user.email})`);

      // Send connection confirmation with user info
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
      client.disconnect(); // Invalid token or other error
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

  /**
   * Subscribe to real-time updates for a specific task
   * 
   * Room-based subscription:
   * - Client joins task:{taskId} room
   * - Receives all events for that task (updates, assignments, etc.)
   * - Useful for task detail pages that need live updates
   * 
   * @param client - Authenticated socket client
   * @param data - Contains taskId to subscribe to
   * @returns Confirmation message
   */
  @SubscribeMessage('subscribe-to-task')
  async handleSubscribeToTask(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { taskId: string },
  ) {
    if (!client.user) return; // Unauthenticated clients ignored

    const { taskId } = data;
    await client.join(`task:${taskId}`); // Join task-specific room

    this.logger.log(`User ${client.user.email} subscribed to task ${taskId}`);

    return { event: 'subscribed', taskId };
  }

  @SubscribeMessage('unsubscribe-from-task')
  async handleUnsubscribeFromTask(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { taskId: string },
  ) {
    if (!client.user) return;

    const { taskId } = data;
    await client.leave(`task:${taskId}`);

    this.logger.log(`User ${client.user.email} unsubscribed from task ${taskId}`);

    return { event: 'unsubscribed', taskId };
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() _client: AuthenticatedSocket) {
    void _client; // Explicitly ignore unused parameter
    return { event: 'pong', timestamp: new Date() };
  }

  /**
   * Emit task event to all relevant clients
   * 
   * Broadcasting strategy:
   * 1. Task-specific room: Clients subscribed to this task get immediate update
   * 2. Global broadcast: All clients get event (for list view updates)
   * 
   * This dual-broadcast ensures:
   * - Task detail pages get instant updates
   * - Task list pages stay synchronized
   * 
   * Side effects:
   * - Event logged to MongoDB for audit trail
   * - Actor information loaded and included in event
   * 
   * @param event - Task event to broadcast
   */
  async emitTaskEvent(event: TaskEvent): Promise<void> {
    const { type, taskId, actorId, payload } = event;

    // Load actor information to include in event (who performed the action)
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

    // Broadcast to task-specific room (clients viewing this task)
    this.server.to(`task:${taskId}`).emit('task-event', eventData);

    // Broadcast globally (clients viewing task lists)
    this.server.emit('task-event', eventData);

    // Log event to MongoDB for audit trail and compliance
    await this.eventsService.logEvent({
      type: type as unknown as EventType,
      actorId,
      entityId: taskId,
      entityType: 'task',
      payload: {
        ...payload,
        realTimeBroadcast: true, // Mark as real-time event
      },
    });

    this.logger.log(`Emitted task event: ${type} for task ${taskId}`);
  }

  /**
   * Send assignment notification to relevant users
   * 
   * Notification targets:
   * - New assignee: Gets notification in user:{assigneeId} room
   * - Assignor: Gets confirmation notification
   * 
   * Uses user-specific rooms for targeted delivery (more efficient than global broadcast)
   * 
   * @param taskId - Task that was assigned
   * @param assigneeId - New assignee (null if unassigned)
   * @param assignorId - User who performed the assignment
   */
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

    // Notify new assignee (if task was assigned, not unassigned)
    if (assigneeId) {
      this.server.to(`user:${assigneeId}`).emit('notification', notification);
    }

    // Notify assignor (confirmation of their action)
    this.server.to(`user:${assignorId}`).emit('notification', notification);

    this.logger.log(`Task ${taskId} assignment notification sent`);
  }

  notifyTaskDueSoon(taskId: string, userId: string, daysUntilDue: number): void {
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
        .filter(client => client.user?.role === UserRole.ADMIN).length,
      userConnections: Array.from(this.connectedClients.values())
        .filter(client => client.user?.role === UserRole.USER).length,
    };
  }

  private extractTokenFromSocket(client: AuthenticatedSocket): string | null {
    // Extract token from various possible locations with proper type checking
    let token: string | null = null;

    if (client.handshake.auth?.token && typeof client.handshake.auth.token === 'string') {
      token = client.handshake.auth.token;
    } else if (client.handshake.headers?.authorization && typeof client.handshake.headers.authorization === 'string') {
      token = client.handshake.headers.authorization.replace('Bearer ', '');
    } else if (client.handshake.query?.token && typeof client.handshake.query.token === 'string') {
      token = client.handshake.query.token;
    }

    return token && token.length > 0 ? token : null;
  }
}



