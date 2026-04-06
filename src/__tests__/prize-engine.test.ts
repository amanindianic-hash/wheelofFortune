import { describe, it, expect } from 'vitest';
import { selectSegment, generateCouponCode } from '@/lib/prize-engine';
import type { Segment } from '@/lib/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeSegment(overrides: Partial<Segment> = {}): Segment {
  return {
    id: crypto.randomUUID(),
    wheel_id: 'wheel-1',
    position: 0,
    label: 'Test',
    bg_color: '#ff0000',
    text_color: '#ffffff',
    weight: 1,
    is_no_prize: false,
    wins_today: 0,
    wins_total: 0,
    win_cap_daily: null,
    win_cap_total: null,
    ...overrides,
  };
}

// ─── selectSegment ────────────────────────────────────────────────────────────

describe('selectSegment', () => {
  it('returns a segment from the eligible pool', () => {
    const segments = [makeSegment({ label: 'A' }), makeSegment({ label: 'B' })];
    const { segment } = selectSegment(segments);
    expect(['A', 'B']).toContain(segment.label);
  });

  it('returns a server seed string', () => {
    const segments = [makeSegment()];
    const { serverSeed } = selectSegment(segments);
    expect(typeof serverSeed).toBe('string');
    expect(serverSeed.length).toBe(64); // 32 bytes → 64 hex chars
  });

  it('respects win_cap_daily — skips fully-capped segment', () => {
    const capped = makeSegment({ label: 'Capped', win_cap_daily: 3, wins_today: 3 });
    const free   = makeSegment({ label: 'Free',   win_cap_daily: 3, wins_today: 0 });
    // Run 20 times — capped segment must never be returned
    for (let i = 0; i < 20; i++) {
      const { segment } = selectSegment([capped, free]);
      expect(segment.label).toBe('Free');
    }
  });

  it('respects win_cap_total — skips fully-capped segment', () => {
    const capped = makeSegment({ label: 'Capped', win_cap_total: 100, wins_total: 100 });
    const free   = makeSegment({ label: 'Free',   win_cap_total: 100, wins_total: 0 });
    for (let i = 0; i < 20; i++) {
      const { segment } = selectSegment([capped, free]);
      expect(segment.label).toBe('Free');
    }
  });

  it('partially-capped segment (not yet at limit) remains eligible', () => {
    const partial = makeSegment({ label: 'Partial', win_cap_daily: 5, wins_today: 4 });
    const result = selectSegment([partial]);
    expect(result.segment.label).toBe('Partial');
  });

  it('falls back to any segment when all eligible are capped', () => {
    const seg = makeSegment({ is_no_prize: true, win_cap_total: 1, wins_total: 1 });
    // All capped → prize-engine falls back to first segment or no-prize
    const { segment } = selectSegment([seg]);
    expect(segment).toBeDefined();
  });

  it('handles single-segment list', () => {
    const segments = [makeSegment({ label: 'Solo' })];
    const { segment } = selectSegment(segments);
    expect(segment.label).toBe('Solo');
  });

  it('distributes across segments with equal weight', () => {
    const a = makeSegment({ label: 'A', weight: 1 });
    const b = makeSegment({ label: 'B', weight: 1 });
    const c = makeSegment({ label: 'C', weight: 1 });
    const counts: Record<string, number> = { A: 0, B: 0, C: 0 };

    for (let i = 0; i < 300; i++) {
      const { segment } = selectSegment([a, b, c]);
      counts[segment.label]++;
    }
    // Each should appear at least once (probability of any single label being 0 in 300 trials is negligible)
    expect(counts['A']).toBeGreaterThan(0);
    expect(counts['B']).toBeGreaterThan(0);
    expect(counts['C']).toBeGreaterThan(0);
  });

  it('heavily-weighted segment wins the vast majority', () => {
    const heavy = makeSegment({ label: 'Heavy', weight: 99 });
    const light = makeSegment({ label: 'Light', weight: 1 });
    let heavyWins = 0;
    for (let i = 0; i < 200; i++) {
      const { segment } = selectSegment([heavy, light]);
      if (segment.label === 'Heavy') heavyWins++;
    }
    // With 99:1 ratio, heavy should win >150 out of 200
    expect(heavyWins).toBeGreaterThan(150);
  });
});

// ─── generateCouponCode ───────────────────────────────────────────────────────

describe('generateCouponCode', () => {
  it('starts with the given prefix', () => {
    const code = generateCouponCode('PROMO', 10);
    expect(code.startsWith('PROMO')).toBe(true);
  });

  it('returns the requested total length', () => {
    expect(generateCouponCode('ABC', 8).length).toBe(8);
    expect(generateCouponCode('', 6).length).toBe(6);
    expect(generateCouponCode('X', 12).length).toBe(12);
  });

  it('only contains uppercase alphanumeric characters', () => {
    for (let i = 0; i < 50; i++) {
      const code = generateCouponCode('', 12);
      expect(code).toMatch(/^[A-Z0-9]+$/);
    }
  });

  it('produces unique codes across multiple calls', () => {
    const codes = new Set(Array.from({ length: 100 }, () => generateCouponCode('TEST', 12)));
    // With 7 random chars from 36-char alphabet (36^7 = ~78B), collisions in 100 draws are impossible
    expect(codes.size).toBe(100);
  });

  it('handles empty prefix', () => {
    const code = generateCouponCode('', 8);
    expect(code.length).toBe(8);
    expect(code).toMatch(/^[A-Z0-9]+$/);
  });

  it('handles prefix length equal to total length (suffix length = 1)', () => {
    // prefix = 7 chars, total = 8 → suffix = 1 char
    const code = generateCouponCode('ABCDEFG', 8);
    expect(code.startsWith('ABCDEFG')).toBe(true);
    expect(code.length).toBe(8);
  });
});
