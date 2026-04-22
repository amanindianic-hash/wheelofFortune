'use client';

import { useEffect, useRef, useState } from 'react';
import {
  drawWheel,
  preloadSegmentImages,
  type WheelSegment,
  type WheelConfig,
  type WheelBranding,
  type ImageCache,
} from '@/lib/utils/wheel-renderer';

interface WheelRendererProps {
  segments: WheelSegment[];
  config: WheelConfig;
  branding: WheelBranding;
  rotation?: number;
  className?: string;
  /**
   * Explicit CSS pixel size (width = height).
   * When omitted the component fills its parent container (width: 100%, height: 100%).
   * The parent must then supply explicit dimensions via Tailwind/CSS classes.
   */
  size?: number;
}

/**
 * WheelRenderer — single authoritative component for all wheel canvas rendering.
 *
 * Design principles:
 * - `drawWheel` reads the canvas CSS size via getBoundingClientRect() at draw time,
 *   so the canvas always renders at the correct pixel density regardless of `size`.
 * - A ResizeObserver re-triggers drawing when the container's CSS dimensions change,
 *   giving fully responsive behaviour when `size` is omitted.
 * - The pointer overlay uses an `inset-0` container so CSS `rotate()` always pivots
 *   around the wheel centre without hardcoded pixel values.
 */
export function WheelRenderer({
  segments,
  config,
  branding,
  rotation = 0,
  className = '',
  size,
}: WheelRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageCacheRef = useRef<ImageCache>(new Map());
  const [isReady, setIsReady] = useState(false);
  const [loadTrigger, setLoadTrigger] = useState(0);

  // ── 1. Preload images whenever segments / branding changes ────────────────
  useEffect(() => {
    let active = true;
    async function preload() {
      await preloadSegmentImages(segments, config, branding, imageCacheRef.current);
      if (active) {
        setIsReady(true);
        setLoadTrigger(t => t + 1);
      }
    }
    preload();
    return () => { active = false; };
  }, [segments, config, branding]);

  // ── 2. Draw whenever props or readiness change ────────────────────────────
  useEffect(() => {
    if (!canvasRef.current || !isReady) return;
    // ── STEP 6: RENDER INPUT ──────────────────────────────────────────────
    console.log('STEP 6 RENDER INPUT (Universal Renderer):', {
      segmentCount: segments.length,
      branding: {
        primary: branding.primary_color,
        face_url: branding.premium_face_url,
        outer_ring_width: branding.outer_ring_width,
      },
      firstSegment: segments[0] ? {
        label: segments[0].label,
        lro: (segments[0] as any).label_radial_offset,
        bg: (segments[0] as any).bg_color || segments[0].background?.color,
        icon: (segments[0] as any).icon_url
      } : null,
      centerLogo: (branding as any).centerLogo || (branding as any).center_logo
    });
    drawWheel(canvasRef.current, segments, rotation, config, branding, imageCacheRef.current);
  }, [segments, config, branding, rotation, isReady, loadTrigger]);

  // ── 3. Re-draw on container resize (responsive mode) ─────────────────────
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(() => {
      if (canvasRef.current && isReady) {
        drawWheel(canvasRef.current, segments, rotation, config, branding, imageCacheRef.current);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [segments, config, branding, rotation, isReady]);

  // ── Pointer ───────────────────────────────────────────────────────────────
  const pointerColor = branding.pointer_color || branding.primary_color || '#7C3AED';
  const pointerPos = config.pointer_position ?? 'top';
  const pointerRotation =
    pointerPos === 'right' ? 90
    : pointerPos === 'bottom' ? 180
    : pointerPos === 'left' ? 270
    : 0;

  // Container dimensions: explicit size OR 100% fill
  const containerStyle: React.CSSProperties = size != null
    ? { width: size, height: size }
    : { width: '100%', height: '100%' };

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={{
        width: '100%',
        aspectRatio: '1 / 1',
        overflow: 'visible',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...containerStyle
      }}
    >
      {/*
        Pointer overlay.
        Uses absolute inset-0 so the div covers the full wheel area.
        CSS transform: rotate() with the default transformOrigin (50% 50%) therefore
        always pivots around the wheel centre — no hardcoded pixel values needed.
      */}
      <div
        className="absolute inset-0 z-20 pointer-events-none flex flex-col items-center"
        style={{ transform: `rotate(${pointerRotation}deg)` }}
      >
        {branding.premium_pointer_url ? (
          <img
            src={branding.premium_pointer_url}
            className="w-full h-full object-contain"
            alt="Pointer"
          />
        ) : (
          <>
            {/* Base Mount */}
            <div className="w-8 h-4 bg-gradient-to-b from-[#f8f9fa] to-[#d1d5db] rounded-t-md shadow-sm border border-b-0 border-black/10 relative z-10" />
            {/* Arrow */}
            <div className="relative -mt-0.5 drop-shadow-xl filter">
              <svg width="28" height="38" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M16 38L2 14V2C2 2 12 4 16 4C20 4 30 2 30 2V14L16 38Z"
                  fill={pointerColor}
                  stroke="rgba(255,255,255,0.6)"
                  strokeWidth="2"
                />
                <path
                  d="M16 34L4 15V5C7 6.5 11 7.5 16 7.5C21 7.5 25 6.5 28 5V15L16 34Z"
                  fill="url(#arrow-grad-wr)"
                />
                <defs>
                  <linearGradient id="arrow-grad-wr" x1="16" y1="5" x2="16" y2="34" gradientUnits="userSpaceOnUse">
                    <stop stopColor="white" stopOpacity="0.3" />
                    <stop offset="1" stopColor="black" stopOpacity="0.25" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </>
        )}
      </div>

      {/*
        Canvas.
        The HTML width/height attributes are used only as a DPR fallback by drawWheel
        when getBoundingClientRect() hasn't resolved yet (first paint edge case).
        The CSS width/height (100% × 100%) ensures it fills the container.
      */}
      <canvas
        ref={canvasRef}
        width={size ?? 360}
        height={size ?? 360}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          display: 'block',
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }}
      />

      {/* Loading spinner shown until all images are preloaded */}
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/5 rounded-full backdrop-blur-sm">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

// Backward-compatibility alias — all existing imports of UniversalWheelRenderer keep working
export const UniversalWheelRenderer = WheelRenderer;
