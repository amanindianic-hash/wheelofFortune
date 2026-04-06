'use client';

import type { WheelSegment } from '@/lib/utils/wheel-renderer';
import type { WheelBranding, WheelConfig } from '@/lib/types';

interface ScratchPreviewProps {
  segments: WheelSegment[];
  branding: WheelBranding;
  config: WheelConfig;
}

const CARD_SIZES = {
  small:  { w: 240, h: 138 },
  medium: { w: 290, h: 170 },
  large:  { w: 320, h: 200 },
};

function layerBackground(style: WheelConfig['scratch_layer_style'], color: string): React.CSSProperties {
  switch (style) {
    case 'metallic':
      return { background: 'linear-gradient(135deg, #9e9e9e 0%, #e0e0e0 25%, #bdbdbd 50%, #f5f5f5 75%, #9e9e9e 100%)' };
    case 'foil':
      return { background: 'linear-gradient(90deg, #FF6B6B, #FFD93D, #6BCB77, #4D96FF, #C77DFF, #FF6B6B)' };
    case 'striped':
      return {
        backgroundColor: color,
        backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.15) 0px, rgba(255,255,255,0.15) 10px, transparent 10px, transparent 20px)',
      };
    default:
      return { backgroundColor: color };
  }
}

function PrizeCells({ layout, segments, primaryColor }: { layout: WheelConfig['scratch_card_layout']; segments: WheelSegment[]; primaryColor: string }) {
  const cell = (seg: WheelSegment | undefined, i: number) => (
    <div key={i} className="flex flex-col items-center justify-center gap-0.5 h-full"
      style={{ backgroundColor: seg?.bg_color ?? primaryColor, flex: 1 }}>
      <span className="text-lg">🎁</span>
      <span className="text-[9px] font-bold truncate max-w-full px-0.5 text-center" style={{ color: seg?.text_color ?? '#fff' }}>
        {(seg?.label ?? '?').slice(0, 8)}
      </span>
    </div>
  );
  if (layout === 'grid_2x2') {
    return (
      <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
        {[0,1,2,3].map(i => cell(segments[i % (segments.length || 1)], i))}
      </div>
    );
  }
  if (layout === 'row_3x1') {
    return (
      <div className="absolute inset-0 flex">
        {[0,1,2].map(i => cell(segments[i % (segments.length || 1)], i))}
      </div>
    );
  }
  const seg = segments[0];
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1" style={{ backgroundColor: seg?.bg_color ?? primaryColor }}>
      <span className="text-2xl">🎁</span>
      <span className="text-xs font-bold text-center px-1" style={{ color: seg?.text_color ?? '#fff' }}>{seg?.label ?? 'Scratch!'}</span>
    </div>
  );
}

export function ScratchPreview({ segments, branding, config }: ScratchPreviewProps) {
  const primaryColor = branding.primary_color ?? '#7C3AED';
  const sizeKey = config.scratch_card_size ?? 'medium';
  const { w, h } = CARD_SIZES[sizeKey];
  const borderRadius = config.scratch_border_radius ?? 16;
  const borderColor = config.scratch_border_color ?? primaryColor;
  const layerColor = config.scratch_layer_color ?? '#B0B0B0';
  const layerStyle = config.scratch_layer_style ?? 'solid';
  const layout = config.scratch_card_layout ?? 'single';
  const threshold = Math.round((config.scratch_reveal_threshold ?? 0.6) * 100);

  return (
    <div className="flex flex-col items-center justify-center gap-4 bg-muted/30 rounded-xl p-6 border border-dashed border-muted-foreground/20">
      {/* Card */}
      <div className="relative overflow-hidden shadow-lg" style={{ width: w, height: h, borderRadius, border: `3px solid ${borderColor}` }}>
        <PrizeCells layout={layout} segments={segments} primaryColor={primaryColor} />

        {/* Scratch overlay with partial reveal (right 40% pre-scratched) */}
        <div className="absolute inset-0 flex">
          {/* Scratched area */}
          <div style={{ width: '40%', height: '100%' }} />
          {/* Remaining overlay */}
          <div
            className="flex items-center justify-center"
            style={{ ...layerBackground(layerStyle, layerColor), flex: 1, height: '100%', opacity: 0.92 }}
          >
            <span className="text-white/80 font-bold text-[10px] drop-shadow">✦ Scratch here ✦</span>
          </div>
        </div>
      </div>

      {/* Meta */}
      <div className="w-full max-w-[320px] space-y-1 text-xs text-muted-foreground text-center">
        <p className="font-medium uppercase tracking-wider">Live Preview · Scratch Card</p>
        <p className="text-[10px] opacity-70">
          {layout === 'grid_2x2' ? '2×2 Grid' : layout === 'row_3x1' ? '3×1 Row' : 'Single Prize'} · {sizeKey} · Reveal at {threshold}%
        </p>
      </div>
    </div>
  );
}
