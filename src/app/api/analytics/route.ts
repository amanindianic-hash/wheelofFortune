import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth, okResponse, errorResponse } from '@/lib/middleware-utils';

// GET /api/analytics?wheel_id=...&from=...&to=...
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ('status' in auth) return auth;

  const wheelId = req.nextUrl.searchParams.get('wheel_id');
  const from = req.nextUrl.searchParams.get('from') ?? new Date(Date.now() - 30 * 86400000).toISOString();
  const to = req.nextUrl.searchParams.get('to') ?? new Date().toISOString();

  try {
    // Validate wheel ownership if wheel_id provided
    if (wheelId) {
      const wheelResults = await sql`
        SELECT id FROM wheels WHERE id = ${wheelId} AND client_id = ${auth.user.client_id} AND deleted_at IS NULL LIMIT 1
      `;
      const wheel = (wheelResults as any)[0];
      if (!wheel) return errorResponse('NOT_FOUND', 'Wheel not found.', 404);
    }

    const wheelFilter = wheelId
      ? sql`AND sr.wheel_id = ${wheelId}`
      : sql`AND w.client_id = ${auth.user.client_id}`;

    // Total spins & winners
    const summaryResults = await sql`
      SELECT
        COUNT(sr.id)::int                                              AS total_spins,
        COUNT(sr.id) FILTER (WHERE sr.prize_id IS NOT NULL)::int      AS total_winners,
        COUNT(DISTINCT ss.lead_email) FILTER (WHERE ss.lead_email IS NOT NULL)::int AS unique_leads
      FROM spin_results sr
      JOIN spin_sessions ss ON ss.id = sr.session_id
      JOIN wheels w ON w.id = sr.wheel_id
      WHERE sr.created_at BETWEEN ${from}::timestamptz AND ${to}::timestamptz
      ${wheelFilter}
    `;
    const summary = (summaryResults as any)[0];

    // Daily spin counts
    const daily = await sql`
      SELECT
        DATE(sr.created_at)::text AS date,
        COUNT(*)::int             AS spins,
        COUNT(*) FILTER (WHERE sr.prize_id IS NOT NULL)::int AS winners
      FROM spin_results sr
      JOIN wheels w ON w.id = sr.wheel_id
      WHERE sr.created_at BETWEEN ${from}::timestamptz AND ${to}::timestamptz
      ${wheelFilter}
      GROUP BY DATE(sr.created_at)
      ORDER BY DATE(sr.created_at) ASC
    `;

    // Prize distribution
    const prizeBreakdown = await sql`
      SELECT
        p.display_title,
        p.type,
        COUNT(sr.id)::int AS win_count
      FROM spin_results sr
      JOIN prizes p ON p.id = sr.prize_id
      JOIN wheels w ON w.id = sr.wheel_id
      WHERE sr.created_at BETWEEN ${from}::timestamptz AND ${to}::timestamptz
        AND sr.prize_id IS NOT NULL
      ${wheelFilter}
      GROUP BY p.id, p.display_title, p.type
      ORDER BY win_count DESC
    `;

    // Segment win distribution
    const segmentBreakdown = await sql`
      SELECT
        s.label,
        s.position,
        COUNT(sr.id)::int AS spin_count
      FROM spin_results sr
      JOIN segments s ON s.id = sr.segment_id
      JOIN wheels w ON w.id = sr.wheel_id
      WHERE sr.created_at BETWEEN ${from}::timestamptz AND ${to}::timestamptz
      ${wheelFilter}
      GROUP BY s.id, s.label, s.position
      ORDER BY spin_count DESC
    `;

    // Device type breakdown
    const deviceBreakdown = await sql`
      SELECT
        COALESCE(ss.device_type, 'unknown') AS device_type,
        COUNT(*)::int AS count
      FROM spin_sessions ss
      JOIN wheels w ON w.id = ss.wheel_id
      WHERE ss.created_at BETWEEN ${from}::timestamptz AND ${to}::timestamptz
      ${wheelId ? sql`AND ss.wheel_id = ${wheelId}` : sql`AND w.client_id = ${auth.user.client_id}`}
      GROUP BY device_type
      ORDER BY count DESC
    `;

    // OS breakdown
    const osBreakdown = await sql`
      SELECT
        COALESCE(ss.os, 'Other') AS os,
        COUNT(*)::int AS count
      FROM spin_sessions ss
      JOIN wheels w ON w.id = ss.wheel_id
      WHERE ss.created_at BETWEEN ${from}::timestamptz AND ${to}::timestamptz
      ${wheelId ? sql`AND ss.wheel_id = ${wheelId}` : sql`AND w.client_id = ${auth.user.client_id}`}
      GROUP BY os
      ORDER BY count DESC
    `;

    return okResponse({ summary, daily, prize_breakdown: prizeBreakdown, segment_breakdown: segmentBreakdown, device_breakdown: deviceBreakdown, os_breakdown: osBreakdown });
  } catch (err) {
    console.error('Analytics error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch analytics.', 500);
  }
}
