# State Management Architecture

## Overview

TaskFlow implements a comprehensive state management solution that combines **React Context API** for global state and **React Query (TanStack Query)** for server state management and caching. This architecture provides optimal performance, real-time synchronization, and excellent developer experience.

## Architecture Principles

### 1. **Separation of Concerns**
- **React Context API**: Global UI state (auth, theme, WebSocket connections)
- **React Query**: Server state (API data, caching, synchronization)
- **Local State**: Component-specific state (forms, UI interactions)

### 2. **Performance Optimization**
- Intelligent caching with configurable stale times
- Optimistic updates for better UX
- Background refetching and cache invalidation
- Memoization and debouncing to prevent unnecessary re-renders

### 3. **Real-time Synchronization**
- WebSocket integration for live updates
- Automatic cache invalidation on real-time events
- Conflict resolution and optimistic locking

### 4. **Type Safety**
- Full TypeScript implementation
- Type-safe query keys and API responses
- Runtime validation with Zod schemas

## React Context API Implementation

### AuthProvider (`src/providers/auth-provider.tsx`)

Manages authentication state across the application.

#### Features:
- **JWT Token Management**: Automatic token storage and refresh
- **Mock Authentication**: Development mode support without backend
- **Auto-login**: Seamless authentication flow
- **SSR Safe**: Handles server-side rendering properly

#### State Structure:
```typescript
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}
```

#### Usage:
```typescript
import { useAuth } from '@/providers/auth-provider';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();

  if (!isAuthenticated) {
    return <LoginForm onSubmit={login} />;
  }

  return <Dashboard user={user} onLogout={logout} />;
}
```

### ThemeProvider (`src/providers/theme-provider.tsx`)

Manages theme state with system preference detection.

#### Features:
- **Multiple Theme Options**: Light, Dark, System
- **System Preference Detection**: Automatic theme switching
- **Persistent Storage**: localStorage integration
- **SSR Safe**: Prevents hydration mismatches
- **Aggressive Enforcement**: Ensures theme consistency

#### State Structure:
```typescript
interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
}
```

#### Usage:
```typescript
import { useTheme } from '@/providers/theme-provider';

function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      Current theme: {resolvedTheme}
    </button>
  );
}
```

### WebSocketProvider (`src/providers/websocket-provider.tsx`)

Manages real-time WebSocket connections for live updates.

#### Features:
- **Automatic Connection**: Connects when authenticated
- **Event Callbacks**: Subscribe to task events and notifications
- **Connection State**: Real-time connection status
- **Error Handling**: Comprehensive error management
- **Development Debugging**: Detailed logging in dev mode

#### State Structure:
```typescript
interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  subscribeToTask: (taskId: string) => void;
  unsubscribeFromTask: (taskId: string) => void;
  onTaskEvent: (callback: (event: TaskEvent) => void) => () => void;
  onNotification: (callback: (notification: WebSocketNotification) => void) => () => void;
}
```

#### Usage:
```typescript
import { useWebSocket } from '@/providers/websocket-provider';

function TaskComponent({ taskId }: { taskId: string }) {
  const { isConnected, subscribeToTask, onTaskEvent } = useWebSocket();

  useEffect(() => {
    subscribeToTask(taskId);

    const unsubscribe = onTaskEvent((event) => {
      if (event.taskId === taskId) {
        // Handle task update
        console.log('Task updated:', event);
      }
    });

    return unsubscribe;
  }, [taskId, subscribeToTask, onTaskEvent]);

  return (
    <div>
      Connection Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
    </div>
  );
}
```

## React Query Implementation

### QueryProvider Configuration (`src/providers/query-provider.tsx`)

Configures React Query with optimized defaults for TaskFlow.

#### Configuration:
```typescript
new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error) => {
        // Smart retry logic
        if (error?.status >= 400 && error?.status < 500) {
          return false; // Don't retry 4xx errors
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
      onError: (error) => {
        // Global error handling
        console.error('Mutation error:', error);
      },
    },
  },
})
```

### Query Keys Factory (`src/hooks/use-api.ts`)

Centralized, type-safe query key management.

