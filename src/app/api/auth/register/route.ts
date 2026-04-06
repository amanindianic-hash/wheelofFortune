import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { sql } from '@/lib/db';
import { signAccessToken, signRefreshToken } from '@/lib/auth';
import { errorResponse } from '@/lib/middleware-utils';

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { company_name, email, password, full_name, timezone = 'UTC' } = body;

    if (!company_name || !email || !password || !full_name) {
      return errorResponse('VALIDATION_ERROR', 'company_name, email, password, and full_name are required.', 400);
    }

    if (password.length < 8) {
      return errorResponse('VALIDATION_ERROR', 'Password must be at least 8 characters.', 400);
    }

    // Check if email already exists
    const existing = await sql`SELECT id FROM users WHERE email = ${email} AND deleted_at IS NULL LIMIT 1` as any[];
    if (existing.length > 0) {
      return errorResponse('EMAIL_TAKEN', 'An account with this email already exists.', 409);
    }

    const baseSlug = slugify(company_name);
    // Ensure slug uniqueness
    const slugCheck = await sql`SELECT slug FROM clients WHERE slug LIKE ${baseSlug + '%'} ORDER BY slug` as any[];
    const existingSlugs = slugCheck.map((r: Record<string, unknown>) => r.slug as string);
    let slug = baseSlug;
    let i = 1;
    while (existingSlugs.includes(slug)) {
      slug = `${baseSlug}-${i++}`;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Create client + owner user in a transaction-like sequence
    const clientResults = await sql`
      INSERT INTO clients (name, slug, email, plan, timezone)
      VALUES (${company_name}, ${slug}, ${email}, 'starter', ${timezone})
      RETURNING id, name, slug, email, plan, plan_spin_limit, spins_used_this_month, timezone, is_active, created_at
    `;
    const client = (clientResults as any)[0];

    const userResults = await sql`
      INSERT INTO users (client_id, email, password_hash, full_name, role, email_verified)
      VALUES (${client.id}, ${email}, ${passwordHash}, ${full_name}, 'owner', true)
      RETURNING id, client_id, email, full_name, role, email_verified, created_at
    `;
    const user = (userResults as any)[0];

    const authUser = { id: user.id, client_id: user.client_id, email: user.email, full_name: user.full_name, role: user.role };
    const accessToken = await signAccessToken(authUser);
    const refreshToken = await signRefreshToken(user.id);

    const res = NextResponse.json({ user: authUser, client }, { status: 201 });
    res.cookies.set('access_token', accessToken, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 900 });
    res.cookies.set('refresh_token', refreshToken, { httpOnly: true, secure: true, sameSite: 'lax', path: '/api/auth/refresh', maxAge: 604800 });
    return res;
  } catch (err) {
    console.error('Register error:', err);
    return errorResponse('INTERNAL_ERROR', 'Registration failed.', 500);
  }
}
