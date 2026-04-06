import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth, okResponse, errorResponse } from '@/lib/middleware-utils';

// GET /api/analytics/leaderboard?wheel_id=...&limit=20&period=all|today|week|month
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ('status' in auth) return auth;

  const { searchParams } = new URL(req.url);
  const wheelId = searchParams.get('wheel_id');
  const limit   = Math.min(100, parseInt(searchParams.get('limit') ?? '20'));
  const period  = searchParams.get('period') ?? 'all';

  // If wheel_id provided, verify ownership
  if (wheelId) {
    const wRows = await sql`
      SELECT id FROM wheels WHERE id = ${wheelId} AND client_id = ${auth.user.client_id} AND deleted_at IS NULL LIMIT 1
    `;
    if (!(wRows as unknown[]).length) return errorResponse('NOT_FOUND', 'Wheel not found.', 404);
  }

  const wheelFilter = wheelId
    ? sql`AND sr.wheel_id = ${wheelId}`
    : sql`AND w.client_id = ${auth.user.client_id}`;

  const periodFilter =
    period === 'today' ? sql`AND sr.created_at >= CURRENT_DATE`
    : period === 'week'  ? sql`AND sr.created_at >= (CURRENT_DATE - INTERVAL '7 days')`
    : period === 'month' ? sql`AND sr.created_at >= (CURRENT_DATE - INTERVAL '30 days')`
    : sql``;

  const rows = await sql`
    SELECT
      ROW_NUMBER() OVER (ORDER BY total_wins DESC, last_win_at DESC)::int AS rank,
      COALESCE(NULLIF(ss.lead_name, ''), 'Anonymous')  AS player_name,
      ss.lead_email,
      ss.lead_phone,
      ss.fingerprint,
      total_wins,
      total_spins,
      ROUND(total_wins * 100.0 / NULLIF(total_spins, 0), 1)::float AS win_rate,
      last_win_at,
      prize_names
    FROM (
      SELECT
        ss.lead_name,
        ss.lead_email,
        ss.lead_phone,
        ss.fingerprint,
        COUNT(sr.id)::int                                                     AS total_spins,
        COUNT(sr.id) FILTER (WHERE sr.prize_id IS NOT NULL)::int              AS total_wins,
        MAX(sr.created_at)  FILTER (WHERE sr.prize_id IS NOT NULL)            AS last_win_at,
        ARRAY_AGG(DISTINCT p.display_title) FILTER (WHERE p.display_title IS NOT NULL) AS prize_names
      FROM spin_results sr
      JOIN spin_sessions ss ON ss.id = sr.session_id
      JOIN wheels w          ON w.id  = sr.wheel_id
      LEFT JOIN prizes p     ON p.id  = sr.prize_id
      WHERE TRUE
      ${wheelFilter}
      ${periodFilter}
      GROUP BY ss.lead_name, ss.lead_email, ss.lead_phone, ss.fingerprint
      HAVING COUNT(sr.id) FILTER (WHERE sr.prize_id IS NOT NULL) > 0
    ) sub
    ORDER BY total_wins DESC, last_win_at DESC
    LIMIT ${limit}
  `;

  // Compute current win streak per player using a pure-SQL CTE (no array param needed)
  // Streak = consecutive wins from most recent spin backward until first loss.
  const streakRows = await sql`
    WITH ranked AS (
      SELECT
        ss.fingerprint,
        (sr.prize_id IS NOT NULL)                                             AS is_win,
        ROW_NUMBER() OVER (PARTITION BY ss.fingerprint ORDER BY sr.created_at DESC) AS rn
      FROM spin_results sr
      JOIN spin_sessions ss ON ss.id = sr.session_id
      JOIN wheels w          ON w.id  = sr.wheel_id
      WHERE TRUE
      ${wheelFilter}
    ),
    streak_calc AS (
      SELECT
        fingerprint,
        COALESCE(
          (MIN(rn) FILTER (WHERE NOT is_win)) - 1,
          COUNT(*)
        )::int AS current_streak
      FROM ranked
      GROUP BY fingerprint
    )
    SELECT fingerprint, current_streak FROM streak_calc
  `;

  const streakMap: Record<string, number> = {};
  for (const r of streakRows as { fingerprint: string; current_streak: number }[]) {
    streakMap[r.fingerprint] = r.current_streak;
  }

  const enriched = (rows as Record<string, unknown>[]).map(r => ({
    ...r,
    current_streak: streakMap[r.fingerprint as string] ?? 0,
  }));

  return okResponse({ leaderboard: enriched });
}
