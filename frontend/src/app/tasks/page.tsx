'use client';

import { useState, useMemo } from 'react';
import { Plus, BarChart3, Users, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { useAuth } from '@/providers/auth-provider';
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

  // State for forms and modals
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

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

  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();
  const assignTaskMutation = useAssignTask();

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
      if (process.env.NODE_ENV === 'development') {
        console.log('[Tasks Page] No tasksResponse');
      }
      return [];
    }
    
    // Handle both direct response and wrapped response
    if (Array.isArray(tasksResponse)) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Tasks Page] tasksResponse is array, length:', tasksResponse.length);
      }
      return tasksResponse;
    }
    
    const taskList = tasksResponse.data || [];
    if (process.env.NODE_ENV === 'development') {
      console.log('[Tasks Page] tasksResponse.data length:', taskList.length, 'pagination:', tasksResponse.pagination);
    }
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

  const handleAssignTask = async (taskId: string) => {
    setSelectedTask(tasks.find(t => t.id === taskId) || null);
    setShowAssignModal(true);
  };

  const handleAssignSubmit = async (assigneeId: string | null) => {
    if (selectedTask) {
      await assignTaskMutation.mutateAsync({
        id: selectedTask.id,
        assigneeId
      });
      setShowAssignModal(false);
      setSelectedTask(null);
    }
  };

  const handleFiltersChange = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 })); // Reset to first page
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-white dark:from-slate-900 dark:via-slate-800/30 dark:to-slate-900">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-[#212121] dark:from-slate-100 dark:via-indigo-200 dark:to-purple-200 mb-2">
                Tasks
              </h1>
              <p className="text-[#757575] dark:text-slate-400 text-lg">
                Manage and track your team&apos;s tasks with real-time collaboration
              </p>
            </div>
            <Button 
              onClick={() => setShowCreateForm(true)} 
              className="flex items-center gap-2 bg-[#1976d2] hover:bg-[#1565c0] text-white shadow-md hover:shadow-lg"
            >
              <Plus className="h-4 w-4" />
              New Task
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white dark:bg-slate-800 border-[#e0e0e0] dark:border-slate-700 hover:border-[#1976d2] dark:hover:border-blue-600 transition-all shadow-sm hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[#757575] dark:text-slate-300">Total Tasks</CardTitle>
                <BarChart3 className="h-4 w-4 text-[#1976d2] dark:text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#212121] dark:text-slate-100">
                  {statsLoading ? '...' : stats?.total || 0}
                </div>
                <p className="text-xs text-[#757575] dark:text-slate-400">
                  Across all statuses
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-800 border-[#e0e0e0] dark:border-slate-700 hover:border-[#00796b] dark:hover:border-green-600 transition-all shadow-sm hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[#757575] dark:text-slate-300">In Progress</CardTitle>
                <Users className="h-4 w-4 text-[#00796b] dark:text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#212121] dark:text-slate-100">
                  {statsLoading ? '...' : stats?.byStatus[TaskStatus.IN_PROGRESS] || 0}
                </div>
                <p className="text-xs text-[#757575] dark:text-slate-400">
                  Currently active
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-800 border-[#e0e0e0] dark:border-slate-700 hover:border-[#f57c00] dark:hover:border-yellow-600 transition-all shadow-sm hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[#757575] dark:text-slate-300">High Priority</CardTitle>
                <AlertTriangle className="h-4 w-4 text-[#f57c00] dark:text-yellow-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#212121] dark:text-slate-100">
                  {statsLoading ? '...' : (stats?.byPriority.high || 0) + (stats?.byPriority.urgent || 0)}
                </div>
                <p className="text-xs text-[#757575] dark:text-slate-400">
                  Need attention
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-800 border-[#e0e0e0] dark:border-slate-700 hover:border-[#d32f2f] dark:hover:border-red-600 transition-all shadow-sm hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[#757575] dark:text-slate-300">Overdue</CardTitle>
                <AlertTriangle className="h-4 w-4 text-[#d32f2f] dark:text-red-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#d32f2f] dark:text-red-400">
                  {statsLoading ? '...' : stats?.overdue || 0}
                </div>
                <p className="text-xs text-[#757575] dark:text-slate-400">
                  Past due date
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Error Display */}
          {tasksError && (
            <div className="mb-6 p-4 bg-[#ffebee] dark:bg-red-900/20 border border-[#ffcdd2] dark:border-red-800 rounded-lg">
              <p className="text-[#d32f2f] dark:text-red-400 text-sm">
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
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-[#e0e0e0] dark:border-slate-800">
              <div className="text-sm text-[#757575] dark:text-slate-400">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} tasks
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1 || tasksLoading}
                  className="border-[#e0e0e0] dark:border-slate-700 text-[#212121] dark:text-slate-300 hover:bg-[#f5f5f5] dark:hover:bg-slate-800 disabled:opacity-50"
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
                            ? "bg-[#1976d2] text-white hover:bg-[#1565c0]"
                            : "border-[#e0e0e0] dark:border-slate-700 text-[#212121] dark:text-slate-300 hover:bg-[#f5f5f5] dark:hover:bg-slate-800 disabled:opacity-50"
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
                  className="border-[#e0e0e0] dark:border-slate-700 text-[#212121] dark:text-slate-300 hover:bg-[#f5f5f5] dark:hover:bg-slate-800 disabled:opacity-50"
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
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white dark:bg-slate-800 border border-[#e0e0e0] dark:border-slate-700 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
                <h3 className="text-lg font-semibold mb-4 text-[#212121] dark:text-slate-100">Assign Task</h3>
                <p className="text-sm text-[#757575] dark:text-slate-400 mb-6">
                  Assign &quot;{selectedTask.title}&quot; to a team member
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-[#212121] dark:text-slate-300 mb-2 block">
                      Select Assignee
                    </label>
                    <UserSelector
                      users={users}
                      value={selectedTask.assigneeId}
                      onValueChange={(userId) => {
                        // Update local state
                        setSelectedTask(prev => prev ? { ...prev, assigneeId: userId } : null);
                      }}
                      placeholder="Choose a team member..."
                      className="w-full"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowAssignModal(false);
                        setSelectedTask(null);
                      }}
                      className="border-[#e0e0e0] dark:border-slate-700 text-[#212121] dark:text-slate-300 hover:bg-[#f5f5f5] dark:hover:bg-slate-700"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => handleAssignSubmit(selectedTask.assigneeId)}
                      disabled={assignTaskMutation.isPending}
                      className="bg-[#1976d2] hover:bg-[#1565c0] text-white"
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

