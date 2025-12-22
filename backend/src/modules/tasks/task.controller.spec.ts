import { Test, TestingModule } from '@nestjs/testing';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { JwtPermissionsGuard } from '../../guards/jwt-permissions.guard';
import { LoggingInterceptor } from '../../interceptors/logging.interceptor';
import { CreateTaskDto, UpdateTaskDto, TaskQueryDto } from '../../dto/task.dto';
import { Task, TaskStatus, TaskPriority } from '../../entities/task.entity';
import { User, UserRole } from '../../entities/user.entity';

describe('TaskController', () => {
  let controller: TaskController;
  let taskService: TaskService;

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    role: UserRole.USER,
    profile: { firstName: 'Test', lastName: 'User' },
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

  const mockTaskService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    assign: jest.fn(),
    getStats: jest.fn(),
  };

  const mockRequest = {
    user: mockUser,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskController],
      providers: [
        {
          provide: TaskService,
          useValue: mockTaskService,
        },
      ],
    })
      .overrideGuard(JwtPermissionsGuard)
      .useValue({ canActivate: () => true })
      .overrideInterceptor(LoggingInterceptor)
      .useValue({ intercept: jest.fn() })
      .compile();

    controller = module.get<TaskController>(TaskController);
    taskService = module.get<TaskService>(TaskService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new task', async () => {
      const createTaskDto: CreateTaskDto = {
        title: 'New Task',
        description: 'Task description',
        priority: TaskPriority.HIGH,
        dueDate: new Date('2024-12-31'),
      };

      const expectedTask = { ...mockTask, ...createTaskDto };
      mockTaskService.create.mockResolvedValue(expectedTask);

      const result = await controller.create(createTaskDto, mockRequest);

      expect(mockTaskService.create).toHaveBeenCalledWith(createTaskDto, mockUser);
      expect(result).toEqual(expectedTask);
    });

    it('should create task without optional fields', async () => {
      const createTaskDto: CreateTaskDto = {
        title: 'Simple Task',
      };

      const expectedTask = {
        ...mockTask,
        title: 'Simple Task',
        description: undefined,
        priority: TaskPriority.MEDIUM,
        dueDate: undefined,
      };
      mockTaskService.create.mockResolvedValue(expectedTask);

      const result = await controller.create(createTaskDto, mockRequest);

      expect(mockTaskService.create).toHaveBeenCalledWith(createTaskDto, mockUser);
      expect(result).toEqual(expectedTask);
    });

    it('should handle service errors', async () => {
      const createTaskDto: CreateTaskDto = {
        title: 'Task with Error',
      };

      const error = new Error('Service error');
      mockTaskService.create.mockRejectedValue(error);

      await expect(controller.create(createTaskDto, mockRequest)).rejects.toThrow(error);
    });
  });

  describe('findAll', () => {
    it('should return paginated tasks with default parameters', async () => {
      const mockResponse = {
        data: [mockTask],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      };

      mockTaskService.findAll.mockResolvedValue(mockResponse);

      const result = await controller.findAll({}, mockRequest);

      expect(mockTaskService.findAll).toHaveBeenCalledWith(mockUser, {});
      expect(result).toEqual(mockResponse);
    });

    it('should apply query parameters', async () => {
      const query: TaskQueryDto = {
        page: 2,
        limit: 20,
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        search: 'urgent',
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };

      const mockResponse = {
        data: [],
        pagination: {
          page: 2,
          limit: 20,
          total: 0,
          totalPages: 0,
        },
      };

      mockTaskService.findAll.mockResolvedValue(mockResponse);

      const result = await controller.findAll(query, mockRequest);

      expect(mockTaskService.findAll).toHaveBeenCalledWith(mockUser, query);
      expect(result).toEqual(mockResponse);
    });

    it('should handle empty results', async () => {
      const mockResponse = {
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      };

      mockTaskService.findAll.mockResolvedValue(mockResponse);

      const result = await controller.findAll({}, mockRequest);

      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });

    it('should handle large datasets', async () => {
      const largeTaskList = Array.from({ length: 100 }, (_, i) => ({
        ...mockTask,
        id: `task-${i}`,
        title: `Task ${i}`,
      }));

      const mockResponse = {
        data: largeTaskList,
        pagination: {
          page: 1,
          limit: 100,
          total: 100,
          totalPages: 1,
        },
      };

      mockTaskService.findAll.mockResolvedValue(mockResponse);

      const result = await controller.findAll({ limit: 100 }, mockRequest);

      expect(result.data).toHaveLength(100);
      expect(result.pagination.total).toBe(100);
    });
  });

  describe('findOne', () => {
    it('should return a single task', async () => {
      mockTaskService.findOne.mockResolvedValue(mockTask);

      const result = await controller.findOne('task-123', mockRequest);

      expect(mockTaskService.findOne).toHaveBeenCalledWith('task-123', mockUser);
      expect(result).toEqual(mockTask);
    });

    it('should handle different task IDs', async () => {
      const taskId = 'different-task-id';
      mockTaskService.findOne.mockResolvedValue({ ...mockTask, id: taskId });

      const result = await controller.findOne(taskId, mockRequest);

      expect(mockTaskService.findOne).toHaveBeenCalledWith(taskId, mockUser);
      expect(result.id).toBe(taskId);
    });

    it('should handle service not found errors', async () => {
      const error = new Error('Task not found');
      mockTaskService.findOne.mockRejectedValue(error);

      await expect(controller.findOne('non-existent', mockRequest)).rejects.toThrow(error);
    });
  });

  describe('update', () => {
    it('should update a task', async () => {
      const updateTaskDto: UpdateTaskDto = {
        title: 'Updated Task',
        status: TaskStatus.IN_PROGRESS,
        version: 1,
      };

      const updatedTask = { ...mockTask, ...updateTaskDto, version: 2 };
      mockTaskService.update.mockResolvedValue(updatedTask);

      const result = await controller.update('task-123', updateTaskDto, mockRequest);

      expect(mockTaskService.update).toHaveBeenCalledWith('task-123', updateTaskDto, mockUser);
      expect(result).toEqual(updatedTask);
    });

    it('should handle partial updates', async () => {
      const updateTaskDto: UpdateTaskDto = {
        status: TaskStatus.DONE,
        version: 2,
      };

      const updatedTask = { ...mockTask, ...updateTaskDto, version: 3 };
      mockTaskService.update.mockResolvedValue(updatedTask);

      const result = await controller.update('task-123', updateTaskDto, mockRequest);

      expect(mockTaskService.update).toHaveBeenCalledWith('task-123', updateTaskDto, mockUser);
      expect(result.status).toBe(TaskStatus.DONE);
      expect(result.version).toBe(3);
    });

    it('should handle version conflicts', async () => {
      const updateTaskDto: UpdateTaskDto = {
        title: 'Conflicting Update',
        version: 1,
      };

      const error = new Error('Version conflict');
      mockTaskService.update.mockRejectedValue(error);

      await expect(
        controller.update('task-123', updateTaskDto, mockRequest)
      ).rejects.toThrow(error);
    });
  });

  describe('remove', () => {
    it('should delete a task', async () => {
      mockTaskService.remove.mockResolvedValue(undefined);

      const result = await controller.remove('task-123', mockRequest);

      expect(mockTaskService.remove).toHaveBeenCalledWith('task-123', mockUser);
      expect(result).toBeUndefined();
    });

    it('should handle deletion of non-existent tasks', async () => {
      const error = new Error('Task not found');
      mockTaskService.remove.mockRejectedValue(error);

      await expect(controller.remove('non-existent', mockRequest)).rejects.toThrow(error);
    });
  });

  describe('assign', () => {
    it('should assign a task to a user', async () => {
      const assignDto = { assigneeId: 'user-456' };
      const assignedTask = { ...mockTask, assigneeId: 'user-456' };

      mockTaskService.assign.mockResolvedValue(assignedTask);

      const result = await controller.assign('task-123', assignDto, mockRequest);

      expect(mockTaskService.assign).toHaveBeenCalledWith('task-123', 'user-456', mockUser);
      expect(result).toEqual(assignedTask);
    });

    it('should unassign a task', async () => {
      const assignDto = { assigneeId: null };
      const unassignedTask = { ...mockTask, assigneeId: null };

      mockTaskService.assign.mockResolvedValue(unassignedTask);

      const result = await controller.assign('task-123', assignDto, mockRequest);

      expect(mockTaskService.assign).toHaveBeenCalledWith('task-123', null, mockUser);
      expect(result.assigneeId).toBeNull();
    });

    it('should handle assignment permission errors', async () => {
      const assignDto = { assigneeId: 'user-456' };
      const error = new Error('Insufficient permissions');

      mockTaskService.assign.mockRejectedValue(error);

      await expect(
        controller.assign('task-123', assignDto, mockRequest)
      ).rejects.toThrow(error);
    });
  });

  describe('getStats', () => {
    it('should return task statistics', async () => {
      const mockStats = {
        total: 10,
        byStatus: {
          [TaskStatus.TODO]: 3,
          [TaskStatus.IN_PROGRESS]: 4,
          [TaskStatus.REVIEW]: 2,
          [TaskStatus.DONE]: 1,
        },
        byPriority: {
          [TaskPriority.LOW]: 2,
          [TaskPriority.MEDIUM]: 5,
          [TaskPriority.HIGH]: 2,
          [TaskPriority.URGENT]: 1,
        },
        overdue: 2,
      };

      mockTaskService.getStats.mockResolvedValue(mockStats);

      const result = await controller.getStats(mockRequest);

      expect(mockTaskService.getStats).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockStats);
    });

    it('should handle stats calculation errors', async () => {
      const error = new Error('Stats calculation failed');
      mockTaskService.getStats.mockRejectedValue(error);

      await expect(controller.getStats(mockRequest)).rejects.toThrow(error);
    });
  });

  describe('request validation', () => {
    it('should handle malformed create request', async () => {
      const invalidDto = {} as CreateTaskDto;

      const error = new Error('Validation failed');
      mockTaskService.create.mockRejectedValue(error);

      await expect(controller.create(invalidDto, mockRequest)).rejects.toThrow(error);
    });

    it('should handle malformed update request', async () => {
      const invalidDto = { invalidField: 'value' } as UpdateTaskDto;

      const error = new Error('Validation failed');
      mockTaskService.update.mockRejectedValue(error);

      await expect(controller.update('task-123', invalidDto, mockRequest)).rejects.toThrow(error);
    });
  });

  describe('authorization', () => {
    it('should pass user context to service methods', async () => {
      const adminUser = { ...mockUser, role: UserRole.ADMIN };

      mockTaskService.findAll.mockResolvedValue({
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      });

      await controller.findAll({}, { user: adminUser });

      expect(mockTaskService.findAll).toHaveBeenCalledWith(adminUser, {});
    });

    it('should handle different user roles', async () => {
      const managerUser = { ...mockUser, role: UserRole.MANAGER };

      mockTaskService.create.mockResolvedValue(mockTask);

      await controller.create(
        { title: 'Manager Task' },
        { user: managerUser }
      );

      expect(mockTaskService.create).toHaveBeenCalledWith(
        { title: 'Manager Task' },
        managerUser
      );
    });
  });

  describe('edge cases', () => {
    it('should handle very long task IDs', async () => {
      const longTaskId = 'a'.repeat(100);
      mockTaskService.findOne.mockResolvedValue({ ...mockTask, id: longTaskId });

      const result = await controller.findOne(longTaskId, mockRequest);

      expect(result.id).toBe(longTaskId);
    });

    it('should handle tasks with complex data', async () => {
      const complexTask = {
        ...mockTask,
        title: 'Complex Task with émojis 🎉 and spëcial chärs',
        description: 'A very detailed description with\nmultiple lines\nand special chars: !@#$%^&*()',
        dueDate: new Date('2024-12-31T23:59:59.999Z'),
      };

      mockTaskService.findOne.mockResolvedValue(complexTask);

      const result = await controller.findOne('task-123', mockRequest);

      expect(result.title).toContain('émojis 🎉');
      expect(result.description).toContain('spëcial chärs');
    });

    it('should handle concurrent requests', async () => {
      mockTaskService.findOne.mockResolvedValue(mockTask);

      // Simulate concurrent calls
      const promises = [
        controller.findOne('task-1', mockRequest),
        controller.findOne('task-2', mockRequest),
        controller.findOne('task-3', mockRequest),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toEqual(mockTask);
      });
    });

    it('should handle very large payloads', async () => {
      const largeDescription = 'a'.repeat(10000);
      const largeTask = {
        ...mockTask,
        description: largeDescription,
      };

      mockTaskService.create.mockResolvedValue(largeTask);

      const result = await controller.create(
        { title: 'Large Task', description: largeDescription },
        mockRequest
      );

      expect(result.description).toBe(largeDescription);
    });
  });
});
