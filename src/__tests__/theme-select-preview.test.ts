/**
 * Theme Select & Live Preview Tests
 *
 * Covers:
 *  1. applyTemplateToWheel — apply logic for built-in, premium, custom themes
 *  2. WHEEL_TEMPLATES — template catalogue integrity / selection helpers
 *  3. Live preview state simulation — spreading config/branding onto a wheel object
 *     the same way the dashboard editor does it, without a browser.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { applyTemplateToWheel } from '@/lib/utils/theme-utils';
import { WHEEL_TEMPLATES } from '@/lib/wheel-templates';
import type { WheelTemplate } from '@/lib/wheel-templates';
import type { Segment, WheelConfig, WheelBranding } from '@/lib/types';

// ─── Shared fixtures ──────────────────────────────────────────────────────────

function makeSegment(overrides: Partial<Segment> = {}): Segment {
  return {
    id: `seg-${Math.random().toString(36).slice(2)}`,
    wheel_id: 'wheel-1',
    position: 0,
    label: 'Test Prize',
    bg_color: '#000000',
    text_color: '#ffffff',
    weight: 1,
    is_no_prize: false,
    wins_today: 0,
    wins_total: 0,
    ...overrides,
  };
}

const FOUR_SEGMENTS: Segment[] = [
  makeSegment({ id: 's1', position: 0, label: 'A', bg_color: '#111111', text_color: '#aaaaaa' }),
  makeSegment({ id: 's2', position: 1, label: 'B', bg_color: '#222222', text_color: '#bbbbbb' }),
  makeSegment({ id: 's3', position: 2, label: 'C', bg_color: '#333333', text_color: '#cccccc' }),
  makeSegment({ id: 's4', position: 3, label: 'D', bg_color: '#444444', text_color: '#dddddd' }),
];

/** Simulates the dashboard's live-preview spread (same logic as page.tsx lines 145-148) */
function simulateLivePreview(
  wheelConfig: Partial<WheelConfig>,
  wheelBranding: Partial<WheelBranding>,
  segments: Segment[],
  template: WheelTemplate,
) {
  const { newConfig, newBranding, newSegments } = applyTemplateToWheel(template, segments);
  return {
    config: { ...wheelConfig, ...newConfig },
    branding: { ...wheelBranding, ...newBranding },
    segments: newSegments,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. applyTemplateToWheel — core apply logic
// ─────────────────────────────────────────────────────────────────────────────

describe('applyTemplateToWheel — core apply logic', () => {

  it('returns the same number of segments as the input', () => {
    const t = WHEEL_TEMPLATES.find((t) => t.id === 'festival')!;
    const { newSegments } = applyTemplateToWheel(t, FOUR_SEGMENTS);
    expect(newSegments).toHaveLength(FOUR_SEGMENTS.length);
  });

  it('does NOT mutate original segments', () => {
    const t = WHEEL_TEMPLATES.find((t) => t.id === 'neon-night')!;
    const origColors = FOUR_SEGMENTS.map((s) => s.bg_color);
    applyTemplateToWheel(t, FOUR_SEGMENTS);
    FOUR_SEGMENTS.forEach((s, i) => expect(s.bg_color).toBe(origColors[i]));
  });

  it('preserves segment id, wheel_id, label, weight, position after palette application', () => {
    const t = WHEEL_TEMPLATES.find((t) => t.id === 'luxury-gold')!;
    const { newSegments } = applyTemplateToWheel(t, FOUR_SEGMENTS);
    newSegments.forEach((seg, i) => {
      expect(seg.id).toBe(FOUR_SEGMENTS[i].id);
      expect(seg.wheel_id).toBe(FOUR_SEGMENTS[i].wheel_id);
      expect(seg.label).toBe(FOUR_SEGMENTS[i].label);
      expect(seg.weight).toBe(FOUR_SEGMENTS[i].weight);
      expect(seg.position).toBe(FOUR_SEGMENTS[i].position);
    });
  });

  it('cycles palette when segment count exceeds palette length', () => {
    const palette = [
      { bg_color: '#aaaaaa', text_color: '#111111' },
      { bg_color: '#bbbbbb', text_color: '#222222' },
    ];
    const twoColorTheme: WheelTemplate = {
      id: 'two-color', name: 'Two Color', description: '', emoji: '🎨',
      gameType: 'wheel', config: {}, branding: {}, segmentPalette: palette,
    };
    const { newSegments } = applyTemplateToWheel(twoColorTheme, FOUR_SEGMENTS);
    expect(newSegments[0].bg_color).toBe('#aaaaaa');
    expect(newSegments[1].bg_color).toBe('#bbbbbb');
    expect(newSegments[2].bg_color).toBe('#aaaaaa'); // wraps
    expect(newSegments[3].bg_color).toBe('#bbbbbb'); // wraps
  });

  it('handles a single segment correctly', () => {
    const t = WHEEL_TEMPLATES.find((t) => t.id === 'ocean-blue')!;
    const single = [makeSegment({ id: 'only', label: 'Only' })];
    const { newSegments } = applyTemplateToWheel(t, single);
    expect(newSegments).toHaveLength(1);
    expect(newSegments[0].bg_color).toBe(t.segmentPalette[0].bg_color);
  });

  it('handles empty segment array without throwing', () => {
    const t = WHEEL_TEMPLATES.find((t) => t.id === 'corporate')!;
    expect(() => applyTemplateToWheel(t, [])).not.toThrow();
    const { newSegments } = applyTemplateToWheel(t, []);
    expect(newSegments).toHaveLength(0);
  });

  it('returns config as a plain copy — not the original template object', () => {
    const t = WHEEL_TEMPLATES.find((t) => t.id === 'festival')!;
    const { newConfig } = applyTemplateToWheel(t, FOUR_SEGMENTS);
    // Mutating returned config must not affect template
    (newConfig as Record<string, unknown>).confetti_enabled = false;
    expect(t.config.confetti_enabled).toBe(true);
  });

  it('returns branding as a plain copy — not the original template object', () => {
    const t = WHEEL_TEMPLATES.find((t) => t.id === 'luxury-gold')!;
    const { newBranding } = applyTemplateToWheel(t, FOUR_SEGMENTS);
    const originalColor = t.branding.primary_color;
    (newBranding as Record<string, unknown>).primary_color = '#000000';
    expect(t.branding.primary_color).toBe(originalColor);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Built-in theme selection & template catalogue integrity
// ─────────────────────────────────────────────────────────────────────────────

describe('WHEEL_TEMPLATES — catalogue integrity', () => {

  it('has no duplicate template IDs', () => {
    const ids = WHEEL_TEMPLATES.map((t) => t.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('every template has required fields (id, name, gameType, segmentPalette)', () => {
    WHEEL_TEMPLATES.forEach((t) => {
      expect(t.id).toBeTruthy();
      expect(t.name).toBeTruthy();
      expect(['wheel', 'scratch_card', 'slot_machine', 'roulette']).toContain(t.gameType);
      expect(Array.isArray(t.segmentPalette)).toBe(true);
      expect(t.segmentPalette.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('every palette entry has bg_color and text_color strings', () => {
    WHEEL_TEMPLATES.forEach((t) => {
      t.segmentPalette.forEach((entry) => {
        expect(typeof entry.bg_color).toBe('string');
        expect(typeof entry.text_color).toBe('string');
      });
    });
  });

  it('can filter wheel-only templates', () => {
    const wheelTemplates = WHEEL_TEMPLATES.filter((t) => t.gameType === 'wheel');
    expect(wheelTemplates.length).toBeGreaterThan(0);
    wheelTemplates.forEach((t) => expect(t.gameType).toBe('wheel'));
  });

  it('can filter scratch_card templates', () => {
    const scratchTemplates = WHEEL_TEMPLATES.filter((t) => t.gameType === 'scratch_card');
    expect(scratchTemplates.length).toBeGreaterThan(0);
  });

  it('can filter slot_machine templates', () => {
    const slotTemplates = WHEEL_TEMPLATES.filter((t) => t.gameType === 'slot_machine');
    expect(slotTemplates.length).toBeGreaterThan(0);
  });

  it('can filter roulette templates', () => {
    const rouletteTemplates = WHEEL_TEMPLATES.filter((t) => t.gameType === 'roulette');
    expect(rouletteTemplates.length).toBeGreaterThan(0);
  });

  it('all wheel templates with outer_ring_width set have a numeric value', () => {
    WHEEL_TEMPLATES
      .filter((t) => t.gameType === 'wheel')
      .filter((t) => (t.branding as Record<string, unknown>).outer_ring_width !== undefined)
      .forEach((t) => {
        expect(typeof (t.branding as Record<string, unknown>).outer_ring_width).toBe('number');
      });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Live preview state simulation
// ─────────────────────────────────────────────────────────────────────────────

describe('Live preview state simulation', () => {

  let baseConfig: Partial<WheelConfig>;
  let baseBranding: Partial<WheelBranding>;

  beforeEach(() => {
    baseConfig = {
      show_segment_labels: true,
      confetti_enabled: false,
      sound_enabled: false,
      label_rotation: 'radial',
    };
    baseBranding = {
      primary_color: '#123456',
      background_value: '#ffffff',
      font_family: 'Inter, sans-serif',
      outer_ring_width: 20,
    };
  });

  it('applying festival theme sets confetti_enabled=true on the preview config', () => {
    const t = WHEEL_TEMPLATES.find((t) => t.id === 'festival')!;
    const { config } = simulateLivePreview(baseConfig, baseBranding, FOUR_SEGMENTS, t);
    expect(config.confetti_enabled).toBe(true);
  });

  it('applying a theme does NOT erase existing wheel config keys absent from the template', () => {
    const t = WHEEL_TEMPLATES.find((t) => t.id === 'festival')!;
    const { config } = simulateLivePreview(baseConfig, baseBranding, FOUR_SEGMENTS, t);
    // label_rotation is set in base but not in festival template — must survive
    expect(config.label_rotation).toBe('radial');
    expect(config.sound_enabled).toBe(false);
  });

  it('applying a theme does NOT erase existing branding keys absent from the template', () => {
    const t = WHEEL_TEMPLATES.find((t) => t.id === 'luxury-gold')!;
    const { branding } = simulateLivePreview(baseConfig, baseBranding, FOUR_SEGMENTS, t);
    // font_family is in base but luxury-gold has no font_family — must survive
    expect(branding.font_family).toBe('Inter, sans-serif');
  });

  it('template branding values override the base branding values', () => {
    const t = WHEEL_TEMPLATES.find((t) => t.id === 'luxury-gold')!;
    const { branding } = simulateLivePreview(baseConfig, baseBranding, FOUR_SEGMENTS, t);
    // luxury-gold sets primary_color to '#B8860B', overriding base '#123456'
    expect(branding.primary_color).toBe('#B8860B');
  });

  it('template config values override the base config values', () => {
    const t = WHEEL_TEMPLATES.find((t) => t.id === 'corporate')!;
    const { config } = simulateLivePreview(baseConfig, baseBranding, FOUR_SEGMENTS, t);
    // corporate sets confetti_enabled=false — base was false, template also false; consistent
    expect(config.confetti_enabled).toBe(false);
  });

  it('applying a second theme overwrites the first (last-write-wins)', () => {
    const first = WHEEL_TEMPLATES.find((t) => t.id === 'neon-night')!;
    const second = WHEEL_TEMPLATES.find((t) => t.id === 'luxury-gold')!;

    const afterFirst = simulateLivePreview(baseConfig, baseBranding, FOUR_SEGMENTS, first);
    const afterSecond = simulateLivePreview(afterFirst.config, afterFirst.branding, afterFirst.segments, second);

    // luxury-gold primary_color wins over neon-night primary_color
    expect(afterSecond.branding.primary_color).toBe('#B8860B');
    expect(afterSecond.branding.primary_color).not.toBe(first.branding.primary_color);
  });

  it('segment label content is preserved through live preview apply', () => {
    const t = WHEEL_TEMPLATES.find((t) => t.id === 'pastel-spring')!;
    const { segments } = simulateLivePreview(baseConfig, baseBranding, FOUR_SEGMENTS, t);
    const labels = segments.map((s) => s.label);
    expect(labels).toEqual(FOUR_SEGMENTS.map((s) => s.label));
  });

  it('applying a custom ad-hoc theme sets its branding and config on the preview', () => {
    const customTheme: WheelTemplate = {
      id: 'my-brand',
      name: 'My Brand',
      description: '',
      emoji: '🎯',
      gameType: 'wheel',
      config: { show_segment_labels: true, confetti_enabled: true },
      branding: { primary_color: '#BADA55', button_text: 'Go!' },
      segmentPalette: [
        { bg_color: '#BADA55', text_color: '#000000' },
        { bg_color: '#000000', text_color: '#BADA55' },
      ],
    };
    const { config, branding, segments } = simulateLivePreview(baseConfig, baseBranding, FOUR_SEGMENTS, customTheme);
    expect(config.confetti_enabled).toBe(true);
    expect(branding.primary_color).toBe('#BADA55');
    expect(branding.button_text).toBe('Go!');
    // palette wraps: 0→#BADA55, 1→#000000, 2→#BADA55, 3→#000000
    expect(segments[0].bg_color).toBe('#BADA55');
    expect(segments[1].bg_color).toBe('#000000');
    expect(segments[2].bg_color).toBe('#BADA55');
    expect(segments[3].bg_color).toBe('#000000');
  });

  it('a theme with only branding overrides does not corrupt config', () => {
    const brandingOnlyTheme: WheelTemplate = {
      id: 'branding-only',
      name: 'Branding Only',
      description: '',
      emoji: '✨',
      gameType: 'wheel',
      config: {},
      branding: { primary_color: '#FF0000' },
      segmentPalette: [{ bg_color: '#FF0000', text_color: '#FFFFFF' }],
    };
    const { config } = simulateLivePreview(baseConfig, baseBranding, FOUR_SEGMENTS, brandingOnlyTheme);
    // All base config keys must still be present
    expect(config.show_segment_labels).toBe(true);
    expect(config.confetti_enabled).toBe(false);
  });

  it('a theme with only config overrides does not corrupt branding', () => {
    const configOnlyTheme: WheelTemplate = {
      id: 'config-only',
      name: 'Config Only',
      description: '',
      emoji: '⚙️',
      gameType: 'wheel',
      config: { confetti_enabled: true },
      branding: {},
      segmentPalette: [{ bg_color: '#CCCCCC', text_color: '#000000' }],
    };
    const { branding } = simulateLivePreview(baseConfig, baseBranding, FOUR_SEGMENTS, configOnlyTheme);
    // Note: Applying a theme now forces a branding reset to prevent data leaks.
    // Core brand colors are reset to platform defaults if not specified by the theme.
    expect(branding.primary_color).toBe('#7C3AED'); // platform default
    expect(branding.background_value).toBe('#FFFFFF'); // platform default
  });
});
