import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth, okResponse, errorResponse } from '@/lib/middleware-utils';
import { logAuditAction } from '@/lib/audit';

// GET /api/prizes
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ('status' in auth) return auth;

  try {
    const prizes = await sql`
      SELECT * FROM prizes WHERE client_id = ${auth.user.client_id} ORDER BY created_at DESC
    ` as any[];
    return okResponse({ prizes });
  } catch (err) {
    console.error('List prizes error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch prizes.', 500);
  }
}

// POST /api/prizes
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if ('status' in auth) return auth;

  if (!['owner', 'admin', 'editor'].includes(auth.user.role)) {
    return errorResponse('FORBIDDEN', 'Insufficient permissions.', 403);
  }

  try {
    const body = await req.json();
    const { name, type, display_title, display_description, coupon_mode, static_coupon_code,
            auto_gen_prefix, auto_gen_length, coupon_expiry_days, points_value,
            redirect_url, custom_message_html } = body;

    if (!name || !type || !display_title) {
      return errorResponse('VALIDATION_ERROR', 'name, type, and display_title are required.', 400);
    }

    const validTypes = ['coupon', 'points', 'gift_card', 'message', 'url_redirect', 'try_again'];
    if (!validTypes.includes(type)) {
      return errorResponse('VALIDATION_ERROR', `type must be one of: ${validTypes.join(', ')}`, 400);
    }

    if (type === 'coupon' && !coupon_mode) {
      return errorResponse('VALIDATION_ERROR', 'coupon_mode is required for coupon prizes.', 400);
    }
    if (type === 'points' && !points_value) {
      return errorResponse('VALIDATION_ERROR', 'points_value is required for points prizes.', 400);
    }
    if (type === 'url_redirect' && !redirect_url) {
      return errorResponse('VALIDATION_ERROR', 'redirect_url is required for url_redirect prizes.', 400);
    }

    const prizeResults = await sql`
      INSERT INTO prizes (
        client_id, name, type, display_title, display_description, coupon_mode,
        static_coupon_code, auto_gen_prefix, auto_gen_length, coupon_expiry_days,
        points_value, redirect_url, custom_message_html
      ) VALUES (
        ${auth.user.client_id}, ${name}, ${type}, ${display_title},
        ${display_description ?? null}, ${coupon_mode ?? null},
        ${static_coupon_code ?? null}, ${auto_gen_prefix ?? null},
        ${auto_gen_length ?? 8}, ${coupon_expiry_days ?? null},
        ${points_value ?? null}, ${redirect_url ?? null}, ${custom_message_html ?? null}
      ) RETURNING *
    `;
    const prize = (prizeResults as any)[0];

    await logAuditAction({
      req,
      userId: auth.user.id,
      clientId: auth.user.client_id,
      action: 'prize_created',
      resourceType: 'prize',
      resourceId: prize.id,
      changes: { name: prize.name, type: prize.type, display_title: prize.display_title }
    });

    return okResponse({ prize }, 201);
  } catch (err) {
    console.error('Create prize error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to create prize.', 500);
  }
}
