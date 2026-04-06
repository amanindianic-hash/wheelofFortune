import { NextRequest } from 'next/server';
import webpush from 'web-push';
import { sql } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { okResponse, errorResponse } from '@/lib/middleware-utils';



// POST /api/push/send — authenticated
export async function POST(req: NextRequest) {
  try {
    // Configure VAPID inside handler so env vars are available at runtime (not build time)
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT ?? 'mailto:admin@spinplatform.com',
      process.env.VAPID_PUBLIC_KEY ?? '',
      process.env.VAPID_PRIVATE_KEY ?? '',
    );

    const auth = await getAuthUser();
    if (!auth) return errorResponse('UNAUTHORIZED', 'Authentication required.', 401);

    const body = await req.json();
    const { title, message, url, wheel_id } = body;

    if (!title || !message) {
      return errorResponse('VALIDATION_ERROR', 'title and message are required.', 400);
    }

    // Fetch subscriptions (optionally filtered by wheel)
    const subs = wheel_id
      ? await sql`SELECT * FROM push_subscriptions WHERE wheel_id = ${wheel_id} OR wheel_id IS NULL`
      : await sql`SELECT * FROM push_subscriptions`;

    const payload = JSON.stringify({ title, body: message, url: url ?? '/' });

    let sent = 0;
    let failed = 0;
    const toDelete: string[] = [];

    await Promise.all(
      (subs as any[]).map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload,
          );
          sent++;
        } catch (e: any) {
          if (e.statusCode === 410 || e.statusCode === 404) {
            // Subscription expired — mark for deletion
            toDelete.push(sub.endpoint);
          }
          failed++;
        }
      }),
    );

    // Clean up expired subscriptions
    if (toDelete.length > 0) {
      await sql`DELETE FROM push_subscriptions WHERE endpoint = ANY(${toDelete})`;
    }

    // Log notification
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS push_notifications_log (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          client_id UUID,
          wheel_id UUID,
          title TEXT,
          message TEXT,
          url TEXT,
          sent_count INT,
          failed_count INT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        INSERT INTO push_notifications_log (client_id, wheel_id, title, message, url, sent_count, failed_count)
        VALUES (${auth.client_id}, ${wheel_id ?? null}, ${title}, ${message}, ${url ?? null}, ${sent}, ${failed})
      `;
    } catch { /* log failure is non-fatal */ }

    return okResponse({ sent, failed });
  } catch (err) {
    console.error('Push send error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to send notifications.', 500);
  }
}
