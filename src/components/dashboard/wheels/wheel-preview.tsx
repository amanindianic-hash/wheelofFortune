'use client';

import { UniversalWheelRenderer } from '@/components/shared/universal-wheel-renderer';
import type { WheelSegment, WheelConfig, WheelBranding } from '@/lib/utils/wheel-renderer';

interface WheelPreviewProps {
  segments: WheelSegment[];
  config: WheelConfig;
  branding: WheelBranding;
  rotation?: number;
}

export function WheelPreview({ segments, config, branding, rotation = 0 }: WheelPreviewProps) {
  // ── STEP 5.5: FINAL RENDER INPUT ───────────────────────────────────────
  console.log('[FINAL RENDER INPUT] WheelPreview:', { segments: segments.length, branding, config });

  return (
    <div className="flex flex-col items-center justify-center gap-6 w-full py-4 overflow-visible">
      <div className="w-full max-w-[440px] aspect-square relative overflow-visible flex items-center justify-center">
        <UniversalWheelRenderer
          segments={segments}
          config={config}
          branding={branding}
          rotation={rotation}
          className="z-10"
        />
      </div>

      <div className="text-center">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Live Preview</p>
        <p className="text-[10px] text-muted-foreground/60 mt-1">Updates in real-time as you edit</p>
      </div>
    </div>
  );
}
