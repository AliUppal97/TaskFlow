'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, User, Calendar } from 'lucide-react';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { useAuth } from '@/providers/auth-provider';
import { useTasks } from '@/hooks/use-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { UserRole } from '@/types';

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Get user's tasks stats
  const { data: tasksData } = useTasks({ creatorId: user?.id }, { enabled: !!user?.id });
  const totalTasks = tasksData?.pagination.total || 0;

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.profile?.firstName || '',
      lastName: user?.profile?.lastName || '',
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    try {
      // In a real app, you'd call an API to update the profile
      console.log('Updating profile:', data);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (firstName?: string, lastName?: string, email?: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    return email?.[0].toUpperCase() || 'U';
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-500/30';
      case UserRole.USER:
        return 'bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30';
      default:
        return 'bg-slate-100 dark:bg-slate-700/50 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600/50';
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-900 dark:via-slate-800/30 dark:to-slate-900">
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-indigo-800 to-purple-800 dark:from-slate-100 dark:via-indigo-200 dark:to-purple-200 bg-clip-text text-transparent mb-2">
              Profile
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-lg">
              Manage your account settings and preferences
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Overview */}
            <div className="lg:col-span-1">
              <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
                <CardHeader className="text-center">
                  <Avatar className="h-24 w-24 mx-auto mb-4 ring-4 ring-indigo-200 dark:ring-indigo-800">
                    <AvatarFallback className="text-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white">
                      {getInitials(user?.profile?.firstName, user?.profile?.lastName, user?.email)}
                    </AvatarFallback>
                  </Avatar>
                  <CardTitle className="text-xl text-slate-900 dark:text-slate-100">
                    {user?.profile?.firstName && user?.profile?.lastName
                      ? `${user.profile.firstName} ${user.profile.lastName}`
                      : user?.email}
                  </CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">{user?.email}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-center">
                    <Badge className={getRoleBadgeColor(user?.role || UserRole.USER)}>
                      {user?.role?.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-slate-600 dark:text-slate-400">
                      <User className="h-4 w-4 mr-2" />
                      Member since {new Date(user?.createdAt || '').toLocaleDateString()}
                    </div>
                    <div className="flex items-center text-slate-600 dark:text-slate-400">
                      <Calendar className="h-4 w-4 mr-2" />
                      {totalTasks} tasks created
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Profile Details */}
            <div className="lg:col-span-2">
              <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-slate-900 dark:text-slate-100">Personal Information</CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">
                    Update your personal details and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!isEditing ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">First Name</label>
                          <p className="mt-1 text-sm text-slate-900 dark:text-slate-100">
                            {user?.profile?.firstName || 'Not set'}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Last Name</label>
                          <p className="mt-1 text-sm text-slate-900 dark:text-slate-100">
                            {user?.profile?.lastName || 'Not set'}
                          </p>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                        <p className="mt-1 text-sm text-slate-900 dark:text-slate-100">{user?.email}</p>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Role</label>
                        <p className="mt-1 text-sm text-slate-900 dark:text-slate-100 capitalize">{user?.role}</p>
                      </div>

                      <Button onClick={() => setIsEditing(true)} className="mt-6">
                        Edit Profile
                      </Button>
                    </div>
                  ) : (
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>First Name</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Last Name</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="flex gap-4 pt-4">
                          <Button type="submit" disabled={isLoading}>
                            {isLoading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              'Save Changes'
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setIsEditing(false);
                              form.reset();
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </Form>
                  )}
                </CardContent>
              </Card>

              {/* Account Statistics */}
              <Card className="mt-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-slate-900 dark:text-slate-100">Account Statistics</CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">
                    Your activity overview
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                      <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">{totalTasks}</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Tasks Created</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800">
                      <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">0</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Tasks Completed</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800">
                      <div className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 dark:from-yellow-400 dark:to-orange-400 bg-clip-text text-transparent">0</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">In Progress</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800">
                      <div className="text-2xl font-bold bg-gradient-to-r from-red-600 to-pink-600 dark:from-red-400 dark:to-pink-400 bg-clip-text text-transparent">0</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Overdue</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}


