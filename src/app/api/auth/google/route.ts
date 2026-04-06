import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

// GET /api/auth/google — initiate Google OAuth flow
export async function GET(req: NextRequest) {
  const state = randomBytes(16).toString('hex');
  const origin = req.nextUrl.origin;

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: `${origin}/api/auth/google/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'offline',
    prompt: 'select_account',
  });

  const res = NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params}`
  );

  // Store state in short-lived cookie to verify on callback (CSRF protection)
  res.cookies.set('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });

  return res;
}
