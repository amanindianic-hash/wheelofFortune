'use client';

import React, { useState } from 'react';
import { BookMarked } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeDialog } from '@/components/theme-dialog';
import { toast } from 'sonner';
import { WHEEL_TEMPLATES } from '@/lib/wheel-templates';
import { applyTemplateToWheel, BRANDING_RESET_BASE } from '@/lib/utils/theme-utils';
import type { Wheel, Segment } from '@/lib/types';

interface TemplatesTabProps {
  wheel: Wheel;
  segments: Segment[];
  savedThemes: any[];
  appliedTheme: { id: string; name: string; emoji: string; type: string } | null;
  setWheel: (wheel: Wheel) => void;
  setSegments: (segments: Segment[]) => void;
  setAppliedTheme: (theme: any) => void;
  saveCurrentAsTheme: () => void;
  savingTheme: boolean;
}

export function TemplatesTab({
  wheel,
  segments,
  savedThemes,
  appliedTheme,
  setWheel,
  setSegments,
  setAppliedTheme,
  saveCurrentAsTheme,
  savingTheme
}: TemplatesTabProps) {
  const [themeDialogOpen, setThemeDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <BookMarked className="w-4 h-4 text-violet-400" />
            Instant Styling
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-md">
            Apply a template to instantly change colors, style, and branding. Your segment labels and prizes are preserved.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="shrink-0 border-white/10 bg-white/5 hover:bg-white/10 text-white gap-2 h-9"
          onClick={() => setThemeDialogOpen(true)}
        >
          <BookMarked className="w-3.5 h-3.5" />
          Theme Manager
        </Button>
      </div>

      <ThemeDialog
        open={themeDialogOpen}
        onOpenChange={setThemeDialogOpen}
        gametype={wheel?.config?.game_type ?? 'wheel'}
        onApplyPreset={(presetConfig) => {
          if (wheel && presetConfig?.colorPalette) {
            const palette = presetConfig.colorPalette;
            const newSegments = segments.map((seg) => ({
              ...seg,
              bg_color: palette.primary || seg.bg_color,
              text_color: palette.foreground || seg.text_color,
            }));
            setSegments(newSegments);
            setWheel({
              ...wheel,
              branding: {
                ...wheel.branding,
                primary_color: palette.primary,
                secondary_color: palette.secondary,
                background_type: 'solid',
                background_value: palette.background,
                outer_ring_color: palette.accent,
                border_color: palette.border,
              },
              config: { ...wheel.config, ...presetConfig },
            });
            setThemeDialogOpen(false);
          }
        }}
        onSaveTheme={saveCurrentAsTheme}
        saving={savingTheme}
      />

      {appliedTheme && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-violet-600/10 border border-violet-500/20 shadow-[0_0_20px_rgba(124,58,237,0.1)]">
          <div className="h-10 w-10 shrink-0 rounded-lg bg-violet-600/20 flex items-center justify-center text-xl">
            {appliedTheme.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-violet-400 uppercase tracking-widest mb-0.5">Active Perspective</p>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">{appliedTheme.name}</span>
              <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-muted-foreground uppercase font-semibold">
                {appliedTheme.type}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-muted-foreground hover:text-white hover:bg-white/5"
            onClick={() => setAppliedTheme(null)}
          >
            Clear
          </Button>
        </div>
      )}

      {(() => {
        const currentGameType = wheel.config.game_type ?? 'wheel';
        const filteredThemes = savedThemes.filter((t) => (t.config?.game_type ?? 'wheel') === currentGameType);
        return filteredThemes.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <p className="text-[10px] font-black text-violet-400 uppercase tracking-[0.2em] shrink-0">Your Neural Presets</p>
              <div className="flex-1 h-px bg-white/5" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredThemes.map((theme) => (
                <div key={theme.id} className={`glass-panel group relative overflow-hidden transition-all hover:border-violet-500/40 cursor-pointer flex flex-col ${appliedTheme?.id === theme.id ? 'border-violet-500/50 shadow-[0_0_30px_rgba(124,58,237,0.15)] ring-1 ring-violet-500/20' : ''}`}>
                  <div className="p-4 flex-1 space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 shrink-0 rounded-xl bg-white/5 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                        {theme.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-white text-sm uppercase tracking-tight truncate">{theme.name}</p>
                        <p className="text-[10px] text-muted-foreground/40 font-black uppercase mt-1 tracking-widest">Vault ID: {theme.id.slice(0, 8)}</p>
                      </div>
                    </div>
                    {theme.segment_palette.length > 0 && (
                      <div className="flex gap-1.5 p-1.5 bg-black/40 rounded-xl w-fit border border-white/5">
                        {theme.segment_palette.slice(0, 8).map((c: any, i: number) => (
                          <div key={i} className="w-5 h-5 rounded-md shadow-sm ring-1 ring-white/10"
                            style={{ backgroundColor: c.bg_color === 'transparent' ? '#333' : c.bg_color }} />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="p-2 bg-white/[0.02] border-t border-white/5">
                    <Button
                      size="sm"
                      variant={appliedTheme?.id === theme.id ? 'default' : 'ghost'}
                      className={`w-full text-[10px] font-black uppercase tracking-widest h-9 rounded-xl transition-all ${appliedTheme?.id === theme.id ? 'bg-violet-600 text-white shadow-[0_0_15px_rgba(124,58,237,0.3)]' : 'text-muted-foreground hover:text-white hover:bg-violet-600'}`}
                      onClick={() => {
                        const tb = theme.branding as Record<string, any>;
                        const safeConfig = { ...wheel.config, ...theme.config, applied_theme_id: theme.id };
                        setWheel({
                          ...wheel,
                          config: safeConfig,
                          branding: {
                            ...BRANDING_RESET_BASE,
                            ...theme.branding,
                            premium_face_url: tb.premium_face_url ?? null,
                            premium_stand_url: tb.premium_stand_url ?? null,
                          },
                        });
                        if (theme.segment_palette?.length > 0) {
                          const paletteCount = theme.segment_palette.length;
                          setSegments(segments.map((seg, i) => {
                            const p = theme.segment_palette[i % paletteCount];
                            const bgColor = p.background?.color || p.bg_color || '#7c3aed';
                            const bgImage = p.background?.imageUrl || p.segment_image_url || p.image_url || null;
                            return { ...seg, bg_color: bgColor, segment_image_url: bgImage, text_color: p.text_color, icon_url: p.icon_url || null };
                          }));
                          setAppliedTheme({ id: theme.id, name: theme.name, emoji: theme.emoji, type: 'custom' });
                          toast.success(`"${theme.name}" applied`);
                        }
                      }}
                    >
                      {appliedTheme?.id === theme.id ? 'Currently Active' : 'Apply Neural Preset'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null;
      })()}

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest shrink-0">System Architectures</p>
          <div className="flex-1 h-px bg-white/5" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {WHEEL_TEMPLATES.filter((tpl) => tpl.gameType === (wheel.config.game_type ?? 'wheel')).map((tpl) => (
            <div key={tpl.id} className="glass-panel group relative overflow-hidden transition-all hover:border-violet-500/40 cursor-pointer flex flex-col">
              <div className="p-4 flex-1 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 shrink-0 rounded-xl bg-white/5 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    {tpl.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-sm truncate">{tpl.name}</p>
                    <p className="text-[10px] text-muted-foreground/60 font-medium leading-tight mt-1 line-clamp-2">{tpl.description}</p>
                  </div>
                </div>
                <div className="flex gap-1.5 p-1 bg-black/20 rounded-lg w-fit">
                  {tpl.segmentPalette.slice(0, 8).map((c, i) => (
                    <div key={i} className="w-5 h-5 rounded-md shadow-sm ring-1 ring-white/10" style={{ backgroundColor: c.bg_color }} />
                  ))}
                </div>
              </div>
              <div className="p-2 bg-white/[0.02] border-t border-white/5">
                <Button
                  size="sm"
                  variant={appliedTheme?.id === tpl.id ? 'default' : 'ghost'}
                  className={`w-full text-xs font-bold h-9 rounded-lg transition-all ${appliedTheme?.id === tpl.id ? 'bg-violet-600 text-white shadow-[0_0_15px_rgba(124,58,237,0.3)]' : 'text-muted-foreground hover:text-white hover:bg-violet-600'}`}
                  onClick={() => {
                    const { newConfig, newBranding, newSegments } = applyTemplateToWheel(tpl);
                    setWheel({ ...wheel, config: newConfig, branding: newBranding });
                    setSegments(newSegments);
                    setAppliedTheme({ id: tpl.id, name: tpl.name, emoji: tpl.emoji, type: 'system' });
                    toast.success(`"${tpl.name}" applied`);
                  }}
                >
                  {appliedTheme?.id === tpl.id ? 'Currently Active' : 'Apply Architecture'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
