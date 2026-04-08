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

  return {
    newConfig: { ...template.config },
    newBranding: { ...template.branding },
    newSegments,
  };
}
