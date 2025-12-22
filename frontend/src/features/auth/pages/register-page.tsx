'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { RegisterForm } from '../components/register-form';
import { Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading while checking auth status
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#1976d2] dark:text-indigo-400" />
          <p className="mt-2 text-sm text-[#757575] dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render register form if user is authenticated (will redirect)
  if (isAuthenticated) {
    return null;
  }

  return <RegisterForm />;
}



