import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { okResponse, errorResponse } from '@/lib/middleware-utils';

// GET /api/spin/streak?session_id=
export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get('session_id');
    if (!sessionId) return errorResponse('VALIDATION_ERROR', 'session_id is required.', 400);

    // Get wheel_id and fingerprint from the session
    const sessionRows = await sql`
      SELECT wheel_id, fingerprint FROM spin_sessions WHERE id = ${sessionId} LIMIT 1
    `;
    const session = (sessionRows as any[])[0];
    if (!session) return errorResponse('NOT_FOUND', 'Session not found.', 404);

    // Count spins per calendar day for this fingerprint + wheel (last 30 days)
    const spinDays = await sql`
      SELECT DATE(created_at AT TIME ZONE 'UTC') as day
      FROM spin_sessions
      WHERE wheel_id = ${session.wheel_id}
        AND fingerprint = ${session.fingerprint}
        AND status = 'spun'
        AND created_at >= NOW() - INTERVAL '30 days'
      GROUP BY day
      ORDER BY day DESC
    ` as any[];

    const today = new Date().toISOString().split('T')[0];
    let streak = 0;
    let checkDate = new Date();
    for (const row of spinDays) {
      const rowDate = row.day instanceof Date ? row.day.toISOString().split('T')[0] : String(row.day).split('T')[0];
      const expected = checkDate.toISOString().split('T')[0];
      if (rowDate === expected) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    const spinsToday = spinDays.length > 0 && spinDays[0].day?.toString().includes(today) ? 1 : 0;
    const lastSpinDate = spinDays[0]?.day ?? null;

    return okResponse({ streak, spins_today: spinsToday, last_spin_date: lastSpinDate });
  } catch (err) {
    console.error('Streak error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to load streak.', 500);
  }
}
