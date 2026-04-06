import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { okResponse, errorResponse } from '@/lib/middleware-utils';

// GET /api/push/logs
export async function GET(_req: NextRequest) {
  try {
    const auth = await getAuthUser();
    if (!auth) return errorResponse('UNAUTHORIZED', 'Authentication required.', 401);

    let logs: any[] = [];
    try {
      logs = await sql`
        SELECT id, title, message, url, wheel_id, sent_count, failed_count, created_at
        FROM push_notifications_log
        WHERE client_id = ${auth.client_id}
        ORDER BY created_at DESC
        LIMIT 20
      ` as any[];
    } catch { /* table may not exist yet */ }

    return okResponse({ logs });
  } catch (err) {
    console.error('Push logs error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to load logs.', 500);
  }
}
