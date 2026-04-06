import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { okResponse, errorResponse } from '@/lib/middleware-utils';

// POST /api/referral/track
// Called when a new visitor lands via a referral link.
// Body: { session_id, ref_code }
// Updates the session's lead_custom_fields to record the referral source.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { session_id, ref_code } = body;

    if (!session_id || !ref_code || typeof ref_code !== 'string' || ref_code.length < 4) {
      return errorResponse('VALIDATION_ERROR', 'session_id and ref_code are required.', 400);
    }

    // Only update if the session exists and hasn't already recorded a ref source
    await sql`
      UPDATE spin_sessions
      SET lead_custom_fields = COALESCE(lead_custom_fields, '{}'::jsonb) || jsonb_build_object('ref_src', ${ref_code})
      WHERE id = ${session_id}
        AND (lead_custom_fields->>'ref_src') IS NULL
        AND created_at > NOW() - INTERVAL '1 hour'
    `;

    return okResponse({ ok: true });
  } catch (err) {
    console.error('Referral track error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to record referral.', 500);
  }
}
