'use client';

import { createContext, useContext, useEffect, useRef, useState, useMemo, useCallback, ReactNode } from 'react';
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
  const [socket, setSocket] = useState<Socket | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const taskEventCallbacks = useRef<Set<(event: TaskEvent) => void>>(new Set());
  const notificationCallbacks = useRef<Set<(notification: WebSocketNotification) => void>>(new Set());

  const disconnectSocket = useCallback(() => {
    if (socketRef.current) {
      // Remove all event listeners before disconnecting to prevent errors
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
      // Defer state updates to avoid synchronous setState in effects
      setTimeout(() => {
        setSocket(null);
        setIsConnected(false);
      }, 0);
      taskEventCallbacks.current.clear();
      notificationCallbacks.current.clear();
    }
  }, []);

  const connectSocket = useCallback(() => {
    if (socketRef.current?.connected) return;

    const token = localStorage.getItem('accessToken');
    if (!token) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('WebSocket: No access token found, skipping connection');
      }
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const wsUrl = `${apiUrl}/tasks`;

    if (process.env.NODE_ENV === 'development') {
      console.log('WebSocket: Attempting to connect to', wsUrl);
    }

    const socket = io(wsUrl, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    socket.on('connect', () => {
      setIsConnected(true);
      setSocket(socket);
      if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEBUG_WS === 'true') {
        console.log('Connected to WebSocket');
      }
    });

    socket.on('disconnect', (reason) => {
      setIsConnected(false);
      if (process.env.NODE_ENV === 'development') {
        console.log('WebSocket disconnected:', reason);
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
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorDetails = error instanceof Error ? {
        message: error.message,
        type: error.name,
        stack: error.stack,
      } : error;
      
      if (process.env.NODE_ENV === 'development') {
        console.error('WebSocket connection error:', errorMessage);
        console.error('Error details:', errorDetails);
      }
    });

    // Handle general socket errors
    socket.on('error', (error) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorDetails = error instanceof Error ? {
        message: error.message,
        type: error.name,
        stack: error.stack,
      } : error;
      
      if (process.env.NODE_ENV === 'development') {
        console.error('WebSocket error:', errorMessage);
        console.error('Error details:', errorDetails);
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
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      connectSocket();
    } else {
      disconnectSocket();
    }

    return () => {
      disconnectSocket();
    };
    // Note: connectSocket and disconnectSocket manage WebSocket lifecycle
    // This is a valid use case for useEffect to handle side effects
  }, [isAuthenticated, user, connectSocket, disconnectSocket]);

  const subscribeToTask = useCallback((taskId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('subscribe-to-task', { taskId });
    }
  }, []);

  const unsubscribeFromTask = useCallback((taskId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('unsubscribe-from-task', { taskId });
    }
  }, []);

  const onTaskEvent = useCallback((callback: (event: TaskEvent) => void) => {
    taskEventCallbacks.current.add(callback);
    return () => {
      taskEventCallbacks.current.delete(callback);
    };
  }, []);

  const onNotification = useCallback((callback: (notification: WebSocketNotification) => void) => {
    notificationCallbacks.current.add(callback);
    return () => {
      notificationCallbacks.current.delete(callback);
    };
  }, []);

  const value: WebSocketContextType = useMemo(() => ({
    socket,
    isConnected,
    subscribeToTask,
    unsubscribeFromTask,
    onTaskEvent,
    onNotification,
  }), [socket, isConnected, subscribeToTask, unsubscribeFromTask, onTaskEvent, onNotification]);

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


