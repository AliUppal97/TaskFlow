'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { UserRole } from '@/types';
import { Loader2 } from 'lucide-react';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  redirectTo?: string;
  fallback?: React.ReactNode;
}

/**
 * RoleProtectedRoute - Protects routes based on user roles
 * 
 * This component ensures that only users with the specified roles can access
 * the protected content. If the user doesn't have the required role, they
 * will be redirected to the specified route (default: /dashboard).
 * 
 * Usage:
 * <RoleProtectedRoute allowedRoles={[UserRole.ADMIN]}>
 *   <AdminContent />
 * </RoleProtectedRoute>
 * 
 * @param children - Content to render if user has required role
 * @param allowedRoles - Array of roles that can access this route
 * @param redirectTo - Route to redirect to if user doesn't have required role (default: /dashboard)
 * @param fallback - Custom loading component (optional)
 */
export function RoleProtectedRoute({
  children,
  allowedRoles,
  redirectTo = '/dashboard',
  fallback,
}: RoleProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      // If not authenticated, redirect to login
      if (!isAuthenticated || !user) {
        router.push('/login');
        return;
      }

      // Check if user has one of the required roles
      const hasRequiredRole = allowedRoles.includes(user.role);

      if (!hasRequiredRole) {
        // User doesn't have required role, redirect
        router.push(redirectTo);
      }
    }
  }, [user, isAuthenticated, isLoading, allowedRoles, redirectTo, router]);

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

  // If not authenticated, don't render (will redirect)
  if (!isAuthenticated || !user) {
    return null;
  }

  // Check if user has required role
  const hasRequiredRole = allowedRoles.includes(user.role);

  if (!hasRequiredRole) {
    return null; // Will redirect
  }

  return <>{children}</>;
}





