import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/lib/auth';
import { hasPermission, type Permission } from '@/lib/permissions';

const protectedRoutes = ['/dashboard', '/mobile'];
const publicRoutes = ['/login', '/mobile/login', '/api/auth/login', '/api/auth/setup'];
const unprotectedDashboardRoutes = ['/dashboard/facturation/sedit-validation'];

const PERMISSION_PATHS: Array<{ prefix: string; permission: Permission }> = [
  { prefix: '/dashboard/settings', permission: 'MANAGE_USERS' },
  { prefix: '/dashboard/tarifs', permission: 'MANAGE_TARIFS' },
  { prefix: '/dashboard/gabarit', permission: 'MANAGE_TRAMES' },
  { prefix: '/dashboard/facturation', permission: 'SEND_EMAILS' },
  { prefix: '/dashboard/report', permission: 'MANAGE_TARIFS' },
  { prefix: '/dashboard/carte', permission: 'CONTROLE_TERRAIN' },
];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isUnprotectedDashboard = unprotectedDashboardRoutes.some(route => path.startsWith(route));
  // Public routes are never treated as protected (prevents redirect loops on /mobile/login)
  const isPublicRoute = publicRoutes.some(route => path === route || path.startsWith(route + '/'));
  const isProtectedRoute = !isPublicRoute && protectedRoutes.some(route => path.startsWith(route)) && !isUnprotectedDashboard;

  const cookie = request.cookies.get('session')?.value;
  const session = cookie ? await decrypt(cookie) : null;

  // 1. Redirect to login if accessing protected route without session
  if (isProtectedRoute && !session) {
    const dest = path.startsWith('/mobile') ? '/mobile/login' : '/login';
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // 2. Redirect to home if logged in and accessing a login page
  if (isPublicRoute && session) {
    if (path === '/login') return NextResponse.redirect(new URL('/dashboard', request.url));
    if (path === '/mobile/login') return NextResponse.redirect(new URL('/mobile', request.url));
  }

  // 3. Permission-based Access Control (dashboard only)
  if (session && path.startsWith('/dashboard')) {
    const role = session.role as string;
    for (const { prefix, permission } of PERMISSION_PATHS) {
      if (path.startsWith(prefix) && !hasPermission(role, permission)) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
