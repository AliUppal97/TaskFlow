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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <main className="space-y-8">
            {/* Welcome Section */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent mb-2">
                Welcome back{user?.profile?.firstName ? `, ${user.profile.firstName}` : ''}!
              </h1>
              <p className="text-white/70 text-lg">
                Here's what's happening with your tasks today
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <Card className="cursor-pointer bg-white/5 backdrop-blur-md border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20 group" onClick={() => router.push('/tasks')}>
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <CheckSquare className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="flex items-center text-white">
                    My Tasks
                  </CardTitle>
                  <CardDescription className="text-white/70">
                    View and manage your assigned tasks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">View Tasks</p>
                  <p className="text-sm text-white/50">Click to explore</p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer bg-white/5 backdrop-blur-md border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/20 group" onClick={() => router.push('/tasks')}>
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="flex items-center text-white">
                    Team Tasks
                  </CardTitle>
                  <CardDescription className="text-white/70">
                    See all tasks in your organization
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">Browse All</p>
                  <p className="text-sm text-white/50">Full task list</p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer bg-white/5 backdrop-blur-md border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20 group" onClick={() => router.push('/profile')}>
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="flex items-center text-white">
                    Profile
                  </CardTitle>
                  <CardDescription className="text-white/70">
                    Manage your account settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Settings</p>
                  <p className="text-sm text-white/50">Update profile</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="mt-8">
              <Card className="bg-white/5 backdrop-blur-md border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Recent Activity</CardTitle>
                  <CardDescription className="text-white/70">
                    Your latest task management activity
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                      <div className="w-3 h-3 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">Welcome to TaskFlow!</p>
                        <p className="text-xs text-white/60">Get started by creating your first task</p>
                      </div>
                      <span className="text-xs text-white/40">Just now</span>
                    </div>

                    <div className="flex items-center space-x-4 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                      <div className="w-3 h-3 bg-green-500 rounded-full shadow-lg shadow-green-500/50"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">Account Created</p>
                        <p className="text-xs text-white/60">Your TaskFlow account is now active</p>
                      </div>
                      <span className="text-xs text-white/40">Today</span>
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
