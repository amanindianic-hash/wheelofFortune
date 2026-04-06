import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { createGoogleWalletUrl } from '@/lib/wallet/google';
import { okResponse, errorResponse } from '@/lib/middleware-utils';

// GET /api/wallet/google?spin_result_id=
export async function GET(req: NextRequest) {
  try {
    const spinResultId = req.nextUrl.searchParams.get('spin_result_id');
    if (!spinResultId) return errorResponse('VALIDATION_ERROR', 'spin_result_id is required.', 400);

    const rows = await sql`
      SELECT sr.id, sr.coupon_code_id, p.display_title, p.display_description, p.type,
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

    const walletResult = await createGoogleWalletUrl({
      objectId: `spinresult_${spinResultId}`,
      couponCode: result.coupon_code ?? undefined,
      prizeName: result.display_title,
      prizeDescription: result.display_description ?? undefined,
      backgroundColor: result.branding?.primary_color ?? '#7C3AED',
    });

    if ('error' in walletResult) return errorResponse('WALLET_ERROR', walletResult.error, 503);

    return okResponse({ url: walletResult.url });
  } catch (err) {
    console.error('Google Wallet error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to create Google Wallet pass.', 500);
  }
}
