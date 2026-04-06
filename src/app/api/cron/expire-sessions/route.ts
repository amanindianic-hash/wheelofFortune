import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// Called every 30 minutes — marks expired spin sessions
export async function GET(req: NextRequest) {
  const auth = req.headers.get('Authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const resultRows = await sql`
    UPDATE spin_sessions
    SET status = 'expired'
    WHERE status IN ('loaded', 'form_submitted') AND expires_at < NOW()
    RETURNING count(*) as expired_count
  `;
  const result = (resultRows as any)[0];
  return NextResponse.json({ success: true, job: 'expire-sessions' });
}
