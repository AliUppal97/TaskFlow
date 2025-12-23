'use client';

import { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  Users,
  Shield,
  BarChart3,
  Activity,
  CheckCircle,
  TrendingUp,
  Loader2,
  RefreshCw,
  Search,
  X,
  AlertCircle,
  Info,
  Settings,
  User as UserIcon,
  CheckSquare,
  Trash2,
} from 'lucide-react';

import { RoleProtectedRoute } from '@/components/auth/role-protected-route';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  useUsers,
  useTasks,
  useTaskStats,
  useUpdateUserRole,
  useUpdateUserStatus,
  useAssignTask,
} from '@/hooks/use-api';
import { UserRole, TaskStatus, TaskPriority, type User, type Task } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserSelector } from '@/features/tasks/components/user-selector';

// Simple toast notification component
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info' | 'delete'; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' 
    ? 'bg-[#e0f2f1] dark:bg-green-500/20 border-[#b2dfdb] dark:border-green-500/30 text-[#00796b] dark:text-green-300'
    : type === 'error' || type === 'delete'
    ? 'bg-[#ffebee] dark:bg-red-500/20 border-[#ffcdd2] dark:border-red-500/30 text-[#d32f2f] dark:text-red-300'
    : 'bg-[#e3f2fd] dark:bg-blue-500/20 border-[#bbdefb] dark:border-blue-500/30 text-[#1976d2] dark:text-blue-300';

  return (
    <div className={`fixed top-28 right-4 z-50 flex items-center gap-3 p-4 rounded-lg border shadow-lg ${bgColor} animate-in slide-in-from-top-5`}>
      {type === 'success' && <CheckCircle className="h-5 w-5" />}
      {type === 'delete' && <Trash2 className="h-5 w-5" />}
      {type === 'error' && <AlertCircle className="h-5 w-5" />}
      {type === 'info' && <Info className="h-5 w-5" />}
      <p className="text-sm font-medium">{message}</p>
      <button onClick={onClose} className="ml-2 hover:opacity-70">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function AdminPageContent() {
  const { user: currentUser } = useAuth();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [userPage, setUserPage] = useState(1);
  const [userRoleFilter, setUserRoleFilter] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'delete' } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    confirmText?: string;
    variant?: 'default' | 'destructive';
  }>({
    open: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  // Reset page when filter changes - handled in filter change handlers

  // Fetch users data
  const {
    data: usersResponse,
    isLoading: usersLoading,
    error: usersError,
    refetch: refetchUsers,
  } = useUsers({
    page: userPage,
    limit: 10,
    role: userRoleFilter as UserRole | undefined,
  });

  // Fetch all tasks for stats (admin can see all tasks)
  const {
    data: tasksResponse,
    isLoading: tasksLoading,
  } = useTasks({ limit: 1000 });

  // Fetch task stats
  const {
    data: taskStats,
    isLoading: taskStatsLoading,
  } = useTaskStats();

  // User management mutations
  const updateRoleMutation = useUpdateUserRole({
    onSuccess: () => {
      refetchUsers();
      setToast({ message: 'User role updated successfully', type: 'success' });
    },
    onError: (error: Error) => {
      const message = error.message || 'Failed to update user role';
      setToast({ message, type: 'error' });
    },
  });

  const updateStatusMutation = useUpdateUserStatus({
    onSuccess: () => {
      refetchUsers();
      setToast({ message: 'User status updated successfully', type: 'success' });
    },
    onError: (error: Error) => {
      const message = error.message || 'Failed to update user status';
      setToast({ message, type: 'error' });
    },
  });

  // Task assignment mutation
  const assignTaskMutation = useAssignTask({
    onSuccess: () => {
      setToast({ message: 'Task assigned successfully', type: 'success' });
    },
    onError: (error: Error) => {
      const message = error.message || 'Failed to assign task';
      setToast({ message, type: 'error' });
    },
  });

  // Fetch all users for assignment (without filters)
  const {
    data: allUsersResponse,
  } = useUsers({ limit: 1000 });

  // Get all users for assignment selector
  const allUsers = useMemo((): User[] => {
    return allUsersResponse?.data || [];
  }, [allUsersResponse]);

  // Get tasks array
  const tasks = useMemo((): Task[] => {
    return Array.isArray(tasksResponse) 
      ? tasksResponse 
      : tasksResponse?.data || [];
  }, [tasksResponse]);

  // Calculate stats from real data
  const stats = useMemo(() => {
    const users = usersResponse?.data || [];

    const totalUsers = usersResponse?.pagination?.total || 0;
    const activeUsers = users.filter(u => u.isActive !== false).length;
    const adminUsers = users.filter(u => u.role === UserRole.ADMIN).length;
    const regularUsers = users.filter(u => u.role === UserRole.USER).length;
    const totalTasks = taskStats?.total || tasks.length;
    const completedTasks = taskStats?.byStatus?.[TaskStatus.DONE] || 
      tasks.filter(t => t.status === TaskStatus.DONE).length;
    const inProgressTasks = taskStats?.byStatus?.[TaskStatus.IN_PROGRESS] || 
      tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
    const todoTasks = taskStats?.byStatus?.[TaskStatus.TODO] || 
      tasks.filter(t => t.status === TaskStatus.TODO).length;
    const completionRate = totalTasks > 0 
      ? Math.round((completedTasks / totalTasks) * 100) 
      : 0;

    return {
      totalUsers,
      activeUsers,
      adminUsers,
      regularUsers,
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      completionRate,
    };
  }, [usersResponse, tasks, taskStats]);

  // Filter users by search query
  const users = useMemo((): User[] => {
    const allUsers = usersResponse?.data || [];
    if (!searchQuery.trim()) {
      return allUsers;
    }
    const query = searchQuery.toLowerCase();
    return allUsers.filter(user => 
      user.email.toLowerCase().includes(query) ||
      user.profile?.firstName?.toLowerCase().includes(query) ||
      user.profile?.lastName?.toLowerCase().includes(query) ||
      `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.toLowerCase().includes(query)
    );
  }, [usersResponse, searchQuery]);

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    } else {
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(d);
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive
      ? 'bg-[#e0f2f1] dark:bg-green-500/20 text-[#00796b] dark:text-green-300 border border-[#b2dfdb] dark:border-green-500/30'
      : 'bg-[#f5f5f5] dark:bg-slate-700/50 text-[#757575] dark:text-slate-200 border border-[#e0e0e0] dark:border-slate-600/50';
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'bg-[#ffebee] dark:bg-red-500/20 text-[#d32f2f] dark:text-red-300 border border-[#ffcdd2] dark:border-red-500/30';
      case UserRole.USER:
        return 'bg-[#e3f2fd] dark:bg-blue-500/20 text-[#1976d2] dark:text-blue-300 border border-[#bbdefb] dark:border-blue-500/30';
      default:
        return 'bg-[#f5f5f5] dark:bg-slate-700/50 text-[#757575] dark:text-slate-200 border border-[#e0e0e0] dark:border-slate-600/50';
    }
  };

  const getTaskStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.TODO:
        return 'bg-[#f5f5f5] dark:bg-slate-700/50 text-[#757575] dark:text-slate-200 border border-[#e0e0e0] dark:border-slate-600/50';
      case TaskStatus.IN_PROGRESS:
        return 'bg-[#e3f2fd] dark:bg-blue-500/20 text-[#1976d2] dark:text-blue-300 border border-[#bbdefb] dark:border-blue-500/30';
      case TaskStatus.DONE:
        return 'bg-[#e0f2f1] dark:bg-green-500/20 text-[#00796b] dark:text-green-300 border border-[#b2dfdb] dark:border-green-500/30';
      default:
        return 'bg-[#f5f5f5] dark:bg-slate-700/50 text-[#757575] dark:text-slate-200 border border-[#e0e0e0] dark:border-slate-600/50';
    }
  };

  const getTaskPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.LOW:
        return 'bg-[#e0f2f1] dark:bg-green-500/20 text-[#00796b] dark:text-green-300 border border-[#b2dfdb] dark:border-green-500/30';
      case TaskPriority.MEDIUM:
        return 'bg-[#fff3e0] dark:bg-orange-500/20 text-[#f57c00] dark:text-orange-300 border border-[#ffe0b2] dark:border-orange-500/30';
      case TaskPriority.HIGH:
        return 'bg-[#ffebee] dark:bg-red-500/20 text-[#d32f2f] dark:text-red-300 border border-[#ffcdd2] dark:border-red-500/30';
      case TaskPriority.URGENT:
        return 'bg-[#f3e5f5] dark:bg-purple-500/20 text-[#7b1fa2] dark:text-purple-300 border border-[#e1bee7] dark:border-purple-500/30';
      default:
        return 'bg-[#f5f5f5] dark:bg-slate-700/50 text-[#757575] dark:text-slate-200 border border-[#e0e0e0] dark:border-slate-600/50';
    }
  };

  const getAssigneeName = (task: Task) => {
    if (!task.assignee) return 'Unassigned';
    if (task.assignee.profile?.firstName && task.assignee.profile?.lastName) {
      return `${task.assignee.profile.firstName} ${task.assignee.profile.lastName}`;
    }
    return task.assignee.email || 'Unknown';
  };

  const handleRoleChange = (userId: string, currentRole: UserRole, newRole: UserRole) => {
    // Prevent changing own role
    if (currentUser?.id === userId) {
      setToast({ 
        message: 'You cannot change your own role', 
        type: 'error' 
      });
      return;
    }

    // Show confirmation dialog
    setConfirmDialog({
      open: true,
      title: 'Change User Role',
      description: `Are you sure you want to change this user's role from ${currentRole.toUpperCase()} to ${newRole.toUpperCase()}?`,
      confirmText: 'Change Role',
      variant: 'default',
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, open: false });
        await updateRoleMutation.mutateAsync({ userId, role: newRole });
      },
    });
  };

  const handleStatusChange = (userId: string, currentStatus: boolean, newStatus: boolean) => {
    // Prevent deactivating own account
    if (currentUser?.id === userId && !newStatus) {
      setToast({ 
        message: 'You cannot deactivate your own account', 
        type: 'error' 
      });
      return;
    }

    // Show confirmation dialog
    setConfirmDialog({
      open: true,
      title: newStatus ? 'Activate User Account' : 'Deactivate User Account',
      description: newStatus
        ? 'Are you sure you want to activate this user account?'
        : 'Are you sure you want to deactivate this user account? The user will not be able to log in.',
      confirmText: newStatus ? 'Activate' : 'Deactivate',
      variant: newStatus ? 'default' : 'destructive',
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, open: false });
        await updateStatusMutation.mutateAsync({ userId, isActive: newStatus });
      },
    });
  };

  const isLoading = usersLoading || tasksLoading || taskStatsLoading;

  return (
    <RoleProtectedRoute allowedRoles={[UserRole.ADMIN]}>
      <div className="min-h-screen bg-white dark:bg-slate-900">
        {/* Toast Notification */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}

        {/* Confirmation Dialog */}
        <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{confirmDialog.title}</DialogTitle>
              <DialogDescription>{confirmDialog.description}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}
                disabled={updateRoleMutation.isPending || updateStatusMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant={confirmDialog.variant === 'destructive' ? 'destructive' : 'default'}
                onClick={confirmDialog.onConfirm}
                disabled={updateRoleMutation.isPending || updateStatusMutation.isPending}
              >
                {updateRoleMutation.isPending || updateStatusMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  confirmDialog.confirmText || 'Confirm'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-[#212121] dark:text-slate-100 flex items-center mb-2">
              <Shield className="mr-3 h-8 w-8 text-[#1976d2] dark:text-indigo-400" />
              Admin Dashboard
            </h1>
            <p className="text-[#757575] dark:text-slate-400 text-lg">
              Manage users, monitor system health, and configure application settings
            </p>
          </div>

          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="users">User Management</TabsTrigger>
              <TabsTrigger value="system">System Health</TabsTrigger>
              <TabsTrigger value="settings">System Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-white dark:bg-slate-800 border-[#e0e0e0] dark:border-slate-700 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-[#757575] dark:text-slate-300">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-[#9e9e9e] dark:text-slate-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-[#212121] dark:text-slate-100">
                      {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.totalUsers}
                    </div>
                    <p className="text-xs text-[#757575] dark:text-slate-400">
                      {stats.activeUsers} active
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-800 border-[#e0e0e0] dark:border-slate-700 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-[#757575] dark:text-slate-300">Active Users</CardTitle>
                    <Activity className="h-4 w-4 text-[#9e9e9e] dark:text-slate-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-[#212121] dark:text-slate-100">
                      {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.activeUsers}
                    </div>
                    <p className="text-xs text-[#757575] dark:text-slate-400">
                      {stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}% of total
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-800 border-[#e0e0e0] dark:border-slate-700 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-[#757575] dark:text-slate-300">Total Tasks</CardTitle>
                    <BarChart3 className="h-4 w-4 text-[#9e9e9e] dark:text-slate-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-[#212121] dark:text-slate-100">
                      {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.totalTasks.toLocaleString()}
                    </div>
                    <p className="text-xs text-[#757575] dark:text-slate-400">
                      {stats.completedTasks} completed
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-800 border-[#e0e0e0] dark:border-slate-700 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-[#757575] dark:text-slate-300">Completion Rate</CardTitle>
                    <CheckCircle className="h-4 w-4 text-[#00796b] dark:text-green-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-[#00796b] dark:text-green-400">
                      {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : `${stats.completionRate}%`}
                    </div>
                    <p className="text-xs text-[#757575] dark:text-slate-400">
                      Task completion rate
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-white dark:bg-slate-800 border-[#e0e0e0] dark:border-slate-700 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-[#212121] dark:text-slate-100">User Breakdown</CardTitle>
                    <CardDescription className="text-[#757575] dark:text-slate-400">User distribution by role</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[#212121] dark:text-slate-300">Admins</span>
                        <Badge className={getRoleColor(UserRole.ADMIN)}>
                          {stats.adminUsers}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#212121] dark:text-slate-300">Regular Users</span>
                        <Badge className={getRoleColor(UserRole.USER)}>
                          {stats.regularUsers}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#212121] dark:text-slate-300">Inactive</span>
                        <Badge className={getStatusColor(false)}>
                          {stats.totalUsers - stats.activeUsers}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-800 border-[#e0e0e0] dark:border-slate-700 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-[#212121] dark:text-slate-100">Task Breakdown</CardTitle>
                    <CardDescription className="text-[#757575] dark:text-slate-400">Tasks by status</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[#212121] dark:text-slate-300">To Do</span>
                        <span className="font-medium text-[#212121] dark:text-slate-100">{stats.todoTasks}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#212121] dark:text-slate-300">In Progress</span>
                        <span className="font-medium text-[#1976d2] dark:text-blue-400">{stats.inProgressTasks}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#212121] dark:text-slate-300">Completed</span>
                        <span className="font-medium text-[#00796b] dark:text-green-400">{stats.completedTasks}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#212121] dark:text-slate-300">Overdue</span>
                        <span className="font-medium text-[#d32f2f] dark:text-red-400">{taskStats?.overdue || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity & Quick Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white dark:bg-slate-800 border-[#e0e0e0] dark:border-slate-700 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-[#212121] dark:text-slate-100">Recent Users</CardTitle>
                    <CardDescription className="text-[#757575] dark:text-slate-400">Latest registered users</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {usersLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-[#1976d2]" />
                      </div>
                    ) : users.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 mx-auto text-[#9e9e9e] dark:text-slate-500 mb-2" />
                        <p className="text-sm text-[#757575] dark:text-slate-400">No users found</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {users.slice(0, 5).map((user) => (
                          <div key={user.id} className="flex items-center space-x-4">
                            <div className="w-2 h-2 bg-[#1976d2] dark:bg-blue-400 rounded-full"></div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-[#212121] dark:text-slate-100">
                                {user.profile?.firstName && user.profile?.lastName
                                  ? `${user.profile.firstName} ${user.profile.lastName}`
                                  : user.email}
                              </p>
                              <p className="text-xs text-[#757575] dark:text-slate-400">{user.email}</p>
                            </div>
                            <span className="text-xs text-[#9e9e9e] dark:text-slate-500">
                              {formatDate(user.createdAt)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-800 border-[#e0e0e0] dark:border-slate-700 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-[#212121] dark:text-slate-100">Quick Actions</CardTitle>
                    <CardDescription className="text-[#757575] dark:text-slate-400">Common administrative tasks</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      className="w-full justify-start border-[#e0e0e0] dark:border-slate-700 text-[#212121] dark:text-slate-300 hover:bg-[#f5f5f5] dark:hover:bg-slate-800" 
                      variant="outline"
                      onClick={() => setSelectedTab('users')}
                    >
                      <Users className="mr-2 h-4 w-4" />
                      Manage Users
                    </Button>
                    <Button 
                      className="w-full justify-start border-[#e0e0e0] dark:border-slate-700 text-[#212121] dark:text-slate-300 hover:bg-[#f5f5f5] dark:hover:bg-slate-800" 
                      variant="outline"
                      onClick={() => {
                        refetchUsers();
                        setToast({ message: 'Data refreshed successfully', type: 'success' });
                      }}
                      disabled={isLoading}
                    >
                      <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                      Refresh Data
                    </Button>
                    <Button 
                      className="w-full justify-start border-[#e0e0e0] dark:border-slate-700 text-[#212121] dark:text-slate-300 hover:bg-[#f5f5f5] dark:hover:bg-slate-800" 
                      variant="outline"
                      onClick={() => setSelectedTab('system')}
                    >
                      <Activity className="mr-2 h-4 w-4" />
                      System Health
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* System Performance */}
              <Card className="bg-white dark:bg-slate-800 border-[#e0e0e0] dark:border-slate-700 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-[#212121] dark:text-slate-100">System Performance</CardTitle>
                  <CardDescription className="text-[#757575] dark:text-slate-400">Real-time system metrics and health indicators</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[#00796b] dark:text-green-400">
                        {stats.totalUsers}
                      </div>
                      <div className="text-sm text-[#757575] dark:text-slate-400">Total Users</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[#1976d2] dark:text-blue-400">
                        {stats.totalTasks}
                      </div>
                      <div className="text-sm text-[#757575] dark:text-slate-400">Total Tasks</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[#d32f2f] dark:text-red-400">
                        {taskStats?.overdue || 0}
                      </div>
                      <div className="text-sm text-[#757575] dark:text-slate-400">Overdue Tasks</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[#7b1fa2] dark:text-purple-400">
                        {stats.completionRate}%
                      </div>
                      <div className="text-sm text-[#757575] dark:text-slate-400">Task Completion Rate</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tasks Table */}
              <Card className="bg-white dark:bg-slate-800 border-[#e0e0e0] dark:border-slate-700 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-[#212121] dark:text-slate-100 flex items-center">
                    <CheckSquare className="mr-2 h-5 w-5 text-[#1976d2] dark:text-blue-400" />
                    All Tasks
                  </CardTitle>
                  <CardDescription className="text-[#757575] dark:text-slate-400">
                    View all tasks with assignee information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {tasksLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-[#1976d2] mx-auto mb-2" />
                        <p className="text-sm text-[#757575] dark:text-slate-400">Loading tasks...</p>
                      </div>
                    </div>
                  ) : tasks.length === 0 ? (
                    <div className="text-center py-12">
                      <CheckSquare className="h-12 w-12 mx-auto text-[#9e9e9e] dark:text-slate-500 mb-2" />
                      <p className="text-sm text-[#757575] dark:text-slate-400">No tasks found</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-[#212121] dark:text-slate-300">Task</TableHead>
                            <TableHead className="text-[#212121] dark:text-slate-300">Status</TableHead>
                            <TableHead className="text-[#212121] dark:text-slate-300">Priority</TableHead>
                            <TableHead className="text-[#212121] dark:text-slate-300">Assignee</TableHead>
                            <TableHead className="text-[#212121] dark:text-slate-300">Creator</TableHead>
                            <TableHead className="text-[#212121] dark:text-slate-300">Due Date</TableHead>
                            <TableHead className="text-[#212121] dark:text-slate-300">Created</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tasks.slice(0, 50).map((task) => (
                            <TableRow key={task.id}>
                              <TableCell>
                                <div>
                                  <div className="font-medium text-[#212121] dark:text-slate-100">
                                    {task.title}
                                  </div>
                                  {task.description && (
                                    <div className="text-sm text-[#757575] dark:text-slate-400 line-clamp-1 mt-1">
                                      {task.description}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={getTaskStatusColor(task.status)}>
                                  {task.status.replace('_', ' ')}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge className={getTaskPriorityColor(task.priority)}>
                                  {task.priority}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <UserSelector
                                  users={allUsers}
                                  value={task.assigneeId || null}
                                  onValueChange={(assigneeId) => {
                                    assignTaskMutation.mutate({
                                      id: task.id,
                                      assigneeId,
                                    });
                                  }}
                                  placeholder="Unassigned"
                                  disabled={assignTaskMutation.isPending}
                                  className="w-[200px]"
                                />
                              </TableCell>
                              <TableCell>
                                {task.creator ? (
                                  <div className="text-sm text-[#212121] dark:text-slate-100">
                                    {task.creator.profile?.firstName && task.creator.profile?.lastName
                                      ? `${task.creator.profile.firstName} ${task.creator.profile.lastName}`
                                      : task.creator.email}
                                  </div>
                                ) : (
                                  <span className="text-sm text-[#757575] dark:text-slate-400">—</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {task.dueDate ? (
                                  <div className={`text-sm ${task.isOverdue ? 'text-[#d32f2f] dark:text-red-400 font-medium' : 'text-[#212121] dark:text-slate-300'}`}>
                                    {new Date(task.dueDate).toLocaleDateString()}
                                    {task.isOverdue && (
                                      <span className="ml-1 text-xs">(Overdue)</span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-sm text-[#757575] dark:text-slate-400">—</span>
                                )}
                              </TableCell>
                              <TableCell className="text-sm text-[#757575] dark:text-slate-400">
                                {formatDate(task.createdAt)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {tasks.length > 50 && (
                        <div className="mt-4 text-center text-sm text-[#757575] dark:text-slate-400">
                          Showing first 50 of {tasks.length} tasks
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="space-y-6">
              <Card className="bg-white dark:bg-slate-800 border-[#e0e0e0] dark:border-slate-700 shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <CardTitle className="text-[#212121] dark:text-slate-100">User Management</CardTitle>
                      <CardDescription className="text-[#757575] dark:text-slate-400">Manage user accounts, roles, and permissions</CardDescription>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#9e9e9e] dark:text-slate-400" />
                        <Input
                          placeholder="Search users..."
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setUserPage(1);
                          }}
                          className="pl-9 w-[200px]"
                        />
                      </div>
                      <Select value={userRoleFilter || 'all'} onValueChange={(value) => {
                        setUserRoleFilter(value === 'all' ? undefined : value);
                        setUserPage(1);
                      }}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Filter by role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Roles</SelectItem>
                          <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                          <SelectItem value={UserRole.USER}>User</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          refetchUsers();
                          setToast({ message: 'Users refreshed', type: 'success' });
                        }}
                        disabled={usersLoading}
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${usersLoading ? 'animate-spin' : ''}`} />
                        Refresh
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {usersError ? (
                    <div className="text-center py-8">
                      <AlertCircle className="h-12 w-12 mx-auto text-red-500 dark:text-red-400 mb-2" />
                      <p className="text-red-500 dark:text-red-400 font-medium">Error loading users</p>
                      <p className="text-sm text-[#757575] dark:text-slate-400 mt-1">
                        {usersError instanceof Error ? usersError.message : 'Please try again'}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refetchUsers()}
                        className="mt-4"
                      >
                        Try Again
                      </Button>
                    </div>
                  ) : usersLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-[#1976d2] mx-auto mb-2" />
                        <p className="text-sm text-[#757575] dark:text-slate-400">Loading users...</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {searchQuery && (
                        <div className="mb-4 flex items-center justify-between">
                          <p className="text-sm text-[#757575] dark:text-slate-400">
                            Found {users.length} user{users.length !== 1 ? 's' : ''} matching &quot;{searchQuery}&quot;
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSearchQuery('')}
                            className="h-8"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Clear
                          </Button>
                        </div>
                      )}
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-[#212121] dark:text-slate-300">User</TableHead>
                            <TableHead className="text-[#212121] dark:text-slate-300">Role</TableHead>
                            <TableHead className="text-[#212121] dark:text-slate-300">Status</TableHead>
                            <TableHead className="text-[#212121] dark:text-slate-300">Created</TableHead>
                            <TableHead className="text-[#212121] dark:text-slate-300">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {users.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-12">
                                <Users className="h-12 w-12 mx-auto text-[#9e9e9e] dark:text-slate-500 mb-2" />
                                <p className="text-[#757575] dark:text-slate-400 font-medium">No users found</p>
                                {searchQuery && (
                                  <p className="text-sm text-[#757575] dark:text-slate-400 mt-1">
                                    Try adjusting your search query
                                  </p>
                                )}
                              </TableCell>
                            </TableRow>
                          ) : (
                            users.map((user) => {
                              const isCurrentUser = currentUser?.id === user.id;
                              const isActive = user.isActive !== false;
                              
                              return (
                                <TableRow key={user.id}>
                                  <TableCell>
                                    <div>
                                      <div className="font-medium text-[#212121] dark:text-slate-100 flex items-center gap-2">
                                        {user.profile?.firstName && user.profile?.lastName
                                          ? `${user.profile.firstName} ${user.profile.lastName}`
                                          : user.email}
                                        {isCurrentUser && (
                                          <Badge variant="outline" className="text-xs">You</Badge>
                                        )}
                                      </div>
                                      <div className="text-sm text-[#757575] dark:text-slate-400">{user.email}</div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Select
                                      value={user.role}
                                      onValueChange={(value) => handleRoleChange(user.id, user.role, value as UserRole)}
                                      disabled={updateRoleMutation.isPending || isCurrentUser}
                                    >
                                      <SelectTrigger className="w-[100px]">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value={UserRole.ADMIN}>ADMIN</SelectItem>
                                        <SelectItem value={UserRole.USER}>USER</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </TableCell>
                                  <TableCell>
                                    <Badge className={getStatusColor(isActive)}>
                                      {isActive ? 'Active' : 'Inactive'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-sm text-[#757575] dark:text-slate-400">
                                    {formatDate(user.createdAt)}
                                  </TableCell>
                                  <TableCell>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleStatusChange(user.id, isActive, !isActive)}
                                      disabled={updateStatusMutation.isPending || (isCurrentUser && !isActive)}
                                      className="border-[#e0e0e0] dark:border-slate-700 text-[#212121] dark:text-slate-300 hover:bg-[#f5f5f5] dark:hover:bg-slate-800"
                                    >
                                      {isActive ? 'Deactivate' : 'Activate'}
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          )}
                        </TableBody>
                      </Table>
                      {!searchQuery && usersResponse?.pagination && usersResponse.pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#e0e0e0] dark:border-slate-700">
                          <div className="text-sm text-[#757575] dark:text-slate-400">
                            Showing {((usersResponse.pagination.page - 1) * usersResponse.pagination.limit) + 1} to{' '}
                            {Math.min(usersResponse.pagination.page * usersResponse.pagination.limit, usersResponse.pagination.total)} of{' '}
                            {usersResponse.pagination.total} users
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setUserPage(p => Math.max(1, p - 1))}
                              disabled={userPage === 1 || usersLoading}
                            >
                              Previous
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setUserPage(p => p + 1)}
                              disabled={userPage >= usersResponse.pagination.totalPages || usersLoading}
                            >
                              Next
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="system" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-white dark:bg-slate-800 border-[#e0e0e0] dark:border-slate-700 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center text-[#212121] dark:text-slate-100">
                      <Activity className="mr-2 h-5 w-5 text-[#00796b] dark:text-green-400" />
                      System Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[#212121] dark:text-slate-300">Database</span>
                      <Badge className="bg-[#e0f2f1] dark:bg-green-500/20 text-[#00796b] dark:text-green-300 border border-[#b2dfdb] dark:border-green-500/30">Healthy</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#212121] dark:text-slate-300">API Server</span>
                      <Badge className="bg-[#e0f2f1] dark:bg-green-500/20 text-[#00796b] dark:text-green-300 border border-[#b2dfdb] dark:border-green-500/30">Healthy</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#212121] dark:text-slate-300">WebSocket</span>
                      <Badge className="bg-[#e0f2f1] dark:bg-green-500/20 text-[#00796b] dark:text-green-300 border border-[#b2dfdb] dark:border-green-500/30">Healthy</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-800 border-[#e0e0e0] dark:border-slate-700 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center text-[#212121] dark:text-slate-100">
                      <TrendingUp className="mr-2 h-5 w-5 text-[#1976d2] dark:text-blue-400" />
                      Task Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[#212121] dark:text-slate-300">Total Tasks</span>
                      <span className="font-medium text-[#212121] dark:text-slate-100">{stats.totalTasks}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#212121] dark:text-slate-300">To Do</span>
                      <span className="font-medium text-[#212121] dark:text-slate-100">{stats.todoTasks}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#212121] dark:text-slate-300">In Progress</span>
                      <span className="font-medium text-[#1976d2] dark:text-blue-400">{stats.inProgressTasks}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#212121] dark:text-slate-300">Completed</span>
                      <span className="font-medium text-[#00796b] dark:text-green-400">{stats.completedTasks}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#212121] dark:text-slate-300">Overdue</span>
                      <span className="font-medium text-[#d32f2f] dark:text-red-400">{taskStats?.overdue || 0}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-[#e0e0e0] dark:border-slate-700">
                      <span className="text-[#212121] dark:text-slate-300 font-medium">Completion Rate</span>
                      <span className="font-bold text-[#00796b] dark:text-green-400">{stats.completionRate}%</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <Card className="bg-white dark:bg-slate-800 border-[#e0e0e0] dark:border-slate-700 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-[#212121] dark:text-slate-100">System Configuration</CardTitle>
                  <CardDescription className="text-[#757575] dark:text-slate-400">Configure global system settings and preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center py-12">
                    <Settings className="h-16 w-16 mx-auto text-[#9e9e9e] dark:text-slate-500 mb-4" />
                    <p className="text-[#757575] dark:text-slate-400 font-medium">System configuration settings</p>
                    <p className="text-sm text-[#757575] dark:text-slate-400 mt-1">
                      Coming soon in a future update
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </RoleProtectedRoute>
  );
}

export default dynamic(() => Promise.resolve(AdminPageContent), {
  ssr: false,
});
