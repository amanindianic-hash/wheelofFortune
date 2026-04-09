/**
 * segment-utils.ts — Shared helpers for segment data normalisation.
 */

/**
 * The Neon/pg driver returns NUMERIC(6,2) columns as strings (e.g. "5.00").
 * Parse them back to proper JS numbers so canvas arithmetic stays correct.
 * Also safe when values are already numbers or null/undefined.
 */
export function normalizeSegment<T extends Record<string, unknown>>(s: T): T {
  return {
    ...s,
    label_offset_x:       s.label_offset_x       != null ? parseFloat(s.label_offset_x       as string) : null,
    label_offset_y:       s.label_offset_y       != null ? parseFloat(s.label_offset_y       as string) : null,
    icon_offset_x:        s.icon_offset_x        != null ? parseFloat(s.icon_offset_x        as string) : null,
    icon_offset_y:        s.icon_offset_y        != null ? parseFloat(s.icon_offset_y        as string) : null,
    label_rotation_angle: s.label_rotation_angle != null ? parseFloat(s.label_rotation_angle as string) : null,
    icon_rotation_angle:  s.icon_rotation_angle  != null ? parseFloat(s.icon_rotation_angle  as string) : null,
  };
}
