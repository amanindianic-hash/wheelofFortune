import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth, okResponse, errorResponse } from '@/lib/middleware-utils';

async function getTheme(themeId: string, clientId: string) {
  const results = await sql`
    SELECT * FROM wheel_themes
    WHERE id = ${themeId} AND client_id = ${clientId}
    LIMIT 1
  `;
  return (results as any)[0];
}

// PATCH /api/themes/[id] — update name, emoji, description, branding, config, segment_palette
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if ('status' in auth) return auth;

  if (!['owner', 'admin', 'editor'].includes(auth.user.role)) {
    return errorResponse('FORBIDDEN', 'Insufficient permissions.', 403);
  }

  const { id } = await params;
  try {
    const theme = await getTheme(id, auth.user.client_id);
    if (!theme) return errorResponse('NOT_FOUND', 'Theme not found.', 404);

    const body = await req.json();
    const {
      name        = theme.name,
      emoji       = theme.emoji,
      description = theme.description,
      branding    = theme.branding,
      config      = theme.config,
      segment_palette = theme.segment_palette,
    } = body;

    if (!name?.trim()) {
      return errorResponse('VALIDATION_ERROR', 'name is required.', 400);
    }

    const results = await sql`
      UPDATE wheel_themes SET
        name            = ${name.trim()},
        emoji           = ${emoji},
        description     = ${description ?? ''},
        branding        = ${JSON.stringify(branding)},
        config          = ${JSON.stringify(config)},
        segment_palette = ${JSON.stringify(segment_palette)}
      WHERE id = ${id} AND client_id = ${auth.user.client_id}
      RETURNING *
    `;
    return okResponse({ theme: (results as any)[0] });
  } catch (err) {
    console.error('Update theme error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to update theme.', 500);
  }
}

// DELETE /api/themes/[id] — permanently delete a saved theme
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if ('status' in auth) return auth;

  if (!['owner', 'admin', 'editor'].includes(auth.user.role)) {
    return errorResponse('FORBIDDEN', 'Insufficient permissions.', 403);
  }

  const { id } = await params;
  try {
    const theme = await getTheme(id, auth.user.client_id);
    if (!theme) return errorResponse('NOT_FOUND', 'Theme not found.', 404);

    await sql`DELETE FROM wheel_themes WHERE id = ${id} AND client_id = ${auth.user.client_id}`;
    return okResponse({ deleted: true });
  } catch (err) {
    console.error('Delete theme error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to delete theme.', 500);
  }
}
