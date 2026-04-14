import type { WheelConfig, WheelBranding, Segment } from '@/lib/types';
import type { WheelTemplate } from '@/lib/wheel-templates';

/**
 * A "clean slate" of default WheelBranding values.
 *
 * When applying ANY theme (built-in or custom), we spread this base FIRST,
 * then the theme's own branding on top. This guarantees that properties set
 * by a *previous* theme (e.g. thick ring width, custom ticks, premium images)
 * are always reset to a sane default before the new theme is painted.
 *
 * Without this, switching from a "Luxury Gold" theme (outer_ring_width: 28)
 * to a "Corporate" theme (which doesn't specify outer_ring_width) would leave
 * the 28px ring in place.
 */
export const BRANDING_RESET_BASE: Partial<WheelBranding> = {
  // Colors
  primary_color:          '#7C3AED',
  secondary_color:        undefined,
  pointer_color:          undefined,
  background_type:        'solid',
  background_value:       '#FFFFFF',

  // Ring
  outer_ring_color:       '#7C3AED',
  outer_ring_width:       20,
  rim_tick_style:         'none',
  rim_tick_color:         '#FFFFFF',
  inner_ring_enabled:     false,
  inner_ring_color:       'rgba(255,255,255,0.15)',

  // Labels
  label_font_size:        null,
  label_font_weight:      '700',
  label_position:         'outer',
  label_text_transform:   'none',
  label_letter_spacing:   0,

  // Typography / misc
  font_family:            'Inter, sans-serif',
  button_text:            'SPIN NOW!',
  button_color:           undefined,
  border_color:           undefined,
  border_width:           0,
  logo_url:               null,
  logo_position:          'above',

  // Premium assets — always explicitly cleared so switching away from a premium
  // theme removes the overlay images.
  premium_face_url:        null,
  premium_stand_url:       null,
  premium_frame_url:       null,
  premium_pointer_url:     null,
  premium_content_scale:   0.75,
  premium_center_offset_y: 0,
};

export function applyTemplateToWheel(
  template: WheelTemplate,
  currentSegments: Segment[]
): {
  newConfig: Partial<WheelConfig>;
  newBranding: Partial<WheelBranding>;
  newSegments: Segment[];
} {
  // Map segments — reset icons/offsets so they don't "leak" from a previous theme
  const newSegments = currentSegments.map((seg, i) => {
    const palette = template.segmentPalette[i % template.segmentPalette.length];
    return {
      ...seg,
      bg_color:      palette.bg_color,
      text_color:    palette.text_color,
      icon_url:      null,
      icon_offset_x: null,
      icon_offset_y: null,
    };
  });

  // Start from the clean baseline, then stamp the template's branding on top.
  const newBranding: Partial<WheelBranding> = {
    ...BRANDING_RESET_BASE,
    ...template.branding,
  };

  return {
    newConfig: { ...template.config },
    newBranding,
    newSegments,
  };
}
