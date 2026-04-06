import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// Called once daily at 2am UTC (Vercel Hobby plan compatible).
// Sessions that have passed their expires_at are already rejected at read-time
// via lazy expiry checks in spin session APIs — this cron simply cleans up
// stale rows in bulk overnight.
export async function GET(req: NextRequest) {
  const auth = req.headers.get('Authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const resultRows = await sql`
    UPDATE spin_sessions
    SET status = 'expired'
    WHERE status IN ('loaded', 'form_submitted') AND expires_at < NOW()
    RETURNING id
  `;

  const expiredCount = Array.isArray(resultRows) ? resultRows.length : 0;
  return NextResponse.json({ success: true, job: 'expire-sessions', expired: expiredCount });
}
