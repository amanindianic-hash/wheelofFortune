import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { okResponse, errorResponse } from '@/lib/middleware-utils';

export async function POST(req: NextRequest) {
  try {
    const { themeId, segmentUrls } = await req.json();

    if (!themeId) {
      return errorResponse('MISSING_THEME_ID', 'Theme ID is required', 400);
    }

    if (!Array.isArray(segmentUrls) || segmentUrls.length !== 8) {
      return errorResponse('INVALID_SEGMENTS', 'Must provide exactly 8 segment URLs', 400);
    }

    // Verify theme exists
    const themeCheck = await sql`
      SELECT id FROM custom_themes WHERE id = ${themeId} LIMIT 1
    `;

    if (themeCheck.length === 0) {
      return errorResponse('THEME_NOT_FOUND', 'Theme does not exist', 404);
    }

    // Delete existing segment images for this theme
    await sql`
      DELETE FROM theme_segment_images WHERE theme_id = ${themeId}
    `;

    // Insert new segment images
    for (let i = 0; i < 8; i++) {
      await sql`
        INSERT INTO theme_segment_images
        (theme_id, segment_position, image_url, image_name)
        VALUES (${themeId}, ${i + 1}, ${segmentUrls[i]}, ${'segment-' + (i + 1) + '.png'})
      `;
    }

    // Mark theme as having custom segments
    await sql`
      UPDATE custom_themes
      SET has_custom_segments = true, updated_at = NOW()
      WHERE id = ${themeId}
    `;

    return okResponse({
      success: true,
      message: 'All 8 segment images uploaded successfully',
      themeId,
      segmentCount: 8,
    });
  } catch (err) {
    console.error('Segment upload error:', err);
    return errorResponse(
      'INTERNAL_ERROR',
      'Failed to upload segments: ' + (err instanceof Error ? err.message : 'Unknown error'),
      500
    );
  }
}
