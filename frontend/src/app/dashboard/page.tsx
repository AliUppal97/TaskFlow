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
                    <div className="space-y-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="flex items-center space-x-4 p-4 rounded-lg bg-[#f5f5f5] dark:bg-slate-700/50">
                            <div className="w-3 h-3 bg-[#e0e0e0] dark:bg-slate-600 rounded-full"></div>
                            <div className="flex-1">
                              <div className="h-4 bg-[#e0e0e0] dark:bg-slate-600 rounded w-3/4 mb-2"></div>
                              <div className="h-3 bg-[#e0e0e0] dark:bg-slate-600 rounded w-1/2"></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : recentTasks.length > 0 ? (
                    <div className="space-y-3">
                      {recentTasks.slice(0, 5).map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center space-x-4 p-4 rounded-lg bg-[#f5f5f5] dark:bg-slate-700/50 hover:bg-[#e3f2fd] dark:hover:bg-blue-900/20 transition-colors border border-[#e0e0e0] dark:border-slate-600 cursor-pointer"
                          onClick={() => router.push('/tasks')}
                        >
                          <div className={`w-3 h-3 rounded-full shadow-md ${
                            task.status === TaskStatus.TODO ? 'bg-[#f5f5f5] dark:bg-slate-600 border border-[#e0e0e0] dark:border-slate-500' :
                            task.status === TaskStatus.IN_PROGRESS ? 'bg-[#1976d2] dark:bg-blue-400' :
                            task.status === TaskStatus.REVIEW ? 'bg-[#f57c00] dark:bg-yellow-400' :
                            'bg-[#00796b] dark:bg-green-400'
                          }`}></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#212121] dark:text-slate-100 truncate">
                              {task.title}
                            </p>
                            <p className="text-xs text-[#757575] dark:text-slate-400">
                              {task.status.replace('_', ' ')} • {task.priority} priority
                              {task.dueDate && (
                                <>
                                  {' • '}
                                  Due {new Date(task.dueDate).toLocaleDateString()}
                                  {task.isOverdue && (
                                    <span className="text-[#d32f2f] dark:text-red-400 ml-1">(Overdue)</span>
                                  )}
                                </>
                              )}
                            </p>
                          </div>
                          {task.assignee && (
                            <div className="text-xs text-[#757575] dark:text-slate-400">
                              {task.assignee.profile?.firstName || task.assignee.email}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CheckSquare className="h-12 w-12 text-[#9e9e9e] dark:text-slate-500 mx-auto mb-4" />
                      <p className="text-[#757575] dark:text-slate-400 mb-4">No tasks yet</p>
                      <Button
                        onClick={() => router.push('/tasks')}
                        className="bg-[#1976d2] hover:bg-[#1565c0] text-white"
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
