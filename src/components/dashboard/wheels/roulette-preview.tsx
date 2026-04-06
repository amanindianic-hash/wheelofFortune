'use client';

import { useEffect, useRef } from 'react';
import { drawRoulette } from '@/lib/utils/roulette-renderer';
import type { WheelSegment } from '@/lib/utils/wheel-renderer';
import type { WheelBranding, WheelConfig } from '@/lib/types';

interface RoulettePreviewProps {
  segments: WheelSegment[];
  branding: WheelBranding;
  config: WheelConfig;
}

export function RoulettePreview({ segments, branding, config }: RoulettePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || segments.length === 0) return;
    drawRoulette(
      canvasRef.current,
      segments,
      0,           // static preview — no rotation
      -Math.PI / 2, // ball at top
      0,           // ball on track
      {
        primary_color: branding.primary_color,
        roulette_pocket_style: config.roulette_pocket_style,
      },
    );
  }, [segments, branding, config]);

  const primaryColor = branding.primary_color ?? '#7C3AED';
  const pocketStyle  = config.roulette_pocket_style ?? 'classic';
  const tableGreen   = pocketStyle === 'neon' ? '#0A0A14' : '#065c20';

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="rounded-2xl p-4 flex flex-col items-center gap-4 w-full"
        style={{
          backgroundColor: tableGreen,
          border: pocketStyle === 'neon' ? `2px solid ${primaryColor}44` : '2px solid rgba(255,255,255,0.15)',
        }}
      >
        <p className="text-white/80 text-xs font-semibold uppercase tracking-widest">🎰 Roulette Preview</p>

        <div className="relative">
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10">
            <div
              className="w-0 h-0 border-l-[8px] border-r-[8px] border-t-[16px] border-l-transparent border-r-transparent"
              style={{ borderTopColor: pocketStyle === 'neon' ? primaryColor : '#C8A050' }}
            />
          </div>
          <canvas
            ref={canvasRef}
            width={260}
            height={260}
            className="rounded-full"
            style={{ border: `2px solid ${pocketStyle === 'neon' ? primaryColor : '#C8A050'}` }}
          />
        </div>

        <div
          className="w-full py-2 rounded-xl text-center text-sm font-bold text-white opacity-70 cursor-default"
          style={{ backgroundColor: primaryColor }}
        >
          {branding.button_text ?? 'SPIN!'}
        </div>
      </div>
    </div>
  );
}
