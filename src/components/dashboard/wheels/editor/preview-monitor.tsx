'use client';

import React, { memo } from 'react';
import { Save, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WheelPreview } from '@/components/dashboard/wheels/wheel-preview';
import { ScratchPreview } from '@/components/dashboard/wheels/scratch-preview';
import { SlotPreview } from '@/components/dashboard/wheels/slot-preview';
import { RoulettePreview } from '@/components/dashboard/wheels/roulette-preview';
import { getFinalVisualConfig } from '@/lib/utils/theme-utils';
import { WHEEL_TEMPLATES } from '@/lib/wheel-templates';
import type { Wheel, Segment, WheelSegment } from '@/lib/types';

interface PreviewMonitorProps {
  wheel: Wheel;
  segments: Segment[];
  appliedTheme: { id: string; type: string } | null;
  savedThemes: any[];
  saving: boolean;
  saveWheel: () => void;
  saveSegments: () => void;
}

export const PreviewMonitor = memo(({
  wheel,
  segments,
  appliedTheme,
  savedThemes,
  saving,
  saveWheel,
  saveSegments
}: PreviewMonitorProps) => {
  const activeTemplateObj =
    appliedTheme?.id
      ? (WHEEL_TEMPLATES.find(t => t.id === appliedTheme.id)
          ?? savedThemes.find((t: any) => t.id === appliedTheme.id)
          ?? null)
      : null;

  const { branding: finalBranding, config: finalConfig, segments: resolvedSegments } = getFinalVisualConfig(
    { ...wheel, segments },
    activeTemplateObj as any
  );

  const renderPreview = () => {
    const key = finalConfig.applied_theme_id ?? 'default';
    const sharedProps = {
        segments: resolvedSegments as unknown as WheelSegment[],
        branding: finalBranding,
        config: finalConfig
    };

    switch (finalConfig.game_type) {
      case 'scratch_card':
        return <ScratchPreview key={key} {...sharedProps} />;
      case 'slot_machine':
        return <SlotPreview key={key} {...sharedProps} />;
      case 'roulette':
        return <RoulettePreview key={key} {...sharedProps} />;
      default:
        return <WheelPreview key={key} {...sharedProps} />;
    }
  };

  return (
    <div className="sticky top-24 space-y-6">
      <div className="glass-panel border-white/5 shadow-2xl relative overflow-hidden group">
        {/* Monitor Chrome */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/5">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-[#ff5f57]" />
            <div className="h-2 w-2 rounded-full bg-[#ffbd2e]" />
            <div className="h-2 w-2 rounded-full bg-[#27c93f]" />
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest leading-none">Live Monitor</span>
          </div>
        </div>
        
        <div className="p-6">
          {renderPreview()}

          <div className="mt-8 pt-6 border-t border-white/5">
            <Button
              className="w-full font-bold h-11 bg-white text-black hover:bg-zinc-200 transition-all rounded-xl shadow-[0_0_30px_rgba(255,255,255,0.15)] gap-2"
              onClick={() => { saveWheel(); saveSegments(); }}
              disabled={saving}
            >
              <Save className="w-4 h-4" />
              {saving ? 'Syncing...' : 'Save Changes'}
            </Button>
            <p className="text-[10px] text-center text-muted-foreground/40 mt-3 font-medium uppercase tracking-tighter">
              Last synced {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      </div>

      {/* Pro-Tips Bento */}
      <div className="glass-panel p-5 border-violet-500/10 bg-violet-500/5 hover:bg-violet-500/10 transition-colors group">
        <div className="flex gap-4">
          <div className="h-10 w-10 shrink-0 rounded-2xl bg-violet-500/20 flex items-center justify-center text-violet-400 group-hover:scale-110 transition-transform">
            <Lightbulb className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white mb-1">Performance Insight</h4>
            <p className="text-xs text-muted-foreground/80 leading-relaxed">
              Campaigns with 8–12 segments consistently show **24% higher engagement** on mobile devices.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

PreviewMonitor.displayName = 'PreviewMonitor';
