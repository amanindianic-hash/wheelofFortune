import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth, okResponse, errorResponse } from '@/lib/middleware-utils';
import { logAuditAction } from '@/lib/audit';

async function getWheel(wheelId: string, clientId: string) {
  const wheelResults = await sql`
    SELECT * FROM wheels
    WHERE id = ${wheelId} AND client_id = ${clientId} AND deleted_at IS NULL
    LIMIT 1
  `;
  return (wheelResults as any)[0];
}

// GET /api/wheels/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if ('status' in auth) return auth;

  const { id } = await params;
  try {
    const wheel = await getWheel(id, auth.user.client_id);
    if (!wheel) return errorResponse('NOT_FOUND', 'Wheel not found.', 404);

    const segments = await sql`
      SELECT s.*, p.display_title as prize_display_title, p.type as prize_type
      FROM segments s
      LEFT JOIN prizes p ON p.id = s.prize_id
      WHERE s.wheel_id = ${id}
      ORDER BY s.position ASC
    `;

    return okResponse({ wheel, segments });
  } catch (err) {
    console.error('Get wheel error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch wheel.', 500);
  }
}

// PUT /api/wheels/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if ('status' in auth) return auth;

  if (!['owner', 'admin', 'editor'].includes(auth.user.role)) {
    return errorResponse('FORBIDDEN', 'Insufficient permissions.', 403);
  }

  const { id } = await params;
  try {
    const wheel = await getWheel(id, auth.user.client_id);
    if (!wheel) return errorResponse('NOT_FOUND', 'Wheel not found.', 404);

    const body = await req.json();
    // Track which date fields were explicitly provided so we can distinguish
    // "not sent → keep existing" from "sent as null → clear the field".
    const hasActiveFrom  = 'active_from'  in body;
    const hasActiveUntil = 'active_until' in body;
    const { name, config, branding, trigger_rules, frequency_rules, form_config, active_from, active_until, total_spin_cap } = body;

    // Update the main (non-date) fields first using COALESCE pattern
    await sql`
      UPDATE wheels SET
        name            = COALESCE(${name ?? null}, name),
        config          = COALESCE(${config ? JSON.stringify(config) : null}::jsonb, config),
        branding        = COALESCE(${branding ? JSON.stringify(branding) : null}::jsonb, branding),
        trigger_rules   = COALESCE(${trigger_rules ? JSON.stringify(trigger_rules) : null}::jsonb, trigger_rules),
        frequency_rules = COALESCE(${frequency_rules ? JSON.stringify(frequency_rules) : null}::jsonb, frequency_rules),
        form_config     = COALESCE(${form_config ? JSON.stringify(form_config) : null}::jsonb, form_config),
        total_spin_cap  = COALESCE(${total_spin_cap ?? null}, total_spin_cap)
      WHERE id = ${id}
    `;

    // Separately update date fields only when they were explicitly provided in the
    // request body — this correctly handles null (clear) vs absent (keep existing).
    // neon does not reliably bind null as a parameter for timestamptz columns,
    // so we use the SQL literal NULL when clearing and a parameterized cast when setting.
    if (hasActiveFrom) {
      if (active_from == null) {
        await sql`UPDATE wheels SET active_from = NULL WHERE id = ${id}`;
      } else {
        await sql`UPDATE wheels SET active_from = ${active_from}::timestamptz WHERE id = ${id}`;
      }
    }
    if (hasActiveUntil) {
      if (active_until == null) {
        await sql`UPDATE wheels SET active_until = NULL WHERE id = ${id}`;
      } else {
        await sql`UPDATE wheels SET active_until = ${active_until}::timestamptz WHERE id = ${id}`;
      }
    }

    const updatedRow = await sql`SELECT * FROM wheels WHERE id = ${id} LIMIT 1`;
    const updated = (updatedRow as any)[0];

    await logAuditAction({
      req,
      userId: auth.user.id,
      clientId: auth.user.client_id,
      action: 'wheel_updated',
      resourceType: 'wheel',
      resourceId: updated.id,
      changes: { name: updated.name, status: updated.status }
    });

    return okResponse({ wheel: updated });
  } catch (err) {
    console.error('Update wheel error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to update wheel.', 500);
  }
}

// DELETE /api/wheels/[id] — soft delete
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if ('status' in auth) return auth;

  if (!['owner', 'admin'].includes(auth.user.role)) {
    return errorResponse('FORBIDDEN', 'Insufficient permissions.', 403);
  }

  const { id } = await params;
  try {
    const wheel = await getWheel(id, auth.user.client_id);
    if (!wheel) return errorResponse('NOT_FOUND', 'Wheel not found.', 404);

    await sql`UPDATE wheels SET deleted_at = NOW(), status = 'archived' WHERE id = ${id}`;

    await logAuditAction({
      req,
      userId: auth.user.id,
      clientId: auth.user.client_id,
      action: 'wheel_deleted',
      resourceType: 'wheel',
      resourceId: id
    });

    return okResponse({ success: true });
  } catch (err) {
    console.error('Delete wheel error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to delete wheel.', 500);
  }
}
