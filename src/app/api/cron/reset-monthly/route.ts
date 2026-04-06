import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// Called daily at 00:05 — resets spins_used_this_month for clients on their billing_cycle_day
export async function GET(req: NextRequest) {
  const auth = req.headers.get('Authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const today = new Date().getDate();
  const resultRows = await sql`
    UPDATE clients
    SET spins_used_this_month = 0
    WHERE billing_cycle_day = ${today}
      AND deleted_at IS NULL
    RETURNING count(*) as reset_count
  `;
  const result = (resultRows as any)[0];
  return NextResponse.json({ success: true, job: 'reset-monthly', count: result.reset_count });
}
