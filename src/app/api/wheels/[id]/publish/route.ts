import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth, okResponse, errorResponse } from '@/lib/middleware-utils';
import { logAuditAction } from '@/lib/audit';

// POST /api/wheels/[id]/publish — set status active/paused/archived
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if ('status' in auth) return auth;

  if (!['owner', 'admin', 'editor'].includes(auth.user.role)) {
    return errorResponse('FORBIDDEN', 'Insufficient permissions.', 403);
  }

  const { id } = await params;
  try {
    const wheelResults = await sql`
      SELECT id, status FROM wheels
      WHERE id = ${id} AND client_id = ${auth.user.client_id} AND deleted_at IS NULL
      LIMIT 1
    `;
    const wheel = (wheelResults as any)[0];
    if (!wheel) return errorResponse('NOT_FOUND', 'Wheel not found.', 404);

    const body = await req.json();
    const { status } = body;

    if (!['active', 'paused', 'archived', 'draft'].includes(status)) {
      return errorResponse('VALIDATION_ERROR', 'Invalid status. Must be active, paused, archived, or draft.', 400);
    }

    // Validate segments before activating
    if (status === 'active') {
      const segments = await sql`SELECT id FROM segments WHERE wheel_id = ${id}` as any[];
      if (segments.length < 2) {
        return errorResponse('VALIDATION_ERROR', 'Wheel must have at least 2 segments to be activated.', 400);
      }
    }

    const updatedResults = await sql`
      UPDATE wheels SET status = ${status} WHERE id = ${id} RETURNING id, status, name
    `;
    const updated = (updatedResults as any)[0];

    await logAuditAction({
      req,
      userId: auth.user.id,
      clientId: auth.user.client_id,
      action: 'wheel_status_changed',
      resourceType: 'wheel',
      resourceId: id,
      changes: { previous_status: wheel.status, new_status: status },
    });

    return okResponse({ wheel: updated });
  } catch (err) {
    console.error('Publish wheel error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to update wheel status.', 500);
  }
}
