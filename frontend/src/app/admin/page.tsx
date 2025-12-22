'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import {
  Users,
  Shield,
  BarChart3,
  Settings,
  UserPlus,
  Activity,
  Database,
  AlertTriangle,
  CheckCircle,
  TrendingUp
} from 'lucide-react';

import { RoleProtectedRoute } from '@/components/auth/role-protected-route';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UserRole } from '@/types';

// Mock data - in a real app, this would come from APIs
const mockUsers = [
  {
    id: '1',
    email: 'admin@taskflow.com',
    profile: { firstName: 'John', lastName: 'Admin' },
    role: UserRole.ADMIN,
    status: 'active',
    lastLogin: new Date(Date.now() - 1000 * 60 * 30),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
  },
  {
    id: '2',
    email: 'user1@taskflow.com',
    profile: { firstName: 'Jane', lastName: 'User' },
    role: UserRole.USER,
    status: 'active',
    lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 2),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15),
  },
  {
    id: '3',
    email: 'user2@taskflow.com',
    profile: { firstName: 'Bob', lastName: 'Smith' },
    role: UserRole.USER,
    status: 'inactive',
    lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
  },
];

const systemStats = {
  totalUsers: 150,
  activeUsers: 89,
  totalTasks: 1247,
  completedTasks: 892,
  systemHealth: 'healthy',
  uptime: '99.9%',
  responseTime: '45ms',
  errorRate: '0.1%',
};

const recentActivity = [
  { id: '1', action: 'User registered', user: 'newuser@taskflow.com', timestamp: new Date(Date.now() - 1000 * 60 * 5) },
  { id: '2', action: 'Task completed', user: 'jane@example.com', timestamp: new Date(Date.now() - 1000 * 60 * 15) },
  { id: '3', action: 'User role updated', user: 'admin@taskflow.com', timestamp: new Date(Date.now() - 1000 * 60 * 30) },
  { id: '4', action: 'System backup completed', user: 'system', timestamp: new Date(Date.now() - 1000 * 60 * 60) },
];

