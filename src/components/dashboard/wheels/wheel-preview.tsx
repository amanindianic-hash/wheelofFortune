'use client';

import { useEffect, useRef, useState } from 'react';
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
  // Use a state to force re-render once images are preloaded
  const [loadTrigger, setLoadTrigger] = useState(0);

  useEffect(() => {
    let active = true;
    async function updatePreview() {
      if (!canvasRef.current) return;
      
      // Preload images (this is async)
      await preloadSegmentImages(segments, config, branding, imageCacheRef.current);
      
      if (!active) return;
      
      // Draw to canvas
      drawWheel(canvasRef.current, segments, rotation, config, branding, imageCacheRef.current);
      
      // Slightly delay a secondary trigger to ensure all cache hits are accounted for
      // in case of race conditions with the browser's image loading
      setLoadTrigger(prev => prev + 1);
    }
    updatePreview();
    return () => { active = false; };
  }, [segments, config, branding, rotation]);

  const pointerColor = branding.primary_color || '#7C3AED';

  return (
    <div className="flex flex-col items-center justify-center gap-4 bg-muted/30 rounded-xl p-8 border border-dashed border-muted-foreground/20">
      <div className="relative isolate pt-4">
        {/* Premium 3D Pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center pointer-events-none">
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

        {/* 
            Container for the canvas. We use the container for clipping/shadow 
            to prevent the canvas element's rounded-full from clipping 
            high-fidelity premium rims drawn near the edge.
        */}
        <div 
          className="rounded-full shadow-2xl overflow-hidden w-[360px] h-[360px] z-10"
          style={{
            background:
              branding.background_value &&
              branding.background_value !== 'rgba(0, 0, 0, 0)'
                ? branding.background_value
                : 'transparent',
          }}
        >
          <canvas
            ref={canvasRef}
            width={720}
            height={720}
            className="w-full h-full"
            style={{ display: 'block' }}
          />
        </div>
      </div>

      <div className="text-center">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Live Preview</p>
        <p className="text-[10px] text-muted-foreground/60 mt-1">Updates in real-time as you edit</p>
      </div>
    </div>
  );
}
