import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth, okResponse, errorResponse } from '@/lib/middleware-utils';

// GET /api/account — get client account info + team
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ('status' in auth) return auth;

  try {
    const clientResults = await sql`
      SELECT id, name, slug, email, plan, plan_spin_limit, spins_used_this_month,
             billing_cycle_day, custom_domain, timezone, is_active, created_at
      FROM clients WHERE id = ${auth.user.client_id} AND deleted_at IS NULL LIMIT 1
    `;
    const client = (clientResults as any)[0];

    const team = await sql`
      SELECT id, email, full_name, role, email_verified, last_login_at, created_at
      FROM users WHERE client_id = ${auth.user.client_id} AND deleted_at IS NULL
      ORDER BY created_at ASC
    `;

    return okResponse({ client, team });
  } catch (err) {
    console.error('Account GET error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch account.', 500);
  }
}

// PUT /api/account — update client settings
export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req);
  if ('status' in auth) return auth;

  if (!['owner', 'admin'].includes(auth.user.role)) {
    return errorResponse('FORBIDDEN', 'Insufficient permissions.', 403);
  }

  try {
    const body = await req.json();
    const { name, timezone, custom_domain } = body;

    const updatedResults = await sql`
      UPDATE clients SET
        name          = COALESCE(${name ?? null}, name),
        timezone      = COALESCE(${timezone ?? null}, timezone),
        custom_domain = COALESCE(${custom_domain ?? null}, custom_domain)
      WHERE id = ${auth.user.client_id}
      RETURNING id, name, slug, email, plan, timezone, custom_domain, is_active
    `;
    const updated = (updatedResults as any)[0];
    return okResponse({ client: updated });
  } catch (err) {
    console.error('Account PUT error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to update account.', 500);
  }
}
