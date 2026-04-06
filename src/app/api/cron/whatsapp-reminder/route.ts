import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import { okResponse, errorResponse } from '@/lib/middleware-utils';

// GET /api/cron/whatsapp-reminder — called by Vercel Cron daily
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return errorResponse('UNAUTHORIZED', 'Unauthorized.', 401);
    }

    // Find leads with phone who haven't spun in 3+ days
    const leads = await sql`
      SELECT DISTINCT ON (ss.lead_phone)
        ss.lead_phone, ss.lead_name, ss.wheel_id, w.embed_token,
        MAX(ss.created_at) as last_spin
      FROM spin_sessions ss
      JOIN wheels w ON w.id = ss.wheel_id
      WHERE ss.lead_phone IS NOT NULL
        AND ss.lead_phone != ''
        AND ss.created_at < NOW() - INTERVAL '3 days'
      GROUP BY ss.lead_phone, ss.lead_name, ss.wheel_id, w.embed_token
      LIMIT 100
    ` as any[];

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
    let sent = 0;
    let failed = 0;

    for (const lead of leads) {
      const result = await sendWhatsAppMessage({
        to: lead.lead_phone,
        template: 'spin_reminder',
        vars: {
          name: lead.lead_name ?? 'there',
          url: `${appUrl}/play/${lead.embed_token}`,
        },
      });
      if (result.success) sent++; else failed++;
    }

    return okResponse({ sent, failed, total: leads.length });
  } catch (err) {
    console.error('WhatsApp reminder cron error:', err);
    return errorResponse('INTERNAL_ERROR', 'Cron failed.', 500);
  }
}
