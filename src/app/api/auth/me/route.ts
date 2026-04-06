import { NextRequest } from 'next/server';
import { requireAuth, okResponse, errorResponse } from '@/lib/middleware-utils';
import { sql } from '@/lib/db';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ('status' in auth) return auth;

  try {
    const clientResults = await sql`
      SELECT id, name, slug, plan, plan_spin_limit, spins_used_this_month, timezone, is_active, custom_domain
      FROM clients WHERE id = ${auth.user.client_id} AND deleted_at IS NULL LIMIT 1
    `;
    const client = (clientResults as any)[0];
    return okResponse({ user: auth.user, client });
  } catch {
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch user.', 500);
  }
}
