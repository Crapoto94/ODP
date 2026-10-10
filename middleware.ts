import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/lib/auth';
import { hasPermission, isTournagesOnly, type Permission } from '@/lib/permissions';

const protectedRoutes = ['/dashboard', '/mobile'];
const publicRoutes = ['/login', '/mobile/login', '/api/auth/login', '/api/auth/setup'];
const unprotectedDashboardRoutes = ['/dashboard/facturation/sedit-validation'];

const PERMISSION_PATHS: Array<{ prefix: string; permission: Permission }> = [
  { prefix: '/dashboard/tarifs', permission: 'MANAGE_TARIFS' },
  { prefix: '/dashboard/gabarit', permission: 'MANAGE_TRAMES' },
  { prefix: '/dashboard/facturation', permission: 'SEND_EMAILS' },
  { prefix: '/dashboard/report', permission: 'MANAGE_TARIFS' },
  { prefix: '/dashboard/carte', permission: 'VIEW_CARTE' },
  { prefix: '/dashboard/tournages', permission: 'VIEW_TOURNAGES' },
];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isUnprotectedDashboard = unprotectedDashboardRoutes.some(route => path.startsWith(route));
  // Public routes are never treated as protected (prevents redirect loops on /mobile/login)
  const isPublicRoute = publicRoutes.some(route => path === route || path.startsWith(route + '/'));
  const isProtectedRoute = !isPublicRoute && protectedRoutes.some(route => path.startsWith(route)) && !isUnprotectedDashboard;

  const cookie = request.cookies.get('session')?.value;
  const session = cookie ? await decrypt(cookie) : null;

  // Anciennes pièces jointes de tournage (déposées avant la route contrôlée) : plus d'accès public direct
  if (path.startsWith('/uploads/tournages/')) {
    if (!session || !hasPermission(session.role as string, 'VIEW_TOURNAGES')) return new NextResponse('Accès refusé', { status: 403 });
    return NextResponse.rewrite(new URL(`/api/tournages/pieces/${path.split('/').slice(3).join('/')}`, request.url));
  }

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
    // Rôle « Agent tournages » : uniquement les demandes, les tournages (liste + fiche) et la carte
    if (isTournagesOnly(role)) {
      const demandes = new URL('/dashboard/tournages/demandes', request.url);
      if (path === '/dashboard' || path === '/dashboard/') return NextResponse.redirect(demandes);
      if (path.startsWith('/dashboard/occupations') && path === '/dashboard/occupations' && request.nextUrl.searchParams.get('filtre') !== 'TOURNAGE') {
        return NextResponse.redirect(new URL('/dashboard/occupations?filtre=TOURNAGE', request.url));
      }
      const ok = ['/dashboard/tournages', '/dashboard/occupations', '/dashboard/carte', '/dashboard/settings'].some((p) => path.startsWith(p));
      if (!ok) return NextResponse.redirect(demandes);
    }
    if (path.startsWith('/dashboard/settings') && !hasPermission(role, 'MANAGE_USERS') && !hasPermission(role, 'MANAGE_TOURNAGES')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
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
