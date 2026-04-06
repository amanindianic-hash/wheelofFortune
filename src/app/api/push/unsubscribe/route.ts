import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { okResponse, errorResponse } from '@/lib/middleware-utils';

// POST /api/push/unsubscribe
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { endpoint } = body;

    if (!endpoint) {
      return errorResponse('VALIDATION_ERROR', 'endpoint is required.', 400);
    }

    await sql`DELETE FROM push_subscriptions WHERE endpoint = ${endpoint}`;

    return okResponse({ unsubscribed: true });
  } catch (err) {
    console.error('Push unsubscribe error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to remove subscription.', 500);
  }
}
