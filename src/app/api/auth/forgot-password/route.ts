import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { sql } from '@/lib/db';
import { sendPasswordResetEmail } from '@/lib/email';
import { errorResponse, okResponse } from '@/lib/middleware-utils';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return errorResponse('VALIDATION_ERROR', 'Email is required.', 400);
    }

    const users = await sql`
      SELECT id FROM users WHERE email = ${email.toLowerCase().trim()} AND deleted_at IS NULL LIMIT 1
    `;
    const user = (users as any)[0];

    // Always return success to avoid email enumeration
    if (!user) {
      return okResponse({ message: 'If that email exists, a reset link has been sent.' });
    }

    // Invalidate any existing unused tokens for this user
    await sql`
      UPDATE password_reset_tokens SET used_at = NOW()
      WHERE user_id = ${user.id} AND used_at IS NULL
    `;

    // Generate a secure random token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await sql`
      INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
      VALUES (${user.id}, ${tokenHash}, ${expiresAt.toISOString()})
    `;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const resetUrl = `${appUrl}/reset-password?token=${rawToken}`;

    await sendPasswordResetEmail(email, resetUrl);

    return okResponse({ message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    return errorResponse('INTERNAL_ERROR', 'Something went wrong.', 500);
  }
}
