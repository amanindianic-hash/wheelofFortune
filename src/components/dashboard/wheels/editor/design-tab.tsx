'use client';

import React from 'react';
import { 
  Zap, Trophy, Palette, Type, Globe, ImageIcon, X, Circle as CircleIcon 
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { RGBAPicker } from '@/components/dashboard/wheels/rgba-picker';
import { RelativeSlider } from './sliders';
import { FONT_OPTIONS } from '@/lib/utils/font-utils';
import { toast } from 'sonner';
import type { Wheel, Segment } from '@/lib/types';

interface DesignTabProps {
  wheel: Wheel;
  setWheel: (wheel: Wheel) => void;
  segments: Segment[];
  setAppliedTheme: (v: null) => void;
}

export function DesignTab({ wheel, setWheel, segments, setAppliedTheme }: DesignTabProps) {
  return (
    <div className="space-y-12 pb-24">
      {/* ── CORE IDENTITY ─────────────────────────────────────────────────── */}
      <section className="glass-panel overflow-hidden border-white/5">
        <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
          <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-2.5">
            <Globe className="h-4 w-4 text-violet-400" />
            Core Identity
          </h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <Label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest pl-0.5">Campaign Identifier</Label>
            <Input 
              value={wheel.name} 
              onChange={(e) => setWheel({ ...wheel, name: e.target.value })}
              className="bg-white/5 border-white/5 focus:border-violet-500/50 font-medium h-11"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest pl-0.5">Neural Engine Protocol</Label>
            <Select
              value={wheel.config.game_type ?? 'wheel'}
              onValueChange={(v) => {
                setWheel({ 
                  ...wheel, 
                  config: { ...wheel.config, game_type: v as any } 
                });
                setAppliedTheme(null);
              }}
            >
              <SelectTrigger className="h-11 bg-white/5 border-white/5 font-medium transition-all focus:border-violet-500/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-white/10">
                <SelectItem value="wheel">🎡 Pure Spin Wheel</SelectItem>
                <SelectItem value="scratch_card">🎴 Haptic Scratch Card</SelectItem>
                <SelectItem value="slot_machine">🎰 Digital Slot Cluster</SelectItem>
                <SelectItem value="roulette">🎰 Linear Roulette</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground/50 italic leading-relaxed">Choose the primary game mechanic.</p>
          </div>
        </div>
      </section>

      {/* ── PHYSICS & DYNAMICS ────────────────────────────────────────────── */}
      <section className="glass-panel overflow-hidden border-white/5">
        <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
          <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-2.5">
            <Zap className="h-4 w-4 text-violet-400" />
            Physics & Dynamics
          </h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest pl-0.5">Spin Duration</Label>
              <div className="relative pt-1">
                <input type="range" min="2000" max="10000" step="500"
                  value={wheel.config.spin_duration_ms ?? 4000}
                  onChange={(e) => setWheel({ ...wheel, config: { ...wheel.config, spin_duration_ms: parseInt(e.target.value) } })} 
                  className="w-full h-1 bg-white/10 rounded-full appearance-none accent-violet-500 cursor-pointer"
                />
                <div className="flex justify-between mt-2 text-[10px] font-bold font-mono text-muted-foreground/50">
                  <span>2s</span>
                  <span className="text-violet-400">{wheel.config.spin_duration_ms ?? 4000}ms</span>
                  <span>10s</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest pl-0.5">Animation Profile</Label>
              <Select value={wheel.config.animation_speed ?? 'medium'}
                onValueChange={(v) => setWheel({ ...wheel, config: { ...wheel.config, animation_speed: v as any } })}>
                <SelectTrigger className="bg-white/5 border-white/5 font-medium transition-all focus:border-violet-500/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-white/10">
                  <SelectItem value="slow">Slow & Cinematic</SelectItem>
                  <SelectItem value="medium">Balanced Response</SelectItem>
                  <SelectItem value="fast">High Velocity</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-5">
            <div className="flex items-center justify-between group p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-violet-500/20 transition-all">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-white">Confetti FX</div>
                <div className="text-[10px] text-muted-foreground/60 font-medium">Particle burst on victory</div>
              </div>
              <Switch checked={wheel.config.confetti_enabled ?? true}
                onCheckedChange={(v) => setWheel({ ...wheel, config: { ...wheel.config, confetti_enabled: v } })} />
            </div>

            <div className="flex items-center justify-between group p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-violet-500/20 transition-all">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-white">Audio Feedback</div>
                <div className="text-[10px] text-muted-foreground/60 font-medium">Mechanical ticker sounds</div>
              </div>
              <Switch checked={wheel.config.sound_enabled ?? false}
                onCheckedChange={(v) => setWheel({ ...wheel, config: { ...wheel.config, sound_enabled: v } })} />
            </div>
          </div>
        </div>
      </section>

      {/* ── PROBABILITY LOGIC ────────────────────────────────────────────── */}
      <section className="glass-panel overflow-hidden border-violet-500/10 bg-violet-500/5">
        <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
          <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-2.5">
            <Trophy className="h-4 w-4 text-violet-400" />
            Probability Logic
          </h3>
          <Badge className="bg-amber-500/10 text-amber-400 border-0 uppercase text-[9px] font-black px-2 py-0.5">Advanced</Badge>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-[11px] text-muted-foreground/80 leading-relaxed max-w-xl">
            Force a specific segment to win every <strong className="text-white">N</strong> plays.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest pl-0.5">Activation Cadence</Label>
              <Input
                type="number"
                min="2"
                placeholder="Disabled"
                value={wheel.config.guaranteed_win_every_n ?? ''}
                onChange={(e) => setWheel({ ...wheel, config: { ...wheel.config, guaranteed_win_every_n: e.target.value ? parseInt(e.target.value) : null } })}
                className="bg-black/20 border-white/5 focus:border-violet-500/50 font-bold text-violet-300"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest pl-0.5">Target Reward Segment</Label>
              <Select
                value={wheel.config.guaranteed_win_segment_id ?? ''}
                onValueChange={(v) => setWheel({ ...wheel, config: { ...wheel.config, guaranteed_win_segment_id: v || null } })}
              >
                <SelectTrigger className="bg-black/20 border-white/5 font-medium transition-all focus:border-violet-500/50">
                  <SelectValue placeholder="Select outcome…" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-white/10">
                  {segments.filter(s => !s.is_no_prize).map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-xs">{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* ── IDENTITY & AESTHETICS ────────────────────────────────────────── */}
      <section className="glass-panel overflow-hidden border-white/5">
        <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
          <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-2.5">
            <Palette className="h-4 w-4 text-violet-400" />
            Identity & Aesthetics
          </h3>
        </div>
        <div className="p-6 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
                <Label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest pl-0.5">Primary Accent Color</Label>
                <RGBAPicker
                  value={wheel.branding.primary_color ?? '#7C3AED'}
                  onChange={(v) => setWheel({ ...wheel, branding: { ...wheel.branding, primary_color: v } })}
                />
            </div>
            <div className="space-y-2">
                <Label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest pl-0.5">Container Background</Label>
                <RGBAPicker
                  value={wheel.branding.background_value ?? '#F3E8FF'}
                  onChange={(v) => setWheel({ ...wheel, branding: { ...wheel.branding, background_value: v } })}
                />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest pl-0.5">CTA Button Directive</Label>
              <Input 
                value={wheel.branding.button_text ?? 'SPIN NOW!'}
                onChange={(e) => setWheel({ ...wheel, branding: { ...wheel.branding, button_text: e.target.value } })} 
                className="bg-white/5 border-white/5 focus:border-violet-500/50 font-black uppercase tracking-wider"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest pl-0.5">Typography Architecture</Label>
              <Select
                value={wheel.branding.font_family ?? 'Inter, sans-serif'}
                onValueChange={(v) => setWheel({ ...wheel, branding: { ...wheel.branding, font_family: v ?? undefined } })}
              >
                <SelectTrigger className="bg-white/5 border-white/5 font-medium transition-all focus:border-violet-500/50">
                  <SelectValue placeholder="Select type system…" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-white/10 max-h-[400px]">
                  {FONT_OPTIONS.map((f) => (
                    <SelectItem key={f.value} value={f.value} className="text-xs">
                      <span style={{ fontFamily: f.value }}>{f.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* ── SURFACE OVERLAYS ─────────────────────────────────────────────── */}
      {(!wheel.config.game_type || wheel.config.game_type === 'wheel') && (
        <section className="glass-panel overflow-hidden border-violet-500/20 bg-violet-600/5">
          <div className="px-6 py-5 border-b border-violet-500/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-violet-500/10 flex items-center justify-center text-violet-400">
                <ImageIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Premium Surface Overlays</h3>
                <p className="text-[10px] text-violet-300/60 font-bold uppercase tracking-tight">Image-Based Rendering Engine</p>
              </div>
            </div>
            <Switch
              checked={!!wheel.branding.premium_face_url}
              onCheckedChange={(enabled) => setWheel({
                ...wheel,
                branding: {
                  ...wheel.branding,
                  premium_face_url:  enabled ? '/assets/premium-wheels/Wheel.png' : null,
                  premium_stand_url: enabled ? '/assets/premium-wheels/Stand.png' : null,
                },
              })}
            />
          </div>

          {!!wheel.branding.premium_face_url && (
            <div className="p-6 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest pl-0.5">Face PNG</Label>
                  <Input
                    value={wheel.branding.premium_face_url ?? ''}
                    onChange={(e) => setWheel({ ...wheel, branding: { ...wheel.branding, premium_face_url: e.target.value || null } })}
                    className="h-10 bg-black/40 border-white/5 font-mono text-xs text-violet-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest pl-0.5">Stand PNG</Label>
                  <Input
                    value={wheel.branding.premium_stand_url ?? ''}
                    onChange={(e) => setWheel({ ...wheel, branding: { ...wheel.branding, premium_stand_url: e.target.value || null } })}
                    className="h-10 bg-black/40 border-white/5 font-mono text-xs text-violet-300"
                  />
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── TYPOGRAPHY SYSTEMS ─────────────────────────────────────────── */}
      {(!wheel.config.game_type || wheel.config.game_type === 'wheel') && (
        <section className="glass-panel overflow-hidden border-white/5">
          <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02]">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2.5">
              <Type className="h-4 w-4 text-violet-400" />
              Typography Systems
            </h3>
          </div>
          <div className="p-6 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest pl-0.5">Scale Override (PX)</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">Neural Auto</span>
                    <Switch
                      checked={wheel.branding.label_font_size == null}
                      onCheckedChange={(v) => setWheel({ ...wheel, branding: { ...wheel.branding, label_font_size: v ? null : 13 } })}
                    />
                  </div>
                </div>
                <Input
                  type="number" min="6" max="32" step="1"
                  disabled={wheel.branding.label_font_size == null}
                  value={wheel.branding.label_font_size ?? ''}
                  placeholder="Auto-calculating..."
                  onChange={(e) => setWheel({ ...wheel, branding: { ...wheel.branding, label_font_size: parseInt(e.target.value) || null } })}
                  className="h-10 bg-white/5 border-white/5 text-sm font-bold text-violet-400 disabled:opacity-30"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest pl-0.5">Vector Density</Label>
                <Select
                  value={wheel.branding.label_font_weight ?? '700'}
                  onValueChange={(v) => setWheel({ ...wheel, branding: { ...wheel.branding, label_font_weight: v as any } })}
                >
                  <SelectTrigger className="h-10 bg-white/5 border-white/5 font-medium transition-all focus:border-violet-500/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-white/10">
                    <SelectItem value="400">Regular (400)</SelectItem>
                    <SelectItem value="600">Medium (600)</SelectItem>
                    <SelectItem value="700">Bold (700)</SelectItem>
                    <SelectItem value="800">Extra (800)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Placement Sliders */}
            <div className="rounded-2xl border border-white/5 bg-black/40 p-5 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                 <div className="space-y-4">
                    <div className="label-caps text-[9px] text-muted-foreground/50 border-b border-white/5 pb-1">Master Label Layout</div>
                    <RelativeSlider label="Vector Scaling" value={wheel.branding.label_font_scale ?? null} min={0.02} max={0.2} step={0.005}
                      onChange={(v) => setWheel({ ...wheel, branding: { ...wheel.branding, label_font_scale: v ?? undefined } })} />
                    <RelativeSlider label="Radial Depth" value={wheel.branding.label_radial_offset ?? null} min={0} max={1}
                      onChange={(v) => setWheel({ ...wheel, branding: { ...wheel.branding, label_radial_offset: v ?? undefined } })} />
                 </div>
                 <div className="space-y-4">
                    <div className="label-caps text-[9px] text-muted-foreground/50 border-b border-white/5 pb-1">Master Asset Layout</div>
                    <RelativeSlider label="Radial Depth" value={wheel.branding.icon_radial_offset ?? null} min={0} max={1}
                      onChange={(v) => setWheel({ ...wheel, branding: { ...wheel.branding, icon_radial_offset: v ?? undefined } })} />
                 </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── VISUAL PERIMETERS ────────────────────────────────────────────── */}
      <section className="glass-panel overflow-hidden border-white/5">
        <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
          <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-2.5">
            <CircleIcon className="h-4 w-4 text-violet-400" />
            Visual Perimeters
          </h3>
          {!!wheel.branding.premium_face_url && (
            <Badge variant="outline" className="text-[9px] font-black text-amber-400 bg-amber-400/5 border-amber-400/20 px-2 py-0.5">DISABLED BY OVERLAY</Badge>
          )}
        </div>
        <div className={`p-6 space-y-8 ${wheel.branding.premium_face_url ? 'opacity-20 pointer-events-none' : ''}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
               <Label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest pl-0.5">Atmospheric Ring</Label>
               <div className="flex gap-4">
                  <div className="flex-1">
                     <RGBAPicker
                        value={wheel.branding.outer_ring_color ?? wheel.branding.primary_color ?? '#7C3AED'}
                        onChange={(v) => setWheel({ ...wheel, branding: { ...wheel.branding, outer_ring_color: v } })}
                     />
                  </div>
                  <div className="w-24 space-y-1.5">
                     <Input
                        type="number"
                        value={wheel.branding.outer_ring_width ?? 20}
                        onChange={(e) => setWheel({ ...wheel, branding: { ...wheel.branding, outer_ring_width: parseInt(e.target.value) || 20 } })}
                        className="h-9 bg-white/5 border-white/5 font-black text-center"
                     />
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
