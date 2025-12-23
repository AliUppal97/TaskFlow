import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTaskUpdates } from './use-task-updates';
import { TaskEvent, TaskEventType } from '@/types';

// Mock the websocket provider
const mockOnTaskEvent = jest.fn();
const mockUseWebSocket = jest.fn(() => ({
  onTaskEvent: mockOnTaskEvent,
}));

jest.mock('@/providers/websocket-provider', () => ({
  useWebSocket: () => mockUseWebSocket(),
}));

// Mock query client
const mockInvalidateQueries = jest.fn();
const mockQueryClient = {
  invalidateQueries: mockInvalidateQueries,
} as any;

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQueryClient: () => mockQueryClient,
}));

describe('useTaskUpdates', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
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

  it('should call onTaskEvent and set up event listener', () => {
    const mockUnsubscribe = jest.fn();
    mockOnTaskEvent.mockReturnValue(mockUnsubscribe);

    renderHook(() => useTaskUpdates(), { wrapper });

    expect(mockOnTaskEvent).toHaveBeenCalledWith(expect.any(Function));
  });

  it('should invalidate task detail queries when taskId is present', () => {
    const mockUnsubscribe = jest.fn();
    mockOnTaskEvent.mockImplementation((callback) => {
      // Simulate calling the callback
      callback({
        taskId: 'task-123',
        type: TaskEventType.TASK_UPDATED,
        payload: { title: 'Updated Task' },
        timestamp: new Date(),
      });
      return mockUnsubscribe;
    });

    renderHook(() => useTaskUpdates(), { wrapper });

    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ['tasks', 'detail', 'task-123'],
    });
  });

  it('should invalidate tasks list queries', () => {
    const mockUnsubscribe = jest.fn();
    mockOnTaskEvent.mockImplementation((callback) => {
      callback({
        taskId: 'task-123',
        type: TaskEventType.TASK_CREATED,
        payload: { title: 'New Task' },
        timestamp: new Date(),
      });
      return mockUnsubscribe;
    });

    renderHook(() => useTaskUpdates(), { wrapper });

    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ['tasks'],
      refetchType: 'active',
    });
  });

  it('should invalidate task stats queries', () => {
    const mockUnsubscribe = jest.fn();
    mockOnTaskEvent.mockImplementation((callback) => {
      callback({
        taskId: 'task-123',
        type: TaskEventType.TASK_DELETED,
        payload: {},
        timestamp: new Date(),
      });
      return mockUnsubscribe;
    });

    renderHook(() => useTaskUpdates(), { wrapper });

    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ['tasks', 'stats'],
    });
  });

  it('should handle TASK_ASSIGNED events', () => {
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const mockUnsubscribe = jest.fn();

    // Set debug environment variable
    process.env.NEXT_PUBLIC_DEBUG_WS = 'true';

    mockOnTaskEvent.mockImplementation((callback) => {
      callback({
        taskId: 'task-123',
        type: TaskEventType.TASK_ASSIGNED,
        payload: { assigneeId: 'user-456' },
        timestamp: new Date(),
      });
      return mockUnsubscribe;
    });

    renderHook(() => useTaskUpdates(), { wrapper });

    expect(consoleLogSpy).toHaveBeenCalledWith('Task assigned:', { assigneeId: 'user-456' });

    consoleLogSpy.mockRestore();
    delete process.env.NEXT_PUBLIC_DEBUG_WS;
  });

  it('should log events in development mode when debug is enabled', () => {
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const mockUnsubscribe = jest.fn();

    process.env.NEXT_PUBLIC_DEBUG_WS = 'true';
    process.env.NODE_ENV = 'development';

    const testEvent: TaskEvent = {
      taskId: 'task-123',
      type: TaskEventType.TASK_UPDATED,
      payload: { title: 'Updated' },
      timestamp: new Date(),
    };

    mockOnTaskEvent.mockImplementation((callback) => {
      callback(testEvent);
      return mockUnsubscribe;
    });

    renderHook(() => useTaskUpdates(), { wrapper });

    expect(consoleLogSpy).toHaveBeenCalledWith('Received task event:', testEvent);

    consoleLogSpy.mockRestore();
    delete process.env.NEXT_PUBLIC_DEBUG_WS;
  });

  it('should not log events when debug is disabled', () => {
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const mockUnsubscribe = jest.fn();

    process.env.NEXT_PUBLIC_DEBUG_WS = 'false';

    mockOnTaskEvent.mockImplementation((callback) => {
      callback({
        taskId: 'task-123',
        type: TaskEventType.TASK_UPDATED,
        payload: { title: 'Updated' },
        timestamp: new Date(),
      });
      return mockUnsubscribe;
    });

    renderHook(() => useTaskUpdates(), { wrapper });

    expect(consoleLogSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('Received task event'),
      expect.any(Object)
    );

    consoleLogSpy.mockRestore();
  });

  it('should handle errors in event processing gracefully', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const mockUnsubscribe = jest.fn();

    process.env.NODE_ENV = 'development';

    // Mock invalidateQueries to throw an error
    mockInvalidateQueries.mockImplementation(() => {
      throw new Error('Query invalidation failed');
    });

    mockOnTaskEvent.mockImplementation((callback) => {
      callback({
        taskId: 'task-123',
        type: TaskEventType.TASK_UPDATED,
        payload: {},
        timestamp: new Date(),
      });
      return mockUnsubscribe;
    });

    renderHook(() => useTaskUpdates(), { wrapper });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error processing task event:',
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });

  it('should not log errors in production mode', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const mockUnsubscribe = jest.fn();

    process.env.NODE_ENV = 'production';

    mockInvalidateQueries.mockImplementation(() => {
      throw new Error('Query invalidation failed');
    });

    mockOnTaskEvent.mockImplementation((callback) => {
      callback({
        taskId: 'task-123',
        type: TaskEventType.TASK_UPDATED,
        payload: {},
        timestamp: new Date(),
      });
      return mockUnsubscribe;
    });

    renderHook(() => useTaskUpdates(), { wrapper });

    // Should not log errors in production
    expect(consoleErrorSpy).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('should call unsubscribe on cleanup', () => {
    const mockUnsubscribe = jest.fn();
    mockOnTaskEvent.mockReturnValue(mockUnsubscribe);

    const { unmount } = renderHook(() => useTaskUpdates(), { wrapper });

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('should handle events without taskId', () => {
    const mockUnsubscribe = jest.fn();
    mockOnTaskEvent.mockImplementation((callback) => {
      callback({
        type: TaskEventType.TASK_CREATED,
        payload: { title: 'New Task' },
        timestamp: new Date(),
      });
      return mockUnsubscribe;
    });

    renderHook(() => useTaskUpdates(), { wrapper });

    // Should still invalidate tasks list and stats, but not task detail
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ['tasks'],
      refetchType: 'active',
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ['tasks', 'stats'],
    });

    // Should not try to invalidate task detail without taskId
    expect(mockInvalidateQueries).not.toHaveBeenCalledWith({
      queryKey: ['tasks', 'detail', expect.any(String)],
    });
  });

  it('should handle all task event types', () => {
    const mockUnsubscribe = jest.fn();
    const eventTypes = [
      TaskEventType.TASK_CREATED,
      TaskEventType.TASK_UPDATED,
      TaskEventType.TASK_DELETED,
      TaskEventType.TASK_ASSIGNED,
    ];

    let callCount = 0;
    mockOnTaskEvent.mockImplementation((callback) => {
      eventTypes.forEach((type) => {
        callback({
          taskId: 'task-123',
          type,
          payload: {},
          timestamp: new Date(),
        });
      });
      return mockUnsubscribe;
    });

    renderHook(() => useTaskUpdates(), { wrapper });

    // Each event should trigger invalidation of tasks list and stats
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ['tasks'],
      refetchType: 'active',
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ['tasks', 'stats'],
    });

    // Each event should trigger invalidation of task detail
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ['tasks', 'detail', 'task-123'],
    });
  });
});

