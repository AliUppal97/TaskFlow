'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  CheckCircle, 
  Users, 
  Radio, 
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
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#bbdefb] dark:border-indigo-900 border-t-[#1976d2] dark:border-t-indigo-400"></div>
          <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-[#1976d2] dark:text-indigo-400 animate-pulse" strokeWidth={2} />
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null; // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 relative overflow-hidden">
      {/* Subtle gradient overlay - clean and light for light theme */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pointer-events-none" />
      
      {/* Animated background elements - subtle and light for light theme */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-blue-100/20 dark:bg-primary/10 rounded-full blur-3xl animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-indigo-100/20 dark:bg-blue-500/10 rounded-full blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-purple-100/20 dark:bg-purple-500/10 rounded-full blur-3xl animate-blob animation-delay-4000" />
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b border-border bg-white dark:bg-slate-900/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white supports-[backdrop-filter]:dark:bg-slate-900/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center transition-opacity hover:opacity-80">
              <Logo size="lg" clickable={false} />
            </Link>
            <div className="flex items-center gap-3">
              {/* Theme Toggle */}
              <div className="hidden sm:block">
                <ThemeToggle />
              </div>
              <Button 
                variant="ghost" 
                onClick={() => router.push('/login')}
                className="hidden sm:inline-flex h-9 px-4 text-sm font-medium text-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
              >
                Sign In
              </Button>
              <Button 
                onClick={() => router.push('/register')}
                className="h-9 px-4 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md transition-all duration-200 group"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        {/* Hero Section */}
        <div className="text-center mb-32 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent dark:bg-accent/20 border border-border/60 mb-8 shadow-sm">
            <Sparkles className="h-4 w-4 text-primary" strokeWidth={2} />
            <span className="text-sm text-accent-foreground dark:text-foreground/80 font-medium">Enterprise-Grade Task Management</span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-8 text-foreground leading-tight tracking-tight">
            Streamline Your Team&apos;s
            <br />
            <span className="bg-gradient-to-r from-primary via-blue-600 to-purple-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
              Workflow
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl lg:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed font-light">
            A production-ready, enterprise-grade task management system with{' '}
            <span className="text-foreground font-medium">real-time collaboration</span>,
            built for teams that demand{' '}
            <span className="text-foreground font-medium">reliability</span> and{' '}
            <span className="text-foreground font-medium">performance</span>.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              onClick={() => router.push('/register')}
              className="h-12 px-8 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-200 group"
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => router.push('/login')}
              className="h-12 px-8 text-base font-medium border-2 border-border/80 hover:bg-accent transition-all duration-200"
            >
              Sign In
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-32">
          <Card className="group relative overflow-hidden border border-border/80 bg-card hover:border-primary/50 hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-700 to-blue-800 dark:from-primary dark:to-blue-600 flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg shadow-md icon-container">
                <Radio className="h-7 w-7 text-white icon-white" strokeWidth={2.5} />
              </div>
              <CardTitle className="text-xl mb-3 font-semibold">Real-time Collaboration</CardTitle>
              <CardDescription className="text-muted-foreground leading-relaxed">
                See task updates instantly with WebSocket-powered real-time synchronization across your entire team.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="group relative overflow-hidden border border-border/80 bg-card hover:border-primary/50 hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg shadow-md">
                <Shield className="h-7 w-7 text-white" strokeWidth={2} />
              </div>
              <CardTitle className="text-xl mb-3 font-semibold">Enterprise Security</CardTitle>
              <CardDescription className="text-muted-foreground leading-relaxed">
                JWT authentication, role-based access control, and HttpOnly cookies for maximum security.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="group relative overflow-hidden border border-border/80 bg-card hover:border-primary/50 hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg shadow-md">
                <Users className="h-7 w-7 text-white" strokeWidth={2} />
              </div>
              <CardTitle className="text-xl mb-3 font-semibold">Team Management</CardTitle>
              <CardDescription className="text-muted-foreground leading-relaxed">
                Assign tasks, track progress, and manage team workflows efficiently with intuitive controls.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="group relative overflow-hidden border border-border/80 bg-card hover:border-primary/50 hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg shadow-md">
                <CheckCircle className="h-7 w-7 text-white" strokeWidth={2} />
              </div>
              <CardTitle className="text-xl mb-3 font-semibold">Production Ready</CardTitle>
              <CardDescription className="text-muted-foreground leading-relaxed">
                Built with TypeScript, comprehensive testing, and enterprise-grade architecture.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Stats Section */}
        <div className="grid md:grid-cols-3 gap-6 mb-32">
          <Card className="border border-border/80 bg-gradient-to-br from-blue-50 via-blue-50/80 to-indigo-50 dark:from-blue-950/30 dark:via-blue-950/20 dark:to-indigo-950/30 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-2 font-medium uppercase tracking-wide">Active Users</p>
                  <p className="text-4xl font-bold bg-gradient-to-r from-primary via-blue-600 to-blue-700 dark:from-blue-400 dark:via-indigo-400 dark:to-blue-500 bg-clip-text text-transparent">10K+</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/20 dark:bg-primary/20 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-primary dark:text-blue-400" strokeWidth={2} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/80 bg-gradient-to-br from-purple-50 via-purple-50/80 to-pink-50 dark:from-purple-950/30 dark:via-purple-950/20 dark:to-pink-950/30 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-2 font-medium uppercase tracking-wide">Tasks Managed</p>
                  <p className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-purple-700 dark:from-purple-400 dark:via-pink-400 dark:to-purple-500 bg-clip-text text-transparent">1M+</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 dark:bg-purple-500/20 flex items-center justify-center">
                  <CheckSquare className="h-6 w-6 text-purple-600 dark:text-purple-400" strokeWidth={2} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/80 bg-gradient-to-br from-amber-50 via-amber-50/80 to-orange-50 dark:from-amber-950/30 dark:via-amber-950/20 dark:to-orange-950/30 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-2 font-medium uppercase tracking-wide">Uptime</p>
                  <p className="text-4xl font-bold bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 dark:from-amber-400 dark:via-orange-400 dark:to-amber-500 bg-clip-text text-transparent">99.9%</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 dark:bg-amber-500/20 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" strokeWidth={2} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tech Stack */}
        <div className="text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-foreground tracking-tight">
            Built with Modern Tech Stack
          </h2>
          <p className="text-muted-foreground mb-12 text-lg font-light">Powered by cutting-edge technologies</p>
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
                className="px-5 py-2.5 bg-card dark:bg-card/30 border border-border/80 rounded-full text-sm font-medium text-foreground hover:text-foreground hover:border-primary/50 hover:bg-accent hover:shadow-md transition-all duration-200 cursor-default"
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
