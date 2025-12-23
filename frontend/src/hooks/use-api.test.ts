import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useLogin,
  useRegister,
  useLogout,
  useProfile,
  useTasks,
  useTask,
  useTaskStats,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useAssignTask,
  useUsers,
  useInvalidateTasks,
  usePrefetchTask,
  queryKeys,
} from './use-api';
import { apiClient } from '@/lib/api-client';
import { TaskStatus, TaskPriority, UserRole } from '@/types';

// Mock API client
jest.mock('@/lib/api-client', () => ({
  apiClient: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    getProfile: jest.fn(),
    getTasks: jest.fn(),
    getTask: jest.fn(),
    createTask: jest.fn(),
    updateTask: jest.fn(),
    deleteTask: jest.fn(),
    assignTask: jest.fn(),
    getTaskStats: jest.fn(),
    get: jest.fn(),
  },
}));

describe('use-api hooks', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: 0,
        },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  describe('Authentication hooks', () => {
    describe('useLogin', () => {
      it('should call apiClient.login with correct parameters', async () => {
        const mockLoginResponse = { accessToken: 'token', tokenType: 'Bearer' };
        (apiClient.login as jest.Mock).mockResolvedValue(mockLoginResponse);

        const { result } = renderHook(() => useLogin(), { wrapper });

        result.current.mutate({
          email: 'test@example.com',
          password: 'password123',
        });

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        expect(apiClient.login).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
        expect(result.current.data).toEqual(mockLoginResponse);
      });

      it('should handle login errors', async () => {
        const error = new Error('Invalid credentials');
        (apiClient.login as jest.Mock).mockRejectedValue(error);

        const { result } = renderHook(() => useLogin(), { wrapper });

        result.current.mutate({
          email: 'test@example.com',
          password: 'wrong-password',
        });

        await waitFor(() => {
          expect(result.current.isError).toBe(true);
        });

        expect(result.current.error).toEqual(error);
      });
    });

    describe('useRegister', () => {
      it('should call apiClient.register with correct parameters', async () => {
        const mockUser = {
          id: 'user-123',
          email: 'new@example.com',
          role: UserRole.USER,
          profile: { firstName: 'New', lastName: 'User' },
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        (apiClient.register as jest.Mock).mockResolvedValue(mockUser);

        const { result } = renderHook(() => useRegister(), { wrapper });

        result.current.mutate({
          email: 'new@example.com',
          password: 'password123',
          profile: { firstName: 'New', lastName: 'User' },
        });

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        expect(apiClient.register).toHaveBeenCalledWith({
          email: 'new@example.com',
          password: 'password123',
          profile: { firstName: 'New', lastName: 'User' },
        });
        expect(result.current.data).toEqual(mockUser);
      });
    });

    describe('useLogout', () => {
      it('should call apiClient.logout', async () => {
        (apiClient.logout as jest.Mock).mockResolvedValue(undefined);

        const { result } = renderHook(() => useLogout(), { wrapper });

        result.current.mutate();

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        expect(apiClient.logout).toHaveBeenCalled();
      });
    });

    describe('useProfile', () => {
      it('should fetch and return user profile', async () => {
        const mockUser = {
          id: 'user-123',
          email: 'test@example.com',
          role: UserRole.USER,
          profile: { firstName: 'Test', lastName: 'User' },
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        (apiClient.getProfile as jest.Mock).mockResolvedValue(mockUser);

        const { result } = renderHook(() => useProfile(), { wrapper });

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        expect(apiClient.getProfile).toHaveBeenCalled();
        expect(result.current.data).toEqual(mockUser);
      });

      it('should use correct query key', () => {
        const { result } = renderHook(() => useProfile(), { wrapper });

        expect(result.current.queryKey).toEqual(queryKeys.auth.profile());
      });
    });
  });

  describe('Task hooks', () => {
    describe('useTasks', () => {
      it('should fetch tasks with default parameters', async () => {
        const mockTasksResponse = {
          data: [
            {
              id: 'task-1',
              title: 'Task 1',
              status: TaskStatus.TODO,
              priority: TaskPriority.MEDIUM,
              creatorId: 'user-123',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          pagination: {
            page: 1,
            limit: 10,
            total: 1,
            totalPages: 1,
          },
        };
        (apiClient.getTasks as jest.Mock).mockResolvedValue(mockTasksResponse);

        const { result } = renderHook(() => useTasks(), { wrapper });

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        expect(apiClient.getTasks).toHaveBeenCalledWith(undefined);
        expect(result.current.data).toEqual(mockTasksResponse);
      });

      it('should fetch tasks with custom parameters', async () => {
        const params = {
          page: 2,
          limit: 20,
          status: TaskStatus.IN_PROGRESS,
          priority: TaskPriority.HIGH,
        };
        const mockTasksResponse = {
          data: [],
          pagination: {
            page: 2,
            limit: 20,
            total: 0,
            totalPages: 0,
          },
        };
        (apiClient.getTasks as jest.Mock).mockResolvedValue(mockTasksResponse);

        const { result } = renderHook(() => useTasks(params), { wrapper });

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        expect(apiClient.getTasks).toHaveBeenCalledWith(params);
        expect(result.current.queryKey).toEqual(queryKeys.tasks.lists(params));
      });

      it('should use correct stale time', () => {
        const { result } = renderHook(() => useTasks(), { wrapper });

        // The staleTime is set to 30 seconds (30000ms)
        expect(result.current.dataUpdatedAt).toBeDefined();
      });
    });

    describe('useTask', () => {
      it('should fetch single task', async () => {
        const mockTask = {
          id: 'task-123',
          title: 'Test Task',
          description: 'Test description',
          status: TaskStatus.TODO,
          priority: TaskPriority.MEDIUM,
          creatorId: 'user-123',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        (apiClient.getTask as jest.Mock).mockResolvedValue(mockTask);

        const { result } = renderHook(() => useTask('task-123'), { wrapper });

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        expect(apiClient.getTask).toHaveBeenCalledWith('task-123');
        expect(result.current.data).toEqual(mockTask);
        expect(result.current.queryKey).toEqual(queryKeys.tasks.detail('task-123'));
      });

      it('should not fetch when id is undefined', () => {
        const { result } = renderHook(() => useTask(undefined as any), { wrapper });

        expect(result.current.isFetching).toBe(false);
        expect(apiClient.getTask).not.toHaveBeenCalled();
      });
    });

    describe('useTaskStats', () => {
      it('should fetch task statistics', async () => {
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
        (apiClient.getTaskStats as jest.Mock).mockResolvedValue(mockStats);

        const { result } = renderHook(() => useTaskStats(), { wrapper });

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        expect(apiClient.getTaskStats).toHaveBeenCalled();
        expect(result.current.data).toEqual(mockStats);
        expect(result.current.queryKey).toEqual(queryKeys.tasks.stats());
      });
    });

    describe('useCreateTask', () => {
      it('should create task and invalidate queries', async () => {
        const newTask = {
          id: 'task-new',
          title: 'New Task',
          description: 'Description',
          status: TaskStatus.TODO,
          priority: TaskPriority.MEDIUM,
          creatorId: 'user-123',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        (apiClient.createTask as jest.Mock).mockResolvedValue(newTask);

        const { result } = renderHook(() => useCreateTask(), { wrapper });

        result.current.mutate({
          title: 'New Task',
          description: 'Description',
          priority: TaskPriority.MEDIUM,
        });

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        expect(apiClient.createTask).toHaveBeenCalledWith({
          title: 'New Task',
          description: 'Description',
          priority: TaskPriority.MEDIUM,
        });
        expect(result.current.data).toEqual(newTask);

        // Check that queries were invalidated
        expect(queryClient.getQueryState(queryKeys.tasks.all())).toBeDefined();
        expect(queryClient.getQueryState(queryKeys.tasks.stats())).toBeDefined();
      });
    });

    describe('useUpdateTask', () => {
      it('should update task and invalidate queries', async () => {
        const updatedTask = {
          id: 'task-123',
          title: 'Updated Task',
          status: TaskStatus.IN_PROGRESS,
          priority: TaskPriority.MEDIUM,
          creatorId: 'user-123',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        (apiClient.updateTask as jest.Mock).mockResolvedValue(updatedTask);

        const { result } = renderHook(() => useUpdateTask(), { wrapper });

        result.current.mutate({
          id: 'task-123',
          data: {
            title: 'Updated Task',
            status: TaskStatus.IN_PROGRESS,
            version: 1,
          },
        });

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        expect(apiClient.updateTask).toHaveBeenCalledWith('task-123', {
          title: 'Updated Task',
          status: TaskStatus.IN_PROGRESS,
          version: 1,
        });
        expect(result.current.data).toEqual(updatedTask);

        // Check that the task detail was optimistically updated
        expect(queryClient.getQueryData(queryKeys.tasks.detail('task-123'))).toEqual(updatedTask);
      });
    });

    describe('useDeleteTask', () => {
      it('should delete task and invalidate queries', async () => {
        (apiClient.deleteTask as jest.Mock).mockResolvedValue(undefined);

        const { result } = renderHook(() => useDeleteTask(), { wrapper });

        result.current.mutate('task-123');

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        expect(apiClient.deleteTask).toHaveBeenCalledWith('task-123');

        // Check that task detail was removed from cache
        expect(queryClient.getQueryData(queryKeys.tasks.detail('task-123'))).toBeUndefined();
      });
    });

    describe('useAssignTask', () => {
      it('should assign task and update cache', async () => {
        const assignedTask = {
          id: 'task-123',
          title: 'Task',
          assigneeId: 'user-456',
          status: TaskStatus.TODO,
          priority: TaskPriority.MEDIUM,
          creatorId: 'user-123',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        (apiClient.assignTask as jest.Mock).mockResolvedValue(assignedTask);

        const { result } = renderHook(() => useAssignTask(), { wrapper });

        result.current.mutate({
          id: 'task-123',
          assigneeId: 'user-456',
        });

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        expect(apiClient.assignTask).toHaveBeenCalledWith('task-123', 'user-456');
        expect(result.current.data).toEqual(assignedTask);

        // Check that task detail was updated in cache
        expect(queryClient.getQueryData(queryKeys.tasks.detail('task-123'))).toEqual(assignedTask);
      });
    });
  });

  describe('Utility hooks', () => {
    describe('useInvalidateTasks', () => {
      it('should return function that invalidates tasks queries', () => {
        const { result } = renderHook(() => useInvalidateTasks(), { wrapper });

        result.current();

        // Check that invalidateQueries was called with correct key
        expect(queryClient.getQueryState(queryKeys.tasks.all())).toBeDefined();
      });
    });

    describe('usePrefetchTask', () => {
      it('should return function that prefetches task', () => {
        const mockTask = {
          id: 'task-123',
          title: 'Test Task',
          status: TaskStatus.TODO,
          priority: TaskPriority.MEDIUM,
          creatorId: 'user-123',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        (apiClient.getTask as jest.Mock).mockResolvedValue(mockTask);

        const { result } = renderHook(() => usePrefetchTask('task-123'), { wrapper });

        result.current();

        expect(apiClient.getTask).toHaveBeenCalledWith('task-123');
      });
    });

    describe('useUsers', () => {
      it('should fetch users with parameters', async () => {
        const mockUsersResponse = {
          data: [
            {
              id: 'user-1',
              email: 'user1@example.com',
              role: UserRole.USER,
              profile: { firstName: 'User', lastName: 'One' },
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          pagination: {
            page: 1,
            limit: 10,
            total: 1,
            totalPages: 1,
          },
        };
        (apiClient.get as jest.Mock).mockResolvedValue(mockUsersResponse);

        const params = { page: 1, limit: 10 };
        const { result } = renderHook(() => useUsers(params), { wrapper });

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        expect(apiClient.get).toHaveBeenCalledWith('/users', { params });
        expect(result.current.data).toEqual(mockUsersResponse);
      });
    });
  });
});

