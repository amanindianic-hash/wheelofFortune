import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth, okResponse, errorResponse } from '@/lib/middleware-utils';

// GET /api/leads?wheel_id=&search=&page=1&limit=50
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ('status' in auth) return auth;

  const { searchParams } = new URL(req.url);
  const wheelId = searchParams.get('wheel_id') || null;
  const search  = searchParams.get('search')   || '';
  const page    = Math.max(1, parseInt(searchParams.get('page')  ?? '1'));
  const limit   = Math.min(100, parseInt(searchParams.get('limit') ?? '50'));
  const offset  = (page - 1) * limit;

  if (wheelId) {
    const check = await sql`
      SELECT id FROM wheels WHERE id = ${wheelId} AND client_id = ${auth.user.client_id} AND deleted_at IS NULL LIMIT 1
    `;
    if (!(check as unknown[]).length) return errorResponse('NOT_FOUND', 'Wheel not found.', 404);
  }

  const wheelFilter = wheelId
    ? sql`AND w.id = ${wheelId}`
    : sql`AND w.client_id = ${auth.user.client_id}`;

  const searchFilter = search
    ? sql`AND (ss.lead_email ILIKE ${'%' + search + '%'} OR ss.lead_name ILIKE ${'%' + search + '%'} OR ss.lead_phone ILIKE ${'%' + search + '%'})`
    : sql``;

  const rows = await sql`
    SELECT
      ss.id             AS session_id,
      ss.lead_name,
      ss.lead_email,
      ss.lead_phone,
      ss.gdpr_consent,
      ss.created_at,
      w.id              AS wheel_id,
      w.name            AS wheel_name,
      sr.prize_id,
      p.display_title   AS prize_won,
      cc.code           AS coupon_code
    FROM spin_sessions ss
    JOIN wheels w ON w.id = ss.wheel_id
    LEFT JOIN spin_results sr ON sr.session_id = ss.id
    LEFT JOIN prizes p ON p.id = sr.prize_id
    LEFT JOIN coupon_codes cc ON cc.id = sr.coupon_code_id
    WHERE (ss.lead_email IS NOT NULL OR ss.lead_phone IS NOT NULL)
    ${wheelFilter}
    ${searchFilter}
    ORDER BY ss.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  const countRow = await sql`
    SELECT COUNT(*)::int AS total
    FROM spin_sessions ss
    JOIN wheels w ON w.id = ss.wheel_id
    WHERE (ss.lead_email IS NOT NULL OR ss.lead_phone IS NOT NULL)
    ${wheelFilter}
    ${searchFilter}
  `;

  return okResponse({
    leads: rows,
    total: (countRow as { total: number }[])[0]?.total ?? 0,
    page,
    limit,
  });
}
