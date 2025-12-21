'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { UserRole } from '@/types';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  allowedRoles?: UserRole[];
  redirectTo?: string;
  fallback?: React.ReactNode;
}

/**
 * ProtectedRoute - Protects routes based on authentication and optionally roles
 * 
 * This component can protect routes in two ways:
 * 1. Authentication-only: Just check if user is authenticated
 * 2. Role-based: Check if user is authenticated AND has one of the allowed roles
 * 
 * Usage:
 * // Authentication only
 * <ProtectedRoute>
 *   <DashboardContent />
 * </ProtectedRoute>
 * 
 * // Role-based
 * <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
 *   <AdminContent />
 * </ProtectedRoute>
 * 
 * @param children - Content to render if access is granted
 * @param requireAuth - Whether authentication is required (default: true)
 * @param allowedRoles - Optional array of roles that can access this route
 * @param redirectTo - Route to redirect to if access is denied (default: /login)
 * @param fallback - Custom loading component (optional)
 */
export function ProtectedRoute({
  children,
  requireAuth = true,
  allowedRoles,
  redirectTo = '/login',
  fallback,
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      // If authentication is required but user is not authenticated
      if (requireAuth && !isAuthenticated) {
        router.push(redirectTo);
        return;
      }

      // If roles are specified, check if user has required role
      if (requireAuth && isAuthenticated && allowedRoles && allowedRoles.length > 0) {
        if (!user || !allowedRoles.includes(user.role)) {
          // User doesn't have required role, redirect to dashboard
          router.push('/dashboard');
          return;
        }
      }

      // If auth is not required but user is authenticated, redirect to dashboard
      if (!requireAuth && isAuthenticated) {
        router.push('/dashboard');
      }
    }
  }, [user, isAuthenticated, isLoading, requireAuth, allowedRoles, redirectTo, router]);

  if (isLoading) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
            <p className="mt-2 text-sm text-gray-600">Loading...</p>
          </div>
        </div>
      )
    );
  }

  if (requireAuth && !isAuthenticated) {
    return null; // Will redirect
  }

  // Check role-based access if roles are specified
  if (requireAuth && isAuthenticated && allowedRoles && allowedRoles.length > 0) {
    if (!user || !allowedRoles.includes(user.role)) {
      return null; // Will redirect
    }
  }

  if (!requireAuth && isAuthenticated) {
    return null; // Will redirect
  }

  return <>{children}</>;
}




