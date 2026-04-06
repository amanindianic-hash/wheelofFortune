import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { okResponse, errorResponse } from '@/lib/middleware-utils';

// Ensure table exists
async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
      wheel_id UUID REFERENCES wheels(id) ON DELETE SET NULL,
      endpoint TEXT NOT NULL,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      last_notified_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(endpoint)
    )
  `;
}

// POST /api/push/subscribe
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subscription, wheel_id, client_id } = body;

    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return errorResponse('VALIDATION_ERROR', 'Invalid push subscription object.', 400);
    }

    await ensureTable();

    await sql`
      INSERT INTO push_subscriptions (client_id, wheel_id, endpoint, p256dh, auth)
      VALUES (${client_id ?? null}, ${wheel_id ?? null}, ${subscription.endpoint}, ${subscription.keys.p256dh}, ${subscription.keys.auth})
      ON CONFLICT (endpoint) DO UPDATE SET
        client_id = EXCLUDED.client_id,
        wheel_id = EXCLUDED.wheel_id,
        p256dh = EXCLUDED.p256dh,
        auth = EXCLUDED.auth
    `;

    return okResponse({ subscribed: true });
  } catch (err) {
    console.error('Push subscribe error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to save subscription.', 500);
  }
}
