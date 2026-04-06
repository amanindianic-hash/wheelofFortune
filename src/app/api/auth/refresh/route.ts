import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyRefreshToken, signAccessToken, signRefreshToken } from '@/lib/auth';
import { errorResponse } from '@/lib/middleware-utils';

export async function POST(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get('refresh_token')?.value;
    if (!refreshToken) {
      return errorResponse('UNAUTHORIZED', 'Refresh token missing.', 401);
    }

    const payload = await verifyRefreshToken(refreshToken);
    if (!payload?.sub) {
      return errorResponse('TOKEN_EXPIRED', 'Refresh token expired or invalid.', 401);
    }

    const userResults = await sql`
      SELECT id, client_id, email, full_name, role, deleted_at
      FROM users WHERE id = ${payload.sub} LIMIT 1
    `;
    const user = (userResults as any)[0];

    if (!user || user.deleted_at) {
      return errorResponse('UNAUTHORIZED', 'User not found.', 401);
    }

    const authUser = { id: user.id, client_id: user.client_id, email: user.email, full_name: user.full_name, role: user.role };
    const newAccessToken = await signAccessToken(authUser);
    const newRefreshToken = await signRefreshToken(user.id);

    const isSecure = process.env.NODE_ENV === 'production';
    const res = NextResponse.json({ success: true });
    res.cookies.set('access_token', newAccessToken, { httpOnly: true, secure: isSecure, sameSite: 'lax', path: '/', maxAge: 900 });
    res.cookies.set('refresh_token', newRefreshToken, { httpOnly: true, secure: isSecure, sameSite: 'lax', path: '/api/auth/refresh', maxAge: 604800 });
    return res;
  } catch (err) {
    console.error('Refresh error:', err);
    return errorResponse('INTERNAL_ERROR', 'Token refresh failed.', 500);
  }
}