#### Structure:
```typescript
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
```

#### Benefits:
- **Type Safety**: Compile-time verification of query keys
- **Cache Management**: Easy invalidation with hierarchical keys
- **Consistency**: Single source of truth for query keys

### Custom Hooks (`src/hooks/use-api.ts`)

Comprehensive set of hooks for all API operations.

#### Query Hooks:
```typescript
// Fetch tasks with caching
const { data: tasks, isLoading, error } = useTasks(filters);

// Fetch single task
const { data: task, isLoading } = useTask(taskId);

// Fetch task statistics
const { data: stats } = useTaskStats();

// Fetch users
const { data: users } = useUsers(params);
```

#### Mutation Hooks:
```typescript
// Create task with cache invalidation
const createTaskMutation = useCreateTask();

// Update task with optimistic updates
const updateTaskMutation = useUpdateTask();

// Delete task with cache cleanup
const deleteTaskMutation = useDeleteTask();

// Assign task
const assignTaskMutation = useAssignTask();
```

#### Cache Management Strategies:

1. **Optimistic Updates** (Update Task):
```typescript
const updateTaskMutation = useMutation({
  mutationFn: ({ id, data }) => apiClient.updateTask(id, data),
  onSuccess: (updatedTask, { id }) => {
    // Instantly update cache for immediate UI feedback
    queryClient.setQueryData(queryKeys.tasks.detail(id), updatedTask);

    // Invalidate related queries
    queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all() });
    queryClient.invalidateQueries({ queryKey: queryKeys.tasks.stats() });
  },
});
```

2. **Cache Invalidation** (Create/Delete Task):
```typescript
const createTaskMutation = useMutation({
  mutationFn: apiClient.createTask,
  onSuccess: () => {
    // Invalidate all task-related queries
    queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all() });
    queryClient.invalidateQueries({ queryKey: queryKeys.tasks.stats() });
  },
});
```

## Real-time State Synchronization

### WebSocket Integration (`src/hooks/use-task-updates.ts`)

Automatically synchronizes React Query cache with real-time WebSocket events.

```typescript
export function useTaskUpdates() {
  const { onTaskEvent } = useWebSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = onTaskEvent((event: TaskEvent) => {
      // Update specific task in cache
      if (event.taskId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.tasks.detail(event.taskId),
        });
      }

      // Invalidate task lists for fresh data
      queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.all(),
        refetchType: 'active', // Only refetch active queries
      });

      // Update statistics
      queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.stats(),
      });
    });

    return unsubscribe;
  }, [onTaskEvent, queryClient]);
}
```

### Usage in Components:
```typescript
function TasksPage() {
  // Enable real-time updates
  useTaskUpdates();

  // React Query will automatically update when WebSocket events occur
  const { data: tasks } = useTasks();

  return <TaskList tasks={tasks} />;
}
```

## Performance Optimizations

### 1. **Intelligent Caching Strategy**
```typescript
// Different stale times for different data types
const taskDetailQuery = {
  queryKey: queryKeys.tasks.detail(id),
  staleTime: 60 * 1000, // 1 minute - task details change frequently
};

const taskStatsQuery = {
  queryKey: queryKeys.tasks.stats(),
  staleTime: 5 * 60 * 1000, // 5 minutes - stats change less frequently
};

const userProfileQuery = {
  queryKey: queryKeys.auth.profile(),
  staleTime: 5 * 60 * 1000, // 5 minutes - profile changes rarely
};
```

### 2. **Optimistic Updates**
- Immediate UI feedback for better user experience
- Automatic rollback on failure
- Reduces perceived latency

### 3. **Background Refetching**
- Data stays fresh without user interaction
- Configurable stale times prevent unnecessary requests
- `refetchOnWindowFocus: false` prevents aggressive refetching

### 4. **Component Optimization**
```typescript
// Memoized components prevent unnecessary re-renders
const TaskListHeader = memo(function TaskListHeader({ tasksCount, onCreateTask }) {
  return (
    <div>
      <h2>{tasksCount} tasks found</h2>
      <Button onClick={onCreateTask}>New Task</Button>
    </div>
  );
}, (prevProps, nextProps) => {
  // Only re-render when tasksCount changes
  return prevProps.tasksCount === nextProps.tasksCount;
});
```

