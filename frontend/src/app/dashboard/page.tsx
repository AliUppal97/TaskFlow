'use client';

import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckSquare, Users, User } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-white dark:from-slate-900 dark:via-slate-800/30 dark:to-slate-900">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <main className="space-y-8">
            {/* Welcome Section */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-[#212121] dark:from-slate-100 dark:via-indigo-200 dark:to-purple-200 mb-2">
                Welcome back{user?.profile?.firstName ? `, ${user.profile.firstName}` : ''}!
              </h1>
              <p className="text-[#757575] dark:text-slate-400 text-lg">
                Here's what's happening with your tasks today
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
                  <p className="text-2xl font-bold text-[#1976d2] dark:from-blue-400 dark:to-cyan-400">View Tasks</p>
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
                  <p className="text-2xl font-bold text-[#00796b] dark:from-green-400 dark:to-emerald-400">Browse All</p>
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
                  <p className="text-2xl font-bold text-[#1976d2] dark:from-purple-400 dark:to-pink-400">Settings</p>
                  <p className="text-sm text-[#9e9e9e] dark:text-slate-500">Update profile</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="mt-8">
              <Card className="bg-white dark:bg-slate-800 border-[#e0e0e0] dark:border-slate-700 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-[#212121] dark:text-slate-100">Recent Activity</CardTitle>
                  <CardDescription className="text-[#757575] dark:text-slate-400">
                    Your latest task management activity
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4 p-3 rounded-lg bg-[#e3f2fd] dark:bg-blue-900/20 hover:bg-[#bbdefb] dark:hover:bg-blue-900/30 transition-colors border border-[#bbdefb] dark:border-blue-800">
                      <div className="w-3 h-3 bg-[#1976d2] dark:bg-blue-400 rounded-full shadow-md"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[#212121] dark:text-slate-100">Welcome to TaskFlow!</p>
                        <p className="text-xs text-[#757575] dark:text-slate-400">Get started by creating your first task</p>
                      </div>
                      <span className="text-xs text-[#9e9e9e] dark:text-slate-500">Just now</span>
                    </div>

                    <div className="flex items-center space-x-4 p-3 rounded-lg bg-[#e0f2f1] dark:bg-green-900/20 hover:bg-[#b2dfdb] dark:hover:bg-green-900/30 transition-colors border border-[#b2dfdb] dark:border-green-800">
                      <div className="w-3 h-3 bg-[#00796b] dark:bg-green-400 rounded-full shadow-md"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[#212121] dark:text-slate-100">Account Created</p>
                        <p className="text-xs text-[#757575] dark:text-slate-400">Your TaskFlow account is now active</p>
                      </div>
                      <span className="text-xs text-[#9e9e9e] dark:text-slate-500">Today</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
