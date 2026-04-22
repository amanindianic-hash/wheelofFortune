/**
 * segment-utils.ts — Shared helpers for segment data normalisation.
 */

/**
 * The Neon/pg driver returns NUMERIC(6,2) columns as strings (e.g. "5.00").
 * Parse them back to proper JS numbers so canvas arithmetic stays correct.
 * Also safe when values are already numbers or null/undefined.
 */
export function normalizeSegment<T>(s: T): T {
  const input = s as any;
  return {
    ...input,
    label_offset_x:       input.label_offset_x       != null ? parseFloat(input.label_offset_x       as string) : null,
    label_offset_y:       input.label_offset_y       != null ? parseFloat(input.label_offset_y       as string) : null,
    icon_offset_x:        input.icon_offset_x        != null ? parseFloat(input.icon_offset_x        as string) : null,
    icon_offset_y:        input.icon_offset_y        != null ? parseFloat(input.icon_offset_y        as string) : null,
    label_rotation_angle: input.label_rotation_angle != null ? parseFloat(input.label_rotation_angle as string) : null,
    icon_rotation_angle:  input.icon_rotation_angle  != null ? parseFloat(input.icon_rotation_angle  as string) : null,
    icon_radial_offset:   input.icon_radial_offset   != null ? parseFloat(input.icon_radial_offset   as string) : null,
    icon_tangential_offset: input.icon_tangential_offset     != null ? parseFloat(input.icon_tangential_offset     as string) : null,
    label_radial_offset:  input.label_radial_offset  != null ? parseFloat(input.label_radial_offset  as string) : null,
    label_tangential_offset:    input.label_tangential_offset    != null ? parseFloat(input.label_tangential_offset    as string) : null,
    label_font_scale:     input.label_font_scale     != null ? parseFloat(input.label_font_scale     as string) : null,
    icon_scale:           input.icon_scale           != null ? parseFloat(input.icon_scale           as string) : null,
  } as T;
}
export function isTransparent(c: string | undefined): boolean {
  if (!c) return true;
  const lower = c.toLowerCase().trim();
  return lower === 'transparent' || lower.includes('rgba(0,0,0,0)') || lower.includes('rgba(0, 0, 0, 0)');
}