function AdminPageContent() {
  const [selectedTab, setSelectedTab] = useState('overview');

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-[#e0f2f1] dark:bg-green-500/20 text-[#00796b] dark:text-green-300 border border-[#b2dfdb] dark:border-green-500/30';
      case 'inactive': return 'bg-[#f5f5f5] dark:bg-slate-700/50 text-[#757575] dark:text-slate-200 border border-[#e0e0e0] dark:border-slate-600/50';
      case 'pending': return 'bg-[#fff3e0] dark:bg-yellow-500/20 text-[#f57c00] dark:text-yellow-300 border border-[#ffe0b2] dark:border-yellow-500/30';
      default: return 'bg-[#f5f5f5] dark:bg-slate-700/50 text-[#757575] dark:text-slate-200 border border-[#e0e0e0] dark:border-slate-600/50';
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return 'bg-[#ffebee] dark:bg-red-500/20 text-[#d32f2f] dark:text-red-300 border border-[#ffcdd2] dark:border-red-500/30';
      case UserRole.USER: return 'bg-[#e3f2fd] dark:bg-blue-500/20 text-[#1976d2] dark:text-blue-300 border border-[#bbdefb] dark:border-blue-500/30';
      default: return 'bg-[#f5f5f5] dark:bg-slate-700/50 text-[#757575] dark:text-slate-200 border border-[#e0e0e0] dark:border-slate-600/50';
    }
  };

  return (
    <RoleProtectedRoute allowedRoles={[UserRole.ADMIN]}>
      <div className="min-h-screen bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-[#212121] dark:from-slate-100 dark:via-indigo-200 dark:to-purple-200 flex items-center mb-2">
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
                    <div className="text-2xl font-bold text-[#212121] dark:text-slate-100">{systemStats.totalUsers}</div>
                    <p className="text-xs text-[#757575] dark:text-slate-400">
                      +12% from last month
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-800 border-[#e0e0e0] dark:border-slate-700 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-[#757575] dark:text-slate-300">Active Users</CardTitle>
                    <Activity className="h-4 w-4 text-[#9e9e9e] dark:text-slate-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-[#212121] dark:text-slate-100">{systemStats.activeUsers}</div>
                    <p className="text-xs text-[#757575] dark:text-slate-400">
                      {Math.round((systemStats.activeUsers / systemStats.totalUsers) * 100)}% of total
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-800 border-[#e0e0e0] dark:border-slate-700 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-[#757575] dark:text-slate-300">Total Tasks</CardTitle>
                    <BarChart3 className="h-4 w-4 text-[#9e9e9e] dark:text-slate-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-[#212121] dark:text-slate-100">{systemStats.totalTasks.toLocaleString()}</div>
                    <p className="text-xs text-[#757575] dark:text-slate-400">
                      {systemStats.completedTasks} completed
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-800 border-[#e0e0e0] dark:border-slate-700 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-[#757575] dark:text-slate-300">System Health</CardTitle>
                    <CheckCircle className="h-4 w-4 text-[#00796b] dark:text-green-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-[#00796b] dark:text-green-400">{systemStats.systemHealth}</div>
                    <p className="text-xs text-[#757575] dark:text-slate-400">
                      {systemStats.uptime} uptime
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity & Quick Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white dark:bg-slate-800 border-[#e0e0e0] dark:border-slate-700 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-[#212121] dark:text-slate-100">Recent Activity</CardTitle>
                    <CardDescription className="text-[#757575] dark:text-slate-400">Latest system events and user actions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentActivity.map((activity) => (
                        <div key={activity.id} className="flex items-center space-x-4">
                          <div className="w-2 h-2 bg-[#1976d2] dark:bg-blue-400 rounded-full"></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-[#212121] dark:text-slate-100">{activity.action}</p>
                            <p className="text-xs text-[#757575] dark:text-slate-400">{activity.user}</p>
                          </div>
                          <span className="text-xs text-[#9e9e9e] dark:text-slate-500">
                            {formatDate(activity.timestamp)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-800 border-[#e0e0e0] dark:border-slate-700 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-[#212121] dark:text-slate-100">Quick Actions</CardTitle>
                    <CardDescription className="text-[#757575] dark:text-slate-400">Common administrative tasks</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button className="w-full justify-start border-[#e0e0e0] dark:border-slate-700 text-[#212121] dark:text-slate-300 hover:bg-[#f5f5f5] dark:hover:bg-slate-800" variant="outline">
                      <UserPlus className="mr-2 h-4 w-4" />
                      Invite New User
                    </Button>
                    <Button className="w-full justify-start border-[#e0e0e0] dark:border-slate-700 text-[#212121] dark:text-slate-300 hover:bg-[#f5f5f5] dark:hover:bg-slate-800" variant="outline">
                      <Database className="mr-2 h-4 w-4" />
                      View System Logs
                    </Button>
                    <Button className="w-full justify-start border-[#e0e0e0] dark:border-slate-700 text-[#212121] dark:text-slate-300 hover:bg-[#f5f5f5] dark:hover:bg-slate-800" variant="outline">
                      <Settings className="mr-2 h-4 w-4" />
                      System Configuration
                    </Button>
                    <Button className="w-full justify-start border-[#e0e0e0] dark:border-slate-700 text-[#212121] dark:text-slate-300 hover:bg-[#f5f5f5] dark:hover:bg-slate-800" variant="outline">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Generate Reports
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
                      <div className="text-2xl font-bold text-[#00796b] dark:text-green-400">{systemStats.uptime}</div>
                      <div className="text-sm text-[#757575] dark:text-slate-400">Uptime</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[#1976d2] dark:text-blue-400">{systemStats.responseTime}</div>
                      <div className="text-sm text-[#757575] dark:text-slate-400">Avg Response Time</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[#d32f2f] dark:text-red-400">{systemStats.errorRate}</div>
                      <div className="text-sm text-[#757575] dark:text-slate-400">Error Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[#7b1fa2] dark:text-purple-400">
                        {Math.round((systemStats.completedTasks / systemStats.totalTasks) * 100)}%
                      </div>
                      <div className="text-sm text-[#757575] dark:text-slate-400">Task Completion Rate</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="space-y-6">
              <Card className="bg-white dark:bg-slate-800 border-[#e0e0e0] dark:border-slate-700 shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-[#212121] dark:text-slate-100">User Management</CardTitle>
                      <CardDescription className="text-[#757575] dark:text-slate-400">Manage user accounts, roles, and permissions</CardDescription>
                    </div>
                    <Button className="bg-[#1976d2] hover:bg-[#1565c0] text-white">
                      <UserPlus className="mr-2 h-4 w-4" />
                      Add User
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-[#212121] dark:text-slate-300">User</TableHead>
                        <TableHead className="text-[#212121] dark:text-slate-300">Role</TableHead>
                        <TableHead className="text-[#212121] dark:text-slate-300">Status</TableHead>
                        <TableHead className="text-[#212121] dark:text-slate-300">Last Login</TableHead>
                        <TableHead className="text-[#212121] dark:text-slate-300">Created</TableHead>
                        <TableHead className="text-[#212121] dark:text-slate-300">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium text-[#212121] dark:text-slate-100">
                                {user.profile?.firstName} {user.profile?.lastName}
                              </div>
                              <div className="text-sm text-[#757575] dark:text-slate-400">{user.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getRoleColor(user.role)}>
                              {user.role.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(user.status)}>
                              {user.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-[#757575] dark:text-slate-400">
                            {formatDate(user.lastLogin)}
                          </TableCell>
                          <TableCell className="text-sm text-[#757575] dark:text-slate-400">
                            {formatDate(user.createdAt)}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button size="sm" variant="outline" className="border-[#e0e0e0] dark:border-slate-700 text-[#212121] dark:text-slate-300 hover:bg-[#f5f5f5] dark:hover:bg-slate-800">Edit</Button>
                              <Button size="sm" variant="outline" className="border-[#e0e0e0] dark:border-slate-700 text-[#212121] dark:text-slate-300 hover:bg-[#f5f5f5] dark:hover:bg-slate-800">Reset Password</Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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
                    <div className="flex items-center justify-between">
                      <span className="text-[#212121] dark:text-slate-300">Redis Cache</span>
                      <Badge className="bg-[#fff3e0] dark:bg-yellow-500/20 text-[#f57c00] dark:text-yellow-300 border border-[#ffe0b2] dark:border-yellow-500/30">Warning</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#212121] dark:text-slate-300">Email Service</span>
                      <Badge className="bg-[#e0f2f1] dark:bg-green-500/20 text-[#00796b] dark:text-green-300 border border-[#b2dfdb] dark:border-green-500/30">Healthy</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-800 border-[#e0e0e0] dark:border-slate-700 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center text-[#212121] dark:text-slate-100">
                      <TrendingUp className="mr-2 h-5 w-5 text-[#1976d2] dark:text-blue-400" />
                      Performance Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[#212121] dark:text-slate-300">CPU Usage</span>
                      <span className="font-medium text-[#212121] dark:text-slate-100">23%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#212121] dark:text-slate-300">Memory Usage</span>
                      <span className="font-medium text-[#212121] dark:text-slate-100">67%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#212121] dark:text-slate-300">Disk Usage</span>
                      <span className="font-medium text-[#212121] dark:text-slate-100">45%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#212121] dark:text-slate-300">Network I/O</span>
                      <span className="font-medium text-[#212121] dark:text-slate-100">12 MB/s</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-white dark:bg-slate-800 border-[#e0e0e0] dark:border-slate-700 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center text-[#212121] dark:text-slate-100">
                    <AlertTriangle className="mr-2 h-5 w-5 text-[#f57c00] dark:text-orange-400" />
                    System Alerts
                  </CardTitle>
                  <CardDescription className="text-[#757575] dark:text-slate-400">Recent system alerts and notifications</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3 p-3 bg-[#fff3e0] dark:bg-yellow-500/20 border border-[#ffe0b2] dark:border-yellow-500/30 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-[#f57c00] dark:text-yellow-400 mt-0.5" />
                      <div>
                        <p className="font-medium text-[#e65100] dark:text-yellow-300">High Memory Usage</p>
                        <p className="text-sm text-[#f57c00] dark:text-yellow-400">Memory usage is at 85%. Consider scaling resources.</p>
                        <p className="text-xs text-[#f57c00] dark:text-yellow-500 mt-1">2 hours ago</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 p-3 bg-[#e0f2f1] dark:bg-green-500/20 border border-[#b2dfdb] dark:border-green-500/30 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-[#00796b] dark:text-green-400 mt-0.5" />
                      <div>
                        <p className="font-medium text-[#00796b] dark:text-green-300">Backup Completed</p>
                        <p className="text-sm text-[#00796b] dark:text-green-400">Daily system backup completed successfully.</p>
                        <p className="text-xs text-[#00796b] dark:text-green-500 mt-1">4 hours ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <Card className="bg-white dark:bg-slate-800 border-[#e0e0e0] dark:border-slate-700 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-[#212121] dark:text-slate-100">System Configuration</CardTitle>
                  <CardDescription className="text-[#757575] dark:text-slate-400">Configure global system settings and preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#212121] dark:text-slate-300">Session Timeout (minutes)</label>
                      <select className="w-full p-2 border border-[#e0e0e0] dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-[#212121] dark:text-slate-100" defaultValue="60">
                        <option value="15">15 minutes</option>
                        <option value="30">30 minutes</option>
                        <option value="60">1 hour</option>
                        <option value="120">2 hours</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#212121] dark:text-slate-300">Max File Upload Size (MB)</label>
                      <select className="w-full p-2 border border-[#e0e0e0] dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-[#212121] dark:text-slate-100" defaultValue="10">
                        <option value="5">5 MB</option>
                        <option value="10">10 MB</option>
                        <option value="25">25 MB</option>
                        <option value="50">50 MB</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#212121] dark:text-slate-300">Default User Role</label>
                      <select className="w-full p-2 border border-[#e0e0e0] dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-[#212121] dark:text-slate-100" defaultValue="user">
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#212121] dark:text-slate-300">Email Notifications</label>
                      <select className="w-full p-2 border border-[#e0e0e0] dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-[#212121] dark:text-slate-100" defaultValue="enabled">
                        <option value="enabled">Enabled</option>
                        <option value="disabled">Disabled</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#e0e0e0] dark:border-slate-700">
                    <div className="flex justify-end space-x-4">
                      <Button variant="outline" className="border-[#e0e0e0] dark:border-slate-700 text-[#212121] dark:text-slate-300 hover:bg-[#f5f5f5] dark:hover:bg-slate-800">Reset to Defaults</Button>
                      <Button className="bg-[#1976d2] hover:bg-[#1565c0] text-white">Save Changes</Button>
                    </div>
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

