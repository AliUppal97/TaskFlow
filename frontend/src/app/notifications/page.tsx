'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Bell, CheckSquare, AlertCircle, Info, X, Check, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiClient } from '@/lib/api-client';
import { Notification, NotificationType } from '@/types';

const notificationIcons = {
  [NotificationType.TASK_ASSIGNED]: CheckSquare,
  [NotificationType.TASK_COMPLETED]: CheckSquare,
  [NotificationType.TASK_UPDATED]: CheckSquare,
  [NotificationType.TASK_CREATED]: CheckSquare,
  [NotificationType.TASK_DUE_SOON]: AlertCircle,
  [NotificationType.SYSTEM]: Info,
};

const notificationColors = {
  [NotificationType.TASK_ASSIGNED]: 'text-[#1976d2] dark:text-blue-400 bg-[#e3f2fd] dark:bg-blue-500/20 border border-[#bbdefb] dark:border-blue-500/30',
  [NotificationType.TASK_COMPLETED]: 'text-[#00796b] dark:text-green-400 bg-[#e0f2f1] dark:bg-green-500/20 border border-[#b2dfdb] dark:border-green-500/30',
  [NotificationType.TASK_UPDATED]: 'text-[#1976d2] dark:text-blue-400 bg-[#e3f2fd] dark:bg-blue-500/20 border border-[#bbdefb] dark:border-blue-500/30',
  [NotificationType.TASK_CREATED]: 'text-[#1976d2] dark:text-blue-400 bg-[#e3f2fd] dark:bg-blue-500/20 border border-[#bbdefb] dark:border-blue-500/30',
  [NotificationType.TASK_DUE_SOON]: 'text-[#d32f2f] dark:text-red-400 bg-[#ffebee] dark:bg-red-500/20 border border-[#ffcdd2] dark:border-red-500/30',
  [NotificationType.SYSTEM]: 'text-[#757575] dark:text-slate-400 bg-[#f5f5f5] dark:bg-slate-500/20 border border-[#e0e0e0] dark:border-slate-500/30',
};

