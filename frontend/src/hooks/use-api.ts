import { useMutation, useQuery, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  User,
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskQueryParams,
  PaginatedResponse,
  TaskStats,
  ApiResponse,
} from '@/types/api';

// Query Keys
export const queryKeys = {
  auth: {
    profile: () => ['auth', 'profile'] as const,
  },
  tasks: {
    all: () => ['tasks'] as const,
    lists: (params?: TaskQueryParams) => ['tasks', 'list', params] as const,
    detail: (id: string) => ['tasks', 'detail', id] as const,
    stats: () => ['tasks', 'stats'] as const,
  },
};

// Auth Hooks
export function useLogin(options?: UseMutationOptions<AuthResponse, Error, LoginRequest>) {
  return useMutation({
    mutationFn: apiClient.login.bind(apiClient),
    ...options,
  });
}

export function useRegister(options?: UseMutationOptions<User, Error, RegisterRequest>) {
  return useMutation({
    mutationFn: apiClient.register.bind(apiClient),
    ...options,
  });
}

export function useLogout(options?: UseMutationOptions<void, Error>) {
  return useMutation({
    mutationFn: apiClient.logout.bind(apiClient),
    ...options,
  });
}

export function useProfile(options?: UseQueryOptions<User>) {
  return useQuery({
    queryKey: queryKeys.auth.profile(),
    queryFn: apiClient.getProfile.bind(apiClient),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

// Task Hooks
export function useTasks(params?: TaskQueryParams, options?: Omit<UseQueryOptions<PaginatedResponse<Task>>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: queryKeys.tasks.lists(params),
    queryFn: () => apiClient.getTasks(params),
    staleTime: 30 * 1000, // 30 seconds
    ...options,
  });
}

export function useTask(id: string, options?: UseQueryOptions<Task>) {
  return useQuery({
    queryKey: queryKeys.tasks.detail(id),
    queryFn: () => apiClient.getTask(id),
    enabled: !!id,
    staleTime: 60 * 1000, // 1 minute
    ...options,
  });
}

export function useTaskStats(options?: UseQueryOptions<TaskStats>) {
  return useQuery({
    queryKey: queryKeys.tasks.stats(),
    queryFn: apiClient.getTaskStats.bind(apiClient),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

export function useCreateTask(options?: UseMutationOptions<Task, Error, CreateTaskRequest>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: apiClient.createTask.bind(apiClient),
    onSuccess: (newTask) => {
      // Invalidate and refetch tasks list
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all() });

      // Update stats
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.stats() });
    },
    ...options,
  });
}

export function useUpdateTask(options?: UseMutationOptions<Task, Error, { id: string; data: UpdateTaskRequest }>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => apiClient.updateTask(id, data),
    onSuccess: (updatedTask, { id }) => {
      // Update the specific task in cache
      queryClient.setQueryData(queryKeys.tasks.detail(id), updatedTask);

      // Invalidate tasks list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all() });

      // Update stats
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.stats() });
    },
    ...options,
  });
}

export function useDeleteTask(options?: UseMutationOptions<void, Error, string>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: apiClient.deleteTask.bind(apiClient),
    onSuccess: (_, taskId) => {
      // Remove the task from cache
      queryClient.removeQueries({ queryKey: queryKeys.tasks.detail(taskId) });

      // Invalidate tasks list
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all() });

      // Update stats
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.stats() });
    },
    ...options,
  });
}

export function useAssignTask(options?: UseMutationOptions<Task, Error, { id: string; assigneeId: string | null }>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, assigneeId }) => apiClient.assignTask(id, assigneeId),
    onSuccess: (updatedTask, { id }) => {
      // Update the specific task in cache
      queryClient.setQueryData(queryKeys.tasks.detail(id), updatedTask);

      // Invalidate tasks list
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all() });
    },
    ...options,
  });
}

// Users hooks
export const usersQueryKeys = {
  all: () => ['users'] as const,
  list: (params?: any) => ['users', 'list', params] as const,
};

export function useUsers(params?: { role?: string; limit?: number }) {
  return useQuery({
    queryKey: usersQueryKeys.list(params),
    queryFn: () => apiClient.get('/users', { params }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Utility hooks
export function useInvalidateTasks() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all() });
  };
}

export function usePrefetchTask(id: string) {
  const queryClient = useQueryClient();

  return () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.tasks.detail(id),
      queryFn: () => apiClient.getTask(id),
      staleTime: 60 * 1000,
    });
  };
}

