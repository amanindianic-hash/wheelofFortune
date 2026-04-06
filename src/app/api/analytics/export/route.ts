import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth, errorResponse } from '@/lib/middleware-utils';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ('status' in auth) return auth;

  const { searchParams } = new URL(req.url);
  const wheelId = searchParams.get('wheel_id');

  try {
    const wheelFilter = wheelId
      ? sql`AND sr.wheel_id = ${wheelId}`
      : sql`AND w.client_id = ${auth.user.client_id}`;

    const leads = await sql`
      SELECT
        ss.lead_email,
        ss.lead_data->>'name' as name,
        ss.lead_data->>'phone' as phone,
        w.name as wheel_name,
        p.display_title as prize_won,
        sr.created_at as won_at
      FROM spin_results sr
      JOIN spin_sessions ss ON ss.id = sr.session_id
      JOIN wheels w ON w.id = sr.wheel_id
      LEFT JOIN prizes p ON p.id = sr.prize_id
      WHERE ss.lead_email IS NOT NULL
      ${wheelFilter}
      ORDER BY sr.created_at DESC
    `;

    const rows = leads as any[];
    
    // Generate CSV
    const headers = ['Email', 'Name', 'Phone', 'Wheel', 'Prize', 'Date'];
    const csvRows = [
      headers.join(','),
      ...rows.map(row => [
        `"${row.lead_email}"`,
        `"${row.name || ''}"`,
        `"${row.phone || ''}"`,
        `"${row.wheel_name}"`,
        `"${row.prize_won || 'No Prize'}"`,
        `"${new Date(row.won_at).toLocaleString()}"`
      ].join(','))
    ];

    const csvString = csvRows.join('\n');

    return new NextResponse(csvString, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="leads-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });

  } catch (error) {
    console.error('Export error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to export leads', 500);
  }
}
