import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { okResponse, errorResponse } from '@/lib/middleware-utils';

// GET /api/spin/game-type?token=<embed_token>
// Lightweight lookup — returns only the game_type so the widget page can route correctly.
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token');
    if (!token) return errorResponse('VALIDATION_ERROR', 'token is required', 400);

    const rows = await sql`
      SELECT config
      FROM wheels
      WHERE embed_token = ${token}
        AND deleted_at IS NULL
      LIMIT 1
    `;
    const wheel = (rows as any)[0];
    if (!wheel) return errorResponse('NOT_FOUND', 'Wheel not found', 404);

    const gameType: string = (wheel.config as Record<string, unknown>)?.game_type as string ?? 'wheel';
    return okResponse({ game_type: gameType });
  } catch {
    return errorResponse('INTERNAL', 'Server error', 500);
  }
}
