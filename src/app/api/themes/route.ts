import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth, okResponse, errorResponse } from '@/lib/middleware-utils';

// GET /api/themes — list all saved themes for the authenticated client
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ('status' in auth) return auth;

  try {
    const themes = await sql`
      SELECT id, client_id, name, emoji, description, branding, config, segment_palette, created_at, updated_at
      FROM wheel_themes
      WHERE client_id = ${auth.user.client_id}
      ORDER BY created_at DESC
    `;
    return okResponse({ themes });
  } catch (err) {
    console.error('List themes error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch themes.', 500);
  }
}

// POST /api/themes — create a new saved theme
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if ('status' in auth) return auth;

  if (!['owner', 'admin', 'editor'].includes(auth.user.role)) {
    return errorResponse('FORBIDDEN', 'Insufficient permissions.', 403);
  }

  try {
    const body = await req.json();
    const { name, emoji = '🎨', description = '', branding = {}, config = {}, segment_palette = [] } = body;

    if (!name?.trim()) {
      return errorResponse('VALIDATION_ERROR', 'name is required.', 400);
    }

    // ── DEBUG: THEME COLORS ──
    console.log("[API] theme colors (Branding Tags):", {
      outer_ring_color: branding.outer_ring_color,
      inner_ring_color: branding.inner_ring_color,
      rim_tick_color:   branding.rim_tick_color,
    });

    const results = await sql`
      INSERT INTO wheel_themes (client_id, name, emoji, description, branding, config, segment_palette)
      VALUES (
        ${auth.user.client_id},
        ${name.trim()},
        ${emoji},
        ${description},
        ${JSON.stringify(branding)},
        ${JSON.stringify(config)},
        ${JSON.stringify(segment_palette)}
      )
      RETURNING *
    `;
    return okResponse({ theme: (results as any)[0] }, 201);
  } catch (err) {
    console.error('Create theme error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to create theme.', 500);
  }
}
