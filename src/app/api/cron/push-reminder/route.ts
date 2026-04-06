import { NextRequest } from 'next/server';
import webpush from 'web-push';
import { sql } from '@/lib/db';
import { okResponse, errorResponse } from '@/lib/middleware-utils';



// GET /api/cron/push-reminder — called by Vercel Cron
export async function GET(req: NextRequest) {
  try {
    // Configure VAPID inside handler so env vars are available at runtime (not build time)
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT ?? 'mailto:admin@spinplatform.com',
      process.env.VAPID_PUBLIC_KEY ?? '',
      process.env.VAPID_PRIVATE_KEY ?? '',
    );

    // Verify cron secret
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return errorResponse('UNAUTHORIZED', 'Unauthorized.', 401);
    }

    // Find subscriptions where user hasn't spun in 2+ days and hasn't been notified in 24h
    const subs = await sql`
      SELECT DISTINCT ps.*
      FROM push_subscriptions ps
      WHERE (ps.last_notified_at IS NULL OR ps.last_notified_at < NOW() - INTERVAL '24 hours')
    `;

    const payload = JSON.stringify({
      title: 'Your daily spin is waiting! 🎡',
      body: 'Come back and spin the wheel — new prizes available!',
      url: '/',
    });

    let sent = 0;
    const toDelete: string[] = [];

    await Promise.all(
      (subs as any[]).map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload,
          );
          await sql`UPDATE push_subscriptions SET last_notified_at = NOW() WHERE id = ${sub.id}`;
          sent++;
        } catch (e: any) {
          if (e.statusCode === 410 || e.statusCode === 404) {
            toDelete.push(sub.endpoint);
          }
        }
      }),
    );

    if (toDelete.length > 0) {
      await sql`DELETE FROM push_subscriptions WHERE endpoint = ANY(${toDelete})`;
    }

    return okResponse({ sent, expired_removed: toDelete.length });
  } catch (err) {
    console.error('Push reminder cron error:', err);
    return errorResponse('INTERNAL_ERROR', 'Cron failed.', 500);
  }
}
