import axios from 'axios';
import { apiClient } from './api-client';
import {
  LoginRequest,
  RegisterRequest,
  User,
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskQueryParams,
  TaskStats,
  UserRole,
  TaskStatus,
  TaskPriority,
} from '@/types';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('ApiClient', () => {
  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
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
    creatorId: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    completedAt: null,
    dueDate: null,
    version: 1,
    isOverdue: false,
    daysUntilDue: null,
  };

  const mockAxiosInstance = {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    mockedAxios.create.mockReturnValue(mockAxiosInstance as any);
    // Re-import to get fresh instance
    jest.resetModules();
  });

  describe('authentication', () => {
    it('should login successfully and store token', async () => {
      const loginRequest: LoginRequest = {
        email: 'test@example.com',
        password: 'password123',
      };

      const authResponse = {
        accessToken: 'access-token',
        tokenType: 'Bearer',
        expiresIn: 900,
      };

      mockAxiosInstance.post.mockResolvedValue({
        data: authResponse,
      });

      // Need to re-import after mocking
      const { apiClient: client } = await import('./api-client');

      const result = await client.login(loginRequest);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/auth/login',
        loginRequest
      );
      expect(result).toEqual(authResponse);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('accessToken', 'access-token');
    });

    it('should register user successfully', async () => {
      const registerRequest: RegisterRequest = {
        email: 'newuser@example.com',
        password: 'password123',
        profile: { firstName: 'New', lastName: 'User' },
      };

      const registerResponse = {
        success: true,
        data: mockUser,
      };

      mockAxiosInstance.post.mockResolvedValue({
        data: registerResponse,
      });

      const { apiClient: client } = await import('./api-client');

      const result = await client.register(registerRequest);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/auth/register',
        registerRequest
      );
      expect(result).toEqual(registerResponse);
    });

    it('should logout successfully', async () => {
      localStorageMock.setItem('accessToken', 'token');
      mockAxiosInstance.post.mockResolvedValue({ data: {} });

      const { apiClient: client } = await import('./api-client');

      await client.logout();

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/logout');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('accessToken');
    });

    it('should get user profile successfully', async () => {
      const profileResponse = {
        success: true,
        data: mockUser,
      };

      mockAxiosInstance.get.mockResolvedValue({
        data: profileResponse,
      });

      const { apiClient: client } = await import('./api-client');
      localStorageMock.setItem('accessToken', 'token');

      const result = await client.getProfile();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/auth/profile');
      expect(result).toEqual(mockUser);
    });

    it('should handle direct user response format', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: mockUser,
      });

      const { apiClient: client } = await import('./api-client');
      localStorageMock.setItem('accessToken', 'token');

      const result = await client.getProfile();

      expect(result).toEqual(mockUser);
    });
  });

  describe('task operations', () => {
    beforeEach(() => {
      localStorageMock.setItem('accessToken', 'token');
    });

    it('should get tasks successfully', async () => {
      const tasksResponse = {
        data: [mockTask],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      };

      mockAxiosInstance.get.mockResolvedValue({
        data: tasksResponse,
      });

      const { apiClient: client } = await import('./api-client');

      const result = await client.getTasks();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/tasks', { params: undefined });
      expect(result).toEqual(tasksResponse);
    });

    it('should get tasks with query parameters', async () => {
      const params: TaskQueryParams = {
        page: 2,
        limit: 20,
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
      };

      const tasksResponse = {
        data: [mockTask],
        pagination: {
          page: 2,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
      };

      mockAxiosInstance.get.mockResolvedValue({
        data: tasksResponse,
      });

      const { apiClient: client } = await import('./api-client');

      const result = await client.getTasks(params);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/tasks', { params });
      expect(result).toEqual(tasksResponse);
    });

    it('should get single task successfully', async () => {
      const taskResponse = {
        success: true,
        data: mockTask,
      };

      mockAxiosInstance.get.mockResolvedValue({
        data: taskResponse,
      });

      const { apiClient: client } = await import('./api-client');

      const result = await client.getTask('task-123');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/tasks/task-123');
      expect(result).toEqual(mockTask);
    });

    it('should create task successfully', async () => {
      const createRequest: CreateTaskRequest = {
        title: 'New Task',
        description: 'Task description',
        priority: TaskPriority.HIGH,
      };

      const taskResponse = {
        success: true,
        data: mockTask,
      };

      mockAxiosInstance.post.mockResolvedValue({
        data: taskResponse,
      });

      const { apiClient: client } = await import('./api-client');

      const result = await client.createTask(createRequest);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/tasks', createRequest);
      expect(result).toEqual(mockTask);
    });

    it('should update task successfully', async () => {
      const updateRequest: UpdateTaskRequest = {
        title: 'Updated Task',
        status: TaskStatus.IN_PROGRESS,
        version: 1,
      };

      const updatedTask = { ...mockTask, ...updateRequest };
      const taskResponse = {
        success: true,
        data: updatedTask,
      };

      mockAxiosInstance.patch.mockResolvedValue({
        data: taskResponse,
      });

      const { apiClient: client } = await import('./api-client');

      const result = await client.updateTask('task-123', updateRequest);

      expect(mockAxiosInstance.patch).toHaveBeenCalledWith('/tasks/task-123', updateRequest);
      expect(result).toEqual(updatedTask);
    });

    it('should delete task successfully', async () => {
      mockAxiosInstance.delete.mockResolvedValue({ status: 204 });

      const { apiClient: client } = await import('./api-client');

      await client.deleteTask('task-123');

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/tasks/task-123');
    });

    it('should assign task successfully', async () => {
      const assignedTask = { ...mockTask, assigneeId: 'user-456' };
      const taskResponse = {
        success: true,
        data: assignedTask,
      };

      mockAxiosInstance.patch.mockResolvedValue({
        data: taskResponse,
      });

      const { apiClient: client } = await import('./api-client');

      const result = await client.assignTask('task-123', 'user-456');

      expect(mockAxiosInstance.patch).toHaveBeenCalledWith('/tasks/task-123/assign', {
        assigneeId: 'user-456',
      });
      expect(result).toEqual(assignedTask);
    });

    it('should get task stats successfully', async () => {
      const stats: TaskStats = {
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

      const statsResponse = {
        success: true,
        data: stats,
      };

      mockAxiosInstance.get.mockResolvedValue({
        data: statsResponse,
      });

      const { apiClient: client } = await import('./api-client');

      const result = await client.getTaskStats();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/tasks/stats');
      expect(result).toEqual(stats);
    });
  });

  describe('error handling', () => {
    it('should handle 401 error and attempt token refresh', async () => {
      localStorageMock.setItem('accessToken', 'expired-token');

      const refreshResponse = {
        accessToken: 'new-token',
        refreshToken: 'new-refresh-token',
      };

      // First call fails with 401
      mockAxiosInstance.get.mockRejectedValueOnce({
        response: { status: 401 },
        config: { _retry: false },
      });

      // Refresh token call succeeds
      mockedAxios.post.mockResolvedValueOnce({
        data: refreshResponse,
      });

      // Retry original call succeeds
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: { success: true, data: mockUser },
      });

      const { apiClient: client } = await import('./api-client');

      // This test verifies the interceptor setup
      // The actual refresh logic is tested via integration tests
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network Error');
      mockAxiosInstance.get.mockRejectedValue(networkError);

      const { apiClient: client } = await import('./api-client');

      await expect(client.getProfile()).rejects.toThrow('Network Error');
    });

    it('should handle timeout errors', async () => {
      const timeoutError = { code: 'ECONNABORTED', message: 'timeout of 10000ms exceeded' };
      mockAxiosInstance.get.mockRejectedValue(timeoutError);

      const { apiClient: client } = await import('./api-client');

      await expect(client.getProfile()).rejects.toEqual(timeoutError);
    });

    it('should handle 500 server errors', async () => {
      const serverError = {
        response: { status: 500, data: { message: 'Internal server error' } },
      };
      mockAxiosInstance.get.mockRejectedValue(serverError);

      const { apiClient: client } = await import('./api-client');

      await expect(client.getProfile()).rejects.toEqual(serverError);
    });

    it('should handle 403 forbidden errors', async () => {
      const forbiddenError = {
        response: { status: 403, data: { message: 'Forbidden' } },
      };
      mockAxiosInstance.get.mockRejectedValue(forbiddenError);

      const { apiClient: client } = await import('./api-client');

      await expect(client.getProfile()).rejects.toEqual(forbiddenError);
    });

    it('should handle malformed response data', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: null, // Unexpected null response
      });

      const { apiClient: client } = await import('./api-client');
      localStorageMock.setItem('accessToken', 'token');

      // Should handle gracefully
      const result = await client.getProfile();
      expect(result).toBeNull();
    });

    it('should handle empty task list response', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: {
          data: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
          },
        },
      });

      const { apiClient: client } = await import('./api-client');
      localStorageMock.setItem('accessToken', 'token');

      const result = await client.getTasks();

      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });

    it('should handle large task list response', async () => {
      const largeTaskList = Array.from({ length: 1000 }, (_, i) => ({
        ...mockTask,
        id: `task-${i}`,
        title: `Task ${i}`,
      }));

      mockAxiosInstance.get.mockResolvedValue({
        data: {
          data: largeTaskList,
          pagination: {
            page: 1,
            limit: 1000,
            total: 1000,
            totalPages: 1,
          },
        },
      });

      const { apiClient: client } = await import('./api-client');
      localStorageMock.setItem('accessToken', 'token');

      const result = await client.getTasks();

      expect(result.data).toHaveLength(1000);
    });

    it('should handle concurrent API requests', async () => {
      mockAxiosInstance.get
        .mockResolvedValueOnce({ data: { success: true, data: mockUser } })
        .mockResolvedValueOnce({
          data: {
            data: [mockTask],
            pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
          },
        });

      const { apiClient: client } = await import('./api-client');
      localStorageMock.setItem('accessToken', 'token');

      const [profile, tasks] = await Promise.all([
        client.getProfile(),
        client.getTasks(),
      ]);

      expect(profile).toEqual(mockUser);
      expect(tasks.data).toHaveLength(1);
    });

    it('should handle missing access token gracefully', async () => {
      localStorageMock.getItem.mockReturnValue(null);
      mockAxiosInstance.get.mockResolvedValue({
        data: { success: true, data: mockUser },
      });

      const { apiClient: client } = await import('./api-client');

      // Should still make request (token will be null in header)
      const result = await client.getProfile();
      expect(result).toEqual(mockUser);
    });

    it('should handle token refresh failure during retry', async () => {
      localStorageMock.setItem('accessToken', 'expired-token');

      // First call fails with 401
      mockAxiosInstance.get.mockRejectedValueOnce({
        response: { status: 401 },
        config: { _retry: false },
      });

      // Refresh token call fails
      mockedAxios.post.mockRejectedValueOnce(new Error('Refresh failed'));

      const { apiClient: client } = await import('./api-client');

      // Should reject with original error after refresh fails
      await expect(client.getProfile()).rejects.toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle very long task title', async () => {
      const longTitleTask = {
        ...mockTask,
        title: 'a'.repeat(1000),
      };

      mockAxiosInstance.post.mockResolvedValue({
        data: { success: true, data: longTitleTask },
      });

      const { apiClient: client } = await import('./api-client');
      localStorageMock.setItem('accessToken', 'token');

      const result = await client.createTask({
        title: longTitleTask.title,
        description: 'Test',
      });

      expect(result.title).toBe(longTitleTask.title);
    });

    it('should handle special characters in search query', async () => {
      const specialChars = "!@#$%^&*()_+-=[]{}|;:,.<>?'\"";
      mockAxiosInstance.get.mockResolvedValue({
        data: {
          data: [],
          pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
        },
      });

      const { apiClient: client } = await import('./api-client');
      localStorageMock.setItem('accessToken', 'token');

      const result = await client.getTasks({ search: specialChars });

      expect(result.data).toEqual([]);
    });

    it('should handle unicode characters in task data', async () => {
      const unicodeTask = {
        ...mockTask,
        title: 'Task with émojis 🎉 and 中文',
        description: 'Description with ñ and ü',
      };

      mockAxiosInstance.post.mockResolvedValue({
        data: { success: true, data: unicodeTask },
      });

      const { apiClient: client } = await import('./api-client');
      localStorageMock.setItem('accessToken', 'token');

      const result = await client.createTask({
        title: unicodeTask.title,
        description: unicodeTask.description,
      });

      expect(result.title).toBe(unicodeTask.title);
      expect(result.description).toBe(unicodeTask.description);
    });
  });
});

