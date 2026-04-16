import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { okResponse, errorResponse } from '@/lib/middleware-utils';

export async function POST(req: NextRequest) {
  try {
    const { themeId, segmentUrls } = await req.json();

    if (!themeId || typeof themeId !== 'string') {
      return errorResponse('INVALID_THEME_ID', 'Theme ID must be a non-empty string', 400);
    }

    if (!Array.isArray(segmentUrls) || segmentUrls.length !== 8) {
      return errorResponse('INVALID_SEGMENTS', 'Must provide exactly 8 segment URLs', 400);
    }

    // Validate all URLs are strings
    if (!segmentUrls.every(url => url === null || typeof url === 'string')) {
      return errorResponse('INVALID_URL_FORMAT', 'All segment URLs must be strings or null', 400);
    }

    // Verify theme exists
    const themeCheck = (await sql`
      SELECT id FROM custom_themes WHERE id = ${themeId} LIMIT 1
    `) as any[];

    if (themeCheck.length === 0) {
      return errorResponse('THEME_NOT_FOUND', 'Theme does not exist', 404);
    }

    // Delete existing segment images and insert new ones atomically
    try {
      // Delete old entries
      await sql`
        DELETE FROM theme_segment_images WHERE theme_id = ${themeId}
      `;

      // Insert all new entries
      for (let i = 0; i < 8; i++) {
        const url = segmentUrls[i];
        if (url) {
          await sql`
            INSERT INTO theme_segment_images
            (theme_id, segment_position, image_url, image_name)
            VALUES (${themeId}, ${i + 1}, ${url}, ${'segment-' + (i + 1)})
          `;
        }
      }

      // Mark theme as having custom segments
      await sql`
        UPDATE custom_themes
        SET has_custom_segments = true, updated_at = NOW()
        WHERE id = ${themeId}
      `;
    } catch (dbErr) {
      console.error('Database error during segment save:', dbErr);
      throw new Error('Failed to save segments to database');
    }

    return okResponse({
      success: true,
      message: 'Segment images uploaded successfully',
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
