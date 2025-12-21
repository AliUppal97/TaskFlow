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
  UserQueryParams,
} from '@/types';

/**
 * React Query key factory
 * 
 * Centralized query key management for cache invalidation
 * 
 * Structure:
 * - Hierarchical keys for related queries
 * - Parameters included in keys for proper cache differentiation
 * - Type-safe with 'as const' for TypeScript inference
 * 
 * Benefits:
 * - Easy cache invalidation (invalidate all tasks: queryKeys.tasks.all())
 * - Prevents cache key typos
 * - Type-safe query key usage
 */
export const queryKeys = {
  auth: {
    profile: () => ['auth', 'profile'] as const,
  },
  tasks: {
    all: () => ['tasks'] as const, // Parent key for all task queries
    lists: (params?: TaskQueryParams) => ['tasks', 'list', params] as const, // Task list with filters
    detail: (id: string) => ['tasks', 'detail', id] as const, // Single task detail
    stats: () => ['tasks', 'stats'] as const, // Task statistics
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
/**
 * Fetch tasks list with filtering and pagination
 * 
 * Caching strategy:
 * - staleTime: 30 seconds (data considered fresh for 30s)
 * - Prevents unnecessary refetches during rapid navigation
 * - Cache key includes params (different filters = different cache entries)
 * 
 * @param params - Filtering and pagination parameters
 * @param options - Additional React Query options
 */
export function useTasks(params?: TaskQueryParams, options?: Omit<UseQueryOptions<PaginatedResponse<Task>>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: queryKeys.tasks.lists(params), // Cache key includes params
    queryFn: () => apiClient.getTasks(params),
    staleTime: 30 * 1000, // 30 seconds - data fresh for 30s
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

/**
 * Create task mutation hook
 * 
 * Cache management:
 * - Invalidates task list cache (triggers refetch)
 * - Invalidates task stats cache (counts changed)
 * 
 * This ensures UI stays in sync after task creation
 */
export function useCreateTask(options?: UseMutationOptions<Task, Error, CreateTaskRequest>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: apiClient.createTask.bind(apiClient),
    onSuccess: (newTask) => {
      // Invalidate all task-related queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all() });

      // Invalidate stats (task count changed)
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.stats() });
    },
    ...options,
  });
}

/**
 * Update task mutation hook
 * 
 * Optimistic updates:
 * - Immediately updates task detail cache (instant UI feedback)
 * - Invalidates list cache (may have changed sorting/filtering)
 * - Invalidates stats (status/priority changes affect counts)
 * 
 * This provides instant UI updates while ensuring data consistency
 */
export function useUpdateTask(options?: UseMutationOptions<Task, Error, { id: string; data: UpdateTaskRequest }>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => apiClient.updateTask(id, data),
    onSuccess: (updatedTask, { id }) => {
      // Optimistically update task detail cache (instant UI update)
      queryClient.setQueryData(queryKeys.tasks.detail(id), updatedTask);

      // Invalidate list cache (task may have moved in sorted list)
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all() });

      // Invalidate stats (status/priority changes affect counts)
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
  list: (params?: UserQueryParams) => ['users', 'list', params] as const,
};

export function useUsers(params?: UserQueryParams) {
  return useQuery({
    queryKey: usersQueryKeys.list(params),
    queryFn: () => apiClient.get<PaginatedResponse<User>>('/users', { params }),
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

