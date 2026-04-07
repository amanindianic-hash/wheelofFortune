import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth, okResponse, errorResponse } from '@/lib/middleware-utils';
import { logAuditAction } from '@/lib/audit';

// Validate color: must be valid hex (#RGB, #RRGGBB) or "transparent"
function isValidColor(color: string | undefined): boolean {
  if (!color) return false;
  if (color.toLowerCase() === 'transparent') return true;
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(color);
}

// GET /api/wheels/[id]/segments
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if ('status' in auth) return auth;

  const { id } = await params;
  try {
    const wheelResults = await sql`SELECT id FROM wheels WHERE id = ${id} AND client_id = ${auth.user.client_id} AND deleted_at IS NULL LIMIT 1`;
    const wheel = (wheelResults as any)[0];
    if (!wheel) return errorResponse('NOT_FOUND', 'Wheel not found.', 404);

    const segments = await sql`
      SELECT s.*, p.display_title as prize_display_title, p.type as prize_type
      FROM segments s
      LEFT JOIN prizes p ON p.id = s.prize_id
      WHERE s.wheel_id = ${id}
      ORDER BY s.position ASC
    ` as any[];
    return okResponse({ segments });
  } catch (err) {
    console.error('Get segments error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch segments.', 500);
  }
}

// PUT /api/wheels/[id]/segments — replace all segments (bulk update)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if ('status' in auth) return auth;

  if (!['owner', 'admin', 'editor'].includes(auth.user.role)) {
    return errorResponse('FORBIDDEN', 'Insufficient permissions.', 403);
  }

  const { id } = await params;
  try {
    const wheelResults = await sql`SELECT id FROM wheels WHERE id = ${id} AND client_id = ${auth.user.client_id} AND deleted_at IS NULL LIMIT 1`;
    const wheel = (wheelResults as any)[0];
    if (!wheel) return errorResponse('NOT_FOUND', 'Wheel not found.', 404);

    const body = await req.json();
    const { segments } = body;

    if (!Array.isArray(segments) || segments.length < 2 || segments.length > 24) {
      return errorResponse('VALIDATION_ERROR', 'segments must be an array of 2-24 items.', 400);
    }

    // Validate colors are valid hex or "transparent"
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      if (!isValidColor(seg.bg_color)) {
        return errorResponse('VALIDATION_ERROR', `Segment ${i + 1} has invalid bg_color "${seg.bg_color}". Use hex (#RGB, #RRGGBB, #RRGGBBAA) or "transparent".`, 400);
      }
      if (!isValidColor(seg.text_color)) {
        return errorResponse('VALIDATION_ERROR', `Segment ${i + 1} has invalid text_color "${seg.text_color}". Use hex (#RGB, #RRGGBB, #RRGGBBAA) or "transparent".`, 400);
      }
    }

    // Fetch existing segments so we know which ones have spin_results references
    const existing = await sql`SELECT id FROM segments WHERE wheel_id = ${id} ORDER BY position ASC` as any[];
    const existingIds = existing.map((r: Record<string, unknown>) => r.id as string);

    // Segments referenced by spin_results cannot be deleted (immutable FK)
    const referenced = await sql`
      SELECT DISTINCT segment_id FROM spin_results WHERE segment_id = ANY(${existingIds})
    ` as any[];
    const referencedSet = new Set(referenced.map((r: Record<string, unknown>) => r.segment_id as string));

    // Upsert each incoming segment
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const existingId = existingIds[i]; // match by position index

      if (existingId) {
        // Update in place (safe even if referenced by spin_results)
        await sql`
          UPDATE segments SET
            position             = ${i},
            label                = ${seg.label},
            bg_color             = ${seg.bg_color ?? '#cccccc'},
            text_color           = ${seg.text_color ?? '#FFFFFF'},
            icon_url             = ${seg.icon_url ?? null},
            weight               = ${seg.weight ?? 1.0},
            prize_id             = ${seg.prize_id ?? null},
            is_no_prize          = ${seg.is_no_prize ?? !seg.prize_id},
            consolation_message  = ${seg.consolation_message ?? null},
            win_cap_daily        = ${seg.win_cap_daily ?? null},
            win_cap_total        = ${seg.win_cap_total ?? null}
          WHERE id = ${existingId}
        `;
      } else {
        // Insert new segment
        await sql`
          INSERT INTO segments (
            wheel_id, position, label, bg_color, text_color, icon_url,
            weight, prize_id, is_no_prize, consolation_message, win_cap_daily, win_cap_total
          ) VALUES (
            ${id}, ${i}, ${seg.label}, ${seg.bg_color ?? '#cccccc'}, ${seg.text_color ?? '#FFFFFF'},
            ${seg.icon_url ?? null}, ${seg.weight ?? 1.0},
            ${seg.prize_id ?? null}, ${seg.is_no_prize ?? !seg.prize_id},
            ${seg.consolation_message ?? null}, ${seg.win_cap_daily ?? null}, ${seg.win_cap_total ?? null}
          )
        `;
      }
    }

    // Delete any trailing existing segments that are no longer needed (only if not referenced)
    for (let i = segments.length; i < existingIds.length; i++) {
      const oldId = existingIds[i];
      if (!referencedSet.has(oldId)) {
        await sql`DELETE FROM segments WHERE id = ${oldId}`;
      }
      // If referenced, leave it — it won't appear on the wheel (position > active count) but satisfies FK
    }

    const updated = await sql`SELECT * FROM segments WHERE wheel_id = ${id} ORDER BY position ASC` as any[];

    await logAuditAction({
      req,
      userId: auth.user.id,
      clientId: auth.user.client_id,
      action: 'segment_updated',
      resourceType: 'wheel',
      resourceId: id,
      changes: { segment_count: updated.length }
    });

    return okResponse({ segments: updated });
  } catch (err) {
    console.error('Update segments error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to update segments.', 500);
  }
}
