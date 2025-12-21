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
  task_assigned: 'text-blue-600 bg-blue-50',
  task_completed: 'text-green-600 bg-green-50',
  mention: 'text-purple-600 bg-purple-50',
  deadline_approaching: 'text-red-600 bg-red-50',
  system: 'text-gray-600 bg-gray-50',
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent flex items-center mb-2">
                <Bell className="mr-3 h-8 w-8 text-purple-400" />
                Notifications
              </h1>
              <p className="text-white/70 text-lg">
                Stay updated with your tasks and team activities
              </p>
            </div>
            {unreadCount > 0 && (
              <Button onClick={markAllAsRead} variant="outline">
                Mark all as read ({unreadCount})
              </Button>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-white/5 backdrop-blur-md border-white/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white/90">Total</CardTitle>
                <Bell className="h-4 w-4 text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{notifications.length}</div>
                <p className="text-xs text-white/60">
                  All notifications
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-md border-white/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white/90">Unread</CardTitle>
                <Bell className="h-4 w-4 text-red-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-400">{unreadCount}</div>
                <p className="text-xs text-white/60">
                  Require attention
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-md border-white/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white/90">This Week</CardTitle>
                <Bell className="h-4 w-4 text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {notifications.filter(n =>
                    new Date(n.createdAt) > oneWeekAgo
                  ).length}
                </div>
                <p className="text-xs text-white/60">
                  Recent activity
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Notifications List */}
          <Card className="bg-white/5 backdrop-blur-md border-white/10">
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
                      <Bell className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
                      <p className="mt-1 text-sm text-gray-500">
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
                                  <p className="text-sm font-medium text-gray-900">
                                    {notification.title}
                                    {!notification.read && (
                                      <Badge variant="secondary" className="ml-2 text-xs">
                                        New
                                      </Badge>
                                    )}
                                  </p>
                                  <div className="flex items-center space-x-2">
                                    {!notification.read && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => markAsRead(notification.id)}
                                        className="text-xs"
                                      >
                                        <Check className="h-3 w-3 mr-1" />
                                        Mark read
                                      </Button>
                                    )}
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => deleteNotification(notification.id)}
                                      className="text-red-600 hover:text-red-700 text-xs"
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>

                                <p className="text-sm text-gray-600 mt-1">
                                  {notification.message}
                                </p>

                                <div className="flex items-center justify-between mt-2">
                                  <p className="text-xs text-gray-500">
                                    {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                                  </p>
                                  <Button
                                    size="sm"
                                    variant="link"
                                    className="text-xs p-0 h-auto"
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
                              <Separator className="my-4" />
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


