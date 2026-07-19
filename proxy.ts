import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/income',
  '/expenses',
  '/investments',
  '/debts',
  '/goals',
  '/bills',
  '/recurring',
  '/reports',
  '/settings',
  '/family',
  '/tax',
  '/insurance',
  '/emergency',
  '/annual',
  '/wealth',
  '/networth',
  '/savings',
  '/transfers',
  '/reconciliation',
  '/opportunities',
  '/coach',
  '/brief',
  '/ai',
  '/markets',
  '/control',
  '/stress',
  '/simulator',
  '/dreams',
  '/guide',
];

// Public routes that should never require auth
const publicRoutes = [
  '/',
  '/login',
  '/signup',
  '/reset-password',
  '/privacy',
  '/terms',
  '/api/auth/login',
  '/api/auth/signup',
  '/api/auth/logout',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/demo',
  '/api/health',
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow all API routes (auth handled inside each route)
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Allow static files and Next internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/public') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico' ||
    pathname === '/manifest.json'
  ) {
    return NextResponse.next();
  }

  // Check if route needs protection
  const isProtected = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );

  const isPublic = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );

  // Get session token from cookies
  const sessionToken = request.cookies.get('session')?.value || 
                       request.cookies.get('auth-token')?.value;

  // Redirect to login if trying to access protected route without session
  if (isProtected && !sessionToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Add security headers
  const response = NextResponse.next();

  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};