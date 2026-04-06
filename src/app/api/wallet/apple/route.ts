import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { createAppleWalletPass } from '@/lib/wallet/apple';
import { errorResponse } from '@/lib/middleware-utils';

// GET /api/wallet/apple?spin_result_id=
export async function GET(req: NextRequest) {
  try {
    const spinResultId = req.nextUrl.searchParams.get('spin_result_id');
    if (!spinResultId) return errorResponse('VALIDATION_ERROR', 'spin_result_id is required.', 400);

    const rows = await sql`
      SELECT sr.id, p.display_title, p.display_description, p.type,
             cc.code as coupon_code, w.branding
      FROM spin_results sr
      JOIN prizes p ON p.id = sr.prize_id
      JOIN wheels w ON w.id = sr.wheel_id
      LEFT JOIN coupon_codes cc ON cc.id = sr.coupon_code_id
      WHERE sr.id = ${spinResultId}
      LIMIT 1
    `;
    const result = (rows as any[])[0];
    if (!result) return errorResponse('NOT_FOUND', 'Spin result not found.', 404);

    const passResult = await createAppleWalletPass({
      serialNumber: `spin-${spinResultId}`,
      couponCode: result.coupon_code ?? undefined,
      prizeName: result.display_title,
      prizeDescription: result.display_description ?? undefined,
      primaryColor: result.branding?.primary_color,
    });

    if ('error' in passResult) return errorResponse('WALLET_ERROR', (passResult as any).error, 503);

    const buf = passResult as Buffer;
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        'Content-Type': 'application/vnd.apple.pkpass',
        'Content-Disposition': `attachment; filename="prize-${spinResultId}.pkpass"`,
      },
    });
  } catch (err) {
    console.error('Apple Wallet error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to create Apple Wallet pass.', 500);
  }
}
