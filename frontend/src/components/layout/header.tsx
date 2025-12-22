'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CheckSquare,
  LayoutDashboard,
  User,
  LogOut,
  Menu,
  X,
  Bell,
  Settings,
  HelpCircle,
  Shield
} from 'lucide-react';

import { useAuth } from '@/providers/auth-provider';
import { useWebSocket } from '@/providers/websocket-provider';
import { UserRole } from '@/types';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Logo } from '@/components/logo';
import { ThemeToggle } from '@/components/ui/theme-toggle';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
];

export function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const { isConnected } = useWebSocket();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Set mounted state after initial render to prevent hydration mismatch
    const timeoutId = setTimeout(() => {
      setMounted(true);
    }, 0);
    
    if (typeof window === 'undefined') {
      return () => clearTimeout(timeoutId);
    }

    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 20);
    };

    // Check initial scroll position after mount
    const checkScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    
    // Use setTimeout to avoid hydration mismatch
    const scrollTimeoutId = setTimeout(checkScroll, 0);
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      clearTimeout(timeoutId);
      clearTimeout(scrollTimeoutId);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  const getInitials = (firstName?: string, lastName?: string, email?: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    return email?.[0].toUpperCase() || 'U';
  };

  if (!isAuthenticated) {
    return null;
  }

  // Prevent hydration mismatch by using mounted state
  const shouldShowScrolled = mounted && isScrolled;

  return (
    <header 
      className={`sticky top-0 z-50 w-full bg-white dark:bg-slate-900 transition-all duration-500 ease-out ${
        shouldShowScrolled 
          ? 'pt-4 px-4' 
          : 'pt-0 px-0'
      }`}
    >
      <div 
        className={`relative transition-all duration-500 ease-out ${
          shouldShowScrolled 
            ? 'mx-auto mb-4 rounded-xl shadow-md shadow-black/5 dark:shadow-black/20 border border-border/30 bg-white dark:bg-slate-900 max-w-7xl' 
            : 'mx-0 mb-0 rounded-none shadow-none border-0 border-b border-border/30 bg-white dark:bg-slate-900'
        }`}
      >
        <div className={`relative z-10 mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-500 ${
          shouldShowScrolled ? 'py-3' : 'py-0'
        }`}>
        <div className={`flex items-center justify-between transition-all duration-500 ${
          shouldShowScrolled ? 'h-14' : 'h-16'
        }`}>
          {/* Logo and Navigation */}
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center transition-opacity hover:opacity-80">
              <Logo size="md" clickable={false} />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex md:items-center md:gap-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group relative inline-flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg ${
                      isActive
                        ? 'text-primary bg-accent/50'
                        : 'text-foreground/70 hover:text-foreground hover:bg-accent/30'
                    }`}
                  >
                    <item.icon className={`h-4 w-4 transition-all duration-200 ${isActive ? 'text-primary' : 'text-foreground/60 group-hover:text-foreground'}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>

            {/* WebSocket Status */}
            <div className="hidden sm:flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected
                    ? 'bg-green-500 shadow-sm shadow-green-500/50'
                    : 'bg-red-500 shadow-sm shadow-red-500/50'
                }`}
                title={`Real-time updates: ${isConnected ? 'Connected' : 'Disconnected'}`}
              />
              <span className="text-xs text-foreground/60 font-medium">
                {isConnected ? 'Live' : 'Offline'}
              </span>
            </div>

            {/* Notifications */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative h-9 w-9 text-foreground/70 hover:text-foreground hover:bg-accent/30 rounded-lg transition-all duration-200" 
              asChild
            >
              <Link href="/notifications">
                <Bell className="h-5 w-5 transition-transform duration-200" />
                {/* Notification badge */}
                <span className="absolute -top-0.5 -right-0.5 h-5 w-5 bg-destructive rounded-full text-[10px] font-semibold text-white flex items-center justify-center shadow-md ring-2 ring-background">
                  3
                </span>
              </Link>
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="relative h-9 w-9 rounded-full hover:bg-accent/30 transition-all duration-200 p-0"
                >
                  <Avatar className="relative h-9 w-9 ring-2 ring-border/50 hover:ring-border transition-all duration-200">
                    <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">
                      {getInitials(user?.profile?.firstName, user?.profile?.lastName, user?.email)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 p-2" align="end">
                <DropdownMenuLabel className="px-3 py-2">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-semibold leading-none">
                      {user?.profile?.firstName && user?.profile?.lastName
                        ? `${user.profile.firstName} ${user.profile.lastName}`
                        : user?.email}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground font-normal">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="my-2" />
                <DropdownMenuItem asChild className="cursor-pointer rounded-md px-3 py-2">
                  <Link href="/profile" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer rounded-md px-3 py-2">
                  <Link href="/settings" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer rounded-md px-3 py-2">
                  <Link href="/help" className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4" />
                    <span>Help & Support</span>
                  </Link>
                </DropdownMenuItem>
                {user?.role === UserRole.ADMIN && (
                  <>
                    <DropdownMenuSeparator className="my-2" />
                    <DropdownMenuItem asChild className="cursor-pointer rounded-md px-3 py-2">
                      <Link href="/admin" className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        <span>Admin Panel</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator className="my-2" />
                <DropdownMenuItem 
                  onClick={handleLogout} 
                  className="cursor-pointer rounded-md px-3 py-2 text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center gap-2">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="h-9 w-9 text-foreground/70 hover:text-foreground hover:bg-accent/30 rounded-lg transition-all duration-200"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5 transition-transform duration-200" />
                ) : (
                  <Menu className="h-5 w-5 transition-transform duration-200" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className={`md:hidden border-t border-border/40 ${
            shouldShowScrolled ? 'mt-2' : ''
          }`}>
              <nav className="px-2 py-3 space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`group flex items-center gap-3 px-4 py-2.5 rounded-lg text-base font-medium transition-all duration-200 ${
                        isActive
                          ? 'text-primary bg-accent/50'
                          : 'text-foreground/70 hover:text-foreground hover:bg-accent/30'
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <item.icon className={`h-5 w-5 transition-all duration-200 ${isActive ? 'text-primary' : 'text-foreground/60 group-hover:text-foreground'}`} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
