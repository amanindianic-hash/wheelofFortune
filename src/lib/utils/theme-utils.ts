import type { WheelConfig, WheelBranding, Segment } from '@/lib/types';
import type { WheelTemplate } from '@/lib/wheel-templates';

export function applyTemplateToWheel(
  template: WheelTemplate,
  currentSegments: Segment[]
): {
  newConfig: Partial<WheelConfig>;
  newBranding: Partial<WheelBranding>;
  newSegments: Segment[];
} {
  // Map segments sequentially assigning palette colors
  const newSegments = currentSegments.map((seg, i) => {
    const palette = template.segmentPalette[i % template.segmentPalette.length];
    return {
      ...seg,
      bg_color: palette.bg_color,
      text_color: palette.text_color,
      // Clear icons and offsets when applying a standard template to avoid "state leak" from previous themes
      icon_url:      null,
      icon_offset_x: null,
      icon_offset_y: null,
    };
  });

  const newBranding: Partial<WheelBranding> = {
    // Explicitly reset all premium assets to null if not present in the template.
    // This solves the issue where switching FROM a premium theme leaves the overlay assets.
    premium_face_url:        template.branding.premium_face_url        ?? null,
    premium_stand_url:       template.branding.premium_stand_url       ?? null,
    premium_frame_url:       template.branding.premium_frame_url       ?? null,
    premium_pointer_url:     template.branding.premium_pointer_url     ?? null,
    premium_content_scale:   template.branding.premium_content_scale   ?? 0.75,
    premium_center_offset_y: template.branding.premium_center_offset_y ?? 0,
    ...template.branding,
  };

  return {
    newConfig: { ...template.config },
    newBranding,
    newSegments,
  };
}
