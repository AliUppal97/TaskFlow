'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { LoginForm } from '../components/login-form';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-purple-400" />
          <p className="mt-2 text-sm text-white/70">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render login form if user is authenticated (will redirect)
  if (isAuthenticated) {
    return null;
  }

  return <LoginForm />;
}




