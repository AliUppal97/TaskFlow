'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, ArrowRight, UserPlus, Sparkles } from 'lucide-react';

import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getErrorMessage } from '@/types';
import { Logo } from '@/components/logo';
import { ThemeToggle } from '@/components/ui/theme-toggle';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register } = useAuth();
  const router = useRouter();

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { confirmPassword, firstName, lastName, ...registerData } = data;
      // Transform form data to match backend DTO structure (profile object)
      const transformedData = {
        ...registerData,
        ...(firstName || lastName ? {
          profile: {
            ...(firstName && { firstName }),
            ...(lastName && { lastName }),
          },
        } : {}),
      };
      await register(transformedData);

      // Registration successful, redirect will be handled by the auth provider
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 relative overflow-hidden flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#e3f2fd]/40 dark:bg-indigo-900/20 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#e0f2f1]/40 dark:bg-purple-900/20 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#e3f2fd]/40 dark:bg-blue-900/20 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-4000"></div>
      </div>

      {/* Logo/Brand Section */}
      <div className="absolute top-6 left-6 z-50">
        <Logo size="lg" />
      </div>

      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* Register Card */}
      <div className="relative z-10 w-full max-w-md animate-fade-in-up">
        <Card className="shadow-2xl">
          <CardHeader className="space-y-4 text-center pb-6">
            <div className="flex justify-center mb-2">
              <div className="w-16 h-16 rounded-2xl bg-[#1976d2] flex items-center justify-center shadow-md">
                <UserPlus className="h-8 w-8 text-white" />
              </div>
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold">
                Create Account
              </CardTitle>
              <CardDescription className="text-base">
                Join TaskFlow and start managing your tasks efficiently
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {error && (
                <div className="p-4 text-sm text-[#d32f2f] dark:text-red-400 bg-[#ffebee] dark:bg-red-900/20 border border-[#ffcdd2] dark:border-red-800 rounded-lg">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="firstName" className="text-sm font-medium text-foreground">
                    First Name
                  </label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    {...registerField('firstName')}
                    className={errors.firstName ? 'border-destructive focus:border-destructive focus:ring-destructive' : ''}
                  />
                  {errors.firstName && (
                    <p className="text-sm text-destructive">{errors.firstName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="lastName" className="text-sm font-medium text-foreground">
                    Last Name
                  </label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    {...registerField('lastName')}
                    className={errors.lastName ? 'border-destructive focus:border-destructive focus:ring-destructive' : ''}
                  />
                  {errors.lastName && (
                    <p className="text-sm text-destructive">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  {...registerField('email')}
                  className={errors.email ? 'border-destructive focus:border-destructive focus:ring-destructive' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a strong password"
                    {...registerField('password')}
                    className={`pr-10 ${errors.password ? 'border-destructive focus:border-destructive focus:ring-destructive' : ''}`}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:opacity-70 transition-opacity"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-[#9e9e9e] dark:text-slate-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-[#9e9e9e] dark:text-slate-400" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
                <p className="text-xs text-muted-foreground">Must be at least 8 characters</p>
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                  Confirm Password
                </label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    {...registerField('confirmPassword')}
                    className={`pr-10 ${errors.confirmPassword ? 'border-destructive focus:border-destructive focus:ring-destructive' : ''}`}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:opacity-70 transition-opacity"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-[#9e9e9e] dark:text-slate-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-[#9e9e9e] dark:text-slate-400" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 text-base font-semibold shadow-md hover:shadow-lg" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Account
                    <Sparkles className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <button
                  onClick={() => router.push('/login')}
                  className="font-semibold text-primary hover:text-primary/90 transition-colors inline-flex items-center gap-1"
                >
                  Sign in
                  <ArrowRight className="h-4 w-4" />
                </button>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Back to home link */}
        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/')}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
            Back to home
          </button>
        </div>
      </div>
    </div>
  );
}


