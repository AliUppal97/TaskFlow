'use client';

import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { ApiErrorResponse } from '@/types';

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // With SSR, we usually want to set some default staleTime
            // above 0 to avoid refetching immediately on the client
            staleTime: 60 * 1000, // 1 minute
            gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
            retry: (failureCount, error: unknown) => {
              // Don't retry on 4xx errors
              if (error && typeof error === 'object' && 'status' in error) {
                const status = (error as { status: number }).status;
                if (status >= 400 && status < 500) {
                  return false;
                }
              }
              // Also check for AxiosError
              if (error && typeof error === 'object' && 'isAxiosError' in error) {
                const axiosError = error as AxiosError<ApiErrorResponse>;
                if (axiosError.response?.status && axiosError.response.status >= 400 && axiosError.response.status < 500) {
                  return false;
                }
              }
              return failureCount < 3;
            },
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: false,
            onError: (error: unknown) => {
              // Global error handler for mutations
              // Prevents unhandled promise rejections from appearing in console
              // Individual mutations can still handle errors via onError callback
              if (process.env.NODE_ENV === 'development') {
                // Only log in development for debugging
                if (error instanceof Error) {
                  console.error('Mutation error:', error.message);
                } else if (error && typeof error === 'object' && 'isAxiosError' in error) {
                  const axiosError = error as AxiosError<ApiErrorResponse>;
                  const message = axiosError.response?.data?.error?.message || axiosError.message;
                  console.error('Mutation error:', message);
                }
              }
              // In production, errors should be handled by individual mutations
              // or by UI error boundaries/toast notifications
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <DevTools />
    </QueryClientProvider>
  );
}

// Separate component for devtools to avoid SSR issues
function DevTools() {
  const [isClient, setIsClient] = useState(false);
  const [DevtoolsComponent, setDevtoolsComponent] = useState<React.ComponentType<{ initialIsOpen?: boolean }> | null>(null);

  useEffect(() => {
    setIsClient(true);
    // Dynamic import to avoid SSR issues
    if (process.env.NODE_ENV === 'development') {
      import('@tanstack/react-query-devtools').then((module) => {
        setDevtoolsComponent(() => module.ReactQueryDevtools);
      });
    }
  }, []);

  if (!isClient || !DevtoolsComponent) {
    return null;
  }

  return <DevtoolsComponent initialIsOpen={false} />;
}
