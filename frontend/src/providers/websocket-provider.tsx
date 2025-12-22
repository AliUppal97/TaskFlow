'use client';

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './auth-provider';
import { TaskEvent, WebSocketNotification } from '@/types';

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  subscribeToTask: (taskId: string) => void;
  unsubscribeFromTask: (taskId: string) => void;
  onTaskEvent: (callback: (event: TaskEvent) => void) => () => void;
  onNotification: (callback: (notification: WebSocketNotification) => void) => () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
  children: ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const { user, isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const taskEventCallbacks = useRef<Set<(event: TaskEvent) => void>>(new Set());
  const notificationCallbacks = useRef<Set<(notification: WebSocketNotification) => void>>(new Set());

  useEffect(() => {
    if (isAuthenticated && user) {
      connectSocket();
    } else {
      disconnectSocket();
    }

    return () => {
      disconnectSocket();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user]);

  const connectSocket = () => {
    if (socketRef.current?.connected) return;

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const socket = io(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/tasks`, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      setIsConnected(true);
      if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEBUG_WS === 'true') {
        console.log('Connected to WebSocket');
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEBUG_WS === 'true') {
        console.log('Disconnected from WebSocket');
      }
    });

    socket.on('connected', (data) => {
      if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEBUG_WS === 'true') {
        console.log('WebSocket authenticated:', data);
      }
    });

    socket.on('task-event', (event: TaskEvent) => {
      if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEBUG_WS === 'true') {
        console.log('Task event received:', event);
      }
      taskEventCallbacks.current.forEach(callback => callback(event));
    });

    socket.on('notification', (notification: WebSocketNotification) => {
      if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEBUG_WS === 'true') {
        console.log('Notification received:', notification);
      }
      notificationCallbacks.current.forEach(callback => callback(notification));
    });

    socket.on('subscribed', (data) => {
      if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEBUG_WS === 'true') {
        console.log('Subscribed to task:', data.taskId);
      }
    });

    socket.on('unsubscribed', (data) => {
      if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEBUG_WS === 'true') {
        console.log('Unsubscribed from task:', data.taskId);
      }
    });

    // Handle connection errors
    socket.on('connect_error', (error) => {
      setIsConnected(false);
      if (process.env.NODE_ENV === 'development') {
        console.error('WebSocket connection error:', error.message);
      }
    });

    // Handle general socket errors
    socket.on('error', (error) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('WebSocket error:', error);
      }
    });

    // Handle authentication errors
    socket.on('unauthorized', (error) => {
      setIsConnected(false);
      if (process.env.NODE_ENV === 'development') {
        console.error('WebSocket authentication failed:', error);
      }
      // Optionally clear token and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
      }
    });

    socketRef.current = socket;
  };

  const disconnectSocket = () => {
    if (socketRef.current) {
      // Remove all event listeners before disconnecting to prevent errors
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      taskEventCallbacks.current.clear();
      notificationCallbacks.current.clear();
    }
  };

  const subscribeToTask = (taskId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('subscribe-to-task', { taskId });
    }
  };

  const unsubscribeFromTask = (taskId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('unsubscribe-from-task', { taskId });
    }
  };

  const onTaskEvent = (callback: (event: TaskEvent) => void) => {
    taskEventCallbacks.current.add(callback);
    return () => {
      taskEventCallbacks.current.delete(callback);
    };
  };

  const onNotification = (callback: (notification: WebSocketNotification) => void) => {
    notificationCallbacks.current.add(callback);
    return () => {
      notificationCallbacks.current.delete(callback);
    };
  };

  const value: WebSocketContextType = {
    socket: socketRef.current,
    isConnected,
    subscribeToTask,
    unsubscribeFromTask,
    onTaskEvent,
    onNotification,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}


