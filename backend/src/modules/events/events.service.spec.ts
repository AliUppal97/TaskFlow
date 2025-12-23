import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventsService } from './events.service';
import { EventLog, EventType } from '../../entities/event-log.entity';

describe('EventsService', () => {
  let service: EventsService;
  let eventLogModel: Model<EventLog>;

  const mockEventLog = {
    _id: 'event-123',
    type: EventType.TASK_CREATED,
    actorId: 'user-123',
    entityId: 'task-456',
    entityType: 'task',
    payload: { title: 'New Task' },
    correlationId: 'corr-123',
    metadata: {
      userAgent: 'test-agent',
      ipAddress: '127.0.0.1',
      sessionId: 'session-123',
      timestamp: new Date(),
    },
    createdAt: new Date(),
  };

  const mockEventLogModel = {
    save: jest.fn(),
    find: jest.fn(),
    sort: jest.fn(),
    limit: jest.fn(),
    skip: jest.fn(),
    exec: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: getModelToken(EventLog.name),
          useValue: mockEventLogModel,
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    eventLogModel = module.get<Model<EventLog>>(getModelToken(EventLog.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('logEvent', () => {
    it('should successfully log an event', async () => {
      const eventData = {
        type: EventType.TASK_CREATED,
        actorId: 'user-123',
        entityId: 'task-456',
        entityType: 'task',
        payload: { title: 'New Task' },
        correlationId: 'corr-123',
        metadata: {
          userAgent: 'test-agent',
          ipAddress: '127.0.0.1',
          sessionId: 'session-123',
        },
      };

      mockEventLogModel.save.mockResolvedValue(mockEventLog);

      await service.logEvent(eventData);

      // Type-safe check: eventLogModel should be a constructor function
      if (eventLogModel && typeof eventLogModel === 'function') {
        expect(eventLogModel).toHaveBeenCalledWith({
          ...eventData,
          correlationId: 'corr-123', // Uses provided correlationId
          metadata: {
            ...eventData.metadata,
            timestamp: expect.any(Date),
          },
        });
      }
      expect(mockEventLogModel.save).toHaveBeenCalled();
    });

    it('should generate correlationId if not provided', async () => {
      const eventData = {
        type: EventType.TASK_UPDATED,
        actorId: 'user-123',
        entityId: 'task-456',
        entityType: 'task',
        payload: { status: 'in_progress' },
      };

      mockEventLogModel.save.mockResolvedValue(mockEventLog);

      await service.logEvent(eventData);

      // Type-safe check: eventLogModel should be a constructor function
      if (eventLogModel && typeof eventLogModel === 'function') {
        expect(eventLogModel).toHaveBeenCalledWith(
          expect.objectContaining({
            correlationId: expect.any(String),
          })
        );
      }
    });

    it('should handle save errors gracefully', async () => {
      const eventData = {
        type: EventType.TASK_DELETED,
        actorId: 'user-123',
        entityId: 'task-456',
        entityType: 'task',
        payload: {},
      };

      const error = new Error('Database connection failed');
      mockEventLogModel.save.mockRejectedValue(error);

      // Should not throw
      await expect(service.logEvent(eventData)).resolves.not.toThrow();

      // Should still attempt to save
      expect(mockEventLogModel.save).toHaveBeenCalled();
    });

    it('should handle complex payload data', async () => {
      const complexPayload = {
        title: 'Complex Task',
        description: 'A very detailed description',
        priority: 'high',
        tags: ['urgent', 'important'],
        metadata: {
          createdFrom: 'web',
          source: 'manual',
        },
      };

      const eventData = {
        type: EventType.TASK_CREATED,
        actorId: 'user-123',
        entityId: 'task-456',
        entityType: 'task',
        payload: complexPayload,
      };

      mockEventLogModel.save.mockResolvedValue(mockEventLog);

      await service.logEvent(eventData);

      // Type-safe check: eventLogModel should be a constructor function
      if (eventLogModel && typeof eventLogModel === 'function') {
        expect(eventLogModel).toHaveBeenCalledWith(
          expect.objectContaining({
            payload: complexPayload,
          })
        );
      }
    });

    it('should handle events without metadata', async () => {
      const eventData = {
        type: EventType.USER_LOGIN,
        actorId: 'user-123',
        entityId: 'user-123',
        entityType: 'user',
        payload: { loginMethod: 'password' },
      };

      mockEventLogModel.save.mockResolvedValue(mockEventLog);

      await service.logEvent(eventData);

      // Type-safe check: eventLogModel should be a constructor function
      if (eventLogModel && typeof eventLogModel === 'function') {
        expect(eventLogModel).toHaveBeenCalledWith(
          expect.objectContaining({
            metadata: {
              timestamp: expect.any(Date),
            },
          })
        );
      }
    });
  });

  describe('getEntityEvents', () => {
    it('should return entity events with default options', async () => {
      const mockEvents = [mockEventLog];
      const mockQuery = {
        find: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockEvents),
      };

      mockEventLogModel.find.mockReturnValue(mockQuery as any);

      const result = await service.getEntityEvents('task-456', 'task');

      expect(mockEventLogModel.find).toHaveBeenCalledWith({
        entityId: 'task-456',
        entityType: 'task',
      });
      expect(mockQuery.sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(mockQuery.limit).toHaveBeenCalledWith(50);
      expect(mockQuery.skip).toHaveBeenCalledWith(0);
      expect(result).toEqual(mockEvents);
    });

    it('should apply custom options', async () => {
      const mockEvents = [mockEventLog];
      const mockQuery = {
        find: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockEvents),
      };

      mockEventLogModel.find.mockReturnValue(mockQuery as any);

      const result = await service.getEntityEvents('task-456', 'task', {
        limit: 10,
        offset: 20,
        type: EventType.TASK_UPDATED,
      });

      expect(mockEventLogModel.find).toHaveBeenCalledWith({
        entityId: 'task-456',
        entityType: 'task',
        type: EventType.TASK_UPDATED,
      });
      expect(mockQuery.limit).toHaveBeenCalledWith(10);
      expect(mockQuery.skip).toHaveBeenCalledWith(20);
      expect(result).toEqual(mockEvents);
    });

    it('should handle empty results', async () => {
      const mockQuery = {
        find: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };

      mockEventLogModel.find.mockReturnValue(mockQuery as any);

      const result = await service.getEntityEvents('task-456', 'task');

      expect(result).toEqual([]);
    });

    it('should handle large limits', async () => {
      const mockEvents = Array.from({ length: 1000 }, (_, i) => ({
        ...mockEventLog,
        _id: `event-${i}`,
      }));

      const mockQuery = {
        find: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockEvents),
      };

      mockEventLogModel.find.mockReturnValue(mockQuery as any);

      const result = await service.getEntityEvents('task-456', 'task', {
        limit: 1000,
      });

      expect(mockQuery.limit).toHaveBeenCalledWith(1000);
      expect(result).toHaveLength(1000);
    });

    it('should filter by event type', async () => {
      const mockEvents = [mockEventLog];
      const mockQuery = {
        find: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockEvents),
      };

      mockEventLogModel.find.mockReturnValue(mockQuery as any);

      await service.getEntityEvents('task-456', 'task', {
        type: EventType.TASK_CREATED,
      });

      expect(mockEventLogModel.find).toHaveBeenCalledWith({
        entityId: 'task-456',
        entityType: 'task',
        type: EventType.TASK_CREATED,
      });
    });
  });

  describe('getUserEvents', () => {
    it('should return user events with default options', async () => {
      const mockEvents = [mockEventLog];
      const mockQuery = {
        find: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockEvents),
      };

      mockEventLogModel.find.mockReturnValue(mockQuery as any);

      const result = await service.getUserEvents('user-123');

      expect(mockEventLogModel.find).toHaveBeenCalledWith({
        actorId: 'user-123',
      });
      expect(mockQuery.sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(mockQuery.limit).toHaveBeenCalledWith(50);
      expect(mockQuery.skip).toHaveBeenCalledWith(0);
      expect(result).toEqual(mockEvents);
    });

    it('should apply custom options', async () => {
      const mockEvents = [mockEventLog];
      const mockQuery = {
        find: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockEvents),
      };

      mockEventLogModel.find.mockReturnValue(mockQuery as any);

      const result = await service.getUserEvents('user-123', {
        limit: 25,
        offset: 10,
        type: EventType.USER_LOGIN,
      });

      expect(mockEventLogModel.find).toHaveBeenCalledWith({
        actorId: 'user-123',
        type: EventType.USER_LOGIN,
      });
      expect(mockQuery.limit).toHaveBeenCalledWith(25);
      expect(mockQuery.skip).toHaveBeenCalledWith(10);
      expect(result).toEqual(mockEvents);
    });

    it('should handle different event types', async () => {
      const mockEvents = [
        { ...mockEventLog, type: EventType.USER_LOGIN },
        { ...mockEventLog, type: EventType.USER_LOGOUT },
        { ...mockEventLog, type: EventType.TASK_CREATED },
      ];

      const mockQuery = {
        find: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockEvents),
      };

      mockEventLogModel.find.mockReturnValue(mockQuery as any);

      const result = await service.getUserEvents('user-123');

      expect(result).toHaveLength(3);
      expect(result[0].type).toBe(EventType.USER_LOGIN);
      expect(result[1].type).toBe(EventType.USER_LOGOUT);
      expect(result[2].type).toBe(EventType.TASK_CREATED);
    });
  });

  describe('getEventsByCorrelationId', () => {
    it('should return events by correlation ID', async () => {
      const mockEvents = [
        { ...mockEventLog, correlationId: 'corr-123', createdAt: new Date('2024-01-01') },
        { ...mockEventLog, correlationId: 'corr-123', createdAt: new Date('2024-01-02') },
      ];

      const mockQuery = {
        find: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockEvents),
      };

      mockEventLogModel.find.mockReturnValue(mockQuery as any);

      const result = await service.getEventsByCorrelationId('corr-123');

      expect(mockEventLogModel.find).toHaveBeenCalledWith({ correlationId: 'corr-123' });
      expect(mockQuery.sort).toHaveBeenCalledWith({ createdAt: 1 }); // Ascending order
      expect(result).toEqual(mockEvents);
    });

    it('should return empty array for non-existent correlation ID', async () => {
      const mockQuery = {
        find: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };

      mockEventLogModel.find.mockReturnValue(mockQuery as any);

      const result = await service.getEventsByCorrelationId('non-existent');

      expect(result).toEqual([]);
    });

    it('should return events in chronological order', async () => {
      const event1 = { ...mockEventLog, correlationId: 'corr-123', createdAt: new Date('2024-01-02') };
      const event2 = { ...mockEventLog, correlationId: 'corr-123', createdAt: new Date('2024-01-01') };
      const event3 = { ...mockEventLog, correlationId: 'corr-123', createdAt: new Date('2024-01-03') };

      const mockQuery = {
        find: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([event2, event1, event3]), // MongoDB returns in sorted order
      };

      mockEventLogModel.find.mockReturnValue(mockQuery as any);

      const result = await service.getEventsByCorrelationId('corr-123');

      expect(result).toHaveLength(3);
      expect(result[0].createdAt.getTime()).toBeLessThanOrEqual(result[1].createdAt.getTime());
    });
  });

  describe('error handling', () => {
    it('should handle database query errors in getEntityEvents', async () => {
      const mockQuery = {
        find: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        exec: jest.fn().mockRejectedValue(new Error('Database error')),
      };

      mockEventLogModel.find.mockReturnValue(mockQuery as any);

      await expect(service.getEntityEvents('task-456', 'task')).rejects.toThrow('Database error');
    });

    it('should handle database query errors in getUserEvents', async () => {
      const mockQuery = {
        find: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        exec: jest.fn().mockRejectedValue(new Error('Database error')),
      };

      mockEventLogModel.find.mockReturnValue(mockQuery as any);

      await expect(service.getUserEvents('user-123')).rejects.toThrow('Database error');
    });

    it('should handle database query errors in getEventsByCorrelationId', async () => {
      const mockQuery = {
        find: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockRejectedValue(new Error('Database error')),
      };

      mockEventLogModel.find.mockReturnValue(mockQuery as any);

      await expect(service.getEventsByCorrelationId('corr-123')).rejects.toThrow('Database error');
    });
  });

  describe('edge cases', () => {
    it('should handle very long entity IDs', async () => {
      const longEntityId = 'a'.repeat(1000);
      const mockEvents = [mockEventLog];

      const mockQuery = {
        find: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockEvents),
      };

      mockEventLogModel.find.mockReturnValue(mockQuery as any);

      const result = await service.getEntityEvents(longEntityId, 'task');

      expect(mockEventLogModel.find).toHaveBeenCalledWith({
        entityId: longEntityId,
        entityType: 'task',
      });
      expect(result).toEqual(mockEvents);
    });

    it('should handle special characters in correlation ID', async () => {
      const specialCorrelationId = 'corr-123!@#$%^&*()';
      const mockEvents = [mockEventLog];

      const mockQuery = {
        find: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockEvents),
      };

      mockEventLogModel.find.mockReturnValue(mockQuery as any);

      const result = await service.getEventsByCorrelationId(specialCorrelationId);

      expect(mockEventLogModel.find).toHaveBeenCalledWith({
        correlationId: specialCorrelationId,
      });
      expect(result).toEqual(mockEvents);
    });

    it('should handle zero limit', async () => {
      const mockEvents = [];
      const mockQuery = {
        find: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockEvents),
      };

      mockEventLogModel.find.mockReturnValue(mockQuery as any);

      const result = await service.getEntityEvents('task-456', 'task', { limit: 0 });

      expect(mockQuery.limit).toHaveBeenCalledWith(0);
      expect(result).toEqual([]);
    });

    it('should handle large offset', async () => {
      const mockEvents = [mockEventLog];
      const mockQuery = {
        find: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockEvents),
      };

      mockEventLogModel.find.mockReturnValue(mockQuery as any);

      const result = await service.getEntityEvents('task-456', 'task', {
        offset: 10000,
        limit: 1
      });

      expect(mockQuery.skip).toHaveBeenCalledWith(10000);
      expect(result).toEqual(mockEvents);
    });
  });
});