### 5. **Debounced Search**
```typescript
const SearchInput = memo(function SearchInput({ onSearchChange }) {
  const [localValue, setLocalValue] = useState('');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleChange = useCallback((value: string) => {
    setLocalValue(value);

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounced update (300ms)
    debounceTimerRef.current = setTimeout(() => {
      onSearchChange(value);
    }, 300);
  }, [onSearchChange]);

  return <Input value={localValue} onChange={handleChange} />;
});
```

## SSR Safety and Hydration

### Server-Side Rendering Considerations:

1. **Context Providers**: All providers handle SSR safely
```typescript
const isMockAuthEnabled = () => {
  if (typeof window === 'undefined') return false; // SSR safety
  return process.env.NEXT_PUBLIC_MOCK_AUTH === 'true' ||
         localStorage.getItem('mockAuth') === 'true';
};
```

2. **Hydration Prevention**: Theme provider prevents hydration mismatches
```typescript
const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
}, []);

if (!mounted) {
  return <div>Placeholder</div>; // Prevent hydration mismatch
}
```

3. **localStorage Access**: Safe access with SSR checks
```typescript
const getStoredTheme = () => {
  if (typeof window === 'undefined') return Theme.DARK;
  return localStorage.getItem('theme') as Theme || Theme.DARK;
};
```

## Error Handling and Resilience

### Global Error Handling:
```typescript
// React Query global error handler
mutations: {
  onError: (error: unknown) => {
    if (process.env.NODE_ENV === 'development') {
      console.error('Mutation error:', error);
    }
    // Handle errors globally while allowing individual mutations to handle specific cases
  },
}
```

### WebSocket Error Handling:
```typescript
socket.on('connect_error', (error) => {
  setIsConnected(false);
  if (process.env.NODE_ENV === 'development') {
    console.error('WebSocket connection error:', error.message);
  }
});

socket.on('unauthorized', () => {
  // Handle authentication errors
  localStorage.removeItem('accessToken');
  window.location.href = '/login';
});
```

## Development Tools and Debugging

### React Query DevTools:
```typescript
// Conditionally loaded in development
if (process.env.NODE_ENV === 'development') {
  import('@tanstack/react-query-devtools').then((module) => {
    setDevtoolsComponent(() => module.ReactQueryDevtools);
  });
}

return <DevtoolsComponent initialIsOpen={false} />;
```

### WebSocket Debugging:
```typescript
// Development-only logging
if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEBUG_WS === 'true') {
  console.log('WebSocket event received:', event);
}
```

## Testing Strategy

### Unit Tests:
```typescript
// Test custom hooks
describe('useTasks', () => {
  it('should fetch tasks with filters', async () => {
    // Test implementation
  });
});

// Test providers
describe('AuthProvider', () => {
  it('should handle login flow', () => {
    // Test implementation
  });
});
```

### Integration Tests:
```typescript
// Test state synchronization
describe('Real-time Updates', () => {
  it('should update cache on WebSocket events', () => {
    // Test WebSocket event handling and cache invalidation
  });
});
```

## Migration and Future Considerations

### Potential Enhancements:

1. **Redux Toolkit**: Consider for complex state logic if needed
2. **Zustand**: Lightweight alternative for simpler state management
3. **SWR**: Alternative to React Query for specific use cases
4. **React Server Components**: Future migration considerations

### Current Architecture Benefits:

- ✅ **Performance**: Optimized caching and rendering
- ✅ **Developer Experience**: Type-safe, well-documented
- ✅ **Maintainability**: Clear separation of concerns
- ✅ **Scalability**: Handles real-time updates and complex state
- ✅ **Testing**: Well-structured for comprehensive testing

## Conclusion

TaskFlow's state management architecture provides a robust, performant, and maintainable solution that effectively combines React Context API for global state and React Query for server state. The implementation follows industry best practices and provides excellent developer experience with comprehensive TypeScript support, real-time synchronization, and extensive error handling.
