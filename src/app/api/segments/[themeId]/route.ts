import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { okResponse, errorResponse } from '@/lib/middleware-utils';

export async function GET(
  req: NextRequest,
  { params }: { params: { themeId: string } }
) {
  try {
    const { themeId } = params;

    if (!themeId) {
      return errorResponse('MISSING_THEME_ID', 'Theme ID is required', 400);
    }

    // Fetch segment images in order (1-8)
    const segments = await sql`
      SELECT segment_position, image_url
      FROM theme_segment_images
      WHERE theme_id = ${themeId}
      ORDER BY segment_position ASC
    `;

    // Return as array of URLs (indexed 0-7)
    const imageUrls = Array(8).fill(null);
    for (const seg of segments as any[]) {
      imageUrls[seg.segment_position - 1] = seg.image_url;
    }

    return okResponse({
      themeId,
      segmentImages: imageUrls,
      hasAllSegments: imageUrls.every((url) => url !== null),
    });
  } catch (err) {
    console.error('Segment fetch error:', err);
    return errorResponse(
      'INTERNAL_ERROR',
      'Failed to fetch segments: ' + (err instanceof Error ? err.message : 'Unknown error'),
      500
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { themeId: string } }
) {
  try {
    const { themeId } = params;

    // Delete all segment images for this theme
    await sql`
      DELETE FROM theme_segment_images WHERE theme_id = ${themeId}
    `;

    // Mark theme as not having custom segments
    await sql`
      UPDATE custom_themes
      SET has_custom_segments = false, updated_at = NOW()
      WHERE id = ${themeId}
    `;

    return okResponse({
      success: true,
      message: 'All segment images deleted',
    });
  } catch (err) {
    console.error('Segment delete error:', err);
    return errorResponse(
      'INTERNAL_ERROR',
      'Failed to delete segments',
      500
    );
  }
}
