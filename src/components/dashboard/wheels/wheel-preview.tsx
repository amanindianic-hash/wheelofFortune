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
  return (
    <div className="flex flex-col items-center justify-center gap-4 bg-muted/30 rounded-xl p-8 border border-dashed border-muted-foreground/20">
      <div className="relative isolate pt-4">
        <div 
          className="rounded-full shadow-2xl z-10"
          style={{
            background:
              branding.background_value &&
              branding.background_value !== 'rgba(0, 0, 0, 0)'
                ? branding.background_value
                : 'transparent',
          }}
        >
          <UniversalWheelRenderer
            segments={segments}
            config={config}
            branding={branding}
            rotation={rotation}
            size={360}
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
