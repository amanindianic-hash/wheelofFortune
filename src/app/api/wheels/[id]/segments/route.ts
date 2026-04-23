import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth, okResponse, errorResponse } from '@/lib/middleware-utils';
import { logAuditAction } from '@/lib/audit';

// Validate color: must be valid hex, rgba, rgb, or "transparent"
function isValidColor(color: string | undefined): boolean {
  if (!color) return false;
  const c = color.trim().toLowerCase();
  
  if (c === 'transparent') return true;
  
  // Hex matching (supports #RGB, #RRGGBB, #RRGGBBAA)
  if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(c)) return true;
  
  // RGBA matching
  if (c.startsWith('rgba(') && c.endsWith(')')) return true;
  
  // RGB matching
  if (c.startsWith('rgb(') && c.endsWith(')')) return true;
  
  return false;
}

// GET /api/wheels/[id]/segments
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if ('status' in auth) return auth;

  const { id } = await params;
  try {
    const wheelResults = await sql`SELECT id, active_segment_count FROM wheels WHERE id = ${id} AND client_id = ${auth.user.client_id} AND deleted_at IS NULL LIMIT 1`;
    const wheel = (wheelResults as any)[0];
    if (!wheel) return errorResponse('NOT_FOUND', 'Wheel not found.', 404);

    const allSegments = await sql`
      SELECT s.*, p.display_title as prize_display_title, p.type as prize_type
      FROM segments s
      LEFT JOIN prizes p ON p.id = s.prize_id
      WHERE s.wheel_id = ${id}
      ORDER BY s.position ASC
    ` as any[];

    const activeCount = wheel.active_segment_count ?? allSegments.length;

    // Map flat DB columns to nested application structure
    const segments = allSegments.slice(0, activeCount).map(s => ({
      ...s,
      background: {
        color: s.bg_color,
        imageUrl: s.segment_image_url || null
      }
      // NOTE: icon_url is passed through untouched from the spread above.
      // It is a separate column and must NEVER be overwritten by background data.
    }));

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

    // Validate background colors
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const bgColor = seg.background?.color || seg.bg_color;
      if (!isValidColor(bgColor)) {
        return errorResponse('VALIDATION_ERROR', `Segment ${i + 1} has invalid bg_color "${bgColor}". Use hex (#RGB, #RRGGBB, #RRGGBBAA) or "transparent".`, 400);
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

    // RULE 3: API receives log — verify all label fields arrive from frontend
    console.log(`[API /segments PUT] WHEEL: ${id} | RECEIVED: ${segments.length} segments`, {
      labels: segments.map((seg: any) => seg.label),
      colors: segments.map((seg: any) => ({
        bg: seg.background?.color || seg.bg_color,
        text: seg.text_color
      }))
    });

    // Upsert each incoming segment
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const existingId = existingIds[i]; // match by position index

      const bgColor = seg.background?.color || seg.bg_color || '#cccccc';
      const bgImage = seg.background?.imageUrl || seg.segment_image_url || null;

      if (existingId) {
        // ── STEP 3: DB VALUE ──────────────────────────────────────────────────
        console.log(`STEP 3 DB VALUE (Update Segment ${i}):`, {
          id: existingId,
          label: seg.label,
          pos: {
            lro: seg.label_radial_offset,
            lto: seg.label_tangential_offset,
            lra: seg.label_rotation_angle,
            lfs: seg.label_font_scale,
          },
          bg: bgColor,
          icon: seg.icon_url
        });

        await sql`
          UPDATE segments SET
            position             = ${i},
            label                = ${seg.label},
            bg_color             = ${bgColor},
            text_color           = ${seg.text_color ?? '#FFFFFF'},
            icon_url             = ${seg.icon_url ?? null},
            segment_image_url    = ${bgImage},
            weight               = ${seg.weight ?? 1.0},
            prize_id             = ${seg.prize_id ?? null},
            is_no_prize          = ${seg.is_no_prize ?? !seg.prize_id},
            consolation_message  = ${seg.consolation_message ?? null},
            win_cap_daily        = ${seg.win_cap_daily ?? null},
            win_cap_total        = ${seg.win_cap_total ?? null},
            label_offset_x       = ${seg.label_offset_x ?? null},
            label_offset_y       = ${seg.label_offset_y ?? null},
            icon_offset_x        = ${seg.icon_offset_x ?? null},
            icon_offset_y        = ${seg.icon_offset_y ?? null},
            label_rotation_angle = ${seg.label_rotation_angle ?? null},
            icon_rotation_angle  = ${seg.icon_rotation_angle ?? null},
            icon_radial_offset   = ${seg.icon_radial_offset ?? null},
            icon_tangential_offset = ${seg.icon_tangential_offset ?? null},
            label_radial_offset  = ${seg.label_radial_offset ?? null},
            label_tangential_offset = ${seg.label_tangential_offset ?? null},
            label_font_scale     = ${seg.label_font_scale ?? null}
          WHERE id = ${existingId}
        `;
      } else {
        // Insert new segment
        await sql`
          INSERT INTO segments (
            wheel_id, position, label, bg_color, text_color, icon_url, segment_image_url,
            weight, prize_id, is_no_prize, consolation_message, win_cap_daily, win_cap_total,
            label_offset_x, label_offset_y, icon_offset_x, icon_offset_y,
            label_rotation_angle, icon_rotation_angle,
            icon_radial_offset, icon_tangential_offset, label_radial_offset, label_tangential_offset, label_font_scale
          ) VALUES (
            ${id}, ${i}, ${seg.label}, ${bgColor}, ${seg.text_color ?? '#FFFFFF'},
            ${seg.icon_url ?? null}, ${bgImage}, ${seg.weight ?? 1.0},
            ${seg.prize_id ?? null}, ${seg.is_no_prize ?? !seg.prize_id},
            ${seg.consolation_message ?? null}, ${seg.win_cap_daily ?? null}, ${seg.win_cap_total ?? null},
            ${seg.label_offset_x ?? null}, ${seg.label_offset_y ?? null},
            ${seg.icon_offset_x ?? null}, ${seg.icon_offset_y ?? null},
            ${seg.label_rotation_angle ?? null}, ${seg.icon_rotation_angle ?? null},
            ${seg.icon_radial_offset ?? null}, ${seg.icon_tangential_offset ?? null},
            ${seg.label_radial_offset ?? null}, ${seg.label_tangential_offset ?? null}, ${seg.label_font_scale ?? null}
          )
        `;
      }
    }

    // Delete any trailing segments that are no longer needed (only if not referenced by spin_results)
    for (let i = segments.length; i < existingIds.length; i++) {
      const oldId = existingIds[i];
      if (!referencedSet.has(oldId)) {
        await sql`DELETE FROM segments WHERE id = ${oldId}`;
      }
      // If referenced by spin_results, leave it — it won't appear on wheel (active_segment_count) but satisfies immutable FK
    }

    // Store the active segment count in wheels table for filtering
    await sql`UPDATE wheels SET active_segment_count = ${segments.length} WHERE id = ${id}`;

    const allUpdated = await sql`SELECT * FROM segments WHERE wheel_id = ${id} ORDER BY position ASC` as any[];

    // Return only active segments
    const updated = allUpdated.slice(0, segments.length);

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
