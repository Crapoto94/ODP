import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/lib/auth';

const protectedRoutes = ['/dashboard'];
const publicRoutes = ['/login', '/api/auth/login', '/api/auth/setup'];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));
  const isPublicRoute = publicRoutes.some(route => path.startsWith(route));

  // Access session cookie
  const cookie = request.cookies.get('session')?.value;
  const session = cookie ? await decrypt(cookie) : null;

  // 1. Redirect to login if accessing protected route without session
  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. Redirect to dashboard if logged in and accessing public route (login)
  if (isPublicRoute && session && path === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 3. Role-based Access Control
  if (session && path.startsWith('/dashboard')) {
    const role = session.role;
    
    // Only Admin can access settings
    if (path.startsWith('/dashboard/settings') && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Only Comptable and Admin can access facturation
    if (path.startsWith('/dashboard/facturation') && (role !== 'AGENT_COMPTABLE' && role !== 'ADMIN')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'], // Exclude standard static files
};
