'use client';

import { useEffect, useRef } from 'react';
import { drawWheel, preloadSegmentImages } from '@/lib/utils/wheel-renderer';
import type { WheelSegment, WheelConfig, WheelBranding, ImageCache } from '@/lib/utils/wheel-renderer';

interface WheelPreviewProps {
  segments: WheelSegment[];
  config: WheelConfig;
  branding: WheelBranding;
  rotation?: number;
}

export function WheelPreview({ segments, config, branding, rotation = 0 }: WheelPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageCacheRef = useRef<ImageCache>(new Map());

  useEffect(() => {
    async function draw() {
      if (!canvasRef.current) return;
      await preloadSegmentImages(segments, config, branding, imageCacheRef.current);
      drawWheel(canvasRef.current, segments, rotation, config, branding, imageCacheRef.current);
    }
    draw();
  }, [segments, config, branding, rotation]);

  const pointerColor = branding.primary_color || '#7C3AED';

  return (
    <div className="flex flex-col items-center justify-center gap-4 bg-muted/30 rounded-xl p-8 border border-dashed border-muted-foreground/20">
      <div className="relative isolate pt-4">
        {/* Premium 3D Pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
          {/* Base Mount */}
          <div className="w-8 h-4 bg-gradient-to-b from-[#f8f9fa] to-[#d1d5db] rounded-t-md shadow-sm border border-b-0 border-black/10 relative z-10" />
          {/* Arrow */}
          <div className="relative -mt-0.5 drop-shadow-xl filter">
            <svg width="28" height="38" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 38L2 14V2C2 2 12 4 16 4C20 4 30 2 30 2V14L16 38Z" fill={pointerColor} stroke="rgba(255,255,255,0.6)" strokeWidth="2" />
              <path d="M16 34L4 15V5C7 6.5 11 7.5 16 7.5C21 7.5 25 6.5 28 5V15L16 34Z" fill="url(#arrow-grad)" />
              <defs>
                <linearGradient id="arrow-grad" x1="16" y1="5" x2="16" y2="34" gradientUnits="userSpaceOnUse">
                  <stop stopColor="white" stopOpacity="0.3" />
                  <stop offset="1" stopColor="black" stopOpacity="0.25" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        <canvas
          ref={canvasRef}
          width={720} // Rendering at 2x internally for crisp graphics
          height={720}
          className="rounded-full shadow-2xl bg-white w-[360px] h-[360px]"
          // Remove border from canvas styles because the wheel-renderer handles its own dynamic premium edge rendering
        />
      </div>

      <div className="text-center">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Live Preview</p>
        <p className="text-[10px] text-muted-foreground/60 mt-1">Updates in real-time as you edit</p>
      </div>
    </div>
  );
}
