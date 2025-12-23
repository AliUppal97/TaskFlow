'use client';

import { useState, useMemo, useEffect } from 'react';
import { Plus, BarChart3, Users, AlertTriangle, ChevronLeft, ChevronRight, Wifi, WifiOff, CheckCircle, X, Trash2 } from 'lucide-react';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { useAuth } from '@/providers/auth-provider';
import { useWebSocket } from '@/providers/websocket-provider';
import { useTaskUpdates } from '@/hooks/use-task-updates';
import {
  useTasks,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useTaskStats,
  useAssignTask,
  useUsers
} from '@/hooks/use-api';
import { TaskList } from '@/features/tasks/components/task-list';
import { TaskForm } from '@/features/tasks/components/task-form';
import { UserSelector } from '@/features/tasks/components/user-selector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Task, TaskStatus, CreateTaskRequest, UpdateTaskRequest, TaskFilters } from '@/types';

export default function TasksPage() {
  const { user } = useAuth();
  const { isConnected } = useWebSocket();

  // State for forms and modals
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'delete' } | null>(null);

  // Filters state
  const [filters, setFilters] = useState<TaskFilters>({
    page: 1,
    limit: 12,
    status: undefined,
    priority: undefined,
    search: '',
  });

  // API hooks
  const {
    data: tasksResponse,
    isLoading: tasksLoading,
    error: tasksError,
  } = useTasks(filters);

  const { data: stats, isLoading: statsLoading } = useTaskStats();

  const createTaskMutation = useCreateTask({
    onSuccess: () => {
      setShowCreateForm(false);
      setToast({ message: 'Task created successfully', type: 'success' });
    },
    onError: (error) => {
      setToast({ 
        message: error instanceof Error ? error.message : 'Failed to create task', 
        type: 'error' 
      });
    },
  });
  const updateTaskMutation = useUpdateTask({
    onSuccess: () => {
      setShowEditForm(false);
      setSelectedTask(null);
      setToast({ message: 'Task updated successfully', type: 'success' });
    },
    onError: (error) => {
      setToast({ 
        message: error instanceof Error ? error.message : 'Failed to update task', 
        type: 'error' 
      });
    },
  });
  const deleteTaskMutation = useDeleteTask({
    onSuccess: () => {
      setToast({ message: 'Task deleted successfully', type: 'delete' });
    },
    onError: (error) => {
      setToast({ 
        message: error instanceof Error ? error.message : 'Failed to delete task', 
        type: 'error' 
      });
    },
  });
  const assignTaskMutation = useAssignTask({
    onSuccess: () => {
      setShowAssignModal(false);
      setSelectedTask(null);
      setSelectedAssigneeId(null);
      setToast({ message: 'Task assigned successfully', type: 'success' });
    },
    onError: (error) => {
      setToast({ 
        message: error instanceof Error ? error.message : 'Failed to assign task', 
        type: 'error' 
      });
    },
  });

  // Get users for assignment
  const { data: usersData } = useUsers({ limit: 50 });
  const users = useMemo(() => {
    if (!usersData?.data) return [];
    return Array.isArray(usersData.data) ? usersData.data : [];
  }, [usersData]);

  // Real-time updates
  useTaskUpdates();

  // Memoized data
  const tasks = useMemo(() => {
    if (!tasksResponse) {
      return [];
    }
    
    // Handle both direct response and wrapped response
    if (Array.isArray(tasksResponse)) {
      return tasksResponse;
    }
    
    const taskList = tasksResponse.data || [];
    return taskList;
  }, [tasksResponse]);
  
  const pagination = useMemo(() => {
    if (!tasksResponse || Array.isArray(tasksResponse)) return undefined;
    return tasksResponse.pagination;
  }, [tasksResponse]);

  // Event handlers
  const handleCreateTask = async (data: CreateTaskRequest | UpdateTaskRequest) => {
    await createTaskMutation.mutateAsync(data as CreateTaskRequest);
  };

  const handleEditTask = async (data: CreateTaskRequest | UpdateTaskRequest) => {
    if (selectedTask) {
      await updateTaskMutation.mutateAsync({ id: selectedTask.id, data: data as UpdateTaskRequest });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      await deleteTaskMutation.mutateAsync(taskId);
    }
  };

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      await updateTaskMutation.mutateAsync({
        id: taskId,
        data: { status, version: task.version }
      });
    }
  };

  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string | null>(null);

  const handleAssignTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setSelectedTask(task);
      setSelectedAssigneeId(task.assigneeId || null);
      setShowAssignModal(true);
    }
  };

  const handleAssignSubmit = async () => {
    if (selectedTask) {
      try {
        await assignTaskMutation.mutateAsync({
          id: selectedTask.id,
          assigneeId: selectedAssigneeId
        });
        // Success handling is done in the mutation's onSuccess callback
      } catch (error) {
        // Error handling is done in the mutation's onError callback
        console.error('Failed to assign task:', error);
      }
    }
  };

  // Auto-dismiss toast after 5 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleFiltersChange = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 })); // Reset to first page
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-white dark:bg-slate-900 relative overflow-hidden">
        {/* Subtle gradient overlay - matching home page */}
        <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pointer-events-none" />
        
        {/* Animated background elements - subtle and light for light theme */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-blue-100/20 dark:bg-primary/10 rounded-full blur-3xl animate-blob" />
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-indigo-100/20 dark:bg-blue-500/10 rounded-full blur-3xl animate-blob animation-delay-2000" />
        </div>

        {/* Toast Notification */}
        {toast && (
          <div className={`fixed top-28 right-4 z-50 flex items-center gap-3 p-4 rounded-lg border shadow-lg animate-in slide-in-from-top-5 ${
            toast.type === 'success'
              ? 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:bg-green-500/20 border-emerald-200 dark:border-green-500/30 text-emerald-700 dark:text-green-300'
              : toast.type === 'delete'
              ? 'bg-gradient-to-r from-red-50 to-pink-50 dark:bg-red-500/20 border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-300'
              : 'bg-gradient-to-r from-red-50 to-pink-50 dark:bg-red-500/20 border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-300'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircle className="h-5 w-5" />
            ) : toast.type === 'delete' ? (
              <Trash2 className="h-5 w-5" />
            ) : (
              <AlertTriangle className="h-5 w-5" />
            )}
            <p className="text-sm font-medium">{toast.message}</p>
            <button 
              onClick={() => setToast(null)} 
              className="ml-2 hover:opacity-70"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className="relative z-10 max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold text-foreground tracking-tight">
                  Tasks
                </h1>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${
                  isConnected
                    ? 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:bg-green-900/20 border-emerald-200 dark:border-green-500/30 text-emerald-700 dark:text-green-300'
                    : 'bg-gradient-to-r from-red-50 to-pink-50 dark:bg-red-900/20 border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-300'
                }`}>
                  {isConnected ? (
                    <Wifi className="h-4 w-4" />
                  ) : (
                    <WifiOff className="h-4 w-4" />
                  )}
                  <span>{isConnected ? 'Live Updates' : 'Offline'}</span>
                </div>
              </div>
              <p className="text-muted-foreground text-lg font-light">
                Manage and track your team&apos;s tasks with real-time collaboration
              </p>
            </div>
            <Button 
              onClick={() => setShowCreateForm(true)} 
              className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg transition-all duration-200"
            >
              <Plus className="h-4 w-4" />
              New Task
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="group relative overflow-hidden border border-border/60 bg-gradient-to-br from-white via-blue-50/30 to-blue-50/20 dark:from-slate-800/50 dark:via-blue-950/20 dark:to-indigo-950/20 hover:border-primary/40 hover:shadow-lg transition-all duration-300 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Total Tasks</CardTitle>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                  <BarChart3 className="h-5 w-5 text-white" strokeWidth={2} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold bg-gradient-to-r from-primary via-blue-600 to-blue-700 dark:from-blue-400 dark:via-indigo-400 dark:to-blue-500 bg-clip-text text-transparent">
                  {statsLoading ? '...' : stats?.total || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Across all statuses
                </p>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border border-border/60 bg-gradient-to-br from-white via-emerald-50/25 to-teal-50/15 dark:from-slate-800/50 dark:via-emerald-950/15 dark:to-teal-950/15 hover:border-emerald-400/40 hover:shadow-lg transition-all duration-300 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">In Progress</CardTitle>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
                  <Users className="h-5 w-5 text-white" strokeWidth={2} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 dark:from-emerald-400 dark:via-teal-400 dark:to-emerald-500 bg-clip-text text-transparent">
                  {statsLoading ? '...' : stats?.byStatus[TaskStatus.IN_PROGRESS] || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Currently active
                </p>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border border-border/60 bg-gradient-to-br from-white via-amber-50/25 to-orange-50/15 dark:from-slate-800/50 dark:via-amber-950/15 dark:to-orange-950/15 hover:border-amber-400/40 hover:shadow-lg transition-all duration-300 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">High Priority</CardTitle>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-sm">
                  <AlertTriangle className="h-5 w-5 text-white" strokeWidth={2} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 dark:from-amber-400 dark:via-orange-400 dark:to-amber-500 bg-clip-text text-transparent">
                  {statsLoading ? '...' : (stats?.byPriority.high || 0) + (stats?.byPriority.urgent || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Need attention
                </p>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border border-border/60 bg-gradient-to-br from-white via-rose-50/25 to-pink-50/15 dark:from-slate-800/50 dark:via-red-950/15 dark:to-pink-950/15 hover:border-rose-400/40 hover:shadow-lg transition-all duration-300 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Overdue</CardTitle>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-sm">
                  <AlertTriangle className="h-5 w-5 text-white" strokeWidth={2} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 dark:from-rose-400 dark:via-pink-400 dark:to-rose-500 bg-clip-text text-transparent">
                  {statsLoading ? '...' : stats?.overdue || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Past due date
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Error Display */}
          {tasksError && (
            <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-pink-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg shadow-sm">
              <p className="text-red-700 dark:text-red-400 text-sm font-medium">
                Error loading tasks: {tasksError instanceof Error ? tasksError.message : 'Unknown error'}
              </p>
            </div>
          )}

          {/* Task List */}
          <TaskList
            tasks={tasks}
            isLoading={tasksLoading}
            currentUserId={user?.id}
            onCreateTask={() => setShowCreateForm(true)}
            onEditTask={(task) => {
              setSelectedTask(task);
              setShowEditForm(true);
            }}
            onDeleteTask={handleDeleteTask}
            onStatusChange={handleStatusChange}
            onAssignTask={handleAssignTask}
            onFiltersChange={handleFiltersChange}
            filters={filters}
          />

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border/80">
              <div className="text-sm text-muted-foreground font-medium">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} tasks
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1 || tasksLoading}
                  className="border-border/80 hover:bg-accent transition-all duration-200 disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={pagination.page === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilters(prev => ({ ...prev, page: pageNum }))}
                        disabled={tasksLoading}
                        className={
                          pagination.page === pageNum
                            ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
                            : "border-border/80 hover:bg-accent transition-all duration-200 disabled:opacity-50"
                        }
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.totalPages || tasksLoading}
                  className="border-border/80 hover:bg-accent transition-all duration-200 disabled:opacity-50"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Create Task Form */}
          <TaskForm
            isOpen={showCreateForm}
            onClose={() => setShowCreateForm(false)}
            onSubmit={handleCreateTask}
            isLoading={createTaskMutation.isPending}
          />

          {/* Edit Task Form */}
          <TaskForm
            isOpen={showEditForm}
            onClose={() => {
              setShowEditForm(false);
              setSelectedTask(null);
            }}
            task={selectedTask}
            onSubmit={handleEditTask}
            isLoading={updateTaskMutation.isPending}
          />

          {/* Assign Task Modal */}
          {showAssignModal && selectedTask && (
            <div 
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" 
              onClick={(e) => {
                // Close modal when clicking backdrop only
                if (e.target === e.currentTarget) {
                  setShowAssignModal(false);
                  setSelectedTask(null);
                  setSelectedAssigneeId(null);
                }
              }}
            >
              <div 
                className="bg-card dark:bg-slate-800 border border-border/80 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl relative z-50"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-semibold mb-4 text-foreground">Assign Task</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Assign &quot;{selectedTask.title}&quot; to a team member
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Select Assignee
                    </label>
                    <UserSelector
                      users={users}
                      value={selectedAssigneeId}
                      onValueChange={setSelectedAssigneeId}
                      placeholder="Choose a team member..."
                      disabled={false}
                      className="w-full"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowAssignModal(false);
                        setSelectedTask(null);
                        setSelectedAssigneeId(null);
                      }}
                      className="border-border/80 hover:bg-accent transition-all duration-200"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAssignSubmit}
                      disabled={assignTaskMutation.isPending}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md transition-all duration-200"
                    >
                      {assignTaskMutation.isPending ? 'Assigning...' : 'Assign Task'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

