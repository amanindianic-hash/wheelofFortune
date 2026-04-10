import { NextRequest } from 'next/server';
import { getThemePresets, getThemePresetsByCategory } from '@/lib/utils/theme-presets';
import { okResponse, errorResponse } from '@/lib/middleware-utils';

/**
 * GET /api/themes/presets
 * Fetch all available theme presets
 * Query params:
 *   - category: filter by category (gaming, entertainment)
 *   - grouped: return grouped by category (true/false)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const grouped = searchParams.get('grouped') === 'true';

    let presets;
    if (grouped) {
      presets = await getThemePresetsByCategory();
    } else if (category) {
      presets = await getThemePresets(category);
    } else {
      presets = await getThemePresets();
    }

    return okResponse({ presets });
  } catch (err) {
    console.error('Fetch theme presets error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch theme presets.', 500);
  }
}
