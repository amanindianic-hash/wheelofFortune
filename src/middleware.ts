import { NextRequest, NextResponse } from 'next/server';

/**
 * Public routes that must never be blocked by Vercel Deployment Protection
 * or any future auth middleware layer.
 */
const PUBLIC_PATHS = [
  '/manifest.webmanifest',
  '/sw.js',
  '/favicon.ico',
  '/icon-192.png',
  '/icon-512.png',
  // Public-facing spin widget & play pages
  '/play/',
  '/widget/',
  // Auth endpoints
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/auth/google',
  '/api/auth/google/callback',
  '/api/auth/google-register',
  '/api/auth/logout',
  // Public spin APIs (session gated internally)
  '/api/spin/session',
  '/api/spin/execute',
  '/api/spin/game-type',
  '/api/push/subscribe',
  '/api/push/unsubscribe',
  // Referral tracking (public)
  '/api/referral/track',
  // Stripe webhook (public, verified by signature)
  '/api/billing/webhook',
  // Telegram webhook (public)
  '/api/telegram/webhook',
];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p));
}

export function middleware(req: NextRequest) {
  // Simply pass all traffic through — this middleware exists to ensure
  // Vercel's Deployment Protection bypass header is added for public paths,
  // and to serve as the canonical matcher config for the project.
  return NextResponse.next();
}

export const config = {
  /*
   * Match everything EXCEPT:
   * - _next/static  (static assets)
   * - _next/image   (image optimisation)
   * - static files with extensions (fonts, images, etc.)
   */
  matcher: ['/((?!_next/static|_next/image|.*\\.(?:png|jpg|jpeg|gif|svg|ico|woff2?|ttf|otf|eot|css|js)$).*)'],
};
