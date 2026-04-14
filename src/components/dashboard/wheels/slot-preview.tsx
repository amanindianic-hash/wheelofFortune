'use client';

import type { WheelSegment } from '@/lib/utils/wheel-renderer';
import type { WheelBranding, WheelConfig } from '@/lib/types';
import { getRandomSlotIcon } from '@/lib/utils/slot-utils';

interface SlotPreviewProps {
  segments: WheelSegment[];
  branding: WheelBranding;
  config: WheelConfig;
}

function getCabinetStyles(style: WheelConfig['slot_cabinet_style'], primaryColor: string): React.CSSProperties {
  switch (style) {
    case 'classic':
      return {
        background: 'linear-gradient(160deg,#c0392b,#8e1c12)',
        border: '4px solid #f39c12',
        borderRadius: 20,
        padding: 16,
        boxShadow: '0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
      };
    case 'neon':
      return {
        background: '#0A0A14',
        border: `4px solid ${primaryColor}`,
        borderRadius: 18,
        padding: 16,
        boxShadow: `0 0 24px ${primaryColor}cc, 0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)`
      };
    default:
      return {
        background: `linear-gradient(135deg,${primaryColor}22,${primaryColor}44)`,
        border: `4px solid ${primaryColor}`,
        borderRadius: 20,
        padding: 16,
        boxShadow: `0 20px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)`,
      };
  }
}

export function SlotPreview({ segments, branding, config }: SlotPreviewProps) {
  const primaryColor = branding.primary_color ?? '#7C3AED';
  const reelCount = config.slot_reel_count ?? 3;
  const visRows = config.slot_visible_rows ?? 3;
  const symbolMode = config.slot_symbol_mode ?? 'both';
  const cabinetStyle = config.slot_cabinet_style ?? 'modern';
  const winLineColor = config.slot_win_line_color ?? primaryColor;
  const rowH = visRows === 1 ? 72 : visRows === 5 ? 44 : 56;
  const windowH = rowH * visRows;
  const reelW = reelCount === 5 ? 52 : reelCount === 2 ? 88 : 72;
  const cabinetCSS = getCabinetStyles(cabinetStyle, primaryColor);

  function reelRows(offset: number): (WheelSegment | undefined)[] {
    if (segments.length === 0) return Array(visRows).fill(undefined);
    return Array.from({ length: visRows }, (_, i) => segments[(i + offset) % segments.length]);
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 bg-muted/30 rounded-xl p-8 border border-dashed border-muted-foreground/20">
      <div style={cabinetCSS}>
        {/* Reel window */}
        <div className="flex gap-1.5 rounded-xl p-1.5"
          style={{ background: cabinetStyle === 'neon' ? '#05050D' : '#1A1A2E', boxShadow: 'inset 0 3px 10px rgba(0,0,0,0.6)' }}>
          {Array.from({ length: reelCount }, (_, reelIdx) => (
            <div key={reelIdx} className="relative rounded-lg overflow-hidden" style={{ width: reelW, height: windowH }}>
              {/* Win-line on middle row */}
              <div className="absolute inset-x-0 z-10 pointer-events-none" style={{
                top: Math.floor(visRows / 2) * rowH,
                height: rowH,
                border: `2px solid ${winLineColor}`,
                borderRadius: 3,
                boxShadow: `0 0 6px ${winLineColor}88`,
              }} />
              {reelRows(reelIdx * 2).map((seg, rowIdx) => (
                <div key={rowIdx} className="flex flex-col items-center justify-center gap-0.5 w-full"
                  style={{ height: rowH, backgroundColor: seg?.bg_color ?? '#2A2A2A', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
                  {(symbolMode === 'icon' || symbolMode === 'both') && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={seg?.icon_url ?? getRandomSlotIcon()}
                      alt={seg?.label ?? 'slot icon'}
                      className="object-contain rounded"
                      style={{
                        width: rowH * 0.32,
                        height: rowH * 0.32,
                      }}
                    />
                  )}
                  {(symbolMode === 'label' || symbolMode === 'both') && (
                    <span className="font-bold text-center leading-none px-0.5 truncate w-full text-center"
                      style={{ color: seg?.text_color ?? '#FFF', fontSize: Math.max(8, rowH * 0.16) }}>
                      {(seg?.label ?? '?').slice(0, 7)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Spin button */}
        <div className="mt-2 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold"
          style={{ backgroundColor: primaryColor }}>
          {branding.button_text ?? 'SPIN!'}
        </div>
      </div>

      <div className="text-center space-y-0.5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">🎰 Live Preview · Slot Machine 🎰</p>
        <p className="text-[10px] text-muted-foreground/70">
          {reelCount} reels · {visRows} row{visRows !== 1 ? 's' : ''} · {symbolMode} · {cabinetStyle}
        </p>
      </div>
    </div>
  );
}
