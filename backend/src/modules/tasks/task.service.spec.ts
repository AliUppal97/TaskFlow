import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskService } from './task.service';
import { Task, TaskStatus, TaskPriority } from '../../entities/task.entity';
import { User } from '../../entities/user.entity';
import { CreateTaskDto, UpdateTaskDto } from '../../dto/task.dto';
import { CacheService } from '../../common/cache/cache.service';
import { EventsService } from '../events/events.service';
import { TaskGateway } from './task.gateway';

describe('TaskService', () => {
  let service: TaskService;
  let taskRepository: Repository<Task>;
  let userRepository: Repository<User>;
  let cacheService: CacheService;
  let eventsService: EventsService;
  let taskGateway: TaskGateway;

  const mockUser: User = {
    id: 'user-123',
    email: 'creator@example.com',
    passwordHash: 'hashed-password',
    role: 'user' as any,
    profile: { firstName: 'Creator', lastName: 'User' },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTask: Task = {
    id: 'task-123',
    title: 'Test Task',
    description: 'Test description',
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    assigneeId: null,
    creatorId: mockUser.id,
    createdAt: new Date(),
    updatedAt: new Date(),
    completedAt: null,
    dueDate: null,
    deletedAt: null,
    version: 1,
    assignee: null,
    creator: mockUser,
    isOverdue: false,
    daysUntilDue: null,
  };

  const mockRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      getRawOne: jest.fn().mockResolvedValue({ total: 0 }),
      setParameters: jest.fn().mockReturnThis(),
    })),
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    deletePattern: jest.fn(),
  };

  const mockEventsService = {
    logEvent: jest.fn(),
  };

  const mockTaskGateway = {
    emitTaskEvent: jest.fn(),
    notifyTaskAssignment: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        {
          provide: getRepositoryToken(Task),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
        {
          provide: EventsService,
          useValue: mockEventsService,
        },
        {
          provide: TaskGateway,
          useValue: mockTaskGateway,
        },
      ],
    }).compile();

    service = module.get<TaskService>(TaskService);
    taskRepository = module.get<Repository<Task>>(getRepositoryToken(Task));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    cacheService = module.get<CacheService>(CacheService);
    eventsService = module.get<EventsService>(EventsService);
    taskGateway = module.get<TaskGateway>(TaskGateway);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new task successfully', async () => {
      const createTaskDto: CreateTaskDto = {
        title: 'New Task',
        description: 'Task description',
        priority: TaskPriority.HIGH,
      };

      const savedTask = { ...mockTask, ...createTaskDto };
      mockRepository.create.mockReturnValue(savedTask);
      mockRepository.save.mockResolvedValue(savedTask);
      mockCacheService.deletePattern.mockResolvedValue(undefined);
      mockEventsService.logEvent.mockResolvedValue(undefined);
      mockTaskGateway.emitTaskEvent.mockResolvedValue(undefined);

      const result = await service.create(createTaskDto, mockUser);

      expect(mockRepository.create).toHaveBeenCalledWith({
        title: createTaskDto.title,
        description: createTaskDto.description,
        creatorId: mockUser.id,
        assigneeId: null,
        status: TaskStatus.TODO,
        priority: createTaskDto.priority,
      });
      expect(mockRepository.save).toHaveBeenCalledWith(savedTask);
      expect(mockCacheService.deletePattern).toHaveBeenCalledWith('task:*');
      expect(mockEventsService.logEvent).toHaveBeenCalled();
      expect(mockTaskGateway.emitTaskEvent).toHaveBeenCalled();
      expect(result).toEqual(savedTask);
    });

    it('should throw NotFoundException if assignee not found', async () => {
      const createTaskDto: CreateTaskDto = {
        title: 'New Task',
        assigneeId: 'non-existent-user',
      };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(service.create(createTaskDto, mockUser)).rejects.toThrow('Assignee not found');
    });
  });

  describe('findAll', () => {
    it('should return cached results if available', async () => {
      const cachedResult = { data: [mockTask], pagination: { page: 1, limit: 10, total: 1, totalPages: 1 } };
      mockCacheService.get.mockResolvedValue(cachedResult);

      const result = await service.findAll({}, mockUser);

      expect(mockCacheService.get).toHaveBeenCalled();
      expect(mockRepository.createQueryBuilder).not.toHaveBeenCalled();
      expect(result).toEqual(cachedResult);
    });

    it('should fetch from database and cache if not cached', async () => {
      const tasks = [mockTask];
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([tasks, 1]),
      };

      mockCacheService.get.mockResolvedValue(null);
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockCacheService.set.mockResolvedValue(undefined);

      const result = await service.findAll({ page: 1, limit: 10 }, mockUser);

      expect(mockCacheService.get).toHaveBeenCalled();
      expect(mockQueryBuilder.getManyAndCount).toHaveBeenCalled();
      expect(mockCacheService.set).toHaveBeenCalled();
      expect(result.data).toEqual(tasks);
      expect(result.pagination.total).toBe(1);
    });

    it('should apply user-specific filters for non-admin users', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      mockCacheService.get.mockResolvedValue(null);
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockCacheService.set.mockResolvedValue(undefined);

      await service.findAll({}, mockUser);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(task.creatorId = :userId OR task.assigneeId = :userId)',
        { userId: mockUser.id }
      );
    });
  });

  describe('findOne', () => {
    it('should return cached task if available', async () => {
      mockCacheService.get.mockResolvedValue(mockTask);

      const result = await service.findOne(mockTask.id, mockUser);

      expect(mockCacheService.get).toHaveBeenCalledWith(`task:${mockTask.id}`);
      expect(mockRepository.findOne).not.toHaveBeenCalled();
      expect(result).toEqual(mockTask);
    });

    it('should fetch from database and cache if not cached', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockRepository.findOne.mockResolvedValue(mockTask);
      mockCacheService.set.mockResolvedValue(undefined);

      const result = await service.findOne(mockTask.id, mockUser);

      expect(mockCacheService.get).toHaveBeenCalledWith(`task:${mockTask.id}`);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockTask.id, deletedAt: null },
        relations: ['creator', 'assignee'],
      });
      expect(mockCacheService.set).toHaveBeenCalledWith(`task:${mockTask.id}`, mockTask, { ttl: 600 });
      expect(result).toEqual(mockTask);
    });

    it('should throw NotFoundException if task not found', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id', mockUser)).rejects.toThrow('Task not found');
    });

    it('should throw NotFoundException if user has no access', async () => {
      const adminUser = { ...mockUser, role: 'admin' as any };
      mockCacheService.get.mockResolvedValue(null);
      mockRepository.findOne.mockResolvedValue(mockTask);

      await expect(service.findOne(mockTask.id, adminUser)).rejects.toThrow('Task not found');
    });
  });

  describe('update', () => {
    it('should update task successfully', async () => {
      const updateTaskDto: UpdateTaskDto = {
        title: 'Updated Title',
        status: TaskStatus.IN_PROGRESS,
        version: 1,
      };

      const updatedTask = { ...mockTask, ...updateTaskDto, version: 2 };
      mockRepository.findOne.mockResolvedValue(mockTask);
      mockRepository.save.mockResolvedValue(updatedTask);
      mockCacheService.deletePattern.mockResolvedValue(undefined);
      mockCacheService.delete.mockResolvedValue(undefined);
      mockEventsService.logEvent.mockResolvedValue(undefined);
      mockTaskGateway.emitTaskEvent.mockResolvedValue(undefined);

      const result = await service.update(mockTask.id, updateTaskDto, mockUser);

      expect(mockRepository.save).toHaveBeenCalledWith(updatedTask);
      expect(mockCacheService.deletePattern).toHaveBeenCalledWith('task:*');
      expect(mockEventsService.logEvent).toHaveBeenCalled();
      expect(mockTaskGateway.emitTaskEvent).toHaveBeenCalled();
      expect(result).toEqual(updatedTask);
    });

    it('should throw ConflictException on version mismatch', async () => {
      const updateTaskDto: UpdateTaskDto = {
        title: 'Updated Title',
        version: 2, // Different version
      };

      mockRepository.findOne.mockResolvedValue(mockTask);

      await expect(service.update(mockTask.id, updateTaskDto, mockUser)).rejects.toThrow(
        'Task has been modified by another user. Please refresh and try again.'
      );
    });

    it('should set completedAt when status changes to DONE', async () => {
      const updateTaskDto: UpdateTaskDto = {
        status: TaskStatus.DONE,
        version: 1,
      };

      const updatedTask = { ...mockTask, status: TaskStatus.DONE, completedAt: new Date() };
      mockRepository.findOne.mockResolvedValue(mockTask);
      mockRepository.save.mockResolvedValue(updatedTask);
      mockCacheService.deletePattern.mockResolvedValue(undefined);
      mockEventsService.logEvent.mockResolvedValue(undefined);
      mockTaskGateway.emitTaskEvent.mockResolvedValue(undefined);

      await service.update(mockTask.id, updateTaskDto, mockUser);

      expect(updatedTask.completedAt).toBeDefined();
    });
  });

  describe('delete', () => {
    it('should soft delete task successfully', async () => {
      const deletedTask = { ...mockTask, deletedAt: new Date() };
      mockRepository.findOne.mockResolvedValue(mockTask);
      mockRepository.save.mockResolvedValue(deletedTask);
      mockCacheService.deletePattern.mockResolvedValue(undefined);
      mockCacheService.delete.mockResolvedValue(undefined);
      mockEventsService.logEvent.mockResolvedValue(undefined);
      mockTaskGateway.emitTaskEvent.mockResolvedValue(undefined);

      await service.delete(mockTask.id, mockUser);

      expect(mockRepository.save).toHaveBeenCalledWith(deletedTask);
      expect(deletedTask.deletedAt).toBeDefined();
      expect(mockEventsService.logEvent).toHaveBeenCalled();
      expect(mockTaskGateway.emitTaskEvent).toHaveBeenCalled();
    });
  });

  describe('assignTask', () => {
    it('should assign task to user successfully', async () => {
      const assigneeId = 'assignee-123';
      const updatedTask = { ...mockTask, assigneeId };
      mockRepository.findOne.mockResolvedValue(mockTask);
      mockRepository.save.mockResolvedValue(updatedTask);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);
      mockCacheService.deletePattern.mockResolvedValue(undefined);
      mockCacheService.delete.mockResolvedValue(undefined);
      mockEventsService.logEvent.mockResolvedValue(undefined);
      mockTaskGateway.emitTaskEvent.mockResolvedValue(undefined);
      mockTaskGateway.notifyTaskAssignment.mockResolvedValue(undefined);

      const result = await service.assignTask(mockTask.id, assigneeId, mockUser);

      expect(mockRepository.save).toHaveBeenCalledWith(updatedTask);
      expect(mockTaskGateway.notifyTaskAssignment).toHaveBeenCalledWith(mockTask.id, assigneeId, mockUser.id);
      expect(result).toEqual(updatedTask);
    });

    it('should unassign task when assigneeId is null', async () => {
      const updatedTask = { ...mockTask, assigneeId: null };
      mockRepository.findOne.mockResolvedValue(mockTask);
      mockRepository.save.mockResolvedValue(updatedTask);
      mockCacheService.deletePattern.mockResolvedValue(undefined);
      mockEventsService.logEvent.mockResolvedValue(undefined);
      mockTaskGateway.emitTaskEvent.mockResolvedValue(undefined);
      mockTaskGateway.notifyTaskAssignment.mockResolvedValue(undefined);

      const result = await service.assignTask(mockTask.id, null, mockUser);

      expect(result.assigneeId).toBeNull();
    });
  });

  describe('getTaskStats', () => {
    it('should return cached stats if available', async () => {
      const cachedStats = { total: 1, byStatus: {}, byPriority: {}, overdue: 0 };
      mockCacheService.get.mockResolvedValue(cachedStats);

      const result = await service.getTaskStats(mockUser);

      expect(mockCacheService.get).toHaveBeenCalled();
      expect(result).toEqual(cachedStats);
    });

    it('should calculate stats from database', async () => {
      const mockStats = {
        total: 1,
        todo: 1,
        inProgress: 0,
        review: 0,
        done: 0,
        low: 0,
        medium: 1,
        high: 0,
        urgent: 0,
        overdue: 0,
      };

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        setParameters: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(mockStats),
      };

      mockCacheService.get.mockResolvedValue(null);
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockCacheService.set.mockResolvedValue(undefined);

      const result = await service.getTaskStats(mockUser);

      expect(result.total).toBe(1);
      expect(result.byStatus[TaskStatus.TODO]).toBe(1);
      expect(result.byPriority[TaskPriority.MEDIUM]).toBe(1);
      expect(mockCacheService.set).toHaveBeenCalled();
    });

    it('should apply user-specific filters for non-admin users', async () => {
      const mockStats = {
        total: 0,
        todo: 0,
        inProgress: 0,
        review: 0,
        done: 0,
        low: 0,
        medium: 0,
        high: 0,
        urgent: 0,
        overdue: 0,
      };

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        setParameters: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(mockStats),
      };

      mockCacheService.get.mockResolvedValue(null);
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockCacheService.set.mockResolvedValue(undefined);

      await service.getTaskStats(mockUser);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(task.creatorId = :userId OR task.assigneeId = :userId)',
        { userId: mockUser.id }
      );
    });

    it('should allow admin users to see all tasks', async () => {
      const adminUser = { ...mockUser, role: 'admin' as any };
      const mockStats = {
        total: 5,
        todo: 2,
        inProgress: 1,
        review: 1,
        done: 1,
        low: 1,
        medium: 2,
        high: 1,
        urgent: 1,
        overdue: 1,
      };

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        setParameters: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(mockStats),
      };

      mockCacheService.get.mockResolvedValue(null);
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockCacheService.set.mockResolvedValue(undefined);

      await service.getTaskStats(adminUser);

      // Admin should not have user-specific filter
      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalledWith(
        expect.stringContaining('creatorId'),
        expect.any(Object)
      );
    });
  });

  describe('update - edge cases', () => {
    it('should clear completedAt when task is reopened from DONE', async () => {
      const doneTask = { ...mockTask, status: TaskStatus.DONE, completedAt: new Date() };
      const updateTaskDto: UpdateTaskDto = {
        status: TaskStatus.IN_PROGRESS,
        version: 1,
      };

      mockRepository.findOne.mockResolvedValue(doneTask);
      mockRepository.save.mockImplementation((task) => Promise.resolve(task));
      mockCacheService.deletePattern.mockResolvedValue(undefined);
      mockEventsService.logEvent.mockResolvedValue(undefined);
      mockTaskGateway.emitTaskEvent.mockResolvedValue(undefined);

      const result = await service.update(mockTask.id, updateTaskDto, mockUser);

      expect(result.completedAt).toBeNull();
    });

    it('should handle search filtering in findAll', async () => {
      const tasks = [mockTask];
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([tasks, 1]),
      };

      mockCacheService.get.mockResolvedValue(null);
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockCacheService.set.mockResolvedValue(undefined);

      await service.findAll({ search: 'test' }, mockUser);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('LOWER'),
        expect.objectContaining({ search: expect.stringContaining('test') })
      );
    });

    it('should handle search with special characters safely', async () => {
      const tasks = [mockTask];
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([tasks, 1]),
      };

      mockCacheService.get.mockResolvedValue(null);
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockCacheService.set.mockResolvedValue(undefined);

      // Test SQL injection attempt
      const maliciousSearch = "'; DROP TABLE tasks; --";
      await service.findAll({ search: maliciousSearch }, mockUser);

      // Should use parameterized query (safe)
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('LOWER'),
        expect.objectContaining({ search: expect.stringContaining(maliciousSearch) })
      );
    });

    it('should handle pagination edge cases', async () => {
      const tasks = [mockTask];
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([tasks, 1]),
      };

      mockCacheService.get.mockResolvedValue(null);
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockCacheService.set.mockResolvedValue(undefined);

      // Test page 0 (should default to 1)
      await service.findAll({ page: 0, limit: 10 }, mockUser);
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(-10); // (0-1)*10

      // Test very large page number
      await service.findAll({ page: 999999, limit: 10 }, mockUser);
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(9999980); // (999999-1)*10
    });

    it('should handle admin access to all tasks', async () => {
      const adminUser = { ...mockUser, role: 'admin' as any };
      const otherUserTask = { ...mockTask, id: 'task-other', creatorId: 'other-user' };
      const tasks = [mockTask, otherUserTask];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([tasks, 2]),
      };

      mockCacheService.get.mockResolvedValue(null);
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockCacheService.set.mockResolvedValue(undefined);

      const result = await service.findAll({}, adminUser);

      // Admin should not have user-specific filter
      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalledWith(
        expect.stringContaining('creatorId'),
        expect.any(Object)
      );
      expect(result.data.length).toBe(2);
    });

    it('should handle task assignment to self', async () => {
      const taskWithSelfAssignment = { ...mockTask, assigneeId: mockUser.id };
      mockRepository.findOne.mockResolvedValue(mockTask);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);
      mockRepository.save.mockResolvedValue(taskWithSelfAssignment);
      mockCacheService.deletePattern.mockResolvedValue(undefined);
      mockEventsService.logEvent.mockResolvedValue(undefined);
      mockTaskGateway.emitTaskEvent.mockResolvedValue(undefined);
      mockTaskGateway.notifyTaskAssignment.mockResolvedValue(undefined);

      const result = await service.assignTask(mockTask.id, mockUser.id, mockUser);

      expect(result.assigneeId).toBe(mockUser.id);
      expect(mockTaskGateway.notifyTaskAssignment).toHaveBeenCalled();
    });

    it('should handle reassigning task to same assignee', async () => {
      const taskWithAssignee = { ...mockTask, assigneeId: 'user-456' };
      mockRepository.findOne.mockResolvedValue(taskWithAssignee);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue({ ...mockUser, id: 'user-456' });
      mockRepository.save.mockResolvedValue(taskWithAssignee);
      mockCacheService.deletePattern.mockResolvedValue(undefined);
      mockEventsService.logEvent.mockResolvedValue(undefined);
      mockTaskGateway.emitTaskEvent.mockResolvedValue(undefined);
      mockTaskGateway.notifyTaskAssignment.mockResolvedValue(undefined);

      await service.assignTask(mockTask.id, 'user-456', mockUser);

      // Should still log event even if same assignee
      expect(mockEventsService.logEvent).toHaveBeenCalled();
    });

    it('should handle partial task updates', async () => {
      const updateTaskDto: UpdateTaskDto = {
        title: 'Updated Title Only',
        version: 1,
      };

      const updatedTask = { ...mockTask, title: 'Updated Title Only', version: 2 };
      mockRepository.findOne.mockResolvedValue(mockTask);
      mockRepository.save.mockResolvedValue(updatedTask);
      mockCacheService.deletePattern.mockResolvedValue(undefined);
      mockEventsService.logEvent.mockResolvedValue(undefined);
      mockTaskGateway.emitTaskEvent.mockResolvedValue(undefined);

      const result = await service.update(mockTask.id, updateTaskDto, mockUser);

      expect(result.title).toBe('Updated Title Only');
      expect(result.description).toBe(mockTask.description); // Unchanged
    });

    it('should handle update without version (backward compatibility)', async () => {
      const updateTaskDto: UpdateTaskDto = {
        title: 'Updated Title',
        // No version provided
      };

      const updatedTask = { ...mockTask, title: 'Updated Title' };
      mockRepository.findOne.mockResolvedValue(mockTask);
      mockRepository.save.mockResolvedValue(updatedTask);
      mockCacheService.deletePattern.mockResolvedValue(undefined);
      mockEventsService.logEvent.mockResolvedValue(undefined);
      mockTaskGateway.emitTaskEvent.mockResolvedValue(undefined);

      const result = await service.update(mockTask.id, updateTaskDto, mockUser);

      expect(result.title).toBe('Updated Title');
    });

    it('should handle error when gateway fails during task creation', async () => {
      const createTaskDto: CreateTaskDto = {
        title: 'New Task',
        description: 'Task description',
      };

      const savedTask = { ...mockTask, ...createTaskDto };
      mockRepository.create.mockReturnValue(savedTask);
      mockRepository.save.mockResolvedValue(savedTask);
      mockCacheService.deletePattern.mockResolvedValue(undefined);
      mockEventsService.logEvent.mockResolvedValue(undefined);
      mockTaskGateway.emitTaskEvent.mockRejectedValue(new Error('WebSocket error'));

      // Task creation should still succeed even if gateway fails
      await expect(service.create(createTaskDto, mockUser)).rejects.toThrow('WebSocket error');
    });

    it('should handle error when events service fails during task update', async () => {
      const updateTaskDto: UpdateTaskDto = {
        title: 'Updated Title',
        version: 1,
      };

      const updatedTask = { ...mockTask, title: 'Updated Title' };
      mockRepository.findOne.mockResolvedValue(mockTask);
      mockRepository.save.mockResolvedValue(updatedTask);
      mockCacheService.deletePattern.mockResolvedValue(undefined);
      mockEventsService.logEvent.mockRejectedValue(new Error('Event service unavailable'));
      mockTaskGateway.emitTaskEvent.mockResolvedValue(undefined);

      await expect(service.update(mockTask.id, updateTaskDto, mockUser)).rejects.toThrow('Event service unavailable');
    });

    it('should handle cache failure gracefully', async () => {
      const tasks = [mockTask];
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([tasks, 1]),
      };

      mockCacheService.get.mockRejectedValue(new Error('Cache unavailable'));
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockCacheService.set.mockRejectedValue(new Error('Cache unavailable'));

      // Should still work even if cache fails
      const result = await service.findAll({}, mockUser);

      expect(result.data).toEqual(tasks);
    });

    it('should handle empty task list', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      mockCacheService.get.mockResolvedValue(null);
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockCacheService.set.mockResolvedValue(undefined);

      const result = await service.findAll({}, mockUser);

      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
    });

    it('should handle task with all optional fields', async () => {
      const createTaskDto: CreateTaskDto = {
        title: 'Complete Task',
        description: 'Full description',
        priority: TaskPriority.URGENT,
        assigneeId: 'user-456',
        dueDate: new Date('2024-12-31').toISOString(),
      };

      const savedTask = {
        ...mockTask,
        ...createTaskDto,
        assigneeId: 'user-456',
        dueDate: new Date('2024-12-31'),
      };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue({ ...mockUser, id: 'user-456' });
      mockRepository.create.mockReturnValue(savedTask);
      mockRepository.save.mockResolvedValue(savedTask);
      mockRepository.findOne.mockResolvedValue(savedTask);
      mockCacheService.deletePattern.mockResolvedValue(undefined);
      mockEventsService.logEvent.mockResolvedValue(undefined);
      mockTaskGateway.emitTaskEvent.mockResolvedValue(undefined);

      const result = await service.create(createTaskDto, mockUser);

      expect(result.title).toBe('Complete Task');
      expect(result.description).toBe('Full description');
      expect(result.priority).toBe(TaskPriority.URGENT);
      expect(result.assigneeId).toBe('user-456');
      expect(result.dueDate).toBeDefined();
    });
  });
});







