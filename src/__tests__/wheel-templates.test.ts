import { describe, it, expect } from 'vitest';
import { WHEEL_TEMPLATES } from '@/lib/wheel-templates';

const HEX_RE = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
const RGBA_RE = /^rgba?\(/;

function isValidColor(c: string) {
  return HEX_RE.test(c) || RGBA_RE.test(c) || c === 'transparent';
}

// ─── Required field structure ─────────────────────────────────────────────────

describe('WHEEL_TEMPLATES — required fields', () => {
  WHEEL_TEMPLATES.forEach((tpl) => {
    it(`template "${tpl.id}" has all required fields`, () => {
      expect(tpl.id).toBeTruthy();
      expect(tpl.name).toBeTruthy();
      expect(tpl.description).toBeTruthy();
      expect(tpl.emoji).toBeTruthy();
      expect(['wheel', 'scratch_card', 'slot_machine', 'roulette']).toContain(tpl.gameType);
      expect(tpl.config).toBeDefined();
      expect(tpl.branding).toBeDefined();
      expect(Array.isArray(tpl.segmentPalette)).toBe(true);
      expect(tpl.segmentPalette.length).toBeGreaterThanOrEqual(2);
    });

    it(`template "${tpl.id}" segmentPalette has valid hex colors`, () => {
      for (const entry of tpl.segmentPalette) {
        expect(isValidColor(entry.bg_color)).toBe(true);
        expect(isValidColor(entry.text_color)).toBe(true);
      }
    });
  });
});

// ─── No duplicate IDs ─────────────────────────────────────────────────────────

describe('WHEEL_TEMPLATES — uniqueness', () => {
  it('has no duplicate IDs', () => {
    const ids = WHEEL_TEMPLATES.map((t) => t.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('has no duplicate names within the same game type', () => {
    for (const gameType of ['wheel', 'scratch_card', 'slot_machine', 'roulette'] as const) {
      const names = WHEEL_TEMPLATES.filter((t) => t.gameType === gameType).map((t) => t.name);
      const unique = new Set(names);
      expect(unique.size).toBe(names.length);
    }
  });
});

// ─── Counts per game type ─────────────────────────────────────────────────────

describe('WHEEL_TEMPLATES — counts', () => {
  it('has 9 wheel templates', () => {
    expect(WHEEL_TEMPLATES.filter((t) => t.gameType === 'wheel').length).toBe(9);
  });

  it('has 6 scratch_card templates', () => {
    expect(WHEEL_TEMPLATES.filter((t) => t.gameType === 'scratch_card').length).toBe(6);
  });

  it('has 6 slot_machine templates', () => {
    expect(WHEEL_TEMPLATES.filter((t) => t.gameType === 'slot_machine').length).toBe(6);
  });

  it('has 6 roulette templates', () => {
    expect(WHEEL_TEMPLATES.filter((t) => t.gameType === 'roulette').length).toBe(6);
  });
});

// ─── Game-type-specific config fields ────────────────────────────────────────

describe('WHEEL_TEMPLATES — game-type config fields', () => {
  it('every roulette template sets roulette_pocket_style', () => {
    const roulette = WHEEL_TEMPLATES.filter((t) => t.gameType === 'roulette');
    for (const tpl of roulette) {
      expect(['classic', 'modern', 'neon']).toContain(tpl.config.roulette_pocket_style);
    }
  });

  it('roulette templates cover all 3 pocket styles', () => {
    const styles = WHEEL_TEMPLATES
      .filter((t) => t.gameType === 'roulette')
      .map((t) => t.config.roulette_pocket_style);
    expect(styles).toContain('classic');
    expect(styles).toContain('modern');
    expect(styles).toContain('neon');
  });

  it('every scratch_card template sets scratch_layer_style', () => {
    const scratch = WHEEL_TEMPLATES.filter((t) => t.gameType === 'scratch_card');
    for (const tpl of scratch) {
      expect(['solid', 'metallic', 'foil', 'striped']).toContain(tpl.config.scratch_layer_style);
    }
  });

  it('every slot_machine template sets slot_cabinet_style', () => {
    const slots = WHEEL_TEMPLATES.filter((t) => t.gameType === 'slot_machine');
    for (const tpl of slots) {
      expect(['classic', 'modern', 'neon']).toContain(tpl.config.slot_cabinet_style);
    }
  });

  it('every slot_machine template sets slot_reel_count', () => {
    const slots = WHEEL_TEMPLATES.filter((t) => t.gameType === 'slot_machine');
    for (const tpl of slots) {
      expect([2, 3, 5]).toContain(tpl.config.slot_reel_count);
    }
  });

  it('slot templates include at least one 5-reel template', () => {
    const fiveReel = WHEEL_TEMPLATES
      .filter((t) => t.gameType === 'slot_machine')
      .some((t) => t.config.slot_reel_count === 5);
    expect(fiveReel).toBe(true);
  });

  it('every wheel template has a primary_color in branding', () => {
    const wheels = WHEEL_TEMPLATES.filter((t) => t.gameType === 'wheel');
    for (const tpl of wheels) {
      expect(tpl.branding.primary_color).toBeTruthy();
      expect(isValidColor(tpl.branding.primary_color!)).toBe(true);
    }
  });
});
