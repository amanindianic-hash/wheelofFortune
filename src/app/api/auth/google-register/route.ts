import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { sql } from '@/lib/db';
import { signAccessToken, signRefreshToken } from '@/lib/auth';
import { errorResponse } from '@/lib/middleware-utils';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-change-in-production'
);

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// POST /api/auth/google-register — complete registration for new Google OAuth users
export async function POST(req: NextRequest) {
  try {
    const { token, company_name, timezone = 'UTC' } = await req.json();

    if (!token || !company_name?.trim()) {
      return errorResponse('VALIDATION_ERROR', 'token and company_name are required.', 400);
    }

    // Verify the onboarding token issued by the OAuth callback
    let payload: { google_id: string; email: string; full_name: string; type: string };
    try {
      const result = await jwtVerify(token, JWT_SECRET);
      payload = result.payload as typeof payload;
    } catch {
      return errorResponse('INVALID_TOKEN', 'Onboarding token is invalid or expired. Please sign in with Google again.', 401);
    }

    if (payload.type !== 'google_onboarding') {
      return errorResponse('INVALID_TOKEN', 'Invalid token type.', 401);
    }

    const { google_id, email, full_name } = payload;

    // Check if email already registered
    const existing = await sql`
      SELECT id FROM users WHERE email = ${email} AND deleted_at IS NULL LIMIT 1
    ` as any[];
    if (existing.length > 0) {
      return errorResponse('EMAIL_TAKEN', 'An account with this email already exists. Sign in instead.', 409);
    }

    // Ensure google_id column exists
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE`;

    // Unique slug for the new client
    const baseSlug = slugify(company_name.trim());
    const slugRows = await sql`
      SELECT slug FROM clients WHERE slug LIKE ${baseSlug + '%'} ORDER BY slug
    ` as any[];
    const taken = slugRows.map((r: any) => r.slug as string);
    let slug = baseSlug;
    let n = 1;
    while (taken.includes(slug)) slug = `${baseSlug}-${n++}`;

    // Create client
    const clientRows = await sql`
      INSERT INTO clients (name, slug, email, plan, timezone)
      VALUES (${company_name.trim()}, ${slug}, ${email}, 'starter', ${timezone})
      RETURNING id, name, slug, email, plan, plan_spin_limit, spins_used_this_month, timezone, is_active
    ` as any[];
    const client = clientRows[0];

    // Create user — no password_hash since they authenticate via Google
    const userRows = await sql`
      INSERT INTO users (client_id, email, password_hash, full_name, role, email_verified, google_id)
      VALUES (${client.id}, ${email}, '', ${full_name}, 'owner', true, ${google_id})
      RETURNING id, client_id, email, full_name, role
    ` as any[];
    const user = userRows[0];

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
    const res = NextResponse.json({ user: authUser, client }, { status: 201 });
    res.cookies.set('access_token', accessToken, { httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge: 900 });
    res.cookies.set('refresh_token', refreshToken, { httpOnly: true, secure, sameSite: 'lax', path: '/api/auth/refresh', maxAge: 604800 });
    return res;
  } catch (err) {
    console.error('Google register error:', err);
    return errorResponse('INTERNAL_ERROR', 'Registration failed.', 500);
  }
}
