'use client';

import { useState, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Bell, CheckSquare, User, AlertCircle, Info, X, Check } from 'lucide-react';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Mock notification data - in a real app, this would come from an API
const mockNotifications = [
  {
    id: '1',
    type: 'task_assigned',
    title: 'Task Assigned',
    message: 'You have been assigned to "Implement user authentication"',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    actionUrl: '/tasks',
    metadata: { taskId: '123', taskTitle: 'Implement user authentication' }
  },
  {
    id: '2',
    type: 'task_completed',
    title: 'Task Completed',
    message: 'John Doe completed "Review pull request #456"',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    actionUrl: '/tasks',
    metadata: { taskId: '456', completedBy: 'John Doe' }
  },
  {
    id: '3',
    type: 'mention',
    title: 'You were mentioned',
    message: 'Sarah mentioned you in task "Update documentation"',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
    actionUrl: '/tasks',
    metadata: { taskId: '789', mentionedBy: 'Sarah' }
  },
  {
    id: '4',
    type: 'deadline_approaching',
    title: 'Deadline Approaching',
    message: 'Task "Fix critical bug" is due in 24 hours',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    actionUrl: '/tasks',
    metadata: { taskId: '101', hoursRemaining: 24 }
  },
  {
    id: '5',
    type: 'system',
    title: 'Welcome to TaskFlow',
    message: 'Welcome! Your account has been successfully set up.',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 1 week ago
    actionUrl: '/dashboard',
    metadata: {}
  }
];

const notificationIcons = {
  task_assigned: CheckSquare,
  task_completed: CheckSquare,
  mention: User,
  deadline_approaching: AlertCircle,
  system: Info,
};

const notificationColors = {
  task_assigned: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/20 border border-blue-200 dark:border-blue-500/30',
  task_completed: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/20 border border-green-200 dark:border-green-500/30',
  mention: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/20 border border-purple-200 dark:border-purple-500/30',
  deadline_approaching: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/30',
  system: 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-500/20 border border-slate-200 dark:border-slate-500/30',
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [selectedTab, setSelectedTab] = useState('all');
  // Calculate one week ago once when component mounts
  const oneWeekAgo = useMemo(() => {
    const now = new Date();
    return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }, []);

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev =>
      prev.filter(notification => notification.id !== notificationId)
    );
  };

  const filteredNotifications = notifications.filter(notification => {
    if (selectedTab === 'all') return true;
    if (selectedTab === 'unread') return !notification.read;
    return notification.type === selectedTab;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-900 dark:via-slate-800/30 dark:to-slate-900">
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-indigo-800 to-purple-800 dark:from-slate-100 dark:via-indigo-200 dark:to-purple-200 bg-clip-text text-transparent flex items-center mb-2">
                <Bell className="mr-3 h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                Notifications
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-lg">
                Stay updated with your tasks and team activities
              </p>
            </div>
            {unreadCount > 0 && (
              <Button onClick={markAllAsRead} variant="outline" className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
                Mark all as read ({unreadCount})
              </Button>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">Total</CardTitle>
                <Bell className="h-4 w-4 text-blue-500 dark:text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{notifications.length}</div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  All notifications
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">Unread</CardTitle>
                <Bell className="h-4 w-4 text-red-500 dark:text-red-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">{unreadCount}</div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Require attention
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">This Week</CardTitle>
                <Bell className="h-4 w-4 text-blue-500 dark:text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {notifications.filter(n =>
                    new Date(n.createdAt) > oneWeekAgo
                  ).length}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Recent activity
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Notifications List */}
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
            <CardHeader>
              <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
                  <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
                  <TabsTrigger value="task_assigned">Tasks</TabsTrigger>
                  <TabsTrigger value="mention">Mentions</TabsTrigger>
                  <TabsTrigger value="system">System</TabsTrigger>
                </TabsList>

                <TabsContent value={selectedTab} className="mt-6">
                  {filteredNotifications.length === 0 ? (
                    <div className="text-center py-12">
                      <Bell className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-600" />
                      <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-slate-100">No notifications</h3>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                        {selectedTab === 'unread'
                          ? "You're all caught up!"
                          : `No ${selectedTab} notifications found.`}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredNotifications.map((notification, index) => {
                        const IconComponent = notificationIcons[notification.type as keyof typeof notificationIcons];
                        const colorClass = notificationColors[notification.type as keyof typeof notificationColors];

                        return (
                          <div key={notification.id}>
                            <div className={`flex items-start space-x-4 p-4 rounded-lg ${colorClass} ${!notification.read ? 'border-l-4 border-current' : ''}`}>
                              <div className="flex-shrink-0">
                                <IconComponent className="h-6 w-6" />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
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
                                        className="text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700"
                                      >
                                        <Check className="h-3 w-3 mr-1" />
                                        Mark read
                                      </Button>
                                    )}
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => deleteNotification(notification.id)}
                                      className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-xs hover:bg-red-50 dark:hover:bg-red-900/20"
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>

                                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                  {notification.message}
                                </p>

                                <div className="flex items-center justify-between mt-2">
                                  <p className="text-xs text-slate-500 dark:text-slate-500">
                                    {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                                  </p>
                                  <Button
                                    size="sm"
                                    variant="link"
                                    className="text-xs p-0 h-auto text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                                    asChild
                                  >
                                    <a href={notification.actionUrl}>
                                      View details →
                                    </a>
                                  </Button>
                                </div>
                              </div>
                            </div>

                            {index < filteredNotifications.length - 1 && (
                              <Separator className="my-4 bg-slate-200 dark:bg-slate-700" />
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


