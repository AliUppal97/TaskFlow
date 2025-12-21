'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, CheckSquare, ArrowRight, UserPlus, Sparkles } from 'lucide-react';

import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getErrorMessage } from '@/types';

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

      const { confirmPassword, ...registerData } = data;
      await register(registerData);

      // Registration successful, redirect will be handled by the auth provider
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Logo/Brand Section */}
      <div className="absolute top-6 left-6 z-50">
        <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => router.push('/')}>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg blur opacity-75 group-hover:opacity-100 transition"></div>
            <CheckSquare className="h-8 w-8 text-white relative z-10" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
            TaskFlow
          </span>
        </div>
      </div>

      {/* Register Card */}
      <div className="relative z-10 w-full max-w-md animate-fade-in-up">
        <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-2xl">
          <CardHeader className="space-y-4 text-center pb-6">
            <div className="flex justify-center mb-2">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/50">
                <UserPlus className="h-8 w-8 text-white" />
              </div>
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
                Create Account
              </CardTitle>
              <CardDescription className="text-white/70 text-base">
                Join TaskFlow and start managing your tasks efficiently
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {error && (
                <div className="p-4 text-sm text-red-300 bg-red-500/20 backdrop-blur-sm border border-red-400/30 rounded-lg">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="firstName" className="text-sm font-medium text-white/90">
                    First Name
                  </label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    {...registerField('firstName')}
                    className={`bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-purple-400/50 focus:ring-purple-400/20 ${
                      errors.firstName ? 'border-red-400/50 focus:border-red-400 focus:ring-red-400/20' : ''
                    }`}
                  />
                  {errors.firstName && (
                    <p className="text-sm text-red-300">{errors.firstName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="lastName" className="text-sm font-medium text-white/90">
                    Last Name
                  </label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    {...registerField('lastName')}
                    className={`bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-purple-400/50 focus:ring-purple-400/20 ${
                      errors.lastName ? 'border-red-400/50 focus:border-red-400 focus:ring-red-400/20' : ''
                    }`}
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-300">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-white/90">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  {...registerField('email')}
                  className={`bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-purple-400/50 focus:ring-purple-400/20 ${
                    errors.email ? 'border-red-400/50 focus:border-red-400 focus:ring-red-400/20' : ''
                  }`}
                />
                {errors.email && (
                  <p className="text-sm text-red-300">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-white/90">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a strong password"
                    {...registerField('password')}
                    className={`bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-purple-400/50 focus:ring-purple-400/20 pr-10 ${
                      errors.password ? 'border-red-400/50 focus:border-red-400 focus:ring-red-400/20' : ''
                    }`}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:opacity-70 transition-opacity"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-white/60" />
                    ) : (
                      <Eye className="h-5 w-5 text-white/60" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-300">{errors.password.message}</p>
                )}
                <p className="text-xs text-white/50">Must be at least 8 characters</p>
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-white/90">
                  Confirm Password
                </label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    {...registerField('confirmPassword')}
                    className={`bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-purple-400/50 focus:ring-purple-400/20 pr-10 ${
                      errors.confirmPassword ? 'border-red-400/50 focus:border-red-400 focus:ring-red-400/20' : ''
                    }`}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:opacity-70 transition-opacity"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-white/60" />
                    ) : (
                      <Eye className="h-5 w-5 text-white/60" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-300">{errors.confirmPassword.message}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-purple-500/50 hover:shadow-xl hover:shadow-purple-500/60 transition-all h-11 text-base font-semibold" 
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

            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-center text-sm text-white/70">
                Already have an account?{' '}
                <button
                  onClick={() => router.push('/login')}
                  className="font-semibold text-purple-300 hover:text-purple-200 transition-colors inline-flex items-center gap-1"
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
            className="text-sm text-white/60 hover:text-white/90 transition-colors inline-flex items-center gap-1"
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
            Back to home
          </button>
        </div>
      </div>
    </div>
  );
}


