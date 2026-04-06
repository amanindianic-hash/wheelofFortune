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
      await preloadSegmentImages(segments, config, imageCacheRef.current);
      drawWheel(canvasRef.current, segments, rotation, config, branding, imageCacheRef.current);
    }
    draw();
  }, [segments, config, branding, rotation]);

  const pointerColor = branding.primary_color || '#7C3AED';

  return (
    <div className="flex flex-col items-center justify-center gap-4 bg-muted/30 rounded-xl p-8 border border-dashed border-muted-foreground/20">
      <div className="relative">
        {/* Pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
          <div
            className="w-0 h-0 border-l-[10px] border-r-[10px] border-t-[20px] border-l-transparent border-r-transparent"
            style={{ borderTopColor: pointerColor }}
          />
        </div>

        <canvas
          ref={canvasRef}
          width={360}
          height={360}
          className="rounded-full shadow-lg bg-white"
          style={{
            border: `${branding.border_width ?? 4}px solid ${branding.border_color ?? pointerColor}`,
          }}
        />
      </div>

      <div className="text-center">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Live Preview</p>
        <p className="text-[10px] text-muted-foreground/60 mt-1">Updates in real-time as you edit</p>
      </div>
    </div>
  );
}
