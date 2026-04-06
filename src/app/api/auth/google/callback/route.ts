import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { sql } from '@/lib/db';
import { signAccessToken, signRefreshToken } from '@/lib/auth';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-change-in-production'
);

// GET /api/auth/google/callback — handle Google OAuth redirect
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const redirectBase = `${appUrl}/login`;

  // User denied access
  if (error) {
    return NextResponse.redirect(`${redirectBase}?error=google_denied`);
  }

  // Validate CSRF state
  const cookieState = req.cookies.get('oauth_state')?.value;
  if (!state || !cookieState || state !== cookieState) {
    return NextResponse.redirect(`${redirectBase}?error=invalid_state`);
  }

  if (!code) {
    return NextResponse.redirect(`${redirectBase}?error=no_code`);
  }

  try {
    const redirectUri = `${appUrl}/api/auth/google/callback`;

    // Exchange code for access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('Google token exchange failed:', tokenData);
      return NextResponse.redirect(`${redirectBase}?error=token_exchange`);
    }

    // Get Google profile
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileRes.json();

    if (!profile.email) {
      return NextResponse.redirect(`${redirectBase}?error=no_email`);
    }

    // Ensure google_id column exists (idempotent)
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE`;

    // Look up by google_id first
    let rows = await sql`
      SELECT id, client_id, email, full_name, role, deleted_at
      FROM users WHERE google_id = ${profile.sub} LIMIT 1
    ` as any[];
    let user = rows[0];

    if (!user) {
      // Fall back to email match (link existing account)
      rows = await sql`
        SELECT id, client_id, email, full_name, role, deleted_at
        FROM users WHERE email = ${profile.email} AND deleted_at IS NULL LIMIT 1
      ` as any[];
      user = rows[0];

      if (user) {
        // Link Google ID to existing email/password account
        await sql`UPDATE users SET google_id = ${profile.sub} WHERE id = ${user.id}`;
      }
    }

    const res = NextResponse.redirect(`${appUrl}/dashboard`);
    res.cookies.delete('oauth_state');

    if (user && !user.deleted_at) {
      // Returning user — issue JWT
      await sql`UPDATE users SET last_login_at = NOW() WHERE id = ${user.id}`;

      const authUser = {
        id: user.id,
        client_id: user.client_id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      };
      const accessToken = await signAccessToken(authUser);
      const refreshToken = await signRefreshToken(user.id);

      const secure = process.env.NODE_ENV === 'production';
      res.cookies.set('access_token', accessToken, { httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge: 900 });
      res.cookies.set('refresh_token', refreshToken, { httpOnly: true, secure, sameSite: 'lax', path: '/api/auth/refresh', maxAge: 604800 });
      return res;
    }

    // New user — create a short-lived onboarding token with their Google info
    const onboardingToken = await new SignJWT({
      google_id: profile.sub,
      email: profile.email,
      full_name: profile.name ?? '',
      type: 'google_onboarding',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30m')
      .sign(JWT_SECRET);

    const params = new URLSearchParams({
      token: onboardingToken,
      email: profile.email,
      name: profile.name ?? '',
    });

    return NextResponse.redirect(`${appUrl}/register/onboarding?${params}`);
  } catch (err) {
    console.error('Google OAuth callback error:', err);
    return NextResponse.redirect(`${redirectBase}?error=oauth_failed`);
  }
}
