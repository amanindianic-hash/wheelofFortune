import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth, okResponse, errorResponse } from '@/lib/middleware-utils';
import { logAuditAction } from '@/lib/audit';

/**
 * GET /api/coupons
 * Lists coupon codes for a specific prize.
 * Query params: prizeId (required), status (optional)
 */
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ('status' in auth) return auth;

  const { searchParams } = new URL(req.url);
  const prizeId = searchParams.get('prizeId');
  const statusFilter = searchParams.get('status');

  if (!prizeId) {
    return errorResponse('VALIDATION_ERROR', 'prizeId is required.', 400);
  }

  try {
    // Verify prize ownership
    const prizeResults = await sql`SELECT id FROM prizes WHERE id = ${prizeId} AND client_id = ${auth.user.client_id} LIMIT 1`;
    if ((prizeResults as any[]).length === 0) {
      return errorResponse('NOT_FOUND', 'Prize not found or unauthorized.', 404);
    }

    const coupons = await sql`
      SELECT id, code, status, issued_at, redeemed_at, expires_at, created_at
      FROM coupon_codes
      WHERE prize_id = ${prizeId}
      ${statusFilter ? sql`AND status = ${statusFilter}` : sql``}
      ORDER BY created_at DESC
      LIMIT 100
    ` as any[];

    return okResponse({ coupons });
  } catch (err) {
    console.error('List coupons error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch coupons.', 500);
  }
}

/**
 * POST /api/coupons
 * Bulk adds coupon codes to a prize pool.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if ('status' in auth) return auth;

  if (!['owner', 'admin', 'editor'].includes(auth.user.role)) {
    return errorResponse('FORBIDDEN', 'Insufficient permissions.', 403);
  }

  try {
    const body = await req.json();
    const { prizeId, codes, expiresAt } = body;

    if (!prizeId || !Array.isArray(codes) || codes.length === 0) {
      return errorResponse('VALIDATION_ERROR', 'prizeId and non-empty codes array are required.', 400);
    }

    // Verify prize ownership
    const prizeResults = await sql`SELECT id FROM prizes WHERE id = ${prizeId} AND client_id = ${auth.user.client_id} LIMIT 1`;
    if ((prizeResults as any[]).length === 0) {
      return errorResponse('NOT_FOUND', 'Prize not found or unauthorized.', 404);
    }

    // Insert codes in bulk
    // We avoid destructuring here due to Neon worker issue
    for (const code of codes) {
      await sql`
        INSERT INTO coupon_codes (prize_id, code, expires_at)
        VALUES (${prizeId}, ${code}, ${expiresAt || null})
        ON CONFLICT (prize_id, code) DO NOTHING
      `;
    }

    await logAuditAction({
      req,
      userId: auth.user.id,
      clientId: auth.user.client_id,
      action: 'coupon_uploaded',
      resourceType: 'prize',
      resourceId: prizeId,
      changes: { count: codes.length }
    });

    return okResponse({ success: true, count: codes.length });
  } catch (err) {
    console.error('Add coupons error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to add coupons.', 500);
  }
}
