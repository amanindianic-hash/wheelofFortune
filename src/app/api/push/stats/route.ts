import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { okResponse, errorResponse } from '@/lib/middleware-utils';

// GET /api/push/stats
export async function GET(_req: NextRequest) {
  try {
    const auth = await getAuthUser();
    if (!auth) return errorResponse('UNAUTHORIZED', 'Authentication required.', 401);

    let total = 0;
    try {
      const res = await sql`SELECT COUNT(*) as total FROM push_subscriptions`;
      total = parseInt((res as any)[0]?.total ?? '0', 10);
    } catch { /* table may not exist yet */ }

    return okResponse({ total });
  } catch (err) {
    console.error('Push stats error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to load stats.', 500);
  }
}
