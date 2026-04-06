import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { sql } from '@/lib/db';
import { signAccessToken, signRefreshToken } from '@/lib/auth';
import { errorResponse } from '@/lib/middleware-utils';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return errorResponse('VALIDATION_ERROR', 'email and password are required.', 400);
    }

    const userResults = await sql`
      SELECT id, client_id, email, password_hash, full_name, role, email_verified, deleted_at
      FROM users
      WHERE email = ${email}
      LIMIT 1
    `;
    const user = (userResults as any)[0];

    if (!user || user.deleted_at) {
      return errorResponse('INVALID_CREDENTIALS', 'Invalid email or password.', 401);
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return errorResponse('INVALID_CREDENTIALS', 'Invalid email or password.', 401);
    }

    // Update last_login_at
    await sql`UPDATE users SET last_login_at = NOW() WHERE id = ${user.id}`;

    const authUser = { id: user.id, client_id: user.client_id, email: user.email, full_name: user.full_name, role: user.role };
    const accessToken = await signAccessToken(authUser);
    const refreshToken = await signRefreshToken(user.id);

    const clientResults = await sql`
      SELECT id, name, slug, plan, plan_spin_limit, spins_used_this_month, timezone, is_active
      FROM clients WHERE id = ${user.client_id} AND deleted_at IS NULL LIMIT 1
    `;
    const client = (clientResults as any)[0];

    const isSecure = process.env.NODE_ENV === 'production';
    const res = NextResponse.json({ user: authUser, client });
    res.cookies.set('access_token', accessToken, { httpOnly: true, secure: isSecure, sameSite: 'lax', path: '/', maxAge: 900 });
    res.cookies.set('refresh_token', refreshToken, { httpOnly: true, secure: isSecure, sameSite: 'lax', path: '/api/auth/refresh', maxAge: 604800 });
    return res;
  } catch (err) {
    console.error('Login error:', err);
    return errorResponse('INTERNAL_ERROR', 'Login failed.', 500);
  }
}
