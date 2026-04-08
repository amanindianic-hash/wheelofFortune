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
    };
  });

  // Always explicitly include premium fields so switching FROM a premium template
  // TO a non-premium one clears them. Without this, the spread in the dashboard
  // ( { ...wheel.branding, ...newBranding } ) would leave the previous
  // premium_face_url / premium_stand_url intact because non-premium templates
  // simply don't include those keys — they never get overwritten to null.
  const newBranding: Partial<WheelBranding> = {
    premium_face_url: template.branding.premium_face_url ?? null,
    premium_stand_url: template.branding.premium_stand_url ?? null,
    premium_content_scale: template.branding.premium_content_scale,
    premium_center_offset_y: template.branding.premium_center_offset_y,
    ...template.branding,
  };

  return {
    newConfig: { ...template.config },
    newBranding,
    newSegments,
  };
}
