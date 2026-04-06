import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { okResponse, errorResponse } from '@/lib/middleware-utils';

// GET /api/referral/credits?embed_token=X&ref_code=Y
// Returns how many unique visitors spun via this ref_code on this wheel.
// Public endpoint — no auth needed.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const embedToken = searchParams.get('embed_token');
  const refCode    = searchParams.get('ref_code');

  if (!embedToken || !refCode) {
    return errorResponse('VALIDATION_ERROR', 'embed_token and ref_code are required.', 400);
  }

  // Look up the wheel
  const wRows = await sql`
    SELECT id FROM wheels WHERE embed_token = ${embedToken} AND deleted_at IS NULL LIMIT 1
  `;
  const wheel = (wRows as { id: string }[])[0];
  if (!wheel) return errorResponse('NOT_FOUND', 'Wheel not found.', 404);

  // Count unique fingerprints that:
  //   1. Came via this ref_code
  //   2. Actually completed a spin (status = 'spun')
  //   3. Are not the referrer themselves (fingerprint shouldn't match the ref_code prefix)
  const countRows = await sql`
    SELECT COUNT(DISTINCT ss.fingerprint)::int AS credits
    FROM spin_sessions ss
    WHERE ss.wheel_id = ${wheel.id}
      AND ss.lead_custom_fields->>'ref_src' = ${refCode}
      AND ss.status = 'spun'
      AND LEFT(ss.fingerprint, 12) <> ${refCode}
  `;
  const credits = (countRows as { credits: number }[])[0]?.credits ?? 0;

  return okResponse({ ref_code: refCode, credits_earned: credits });
}
