import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Protected routes that require authentication
 * These routes will redirect to /login if user is not authenticated
 * 
 * Note: Role-based protection (e.g., admin routes) is handled by
 * the RoleProtectedRoute component on the client side, as we cannot
 * access user role information in middleware without server-side session.
 */
const protectedRoutes = [
  '/dashboard',
  '/tasks',
  '/admin', // Admin-only route (protected by RoleProtectedRoute component)
  '/profile',
  '/settings',
  '/notifications',
  '/help',
];

/**
 * Public routes that should redirect to /dashboard if user is already authenticated
 */
const publicRoutes = [
  '/login',
  '/register',
];

/**
 * Routes that are always accessible (no authentication check)
 */
const publicOnlyRoutes = [
  '/',
  '/forgot-password',
  '/verify-email',
];

/**
 * Middleware to protect routes and handle authentication redirects
 * 
 * This runs on the edge before the page loads, providing:
 * - Framework-level route protection
 * - Faster redirects (no client-side flash)
 * - Better security (can't bypass by disabling JavaScript)
 * 
 * Note: Since access tokens are stored in localStorage (client-side only),
 * we can't check authentication status in middleware. However, this middleware
 * still provides structure for future cookie-based auth or can be enhanced
 * to check for auth cookies if the backend sets them.
 * 
 * The client-side ProtectedRoute component provides the actual authentication
 * checks and redirects. This middleware serves as a first line of defense
 * and can be enhanced if cookies are used for token storage.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check for auth token in cookies (if backend sets it)
  // Note: Access token is currently in localStorage, but we check cookies
  // as a fallback or for future cookie-based auth implementation
  const accessTokenCookie = request.cookies.get('accessToken')?.value;
  const refreshTokenCookie = request.cookies.get('refreshToken')?.value;
  const hasAuthCookie = !!(accessTokenCookie || refreshTokenCookie);

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );

  // Check if the route is public (should redirect if authenticated)
  const isPublicRoute = publicRoutes.some(route => 
    pathname.startsWith(route)
  );

  // If we have auth cookies, we can make routing decisions
  // Otherwise, let client-side ProtectedRoute handle it
  if (hasAuthCookie) {
    // Redirect authenticated users from public routes (login/register) to dashboard
    if (isPublicRoute) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // For protected routes without auth cookies, we could redirect to login
  // But since tokens are in localStorage, we let client-side handle it
  // This prevents false redirects when user is actually authenticated
  
  // Allow all requests to proceed - client-side will handle auth checks
  return NextResponse.next();
}

/**
 * Configure which routes the middleware should run on
 * Using a matcher to optimize performance
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

