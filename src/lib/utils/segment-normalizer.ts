/**
 * segment-normalizer.ts
 *
 * SINGLE SOURCE OF TRUTH for the segment data contract.
 *
 * Every API route that returns segments MUST pass them through
 * `normalizeSegmentForResponse()` before sending to the client.
 *
 * Rules enforced here:
 *   ✔ weight is always Number (never string)
 *   ✔ all offset fields default to null (renderer uses branding-level fallbacks)
 *   ✔ background object is always present
 *   ✔ assertions fire in dev when data is corrupt
 *
 * DO NOT add renderer-specific logic here — this is a data-contract layer only.
 */

export interface NormalizedSegment {
  id: string;
  position: number;
  label: string;
  weight: number;
  is_no_prize: boolean;
  text_color: string;
  bg_color: string;
  segment_image_url: string | null;
  icon_url: string | null;
  background: { color: string; imageUrl: string | null };
  label_radial_offset:     number | null;
  label_tangential_offset: number | null;
  label_rotation_angle:    number | null;
  label_font_scale:        number | null;
  label_offset_x:          number | null;
  label_offset_y:          number | null;
  icon_radial_offset:      number | null;
  icon_tangential_offset:  number | null;
  icon_rotation_angle:     number | null;
  icon_offset_x:           number | null;
  icon_offset_y:           number | null;
  [key: string]: unknown;  // allow pass-through of extra DB columns
}

/**
 * Normalizes a raw DB segment row into the guaranteed NormalizedSegment shape.
 * Safe to call multiple times — idempotent.
 */
export function normalizeSegmentForResponse(s: any, index?: number): NormalizedSegment {
  const idx = index ?? s.position ?? 0;

  // ── Assertions (fail loudly in dev, log in prod) ───────────────────────────
  if (!s.label) {
    console.error(`[SegmentNormalizer] Missing label at position ${idx}`, { id: s.id });
  }
  if (typeof s.weight === 'string') {
    console.warn(`[SegmentNormalizer] weight is a string at position ${idx} — coercing to Number`);
  }
  if (s.bg_color === undefined || s.bg_color === null) {
    console.warn(`[SegmentNormalizer] bg_color missing at position ${idx} — defaulting to #7c3aed`);
  }

  return {
    // Pass through any extra DB columns (prize_id, wins_today, etc.)
    ...s,
    // ── Guaranteed shape ────────────────────────────────────────────────────
    id:          s.id       ?? `unknown-${idx}`,
    position:    s.position ?? idx,
    label:       s.label    ?? `Segment ${idx + 1}`,
    weight:      Number(s.weight ?? 1),   // NEVER a string
    is_no_prize: s.is_no_prize ?? true,
    text_color:  s.text_color  ?? 'rgba(255, 255, 255, 1)',
    bg_color:    s.bg_color    ?? 'rgba(124, 58, 237, 1)',
    segment_image_url: s.segment_image_url ?? null,
    icon_url:    s.icon_url    ?? null,
    // ── Nested background object (required by renderer) ─────────────────────
    background: {
      color:    s.bg_color          ?? 'rgba(124, 58, 237, 1)',
      imageUrl: s.segment_image_url ?? null,
    },
    // ── Label positioning (null = renderer uses branding-level fallback) ────
    label_radial_offset:     s.label_radial_offset     != null ? Number(s.label_radial_offset)     : null,
    label_tangential_offset: s.label_tangential_offset != null ? Number(s.label_tangential_offset) : null,
    label_rotation_angle:    s.label_rotation_angle    != null ? Number(s.label_rotation_angle)    : null,
    label_font_scale:        s.label_font_scale        != null ? Number(s.label_font_scale)        : null,
    label_offset_x:          s.label_offset_x          != null ? Number(s.label_offset_x)          : null,
    label_offset_y:          s.label_offset_y          != null ? Number(s.label_offset_y)          : null,
    // ── Icon positioning ────────────────────────────────────────────────────
    icon_radial_offset:      s.icon_radial_offset      != null ? Number(s.icon_radial_offset)      : null,
    icon_tangential_offset:  s.icon_tangential_offset  != null ? Number(s.icon_tangential_offset)  : null,
    icon_rotation_angle:     s.icon_rotation_angle     != null ? Number(s.icon_rotation_angle)     : null,
    icon_offset_x:           s.icon_offset_x           != null ? Number(s.icon_offset_x)           : null,
    icon_offset_y:           s.icon_offset_y           != null ? Number(s.icon_offset_y)            : null,
  };
}

/**
 * Validates a normalized segment array and logs any violations.
 * Does NOT throw — violations are logged so prod never crashes.
 */
export function assertSegments(segments: NormalizedSegment[], caller: string): void {
  if (!Array.isArray(segments)) {
    console.error(`[${caller}] ASSERTION FAILED: segments is not an array`, typeof segments);
    return;
  }
  if (segments.length === 0) {
    console.error(`[${caller}] ASSERTION FAILED: segments array is empty`);
    return;
  }
  segments.forEach((s, i) => {
    if (!s.label)                          console.error(`[${caller}] seg[${i}] missing label`);
    if (typeof s.weight !== 'number')      console.error(`[${caller}] seg[${i}] weight is not a number:`, s.weight);
    if (isNaN(s.weight))                   console.error(`[${caller}] seg[${i}] weight is NaN`);
    if (!s.bg_color)                       console.warn(`[${caller}]  seg[${i}] bg_color missing`);
    if (!s.background?.color)             console.warn(`[${caller}]  seg[${i}] background.color missing`);
  });
}
