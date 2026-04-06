import { NextRequest } from 'next/server';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import { getAuthUser } from '@/lib/auth';
import { sql } from '@/lib/db';
import { okResponse, errorResponse } from '@/lib/middleware-utils';

// POST /api/whatsapp/send
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser();
    if (!auth) return errorResponse('UNAUTHORIZED', 'Authentication required.', 401);

    const body = await req.json();
    const { phone, type = 'spin_reminder', wheel_id, vars } = body;

    if (!phone) return errorResponse('VALIDATION_ERROR', 'phone is required.', 400);

    // Build vars from wheel if not supplied
    let mergedVars = vars ?? {};
    if (wheel_id && !mergedVars.url) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
      try {
        const rows = await sql`SELECT embed_token FROM wheels WHERE id = ${wheel_id} AND client_id = ${auth.client_id} LIMIT 1`;
        const row = (rows as any[])[0];
        if (row) mergedVars.url = `${appUrl}/play/${row.embed_token}`;
      } catch { /* ignore */ }
    }

    const result = await sendWhatsAppMessage({ to: phone, template: type, vars: mergedVars });

    if (!result.success) return errorResponse('SEND_FAILED', result.error ?? 'Failed to send.', 502);

    return okResponse({ sid: result.sid });
  } catch (err) {
    console.error('WhatsApp send error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to send WhatsApp message.', 500);
  }
}
