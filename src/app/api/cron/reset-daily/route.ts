import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// Called daily at midnight — resets segments.wins_today
// Secure with a secret header: Authorization: Bearer <CRON_SECRET>
export async function GET(req: NextRequest) {
  const auth = req.headers.get('Authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const resultRows = await sql`
    UPDATE segments 
    SET wins_today = 0
    RETURNING count(*) as reset_count
  `;
  const result = (resultRows as any)[0];
  return NextResponse.json({ success: true, job: 'reset-daily', count: result.reset_count });
}
