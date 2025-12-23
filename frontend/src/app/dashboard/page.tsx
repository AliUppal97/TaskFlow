'use client';

import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { useAuth } from '@/providers/auth-provider';
import { useTasks } from '@/hooks/use-api';
import { useTaskUpdates } from '@/hooks/use-task-updates';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckSquare, Users, User, ArrowRight } from 'lucide-react';
import { TaskStatus, SortOrder } from '@/types';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Fetch recent tasks for the dashboard
  const {
    data: tasksResponse,
    isLoading: tasksLoading,
  } = useTasks({
    page: 1,
    limit: 5,
    sortBy: 'createdAt',
    sortOrder: SortOrder.DESC,
  });

  // Real-time updates
  useTaskUpdates();

  const recentTasks = tasksResponse?.data || [];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <main className="space-y-8">
            {/* Welcome Section */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-[#212121] dark:text-slate-100 mb-2">
                Welcome back{user?.profile?.firstName ? `, ${user.profile.firstName}` : ''}!
              </h1>
              <p className="text-[#757575] dark:text-slate-400 text-lg">
                Here&apos;s what&apos;s happening with your tasks today
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <Card className="cursor-pointer bg-white dark:bg-slate-800 border-[#e0e0e0] dark:border-slate-700 hover:border-[#1976d2] dark:hover:border-blue-600 transition-all duration-300 hover:shadow-lg hover:shadow-[#1976d2]/10 group" onClick={() => router.push('/tasks')}>
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-[#1976d2] flex items-center justify-center mb-4 transition-transform group-hover:scale-110 shadow-md">
                    <CheckSquare className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="flex items-center text-[#212121] dark:text-slate-100">
                    My Tasks
                  </CardTitle>
                  <CardDescription className="text-[#757575] dark:text-slate-400">
                    View and manage your assigned tasks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-[#1976d2] dark:text-blue-400">View Tasks</p>
                  <p className="text-sm text-[#9e9e9e] dark:text-slate-500">Click to explore</p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer bg-white dark:bg-slate-800 border-[#e0e0e0] dark:border-slate-700 hover:border-[#00796b] dark:hover:border-green-600 transition-all duration-300 hover:shadow-lg hover:shadow-[#00796b]/10 group" onClick={() => router.push('/tasks')}>
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-[#00796b] flex items-center justify-center mb-4 transition-transform group-hover:scale-110 shadow-md">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="flex items-center text-[#212121] dark:text-slate-100">
                    Team Tasks
                  </CardTitle>
                  <CardDescription className="text-[#757575] dark:text-slate-400">
                    See all tasks in your organization
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-[#00796b] dark:text-green-400">Browse All</p>
                  <p className="text-sm text-[#9e9e9e] dark:text-slate-500">Full task list</p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer bg-white dark:bg-slate-800 border-[#e0e0e0] dark:border-slate-700 hover:border-[#1976d2] dark:hover:border-purple-600 transition-all duration-300 hover:shadow-lg hover:shadow-[#1976d2]/10 group" onClick={() => router.push('/profile')}>
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-[#1976d2] flex items-center justify-center mb-4 transition-transform group-hover:scale-110 shadow-md">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="flex items-center text-[#212121] dark:text-slate-100">
                    Profile
                  </CardTitle>
                  <CardDescription className="text-[#757575] dark:text-slate-400">
                    Manage your account settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-[#1976d2] dark:text-purple-400">Settings</p>
                  <p className="text-sm text-[#9e9e9e] dark:text-slate-500">Update profile</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Tasks */}
            <div className="mt-8">
              <Card className="bg-white dark:bg-slate-800 border-[#e0e0e0] dark:border-slate-700 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle className="text-[#212121] dark:text-slate-100">Recent Tasks</CardTitle>
                    <CardDescription className="text-[#757575] dark:text-slate-400">
                      Your latest task activity
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/tasks')}
                    className="flex items-center gap-2 border-[#e0e0e0] dark:border-slate-700 text-[#212121] dark:text-slate-300 hover:bg-[#f5f5f5] dark:hover:bg-slate-700"
                  >
                    View All
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  {tasksLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="flex items-center space-x-4 p-4 rounded-lg bg-[#f5f5f5] dark:bg-slate-700/50 border border-[#e0e0e0] dark:border-slate-600">
                            <div className="w-4 h-4 bg-[#e0e0e0] dark:bg-slate-600 rounded-full"></div>
                            <div className="flex-1">
                              <div className="h-4 bg-[#e0e0e0] dark:bg-slate-600 rounded w-3/4 mb-2"></div>
                              <div className="h-3 bg-[#e0e0e0] dark:bg-slate-600 rounded w-1/2"></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : recentTasks.length > 0 ? (
                    <div className="space-y-2">
                      {recentTasks.slice(0, 5).map((task) => (
                        <div
                          key={task.id}
                          className="group flex items-center gap-4 p-4 rounded-lg bg-white dark:bg-slate-800 hover:bg-[#f8f9fa] dark:hover:bg-slate-700/50 transition-all duration-200 border border-[#e5e7eb] dark:border-slate-700 hover:border-[#d1d5db] dark:hover:border-slate-600 cursor-pointer shadow-sm hover:shadow-md"
                          onClick={() => router.push('/tasks')}
                        >
                          {/* Status Indicator */}
                          <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                            task.status === TaskStatus.TODO 
                              ? 'bg-white dark:bg-slate-600 border-2 border-[#9ca3af] dark:border-slate-400 shadow-sm' 
                              : task.status === TaskStatus.IN_PROGRESS 
                              ? 'bg-[#3b82f6] dark:bg-blue-400 shadow-sm shadow-blue-500/20' 
                              : task.status === TaskStatus.REVIEW 
                              ? 'bg-[#f59e0b] dark:bg-yellow-400 shadow-sm shadow-yellow-500/20' 
                              : 'bg-[#10b981] dark:bg-green-400 shadow-sm shadow-green-500/20'
                          }`}>
                            {task.status === TaskStatus.TODO && (
                              <div className="w-2.5 h-2.5 rounded-full bg-[#6b7280] dark:bg-slate-400"></div>
                            )}
                          </div>
                          
                          {/* Task Content */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[#111827] dark:text-slate-100 truncate mb-1.5 group-hover:text-[#3b82f6] dark:group-hover:text-blue-400 transition-colors">
                              {task.title}
                            </p>
                            <div className="flex items-center gap-2 flex-wrap">
                              {/* Status Badge */}
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold capitalize bg-[#f9fafb] dark:bg-slate-700 text-[#374151] dark:text-slate-300 border border-[#e5e7eb] dark:border-slate-600 shadow-sm">
                                {task.status.replace('_', ' ')}
                              </span>
                              
                              {/* Priority Badge */}
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold capitalize shadow-sm ${
                                task.priority === 'urgent' 
                                  ? 'bg-[#fef2f2] dark:bg-red-500/20 text-[#b91c1c] dark:text-red-400 border border-[#fecaca] dark:border-red-500/30'
                                  : task.priority === 'high'
                                  ? 'bg-[#fff7ed] dark:bg-orange-500/20 text-[#c2410c] dark:text-orange-400 border border-[#fed7aa] dark:border-orange-500/30'
                                  : task.priority === 'medium'
                                  ? 'bg-[#fffbeb] dark:bg-yellow-500/20 text-[#b45309] dark:text-yellow-400 border border-[#fde68a] dark:border-yellow-500/30'
                                  : 'bg-[#f0fdf4] dark:bg-green-500/20 text-[#166534] dark:text-green-400 border border-[#bbf7d0] dark:border-green-500/30'
                              }`}>
                                {task.priority}
                              </span>
                              
                              {/* Due Date */}
                              {task.dueDate && (
                                <>
                                  <span className={`inline-flex items-center text-xs font-medium text-[#6b7280] dark:text-slate-400 ${
                                    task.isOverdue ? 'text-[#dc2626] dark:text-red-400' : ''
                                  }`}>
                                    {new Date(task.dueDate).toLocaleDateString()}
                                  </span>
                                  {task.isOverdue && (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold text-[#b91c1c] dark:text-red-400 bg-[#fef2f2] dark:bg-red-500/20 border border-[#fecaca] dark:border-red-500/30 shadow-sm">
                                      Overdue
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                          
                          {/* Assignee Badge */}
                          {task.assignee && (
                            <div className="flex-shrink-0">
                              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-[#e5e7eb] dark:border-slate-600 shadow-sm hover:shadow-md hover:border-[#d1d5db] dark:hover:border-slate-500 transition-all duration-200 group/assignee">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#3b82f6] via-[#2563eb] to-[#1d4ed8] dark:from-blue-500 dark:via-blue-600 dark:to-blue-700 flex items-center justify-center shadow-md ring-1 ring-[#3b82f6]/20 dark:ring-blue-500/30 group-hover/assignee:ring-[#3b82f6]/30 dark:group-hover/assignee:ring-blue-500/40 transition-all">
                                  <span className="text-[11px] font-bold text-white leading-none drop-shadow-sm">
                                    {(task.assignee.profile?.firstName || task.assignee.email || 'U')[0].toUpperCase()}
                                  </span>
                                </div>
                                <span className="text-xs font-semibold text-[#111827] dark:text-slate-200 whitespace-nowrap group-hover/assignee:text-[#030712] dark:group-hover/assignee:text-slate-100 transition-colors">
                                  {task.assignee.profile?.firstName || task.assignee.email?.split('@')[0] || 'Unassigned'}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#f5f5f5] dark:bg-slate-800 mb-4">
                        <CheckSquare className="h-8 w-8 text-[#9e9e9e] dark:text-slate-500" />
                      </div>
                      <p className="text-base font-medium text-[#424242] dark:text-slate-300 mb-2">No tasks yet</p>
                      <p className="text-sm text-[#757575] dark:text-slate-400 mb-6">Get started by creating your first task</p>
                      <Button
                        onClick={() => router.push('/tasks')}
                        className="bg-[#1976d2] hover:bg-[#1565c0] text-white shadow-md hover:shadow-lg transition-all duration-200"
                      >
                        Create Your First Task
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
