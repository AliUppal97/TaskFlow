'use client';

import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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
            retry: (failureCount, error: any) => {
              // Don't retry on 4xx errors
              if (error?.status >= 400 && error?.status < 500) {
                return false;
              }
              return failureCount < 3;
            },
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: false,
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
  const [DevtoolsComponent, setDevtoolsComponent] = useState<React.ComponentType<any> | null>(null);

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
