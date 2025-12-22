import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, ArrowLeft, Search } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-900 dark:via-slate-800/30 dark:to-slate-900 relative overflow-hidden flex items-center justify-center px-4">
      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200/40 dark:bg-purple-900/20 rounded-full mix-blend-multiply filter blur-xl opacity-60 dark:opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-200/40 dark:bg-indigo-900/20 rounded-full mix-blend-multiply filter blur-xl opacity-60 dark:opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-200/40 dark:bg-pink-900/20 rounded-full mix-blend-multiply filter blur-xl opacity-60 dark:opacity-20 animate-blob animation-delay-4000"></div>
      </div>
      <Card className="w-full max-w-md text-center relative z-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-2xl">
        <CardHeader className="space-y-2">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/50">
            <Search className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 via-purple-800 to-pink-800 dark:from-slate-100 dark:via-purple-200 dark:to-pink-200 bg-clip-text text-transparent">
            Page Not Found
          </CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400">
            Sorry, we couldn't find the page you're looking for. The page might have been moved, deleted, or you entered the wrong URL.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-6xl font-bold bg-gradient-to-r from-slate-400 to-slate-600 dark:from-slate-500 dark:to-slate-700 bg-clip-text text-transparent mb-4">
            404
          </div>

          <div className="space-y-2">
            <Button asChild className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/30">
              <Link href="/dashboard">
                <Home className="mr-2 h-4 w-4" />
                Go to Dashboard
              </Link>
            </Button>

            <Button asChild variant="outline" className="w-full border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
              <Link href="javascript:history.back()">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Link>
            </Button>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              If you believe this is an error, please{' '}
              <Link href="/settings" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 underline transition-colors">
                contact support
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


