import { sql } from '@/lib/db';
import { SLOT_TEMPLATES } from '@/lib/slot-templates';

export interface ThemePreset {
  id: string;
  name: string;
  emoji: string;
  description: string;
  category: 'gaming' | 'entertainment';
  config: any;
  gameType?: string;
}

/**
 * Convert slot templates to ThemePreset format
 */
function convertSlotTemplatesToPresets(): ThemePreset[] {
  return SLOT_TEMPLATES.map((template) => ({
    id: `slot-${template.id}`,
    name: template.name,
    emoji: template.emoji,
    description: template.description,
    category: 'gaming',
    gameType: template.gameType,
    config: {
      colorPalette: template.segmentPalette,
      branding: template.branding,
      config: template.config,
    },
  }));
}

/**
 * Fetch all available theme presets
 */
export async function getThemePresets(category?: string): Promise<ThemePreset[]> {
  let query = sql`
    SELECT id, name, emoji, description, preset_category as category, config
    FROM wheel_themes
    WHERE is_preset = TRUE
    ORDER BY preset_category, name
  `;

  if (category) {
    query = sql`
      SELECT id, name, emoji, description, preset_category as category, config
      FROM wheel_themes
      WHERE is_preset = TRUE AND preset_category = ${category}
      ORDER BY name
    `;
  }

  const results = (await query) as any[];
  const dbPresets = results.map((r) => ({
    id: r.id,
    name: r.name,
    emoji: r.emoji,
    description: r.description,
    category: r.category,
    config: typeof r.config === 'string' ? JSON.parse(r.config) : r.config,
  }));

  // Add slot machine templates if gaming category or no category filter
  const slotPresets = convertSlotTemplatesToPresets();
  const allPresets = [...dbPresets, ...slotPresets];

  if (category) {
    return allPresets.filter((p) => p.category === category);
  }

  return allPresets;
}

/**
 * Fetch presets grouped by category
 */
export async function getThemePresetsByCategory(): Promise<Record<string, ThemePreset[]>> {
  const presets = await getThemePresets();
  return presets.reduce(
    (acc, preset) => {
      if (!acc[preset.category]) {
        acc[preset.category] = [];
      }
      acc[preset.category].push(preset);
      return acc;
    },
    {} as Record<string, ThemePreset[]>
  );
}

/**
 * Get a specific preset by ID
 */
export async function getThemePresetById(id: string): Promise<ThemePreset | null> {
  const results = (await sql`
    SELECT id, name, emoji, description, preset_category as category, config
    FROM wheel_themes
    WHERE id = ${id} AND is_preset = TRUE
    LIMIT 1
  `) as any[];

  if (results.length === 0) return null;

  const r = results[0];
  return {
    id: r.id,
    name: r.name,
    emoji: r.emoji,
    description: r.description,
    category: r.category,
    config: typeof r.config === 'string' ? JSON.parse(r.config) : r.config,
  };
}

/**
 * Get gaming presets specifically
 */
export async function getGamingPresets(): Promise<ThemePreset[]> {
  return getThemePresets('gaming');
}

/**
 * Get entertainment presets specifically
 */
export async function getEntertainmentPresets(): Promise<ThemePreset[]> {
  return getThemePresets('entertainment');
}
