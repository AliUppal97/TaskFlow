'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  CheckCircle, 
  Users, 
  Zap, 
  Shield, 
  CheckSquare, 
  ArrowRight, 
  Sparkles,
  TrendingUp,
  Clock
} from 'lucide-react';
import { Logo } from '@/components/logo';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-100 dark:border-indigo-900 border-t-indigo-600 dark:border-t-indigo-400"></div>
          <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-indigo-600 dark:text-indigo-400 animate-pulse" />
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null; // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/40 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800/30 dark:to-slate-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-200/40 dark:bg-indigo-900/20 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-200/40 dark:bg-purple-900/20 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-200/40 dark:bg-blue-900/20 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-4000"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60 shadow-sm">
        <div className="container mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <Logo size="lg" />
            <div className="flex items-center space-x-4">
              {/* Theme Toggle */}
              <ThemeToggle />
              <Button 
                variant="ghost" 
                onClick={() => router.push('/login')}
                className="text-[#757575] dark:text-slate-300 hover:text-[#212121] dark:hover:text-slate-100 hover:bg-[#f5f5f5] dark:hover:bg-slate-800"
              >
                Sign In
              </Button>
              <Button 
                onClick={() => router.push('/register')}
                className="bg-[#1976d2] hover:bg-[#1565c0] text-white shadow-md hover:shadow-lg transition-all"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="relative z-10 container mx-auto px-6 py-20">
        {/* Hero Section */}
        <div className="text-center mb-24 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#e3f2fd] dark:bg-indigo-900/30 border border-[#bbdefb] dark:border-indigo-800 mb-6 shadow-sm">
            <Sparkles className="h-4 w-4 text-[#1976d2] dark:text-indigo-400" />
            <span className="text-sm text-[#1565c0] dark:text-indigo-300 font-medium">Enterprise-Grade Task Management</span>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-bold mb-6 text-[#212121] dark:from-slate-100 dark:via-indigo-200 dark:to-purple-200 leading-tight">
            Streamline Your Team&apos;s
            <br />
            <span className="bg-gradient-to-r from-[#1976d2] via-[#1565c0] to-[#0d47a1] dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
              Workflow
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-[#757575] dark:text-slate-300 mb-10 max-w-3xl mx-auto leading-relaxed">
            A production-ready, enterprise-grade task management system with{' '}
            <span className="text-[#1976d2] dark:text-indigo-400 font-semibold">real-time collaboration</span>,
            built for teams that demand{' '}
            <span className="text-[#00796b] dark:text-purple-400 font-semibold">reliability</span> and{' '}
            <span className="text-[#1976d2] dark:text-pink-400 font-semibold">performance</span>.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg" 
                onClick={() => router.push('/register')}
                className="bg-[#1976d2] hover:bg-[#1565c0] text-white px-8 py-6 text-lg shadow-md hover:shadow-lg transition-all"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => router.push('/login')}
              className="border-2 border-[#e0e0e0] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#212121] dark:text-slate-300 hover:bg-[#f5f5f5] dark:hover:bg-slate-700 hover:border-[#bdbdbd] dark:hover:border-slate-600 px-8 py-6 text-lg shadow-sm"
            >
              Sign In
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 group">
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-4 transition-transform group-hover:scale-110 shadow-lg shadow-blue-500/30">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-slate-900 dark:text-slate-100 text-xl mb-2">Real-time Collaboration</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                See task updates instantly with WebSocket-powered real-time synchronization across your entire team.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-green-300 dark:hover:border-green-600 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/10 group">
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-4 transition-transform group-hover:scale-110 shadow-lg shadow-green-500/30">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-slate-900 dark:text-slate-100 text-xl mb-2">Enterprise Security</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                JWT authentication, role-based access control, and HttpOnly cookies for maximum security.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 group">
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4 transition-transform group-hover:scale-110 shadow-lg shadow-purple-500/30">
                <Users className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-slate-900 dark:text-slate-100 text-xl mb-2">Team Management</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                Assign tasks, track progress, and manage team workflows efficiently with intuitive controls.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-600 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/10 group">
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mb-4 transition-transform group-hover:scale-110 shadow-lg shadow-orange-500/30">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-slate-900 dark:text-slate-100 text-xl mb-2">Production Ready</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                Built with TypeScript, comprehensive testing, and enterprise-grade architecture.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Stats Section */}
        <div className="grid md:grid-cols-3 gap-6 mb-20">
          <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 border-indigo-200 dark:border-indigo-800 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 dark:text-slate-400 text-sm mb-1 font-medium">Active Users</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">10K+</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500 dark:text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 border-purple-200 dark:border-purple-800 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 dark:text-slate-400 text-sm mb-1 font-medium">Tasks Managed</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">1M+</p>
                </div>
                <CheckSquare className="h-8 w-8 text-blue-500 dark:text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-pink-50 to-orange-50 dark:from-pink-900/30 dark:to-orange-900/30 border-pink-200 dark:border-pink-800 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 dark:text-slate-400 text-sm mb-1 font-medium">Uptime</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 dark:from-pink-400 dark:to-orange-400 bg-clip-text text-transparent">99.9%</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500 dark:text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tech Stack */}
        <div className="text-center">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-slate-900 to-indigo-800 dark:from-slate-100 dark:to-indigo-200 bg-clip-text text-transparent">
            Built with Modern Tech Stack
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-10 text-lg">Powered by cutting-edge technologies</p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              'Next.js 16',
              'NestJS',
              'TypeScript',
              'PostgreSQL',
              'Redis',
              'WebSockets',
              'Docker',
              'JWT',
              'Tailwind CSS',
              'React Query'
            ].map((tech) => (
              <span
                key={tech}
                className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:text-indigo-700 dark:hover:text-indigo-400 transition-all cursor-default shadow-sm"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
