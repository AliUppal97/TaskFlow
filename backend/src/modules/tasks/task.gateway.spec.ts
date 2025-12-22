import { Test, TestingModule } from '@nestjs/testing';
import { TaskGateway, TaskEventType, TaskEvent } from './task.gateway';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { UserService } from '../auth/user.service';
import { EventsService } from '../events/events.service';
import { User, UserRole } from '../../entities/user.entity';
import { JwtPayload } from '../auth/jwt.strategy';

describe('TaskGateway', () => {
  let gateway: TaskGateway;
  let jwtService: JwtService;
  let configService: ConfigService;
  let cacheManager: any;
  let userService: UserService;
  let eventsService: EventsService;

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    role: UserRole.USER,
    profile: { firstName: 'Test', lastName: 'User' },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSocket = {
    id: 'socket-123',
    handshake: {
      auth: { token: 'valid-token' },
      headers: { 'user-agent': 'test-agent' },
      address: '127.0.0.1',
    },
    user: mockUser,
    join: jest.fn(),
    leave: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
  };

  const mockServer = {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
    sockets: {
      sockets: new Map([['socket-123', mockSocket]]),
    },
  };

  const mockJwtService = {
    verifyAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  const mockUserService = {
    findById: jest.fn(),
  };

  const mockEventsService = {
    logEvent: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskGateway,
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
        { provide: UserService, useValue: mockUserService },
        { provide: EventsService, useValue: mockEventsService },
      ],
    }).compile();

    gateway = module.get<TaskGateway>(TaskGateway);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
    cacheManager = module.get(CACHE_MANAGER);
    userService = module.get<UserService>(UserService);
    eventsService = module.get<EventsService>(EventsService);

    // Set up the server reference
    (gateway as any).server = mockServer;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('afterInit', () => {
    it('should log initialization', () => {
      const loggerSpy = jest.spyOn(gateway['logger'], 'log');

      gateway.afterInit(mockServer as any);

      expect(loggerSpy).toHaveBeenCalledWith('Task Gateway initialized');
    });
  });

  describe('handleConnection', () => {
    beforeEach(() => {
      mockJwtService.verifyAsync.mockResolvedValue({ sub: 'user-123' } as JwtPayload);
      mockUserService.findById.mockResolvedValue(mockUser);
      mockConfigService.get.mockReturnValue('secret');
    });

    it('should authenticate and connect user successfully', async () => {
      await gateway.handleConnection(mockSocket as any);

      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('valid-token', { secret: 'secret' });
      expect(mockUserService.findById).toHaveBeenCalledWith('user-123');
      expect(mockSocket.user).toEqual(mockUser);
    });

    it('should handle invalid token', async () => {
      mockJwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      await expect(gateway.handleConnection(mockSocket as any)).rejects.toThrow('Invalid token');
      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('should handle user not found', async () => {
      mockUserService.findById.mockResolvedValue(null);

      await expect(gateway.handleConnection(mockSocket as any)).rejects.toThrow('User not found');
      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('should handle missing token', async () => {
      const socketWithoutToken = {
        ...mockSocket,
        handshake: { ...mockSocket.handshake, auth: {} },
      };

      await expect(gateway.handleConnection(socketWithoutToken as any)).rejects.toThrow('No token provided');
    });

    it('should cache user session', async () => {
      await gateway.handleConnection(mockSocket as any);

      expect(mockCacheManager.set).toHaveBeenCalledWith(
        `socket:${mockSocket.id}`,
        mockUser,
        24 * 60 * 60 * 1000 // 24 hours
      );
    });
  });

  describe('handleDisconnect', () => {
    it('should clean up user session on disconnect', async () => {
      mockSocket.user = mockUser;

      await gateway.handleDisconnect(mockSocket as any);

      expect(mockCacheManager.del).toHaveBeenCalledWith(`socket:${mockSocket.id}`);
    });

    it('should handle disconnect without user', async () => {
      mockSocket.user = undefined;

      await expect(gateway.handleDisconnect(mockSocket as any)).resolves.not.toThrow();
    });
  });

  describe('subscribeToTask', () => {
    it('should subscribe socket to task room', async () => {
      mockSocket.user = mockUser;

      await gateway.subscribeToTask(mockSocket as any, { taskId: 'task-123' });

      expect(mockSocket.join).toHaveBeenCalledWith('task:task-123');
    });

    it('should handle missing taskId', async () => {
      mockSocket.user = mockUser;

      await expect(gateway.subscribeToTask(mockSocket as any, {})).rejects.toThrow('Task ID is required');
    });

    it('should handle unauthenticated user', async () => {
      mockSocket.user = undefined;

      await expect(gateway.subscribeToTask(mockSocket as any, { taskId: 'task-123' })).rejects.toThrow('Unauthorized');
    });
  });

  describe('unsubscribeFromTask', () => {
    it('should unsubscribe socket from task room', async () => {
      mockSocket.user = mockUser;

      await gateway.unsubscribeFromTask(mockSocket as any, { taskId: 'task-123' });

      expect(mockSocket.leave).toHaveBeenCalledWith('task:task-123');
    });

    it('should handle missing taskId', async () => {
      mockSocket.user = mockUser;

      await expect(gateway.unsubscribeFromTask(mockSocket as any, {})).rejects.toThrow('Task ID is required');
    });
  });

  describe('broadcastTaskEvent', () => {
    it('should broadcast event to task room', () => {
      const taskEvent: TaskEvent = {
        type: TaskEventType.TASK_UPDATED,
        taskId: 'task-123',
        actorId: 'user-123',
        payload: { title: 'Updated Task' },
        timestamp: new Date(),
      };

      gateway.broadcastTaskEvent(taskEvent);

      expect(mockServer.to).toHaveBeenCalledWith('task:task-123');
      expect(mockServer.emit).toHaveBeenCalledWith('task-event', taskEvent);
    });

    it('should log event', () => {
      const loggerSpy = jest.spyOn(gateway['logger'], 'debug');
      const taskEvent: TaskEvent = {
        type: TaskEventType.TASK_CREATED,
        taskId: 'task-123',
        actorId: 'user-123',
        payload: {},
        timestamp: new Date(),
      };

      gateway.broadcastTaskEvent(taskEvent);

      expect(loggerSpy).toHaveBeenCalledWith(
        `Broadcasting task event: ${taskEvent.type} for task ${taskEvent.taskId}`
      );
    });
  });

  describe('notifyTaskUpdate', () => {
    it('should create and broadcast task update event', async () => {
      const taskData = {
        id: 'task-123',
        title: 'Updated Task',
        status: 'in_progress',
      };

      const broadcastSpy = jest.spyOn(gateway, 'broadcastTaskEvent');

      await gateway.notifyTaskUpdate('task-123', taskData, 'user-456');

      expect(broadcastSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: TaskEventType.TASK_UPDATED,
          taskId: 'task-123',
          actorId: 'user-456',
          payload: taskData,
        })
      );

      expect(mockEventsService.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'task.updated',
          actorId: 'user-456',
          entityId: 'task-123',
          entityType: 'task',
          payload: taskData,
        })
      );
    });
  });

  describe('notifyTaskCreated', () => {
    it('should create and broadcast task creation event', async () => {
      const taskData = {
        id: 'task-123',
        title: 'New Task',
        creatorId: 'user-456',
      };

      const broadcastSpy = jest.spyOn(gateway, 'broadcastTaskEvent');

      await gateway.notifyTaskCreated(taskData);

      expect(broadcastSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: TaskEventType.TASK_CREATED,
          taskId: 'task-123',
          actorId: 'user-456',
          payload: taskData,
        })
      );

      expect(mockEventsService.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'task.created',
          actorId: 'user-456',
          entityId: 'task-123',
          entityType: 'task',
          payload: taskData,
        })
      );
    });
  });

  describe('notifyTaskDeleted', () => {
    it('should create and broadcast task deletion event', async () => {
      const broadcastSpy = jest.spyOn(gateway, 'broadcastTaskEvent');

      await gateway.notifyTaskDeleted('task-123', 'user-456');

      expect(broadcastSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: TaskEventType.TASK_DELETED,
          taskId: 'task-123',
          actorId: 'user-456',
          payload: { taskId: 'task-123' },
        })
      );

      expect(mockEventsService.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'task.deleted',
          actorId: 'user-456',
          entityId: 'task-123',
          entityType: 'task',
          payload: { taskId: 'task-123' },
        })
      );
    });
  });

  describe('notifyTaskAssigned', () => {
    it('should create and broadcast task assignment event', async () => {
      const broadcastSpy = jest.spyOn(gateway, 'broadcastTaskEvent');

      await gateway.notifyTaskAssigned('task-123', 'user-456', 'user-789');

      expect(broadcastSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: TaskEventType.TASK_ASSIGNED,
          taskId: 'task-123',
          actorId: 'user-456',
          payload: { taskId: 'task-123', assigneeId: 'user-789' },
        })
      );

      expect(mockEventsService.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'task.assigned',
          actorId: 'user-456',
          entityId: 'task-123',
          entityType: 'task',
          payload: { taskId: 'task-123', assigneeId: 'user-789' },
        })
      );
    });
  });

  describe('getConnectedClients', () => {
    it('should return connected clients count', () => {
      const result = gateway.getConnectedClients();

      expect(result).toBe(1);
    });

    it('should handle empty connections', () => {
      (gateway as any).server.sockets.sockets = new Map();

      const result = gateway.getConnectedClients();

      expect(result).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should handle event logging errors gracefully', async () => {
      mockEventsService.logEvent.mockRejectedValue(new Error('Logging failed'));

      await expect(gateway.notifyTaskCreated({
        id: 'task-123',
        title: 'Test',
        creatorId: 'user-123',
      })).resolves.not.toThrow();
    });

    it('should handle broadcast errors gracefully', async () => {
      mockServer.emit.mockImplementation(() => {
        throw new Error('Broadcast failed');
      });

      // Should not throw
      expect(() => {
        gateway.broadcastTaskEvent({
          type: TaskEventType.TASK_UPDATED,
          taskId: 'task-123',
          actorId: 'user-123',
          payload: {},
          timestamp: new Date(),
        });
      }).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle malformed socket data', async () => {
      const malformedSocket = {
        id: 'socket-123',
        handshake: {
          auth: { token: null },
        },
      };

      await expect(gateway.handleConnection(malformedSocket as any)).rejects.toThrow();
    });

    it('should handle very long task IDs', async () => {
      const longTaskId = 'a'.repeat(1000);
      mockSocket.user = mockUser;

      await gateway.subscribeToTask(mockSocket as any, { taskId: longTaskId });

      expect(mockSocket.join).toHaveBeenCalledWith(`task:${longTaskId}`);
    });

    it('should handle special characters in task IDs', async () => {
      const specialTaskId = 'task-123!@#$%^&*()';
      mockSocket.user = mockUser;

      await gateway.subscribeToTask(mockSocket as any, { taskId: specialTaskId });

      expect(mockSocket.join).toHaveBeenCalledWith(`task:${specialTaskId}`);
    });

    it('should handle concurrent connections', async () => {
      const socket1 = { ...mockSocket, id: 'socket-1' };
      const socket2 = { ...mockSocket, id: 'socket-2' };

      mockJwtService.verifyAsync.mockResolvedValue({ sub: 'user-123' } as JwtPayload);
      mockUserService.findById.mockResolvedValue(mockUser);

      await Promise.all([
        gateway.handleConnection(socket1 as any),
        gateway.handleConnection(socket2 as any),
      ]);

      expect(mockCacheManager.set).toHaveBeenCalledTimes(2);
    });

    it('should handle rapid subscribe/unsubscribe', async () => {
      mockSocket.user = mockUser;

      await Promise.all([
        gateway.subscribeToTask(mockSocket as any, { taskId: 'task-1' }),
        gateway.unsubscribeFromTask(mockSocket as any, { taskId: 'task-1' }),
        gateway.subscribeToTask(mockSocket as any, { taskId: 'task-2' }),
      ]);

      expect(mockSocket.join).toHaveBeenCalledTimes(2);
      expect(mockSocket.leave).toHaveBeenCalledTimes(1);
    });
  });
});
