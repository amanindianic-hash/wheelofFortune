import { describe, it, expect } from 'vitest';
import { applyTemplateToWheel } from '@/lib/utils/theme-utils';
import { WHEEL_TEMPLATES } from '@/lib/wheel-templates';
import type { Segment } from '@/lib/types';

describe('Theme Application Utility', () => {
  const dummySegments: Segment[] = [
    { id: '1', wheel_id: 'w1', position: 0, label: 'Prize 1', bg_color: '#000000', text_color: '#ffffff', weight: 1, is_no_prize: false, wins_today: 0, wins_total: 0 } as any,
    { id: '2', wheel_id: 'w1', position: 1, label: 'Prize 2', bg_color: '#000000', text_color: '#ffffff', weight: 1, is_no_prize: false, wins_today: 0, wins_total: 0 } as any,
    { id: '3', wheel_id: 'w1', position: 2, label: 'Prize 3', bg_color: '#000000', text_color: '#ffffff', weight: 1, is_no_prize: false, wins_today: 0, wins_total: 0 } as any,
    { id: '4', wheel_id: 'w1', position: 3, label: 'Prize 4', bg_color: '#000000', text_color: '#ffffff', weight: 1, is_no_prize: false, wins_today: 0, wins_total: 0 } as any,
  ];

  it('INTERNAL: correctly applies a built-in wheel template config and branding', () => {
    // Pick an internal built-in theme like 'festival'
    const festivalTheme = WHEEL_TEMPLATES.find((t) => t.id === 'festival');
    expect(festivalTheme).toBeDefined();

    const { newConfig, newBranding, newSegments } = applyTemplateToWheel(festivalTheme!);

    // Should merge the config
    expect(newConfig.confetti_enabled).toBe(true);
    expect(newBranding.primary_color).toBe('#7C3AED');
    
    // Should map the segment colors onto our dummy segments
    expect(newSegments.length).toBe(dummySegments.length);
    newSegments.forEach((seg: any, i: number) => {
      const expectedPaletteColor = festivalTheme!.segmentPalette[i % festivalTheme!.segmentPalette.length];
      expect(seg.bg_color).toBe(expectedPaletteColor.bg_color);
      expect(seg.text_color).toBe(expectedPaletteColor.text_color);
    });
  });

  it('CUSTOM: correctly handles an ad-hoc custom theme without image overlays', () => {
    // Simulate a custom theme a user defines manually via the same interface
    const customTheme = {
      id: 'custom-1',
      name: 'Custom User Theme',
      description: 'My Theme',
      emoji: '🎨',
      gameType: 'wheel' as const,
      config: {
        animation_speed: 'slow' as const,
        show_segment_labels: true,
      },
      branding: {
        primary_color: '#123456',
        background_value: '#abcdef'
      },
      segmentPalette: [
        { bg_color: '#111111', text_color: '#aaaaaa' },
        { bg_color: '#222222', text_color: '#bbbbbb' }
      ]
    };

    const { newConfig, newBranding, newSegments } = applyTemplateToWheel(customTheme);

    expect(newConfig.animation_speed).toBe('slow');
    expect(newBranding.primary_color).toBe('#123456');

    // Palettes should wrap around because palette length is 2 and we have 4 segments
    expect(newSegments[0].bg_color).toBe('#111111');
    expect(newSegments[1].bg_color).toBe('#222222');
    expect(newSegments[2].bg_color).toBe('#111111'); // wraparound
    expect(newSegments[3].bg_color).toBe('#222222'); // wraparound
  });
});
