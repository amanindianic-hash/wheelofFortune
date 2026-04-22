'use client';

import React from 'react';
import { 
  Layers, Zap, Trophy, X 
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import type { Wheel, Segment } from '@/lib/types';

interface SettingsTabProps {
  wheel: Wheel;
  segments: Segment[];
  setWheel: (wheel: Wheel) => void;
  setAppliedTheme: (theme: any) => void;
}

export function SettingsTab({
  wheel,
  segments,
  setWheel,
  setAppliedTheme
}: SettingsTabProps) {
  return (
    <div className="space-y-6">
      <section className="glass-panel overflow-hidden border-white/5">
        <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2.5">
            <Layers className="h-4 w-4 text-violet-400" />
            Internal Metadata
          </h3>
        </div>
        <div className="p-6 space-y-6">
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
                setWheel({ ...wheel, config: { ...wheel.config, game_type: v as any } });
                setAppliedTheme(null);
              }}
            >
              <SelectTrigger className="h-11 bg-white/5 border-white/5 font-medium transition-all focus:border-violet-500/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-white/10 text-white">
                <SelectItem value="wheel">🎡 Pure Spin Wheel</SelectItem>
                <SelectItem value="scratch_card">🎴 Haptic Scratch Card</SelectItem>
                <SelectItem value="slot_machine">🎰 Digital Slot Cluster</SelectItem>
                <SelectItem value="roulette">🎰 Linear Roulette</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground/50 italic leading-relaxed">Choose the primary game mechanic. Switching protocols will reset custom theme weights.</p>
          </div>
        </div>
      </section>

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
                <SelectContent className="bg-zinc-900 border-white/10 text-white">
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

            {wheel.config.sound_enabled && (
              <div className="space-y-2 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <Label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest pl-0.5">Sound Source URL</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="url"
                    placeholder="https://..."
                    value={wheel.config.sound_url ?? ''}
                    onChange={(e) => setWheel({ ...wheel, config: { ...wheel.config, sound_url: e.target.value || null } })}
                    className="h-9 bg-white/5 border-white/5 text-xs font-mono"
                  />
                  <label className="cursor-pointer shrink-0 h-9 px-4 flex items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-tighter hover:bg-white/10 transition-all">
                    UPLOAD
                    <input
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const url = URL.createObjectURL(file);
                          setWheel({ ...wheel, config: { ...wheel.config, sound_url: url } });
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

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
              <Label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest pl-0.5">Activation Cadence (Every Nth)</Label>
              <Input
                type="number"
                min="2"
                max="1000"
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
                <SelectTrigger className="bg-black/20 border-white/5 font-medium transition-all focus:border-violet-500/50 text-white">
                  <SelectValue placeholder="Select outcome…" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-white/10 text-white">
                  {segments.filter(s => !s.is_no_prize).map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-xs">{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>
      <div className="pb-24" />
    </div>
  );
}
