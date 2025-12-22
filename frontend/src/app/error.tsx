'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    // In production, you might want to send this to a service like Sentry
    if (process.env.NODE_ENV === 'development') {
      console.error(error);
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 relative overflow-hidden flex items-center justify-center px-4">
      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#f3e5f5]/40 dark:bg-purple-900/20 rounded-full mix-blend-multiply filter blur-xl opacity-60 dark:opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#e3f2fd]/40 dark:bg-indigo-900/20 rounded-full mix-blend-multiply filter blur-xl opacity-60 dark:opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#fce4ec]/40 dark:bg-pink-900/20 rounded-full mix-blend-multiply filter blur-xl opacity-60 dark:opacity-20 animate-blob animation-delay-4000"></div>
      </div>
      <Card className="w-full max-w-md text-center relative z-10 bg-white dark:bg-slate-800 border-[#e0e0e0] dark:border-slate-700 shadow-2xl">
        <CardHeader className="space-y-2">
          <div className="mx-auto w-16 h-16 bg-[#d32f2f] rounded-full flex items-center justify-center shadow-md">
            <AlertTriangle className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-[#212121] dark:from-slate-100 dark:via-red-200 dark:to-pink-200">
            Something went wrong
          </CardTitle>
          <CardDescription className="text-[#757575] dark:text-slate-400">
            We encountered an unexpected error. Our team has been notified and is working to fix the issue.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-6xl font-bold text-[#9e9e9e] dark:from-slate-500 dark:to-slate-700 mb-4">
            500
          </div>

          <div className="space-y-2">
            <Button 
              onClick={reset} 
              className="w-full bg-[#1976d2] hover:bg-[#1565c0] text-white shadow-md hover:shadow-lg"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>

            <Button asChild variant="outline" className="w-full border-[#e0e0e0] dark:border-slate-700 text-[#212121] dark:text-slate-300 hover:bg-[#f5f5f5] dark:hover:bg-slate-700">
              <Link href="/dashboard">
                <Home className="mr-2 h-4 w-4" />
                Go to Dashboard
              </Link>
            </Button>
          </div>

          <div className="pt-4 border-t border-[#e0e0e0] dark:border-slate-700">
            <p className="text-sm text-[#757575] dark:text-slate-400">
              Error ID: {error.digest || 'Unknown'}
            </p>
            <p className="text-sm text-[#757575] dark:text-slate-400 mt-2">
              Need help?{' '}
              <Link href="/settings" className="text-[#1976d2] dark:text-indigo-400 hover:text-[#1565c0] dark:hover:text-indigo-300 underline transition-colors">
                Contact support
              </Link>
            </p>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <details className="pt-4 border-t border-[#e0e0e0] dark:border-slate-700">
              <summary className="cursor-pointer text-sm font-medium text-[#212121] dark:text-slate-300 mb-2">
                Error Details (Development Only)
              </summary>
              <div className="bg-[#f5f5f5] dark:bg-slate-900 p-3 rounded text-xs font-mono text-[#d32f2f] dark:text-red-400 overflow-auto max-h-32">
                <div className="mb-2">
                  <strong>Error:</strong> {error.message}
                </div>
                <div>
                  <strong>Stack:</strong>
                  <pre className="whitespace-pre-wrap mt-1">
                    {error.stack}
                  </pre>
                </div>
              </div>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


