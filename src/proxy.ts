import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';

const PUBLIC_PATHS = ['/login', '/register', '/widget', '/demo.html', '/forgot-password', '/reset-password'];
const PUBLIC_EXACT = ['/', '/manifest.webmanifest', '/manifest.json'];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths and all API routes (they handle their own auth)
  if (
    PUBLIC_EXACT.includes(pathname) ||
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get('access_token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const user = await verifyAccessToken(token);
  if (!user) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
