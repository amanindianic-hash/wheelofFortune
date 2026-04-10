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
    <div className="flex flex-col items-center justify-center gap-4 bg-muted/30 rounded-xl p-8 border border-dashed border-muted-foreground/20">
      <div
        className="rounded-2xl p-6 flex flex-col items-center gap-4 w-full shadow-2xl"
        style={{
          backgroundColor: tableGreen,
          border: pocketStyle === 'neon' ? `3px solid ${primaryColor}` : '3px solid #C8A050',
          boxShadow: pocketStyle === 'neon' ? `0 0 24px ${primaryColor}aa, 0 20px 40px rgba(0,0,0,0.4)` : '0 20px 40px rgba(0,0,0,0.3)',
        }}
      >
        <p className="text-white/80 text-xs font-semibold uppercase tracking-widest">🎰 Roulette Preview</p>

        <div className="relative">
          {/* Premium 3D Pointer */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
            {/* Base Mount */}
            <div className="w-6 h-3 bg-gradient-to-b from-[#f8f9fa] to-[#d1d5db] rounded-t-md shadow-sm border border-b-0 border-black/10 relative z-10" />
            {/* Arrow */}
            <div className="relative -mt-0.5 drop-shadow-lg filter">
              <svg width="24" height="32" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 38L2 14V2C2 2 12 4 16 4C20 4 30 2 30 2V14L16 38Z" fill={pocketStyle === 'neon' ? primaryColor : '#C8A050'} stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
                <path d="M16 34L4 15V5C7 6.5 11 7.5 16 7.5C21 7.5 25 6.5 28 5V15L16 34Z" fill="url(#roulette-arrow-grad)" />
                <defs>
                  <linearGradient id="roulette-arrow-grad" x1="16" y1="5" x2="16" y2="34" gradientUnits="userSpaceOnUse">
                    <stop stopColor="white" stopOpacity="0.4" />
                    <stop offset="1" stopColor="black" stopOpacity="0.3" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
          <canvas
            ref={canvasRef}
            width={260}
            height={260}
            className="rounded-full shadow-2xl"
            style={{
              border: `3px solid ${pocketStyle === 'neon' ? primaryColor : '#C8A050'}`,
              boxShadow: `0 0 20px rgba(0,0,0,0.5), 0 10px 30px rgba(0,0,0,0.3)`,
            }}
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
