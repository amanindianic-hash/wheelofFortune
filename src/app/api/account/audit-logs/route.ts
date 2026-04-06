import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse } from '@/lib/middleware-utils';
import { sql } from '@/lib/db';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ('status' in auth) return auth;

  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    const logs = await sql`
      SELECT id, user_id, action, entity_type, entity_id, 
             old_values, new_values, ip_address, user_agent, created_at
      FROM audit_logs
      WHERE client_id = ${auth.user.client_id}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    return NextResponse.json({ logs });
  } catch (error: any) {
    console.error('Audit logs error:', error);
    return errorResponse('DB_ERROR', 'Failed to fetch audit logs', 500);
  }
}
