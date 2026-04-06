import { NextRequest } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { sql } from '@/lib/db';
import { errorResponse, okResponse } from '@/lib/middleware-utils';

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || typeof token !== 'string') {
      return errorResponse('VALIDATION_ERROR', 'Reset token is required.', 400);
    }
    if (!password || typeof password !== 'string' || password.length < 8) {
      return errorResponse('VALIDATION_ERROR', 'Password must be at least 8 characters.', 400);
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const rows = await sql`
      SELECT id, user_id, expires_at, used_at
      FROM password_reset_tokens
      WHERE token_hash = ${tokenHash}
      LIMIT 1
    `;
    const record = (rows as any)[0];

    if (!record) {
      return errorResponse('INVALID_TOKEN', 'Reset link is invalid or has expired.', 400);
    }
    if (record.used_at) {
      return errorResponse('INVALID_TOKEN', 'Reset link has already been used.', 400);
    }
    if (new Date(record.expires_at) < new Date()) {
      return errorResponse('INVALID_TOKEN', 'Reset link has expired. Please request a new one.', 400);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await sql`UPDATE users SET password_hash = ${passwordHash} WHERE id = ${record.user_id}`;
    await sql`UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ${record.id}`;

    return okResponse({ message: 'Password reset successfully. You can now sign in.' });
  } catch (err) {
    console.error('Reset password error:', err);
    return errorResponse('INTERNAL_ERROR', 'Something went wrong.', 500);
  }
}
