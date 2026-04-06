import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { okResponse, errorResponse } from '@/lib/middleware-utils';

// Public endpoint — no auth required.
// GET /api/wheels/[id]/leaderboard?limit=10&period=all|today|week|month
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const limit  = Math.min(50, parseInt(searchParams.get('limit') ?? '10'));
  const period = searchParams.get('period') ?? 'all';

  // Verify wheel is active (public access requires active wheel)
  const wheelRows = await sql`
    SELECT id FROM wheels WHERE id = ${id} AND status = 'active' AND deleted_at IS NULL LIMIT 1
  `;
  if (!(wheelRows as unknown[]).length) {
    return errorResponse('NOT_FOUND', 'Wheel not found.', 404);
  }

  const periodFilter =
    period === 'today' ? sql`AND sr.created_at >= CURRENT_DATE`
    : period === 'week' ? sql`AND sr.created_at >= (CURRENT_DATE - INTERVAL '7 days')`
    : period === 'month' ? sql`AND sr.created_at >= (CURRENT_DATE - INTERVAL '30 days')`
    : sql``;

  // Leaderboard: group by fingerprint, count wins
  const rows = await sql`
    SELECT
      ROW_NUMBER() OVER (ORDER BY total_wins DESC, last_win_at DESC)::int AS rank,
      COALESCE(NULLIF(lead_name, ''), 'Player') AS player_name,
      CASE WHEN lead_email IS NOT NULL AND lead_email <> ''
        THEN LEFT(lead_email, 2) || '***@' || SPLIT_PART(lead_email, '@', 2)
        ELSE NULL
      END AS masked_email,
      total_wins,
      total_spins,
      ROUND(total_wins * 100.0 / NULLIF(total_spins, 0), 1)::float AS win_rate,
      last_win_at
    FROM (
      SELECT
        ss.lead_name,
        ss.lead_email,
        ss.fingerprint,
        COUNT(sr.id)::int                                                     AS total_spins,
        COUNT(sr.id) FILTER (WHERE sr.prize_id IS NOT NULL)::int              AS total_wins,
        MAX(sr.created_at) FILTER (WHERE sr.prize_id IS NOT NULL)             AS last_win_at
      FROM spin_results sr
      JOIN spin_sessions ss ON ss.id = sr.session_id
      WHERE sr.wheel_id = ${id}
      ${periodFilter}
      GROUP BY ss.lead_name, ss.lead_email, ss.fingerprint
      HAVING COUNT(sr.id) FILTER (WHERE sr.prize_id IS NOT NULL) > 0
    ) sub
    ORDER BY total_wins DESC, last_win_at DESC
    LIMIT ${limit}
  `;

  return okResponse({ leaderboard: rows as unknown[] });
}
