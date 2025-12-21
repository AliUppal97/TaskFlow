import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWebSocket } from '@/providers/websocket-provider';
import { queryKeys } from './use-api';
import { TaskEvent, TaskEventType } from '@/types';

export function useTaskUpdates() {
  const { onTaskEvent } = useWebSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = onTaskEvent((event: TaskEvent) => {
      console.log('Received task event:', event);

      // Update the specific task in cache
      if (event.taskId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.tasks.detail(event.taskId),
        });
      }

      // Invalidate tasks list to get fresh data
      queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.all(),
        refetchType: 'active', // Only refetch active queries
      });

      // Update stats
      queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.stats(),
      });

      // Show notification for certain events
      if (event.type === TaskEventType.TASK_ASSIGNED) {
        // You could show a toast notification here
        console.log('Task assigned:', event.payload);
      }
    });

    return unsubscribe;
  }, [onTaskEvent, queryClient]);
}