export default function NotificationsPage() {
  const [selectedTab, setSelectedTab] = useState('all');
  const [toast, setToast] = useState<{ message: string; type: 'delete' | 'error' } | null>(null);
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notificationsData, isLoading, error } = useQuery({
    queryKey: ['notifications', selectedTab],
    queryFn: async () => {
      const params: any = { page: 1, limit: 100 };
      if (selectedTab === 'unread') {
        params.read = false;
      } else if (selectedTab !== 'all') {
        params.type = selectedTab;
      }
      return apiClient.getNotifications(params);
    },
  });

  // Fetch notification stats
  const { data: stats } = useQuery({
    queryKey: ['notificationStats'],
    queryFn: () => apiClient.getNotificationStats(),
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => apiClient.markNotificationAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notificationStats'] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => apiClient.markAllNotificationsAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notificationStats'] });
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: (id: string) => apiClient.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notificationStats'] });
      setToast({ message: 'Notification deleted successfully', type: 'delete' });
    },
    onError: (error) => {
      setToast({ 
        message: error instanceof Error ? error.message : 'Failed to delete notification', 
        type: 'error' 
      });
    },
  });

  const notifications = notificationsData?.data || [];
  const unreadCount = stats?.unread || 0;
  const totalCount = stats?.total || notifications.length;
  const thisWeekCount = stats?.thisWeek || 0;

  const markAsRead = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId);
  };

  const markAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const deleteNotification = (notificationId: string) => {
    deleteNotificationMutation.mutate(notificationId);
  };

  const filteredNotifications = notifications.filter((notification: Notification) => {
    if (selectedTab === 'all') return true;
    if (selectedTab === 'unread') return !notification.read;
    return notification.type === selectedTab;
  });

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-white dark:bg-slate-900">
        {/* Toast Notification */}
        {toast && (
          <div className={`fixed top-28 right-4 z-50 flex items-center gap-3 p-4 rounded-lg border shadow-lg animate-in slide-in-from-top-5 ${
            toast.type === 'delete'
              ? 'bg-[#ffebee] dark:bg-red-500/20 border-[#ffcdd2] dark:border-red-500/30 text-[#d32f2f] dark:text-red-300'
              : 'bg-[#ffebee] dark:bg-red-500/20 border-[#ffcdd2] dark:border-red-500/30 text-[#d32f2f] dark:text-red-300'
          }`}>
            {toast.type === 'delete' ? (
              <Trash2 className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
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
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-[#212121] dark:from-slate-100 dark:via-indigo-200 dark:to-purple-200 flex items-center mb-2">
                <Bell className="mr-3 h-8 w-8 text-[#1976d2] dark:text-indigo-400" />
                Notifications
              </h1>
              <p className="text-[#757575] dark:text-slate-400 text-lg">
                Stay updated with your tasks and team activities
              </p>
            </div>
            {unreadCount > 0 && (
              <Button 
                onClick={markAllAsRead} 
                variant="outline" 
                disabled={markAllAsReadMutation.isPending}
                className="border-[#e0e0e0] dark:border-slate-700 text-[#212121] dark:text-slate-300 hover:bg-[#f5f5f5] dark:hover:bg-slate-800"
              >
                {markAllAsReadMutation.isPending ? 'Marking...' : `Mark all as read (${unreadCount})`}
              </Button>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-white dark:bg-slate-800 border-[#e0e0e0] dark:border-slate-700 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[#757575] dark:text-slate-300">Total</CardTitle>
                <Bell className="h-4 w-4 text-[#1976d2] dark:text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#212121] dark:text-slate-100">
                  {isLoading ? '...' : totalCount}
                </div>
                <p className="text-xs text-[#757575] dark:text-slate-400">
                  All notifications
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-800 border-[#e0e0e0] dark:border-slate-700 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[#757575] dark:text-slate-300">Unread</CardTitle>
                <Bell className="h-4 w-4 text-[#d32f2f] dark:text-red-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#d32f2f] dark:text-red-400">{isLoading ? '...' : unreadCount}</div>
                <p className="text-xs text-[#757575] dark:text-slate-400">
                  Require attention
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-800 border-[#e0e0e0] dark:border-slate-700 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[#757575] dark:text-slate-300">This Week</CardTitle>
                <Bell className="h-4 w-4 text-[#1976d2] dark:text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#212121] dark:text-slate-100">
                  {isLoading ? '...' : thisWeekCount}
                </div>
                <p className="text-xs text-[#757575] dark:text-slate-400">
                  Recent activity
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Notifications List */}
          <Card className="bg-white dark:bg-slate-800 border-[#e0e0e0] dark:border-slate-700 shadow-sm">
            <CardHeader>
              <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="all">All ({isLoading ? '...' : totalCount})</TabsTrigger>
                  <TabsTrigger value="unread">Unread ({isLoading ? '...' : unreadCount})</TabsTrigger>
                  <TabsTrigger value={NotificationType.TASK_ASSIGNED}>Tasks</TabsTrigger>
                  <TabsTrigger value={NotificationType.TASK_DUE_SOON}>Due Soon</TabsTrigger>
                  <TabsTrigger value={NotificationType.SYSTEM}>System</TabsTrigger>
                </TabsList>

                <TabsContent value={selectedTab} className="mt-6">
                  {isLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1976d2] dark:border-indigo-400 mx-auto"></div>
                      <p className="mt-4 text-sm text-[#757575] dark:text-slate-400">Loading notifications...</p>
                    </div>
                  ) : error ? (
                    <div className="text-center py-12">
                      <AlertCircle className="mx-auto h-12 w-12 text-[#d32f2f] dark:text-red-400" />
                      <h3 className="mt-2 text-sm font-medium text-[#212121] dark:text-slate-100">Error loading notifications</h3>
                      <p className="mt-1 text-sm text-[#757575] dark:text-slate-400">
                        Please try refreshing the page.
                      </p>
                    </div>
                  ) : filteredNotifications.length === 0 ? (
                    <div className="text-center py-12">
                      <Bell className="mx-auto h-12 w-12 text-[#9e9e9e] dark:text-slate-600" />
                      <h3 className="mt-2 text-sm font-medium text-[#212121] dark:text-slate-100">No notifications</h3>
                      <p className="mt-1 text-sm text-[#757575] dark:text-slate-400">
                        {selectedTab === 'unread'
                          ? "You're all caught up!"
                          : `No ${selectedTab} notifications found.`}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredNotifications.map((notification: Notification, index: number) => {
                        const IconComponent = notificationIcons[notification.type];
                        const colorClass = notificationColors[notification.type];

                        return (
                          <div key={notification.id}>
                            <div className={`flex items-start space-x-4 p-4 rounded-lg ${colorClass} ${!notification.read ? 'border-l-4 border-current' : ''}`}>
                              <div className="flex-shrink-0">
                                <IconComponent className="h-6 w-6" />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <div className="text-sm font-medium text-[#212121] dark:text-slate-100">
                                    {notification.title}
                                    {!notification.read && (
                                      <Badge variant="secondary" className="ml-2 text-xs">
                                        New
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    {!notification.read && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => markAsRead(notification.id)}
                                        disabled={markAsReadMutation.isPending}
                                        className="text-xs text-[#212121] dark:text-slate-300 hover:text-[#212121] dark:hover:text-slate-100 hover:bg-[#f5f5f5] dark:hover:bg-slate-700"
                                      >
                                        <Check className="h-3 w-3 mr-1" />
                                        Mark read
                                      </Button>
                                    )}
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => deleteNotification(notification.id)}
                                      disabled={deleteNotificationMutation.isPending}
                                      className="text-[#d32f2f] dark:text-red-400 hover:text-[#c62828] dark:hover:text-red-300 text-xs hover:bg-[#ffebee] dark:hover:bg-red-900/20"
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>

                                <p className="text-sm text-[#757575] dark:text-slate-400 mt-1">
                                  {notification.message}
                                </p>

                                <div className="flex items-center justify-between mt-2">
                                  <p className="text-xs text-[#9e9e9e] dark:text-slate-500">
                                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                  </p>
                                  {notification.actionUrl && (
                                    <Button
                                      size="sm"
                                      variant="link"
                                      className="text-xs p-0 h-auto text-[#1976d2] dark:text-indigo-400 hover:text-[#1565c0] dark:hover:text-indigo-300"
                                      asChild
                                    >
                                      <a href={notification.actionUrl}>
                                        View details →
                                      </a>
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>

                            {index < filteredNotifications.length - 1 && (
                              <Separator className="my-4 bg-[#e0e0e0] dark:bg-slate-700" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardHeader>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
