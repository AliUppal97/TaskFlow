import { renderHook, act, waitFor } from '@testing-library/react';
import { WebSocketProvider, useWebSocket } from './websocket-provider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './auth-provider';
import { User, UserRole, TaskEvent, TaskEventType, WebSocketNotification } from '@/types';

// Mock socket.io-client
const mockSocket = {
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
  connected: true,
  disconnect: jest.fn(),
  removeAllListeners: jest.fn(),
};

jest.mock('socket.io-client', () => ({
  io: jest.fn(() => mockSocket),
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('WebSocketProvider', () => {
  let queryClient: QueryClient;
  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    role: UserRole.USER,
    profile: { firstName: 'Test', lastName: 'User' },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();
    mockSocket.on.mockClear();
    mockSocket.off.mockClear();
    mockSocket.emit.mockClear();
    mockSocket.disconnect.mockClear();
    mockSocket.removeAllListeners.mockClear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WebSocketProvider>{children}</WebSocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  );

  describe('useWebSocket hook', () => {
    it('should throw error when used outside WebSocketProvider', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useWebSocket());
      }).toThrow('useWebSocket must be used within a WebSocketProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('WebSocket connection management', () => {
    it('should connect when user is authenticated', async () => {
      localStorageMock.getItem.mockReturnValue('mock-token');

      // Mock the io function
      const mockIo = require('socket.io-client').io;
      mockIo.mockReturnValue(mockSocket);

      const { result } = renderHook(() => useWebSocket(), { wrapper });

      // Simulate authentication
      await act(async () => {
        // The provider should connect when user is authenticated
        await waitFor(() => {
          expect(mockIo).toHaveBeenCalledWith(
            expect.stringContaining('http://localhost:3001/tasks'),
            expect.objectContaining({
              auth: { token: 'mock-token' },
            })
          );
        });
      });

      expect(result.current.isConnected).toBe(true);
    });

    it('should disconnect when user is not authenticated', () => {
      localStorageMock.getItem.mockReturnValue(null);

      renderHook(() => useWebSocket(), { wrapper });

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('should handle connection events', () => {
      localStorageMock.getItem.mockReturnValue('mock-token');

      const mockIo = require('socket.io-client').io;
      mockIo.mockReturnValue(mockSocket);

      renderHook(() => useWebSocket(), { wrapper });

      // Simulate connect event
      const connectCallback = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1];
      act(() => {
        connectCallback();
      });

      // The component should update isConnected state
      expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
    });

    it('should handle disconnection events', () => {
      localStorageMock.getItem.mockReturnValue('mock-token');

      const mockIo = require('socket.io-client').io;
      mockIo.mockReturnValue(mockSocket);

      renderHook(() => useWebSocket(), { wrapper });

      // Simulate disconnect event
      const disconnectCallback = mockSocket.on.mock.calls.find(call => call[0] === 'disconnect')[1];
      act(() => {
        disconnectCallback();
      });

      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    });

    it('should handle task events', () => {
      localStorageMock.getItem.mockReturnValue('mock-token');

      const mockIo = require('socket.io-client').io;
      mockIo.mockReturnValue(mockSocket);

      const { result } = renderHook(() => useWebSocket(), { wrapper });

      const taskEventCallback = mockSocket.on.mock.calls.find(call => call[0] === 'task-event')[1];

      const mockEvent: TaskEvent = {
        taskId: 'task-123',
        type: TaskEventType.TASK_UPDATED,
        payload: { title: 'Updated Task' },
        timestamp: new Date(),
      };

      act(() => {
        taskEventCallback(mockEvent);
      });

      // The event should be passed to registered callbacks
      expect(mockSocket.on).toHaveBeenCalledWith('task-event', expect.any(Function));
    });

    it('should handle notification events', () => {
      localStorageMock.getItem.mockReturnValue('mock-token');

      const mockIo = require('socket.io-client').io;
      mockIo.mockReturnValue(mockSocket);

      const { result } = renderHook(() => useWebSocket(), { wrapper });

      const notificationCallback = mockSocket.on.mock.calls.find(call => call[0] === 'notification')[1];

      const mockNotification: WebSocketNotification = {
        id: 'notif-123',
        type: 'task_assigned',
        title: 'Task Assigned',
        message: 'You have been assigned a task',
        userId: 'user-123',
        timestamp: new Date(),
      };

      act(() => {
        notificationCallback(mockNotification);
      });

      expect(mockSocket.on).toHaveBeenCalledWith('notification', expect.any(Function));
    });
  });

  describe('WebSocket methods', () => {
    it('should subscribe to task when connected', () => {
      localStorageMock.getItem.mockReturnValue('mock-token');

      const mockIo = require('socket.io-client').io;
      mockIo.mockReturnValue(mockSocket);

      const { result } = renderHook(() => useWebSocket(), { wrapper });

      act(() => {
        result.current.subscribeToTask('task-123');
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('subscribe-to-task', { taskId: 'task-123' });
    });

    it('should not subscribe when not connected', () => {
      localStorageMock.getItem.mockReturnValue('mock-token');

      const mockIo = require('socket.io-client').io;
      mockIo.mockReturnValue({ ...mockSocket, connected: false });

      const { result } = renderHook(() => useWebSocket(), { wrapper });

      act(() => {
        result.current.subscribeToTask('task-123');
      });

      expect(mockSocket.emit).not.toHaveBeenCalled();
    });

    it('should unsubscribe from task when connected', () => {
      localStorageMock.getItem.mockReturnValue('mock-token');

      const mockIo = require('socket.io-client').io;
      mockIo.mockReturnValue(mockSocket);

      const { result } = renderHook(() => useWebSocket(), { wrapper });

      act(() => {
        result.current.unsubscribeFromTask('task-123');
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('unsubscribe-from-task', { taskId: 'task-123' });
    });

    it('should handle event subscriptions', () => {
      localStorageMock.getItem.mockReturnValue('mock-token');

      const mockIo = require('socket.io-client').io;
      mockIo.mockReturnValue(mockSocket);

      const { result } = renderHook(() => useWebSocket(), { wrapper });

      const mockCallback = jest.fn();

      act(() => {
        const unsubscribe = result.current.onTaskEvent(mockCallback);
        // Should return an unsubscribe function
        expect(typeof unsubscribe).toBe('function');
      });
    });

    it('should handle notification subscriptions', () => {
      localStorageMock.getItem.mockReturnValue('mock-token');

      const mockIo = require('socket.io-client').io;
      mockIo.mockReturnValue(mockSocket);

      const { result } = renderHook(() => useWebSocket(), { wrapper });

      const mockCallback = jest.fn();

      act(() => {
        const unsubscribe = result.current.onNotification(mockCallback);
        // Should return an unsubscribe function
        expect(typeof unsubscribe).toBe('function');
      });
    });
  });

  describe('Error handling', () => {
    it('should handle connection errors', () => {
      localStorageMock.getItem.mockReturnValue('mock-token');

      const mockIo = require('socket.io-client').io;
      mockIo.mockReturnValue(mockSocket);

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      renderHook(() => useWebSocket(), { wrapper });

      const connectErrorCallback = mockSocket.on.mock.calls.find(call => call[0] === 'connect_error')[1];

      act(() => {
        connectErrorCallback({ message: 'Connection failed' });
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith('WebSocket connection error:', 'Connection failed');

      consoleErrorSpy.mockRestore();
    });

    it('should handle general socket errors', () => {
      localStorageMock.getItem.mockReturnValue('mock-token');

      const mockIo = require('socket.io-client').io;
      mockIo.mockReturnValue(mockSocket);

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      renderHook(() => useWebSocket(), { wrapper });

      const errorCallback = mockSocket.on.mock.calls.find(call => call[0] === 'error')[1];

      act(() => {
        errorCallback({ message: 'Socket error' });
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith('WebSocket error:', { message: 'Socket error' });

      consoleErrorSpy.mockRestore();
    });

    it('should handle authentication errors', () => {
      localStorageMock.getItem.mockReturnValue('mock-token');

      const mockIo = require('socket.io-client').io;
      mockIo.mockReturnValue(mockSocket);

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      renderHook(() => useWebSocket(), { wrapper });

      const unauthorizedCallback = mockSocket.on.mock.calls.find(call => call[0] === 'unauthorized')[1];

      act(() => {
        unauthorizedCallback({ message: 'Unauthorized' });
      });

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('accessToken');
      expect(consoleErrorSpy).toHaveBeenCalledWith('WebSocket authentication failed:', { message: 'Unauthorized' });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Debug logging', () => {
    it('should log connection events in development', () => {
      process.env.NODE_ENV = 'development';
      process.env.NEXT_PUBLIC_DEBUG_WS = 'true';

      localStorageMock.getItem.mockReturnValue('mock-token');

      const mockIo = require('socket.io-client').io;
      mockIo.mockReturnValue(mockSocket);

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      renderHook(() => useWebSocket(), { wrapper });

      const connectCallback = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1];
      act(() => {
        connectCallback();
      });

      expect(consoleLogSpy).toHaveBeenCalledWith('Connected to WebSocket');

      consoleLogSpy.mockRestore();
      delete process.env.NEXT_PUBLIC_DEBUG_WS;
    });

    it('should not log in production', () => {
      process.env.NODE_ENV = 'production';

      localStorageMock.getItem.mockReturnValue('mock-token');

      const mockIo = require('socket.io-client').io;
      mockIo.mockReturnValue(mockSocket);

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      renderHook(() => useWebSocket(), { wrapper });

      const connectCallback = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1];
      act(() => {
        connectCallback();
      });

      expect(consoleLogSpy).not.toHaveBeenCalledWith('Connected to WebSocket');

      consoleLogSpy.mockRestore();
    });
  });

  describe('Cleanup', () => {
    it('should disconnect socket on unmount', () => {
      localStorageMock.getItem.mockReturnValue('mock-token');

      const mockIo = require('socket.io-client').io;
      mockIo.mockReturnValue(mockSocket);

      const { unmount } = renderHook(() => useWebSocket(), { wrapper });

      unmount();

      expect(mockSocket.removeAllListeners).toHaveBeenCalled();
      expect(mockSocket.disconnect).toHaveBeenCalled();
    });
  });
});
