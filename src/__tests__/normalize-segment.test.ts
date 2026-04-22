/**
 * normalize-segment.test.ts
 *
 * Unit tests for normalizeSegment — the function that converts NUMERIC
 * columns (returned as strings by the Neon/pg driver) back to JS numbers.
 *
 * This test class was added specifically to prevent regressions of the bug
 * where label/icon offsets disappeared from the canvas after saving because
 * DB NUMERIC(6,2) values came back as "5.00" strings, causing the canvas
 * to use string-concatenation instead of arithmetic.
 */
import { describe, it, expect } from 'vitest';
import { normalizeSegment } from '@/lib/utils/segment-utils';

describe('normalizeSegment', () => {
  it('converts string offsets returned by the DB driver to numbers', () => {
    const raw = {
      id: 'seg-1',
      label: 'Win 20%',
      label_offset_x: '5.00',   // NUMERIC(6,2) comes back as string from Neon
      label_offset_y: '-3.50',
      icon_offset_x:  '10.00',
      icon_offset_y:  '0.00',
    };
    const result = normalizeSegment(raw);
    expect(result.label_offset_x).toBe(5);
    expect(result.label_offset_y).toBe(-3.5);
    expect(result.icon_offset_x).toBe(10);
    expect(result.icon_offset_y).toBe(0);
  });

  it('passes through null offsets unchanged', () => {
    const raw = {
      id: 'seg-2',
      label: 'Try Again',
      label_offset_x: null,
      label_offset_y: null,
      icon_offset_x:  null,
      icon_offset_y:  null,
    };
    const result = normalizeSegment(raw);
    expect(result.label_offset_x).toBeNull();
    expect(result.label_offset_y).toBeNull();
    expect(result.icon_offset_x).toBeNull();
    expect(result.icon_offset_y).toBeNull();
  });

  it('passes through undefined offsets as null', () => {
    const raw: any = { id: 'seg-3', label: 'No offset fields' };
    const result = normalizeSegment(raw);
    // undefined != null so the condition is false → stored as null
    expect(result.label_offset_x).toBeNull();
    expect(result.label_offset_y).toBeNull();
    expect(result.icon_offset_x).toBeNull();
    expect(result.icon_offset_y).toBeNull();
  });

  it('leaves already-numeric offsets unchanged', () => {
    const raw = {
      id: 'seg-4',
      label: 'Already numbers',
      label_offset_x: 7,
      label_offset_y: -2,
      icon_offset_x:  0,
      icon_offset_y:  15,
    };
    const result = normalizeSegment(raw);
    expect(result.label_offset_x).toBe(7);
    expect(result.label_offset_y).toBe(-2);
    expect(result.icon_offset_x).toBe(0);
    expect(result.icon_offset_y).toBe(15);
  });

  it('preserves all other segment fields untouched', () => {
    const raw = {
      id: 'seg-5',
      wheel_id: 'wheel-abc',
      position: 2,
      label: 'Test',
      bg_color: '#7C3AED',
      text_color: '#FFFFFF',
      icon_url: 'https://example.com/icon.png',
      weight: '1.5000',  // NUMERIC — NOT normalized by this function (renderer coerces separately)
      prize_id: 'prize-xyz',
      is_no_prize: false,
      label_offset_x: '3.00',
      label_offset_y: '0.00',
      icon_offset_x:  null,
      icon_offset_y:  null,
    };
    const result = normalizeSegment(raw);
    // Non-offset fields should be identical
    expect(result.id).toBe('seg-5');
    expect(result.wheel_id).toBe('wheel-abc');
    expect(result.label).toBe('Test');
    expect(result.bg_color).toBe('#7C3AED');
    expect(result.icon_url).toBe('https://example.com/icon.png');
    expect(result.weight).toBe('1.5000'); // not normalized — checked separately
    // Offsets are numeric
    expect(result.label_offset_x).toBe(3);
    expect(result.label_offset_y).toBe(0);
  });

  it('handles zero string "0.00" correctly (distinct from null)', () => {
    const raw = {
      id: 'seg-6',
      label: 'Zero offset',
      label_offset_x: '0.00',
      label_offset_y: '0.00',
      icon_offset_x:  '0.00',
      icon_offset_y:  '0.00',
    };
    const result = normalizeSegment(raw);
    expect(result.label_offset_x).toBe(0);
    expect(result.label_offset_y).toBe(0);
    expect(result.icon_offset_x).toBe(0);
    expect(result.icon_offset_y).toBe(0);
    // 0 is not null
    expect(result.label_offset_x).not.toBeNull();
  });

  it('handles negative string offsets', () => {
    const raw = {
      id: 'seg-7',
      label: 'Negative',
      label_offset_x: '-12.50',
      label_offset_y: '-0.75',
      icon_offset_x:  '-5.00',
      icon_offset_y:  '-1.25',
    };
    const result = normalizeSegment(raw);
    expect(result.label_offset_x).toBe(-12.5);
    expect(result.label_offset_y).toBe(-0.75);
    expect(result.icon_offset_x).toBe(-5);
    expect(result.icon_offset_y).toBe(-1.25);
  });
});
