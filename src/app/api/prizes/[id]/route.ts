import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth, okResponse, errorResponse } from '@/lib/middleware-utils';
import { logAuditAction } from '@/lib/audit';

// GET /api/prizes/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if ('status' in auth) return auth;

  const { id } = await params;
  try {
    const prizeResults = await sql`SELECT * FROM prizes WHERE id = ${id} AND client_id = ${auth.user.client_id} LIMIT 1`;
    const prize = (prizeResults as any)[0];
    if (!prize) return errorResponse('NOT_FOUND', 'Prize not found.', 404);
    return okResponse({ prize });
  } catch (err) {
    console.error('Get prize error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch prize.', 500);
  }
}

// PUT /api/prizes/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if ('status' in auth) return auth;

  if (!['owner', 'admin', 'editor'].includes(auth.user.role)) {
    return errorResponse('FORBIDDEN', 'Insufficient permissions.', 403);
  }

  const { id } = await params;
  try {
    const prizeResults = await sql`SELECT id FROM prizes WHERE id = ${id} AND client_id = ${auth.user.client_id} LIMIT 1`;
    const prize = (prizeResults as any)[0];
    if (!prize) return errorResponse('NOT_FOUND', 'Prize not found.', 404);

    const body = await req.json();
    const { name, display_title, display_description, coupon_expiry_days, points_value, redirect_url, custom_message_html } = body;

    const updatedResults = await sql`
      UPDATE prizes SET
        name                  = COALESCE(${name ?? null}, name),
        display_title         = COALESCE(${display_title ?? null}, display_title),
        display_description   = COALESCE(${display_description ?? null}, display_description),
        coupon_expiry_days    = COALESCE(${coupon_expiry_days ?? null}, coupon_expiry_days),
        points_value          = COALESCE(${points_value ?? null}, points_value),
        redirect_url          = COALESCE(${redirect_url ?? null}, redirect_url),
        custom_message_html   = COALESCE(${custom_message_html ?? null}, custom_message_html)
      WHERE id = ${id}
      RETURNING *
    `;
    const updated = (updatedResults as any)[0];

    await logAuditAction({
      req,
      userId: auth.user.id,
      clientId: auth.user.client_id,
      action: 'prize_updated',
      resourceType: 'prize',
      resourceId: updated.id,
      changes: { name: updated.name, display_title: updated.display_title }
    });

    return okResponse({ prize: updated });
  } catch (err) {
    console.error('Update prize error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to update prize.', 500);
  }
}

// DELETE /api/prizes/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if ('status' in auth) return auth;

  if (!['owner', 'admin'].includes(auth.user.role)) {
    return errorResponse('FORBIDDEN', 'Insufficient permissions.', 403);
  }

  const { id } = await params;
  try {
    const prizeResultsDelete = await sql`SELECT id FROM prizes WHERE id = ${id} AND client_id = ${auth.user.client_id} LIMIT 1`;
    const prize = (prizeResultsDelete as any)[0];
    if (!prize) return errorResponse('NOT_FOUND', 'Prize not found.', 404);

    // Check if prize is in use by any active wheel segment
    const inUse = await sql`
      SELECT s.id FROM segments s
      JOIN wheels w ON w.id = s.wheel_id
      WHERE s.prize_id = ${id} AND w.status = 'active' AND w.deleted_at IS NULL
      LIMIT 1
    ` as any[];
    if (inUse.length > 0) {
      return errorResponse('CONFLICT', 'Prize is assigned to an active wheel segment. Deactivate or reassign first.', 409);
    }

    await sql`DELETE FROM prizes WHERE id = ${id}`;

    await logAuditAction({
      req,
      userId: auth.user.id,
      clientId: auth.user.client_id,
      action: 'prize_deleted',
      resourceType: 'prize',
      resourceId: id
    });

    return okResponse({ success: true });
  } catch (err) {
    console.error('Delete prize error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to delete prize.', 500);
  }
}
