'use client';

import React, { memo } from 'react';
import { 
  Zap, Lock, X, Share2, ImageIcon 
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { RGBAPicker } from '@/components/dashboard/wheels/rgba-picker';
import { RelativeSlider, AngleSlider } from './sliders';
import { isTransparent } from '@/lib/utils/segment-utils';
import type { Wheel, Segment, Prize } from '@/lib/types';

interface SegmentsTabProps {
  wheel: Wheel;
  segments: Segment[];
  prizes: Prize[];
  isSegmentLocked: boolean;
  addSegment: () => void;
  removeSegment: (idx: number) => void;
  updateSegment: (idx: number, field: string, value: any) => void;
  applyOffsetsToAll: (idx: number) => void;
}

const SegmentRow = memo(({ 
  seg, 
  idx, 
  isSegmentLocked, 
  premiumMode,
  prizes, 
  onRemove, 
  onUpdate, 
  onPropagate 
}: { 
  seg: Segment; 
  idx: number; 
  isSegmentLocked: boolean; 
  premiumMode: boolean;
  prizes: Prize[];
  onRemove: (idx: number) => void;
  onUpdate: (idx: number, field: string, value: any) => void;
  onPropagate: (idx: number) => void;
}) => {
  return (
    <div className="glass-panel group relative overflow-hidden transition-all duration-300 hover:border-white/10 hover:shadow-xl">
      <div className="p-5 space-y-5">
        <div className="flex items-center gap-4">
          <div className="relative h-12 w-12 shrink-0">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 to-transparent blur-sm group-hover:blur-md transition-all" />
            <div 
              className="relative h-full w-full rounded-2xl border-2 border-white/20 shadow-lg flex items-center justify-center overflow-hidden"
              style={{ backgroundColor: isTransparent(seg.bg_color) ? undefined : seg.bg_color }}
            >
              {isTransparent(seg.bg_color) && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
                  <span className="text-[8px] text-zinc-500 font-black rotate-45">ALPHA</span>
                </div>
              )}
              <span className="text-xs font-black text-white/40 drop-shadow-sm">{idx + 1}</span>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest pl-0.5">Label</Label>
              <Input 
                value={seg.label} 
                onChange={(e) => onUpdate(idx, 'label', e.target.value)} 
                className="h-9 bg-white/5 border-white/5 focus:border-violet-500/50 text-sm font-medium transition-all" 
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest pl-0.5">Weight Index</Label>
              <Input 
                type="number" min="0.0001" step="0.5" 
                value={seg.weight}
                onChange={(e) => onUpdate(idx, 'weight', parseFloat(e.target.value) || 1)}
                className="h-9 bg-white/5 border-white/5 focus:border-violet-500/50 text-sm font-bold tabular-nums transition-all" 
              />
            </div>
          </div>

          <button
            onClick={() => !isSegmentLocked && onRemove(idx)}
            className={`shrink-0 flex items-center justify-center h-8 w-8 rounded-lg transition-all ${
              isSegmentLocked 
                ? 'text-white/10 cursor-not-allowed' 
                : 'text-zinc-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20'
            }`}
          >
            {isSegmentLocked ? <Lock className="w-3.5 h-3.5" /> : <X className="w-4 h-4" />}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest pl-0.5">Surface Texture URL</Label>
            <Input
              type="url"
              placeholder="https://..."
              value={seg.background?.imageUrl || seg.segment_image_url || ''}
              onChange={(e) => onUpdate(idx, 'segment_image_url', e.target.value || null)}
              className="h-8 bg-white/5 border-white/5 text-xs text-violet-300 font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest pl-0.5">Asset Overlay URL</Label>
            <Input
              type="url"
              placeholder="https://..."
              value={seg.icon_url ?? ''}
              onChange={(e) => onUpdate(idx, 'icon_url', e.target.value || null)}
              className="h-8 bg-white/5 border-white/5 text-xs text-violet-300 font-mono"
            />
          </div>
        </div>

        {/* Control Panel Bento */}
        <div className="rounded-2xl border border-white/5 bg-black/40 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-violet-400/80 uppercase tracking-[0.2em] flex items-center gap-1.5 pr-2">
               Coordinate Mapping
            </span>
            <button 
              type="button" onClick={() => onPropagate(idx)}
              className="flex items-center gap-1.5 text-[10px] font-bold text-white/40 hover:text-white hover:bg-white/5 px-3 py-1 rounded-full border border-white/5 transition-all"
            >
              Propagate All
              <Share2 className="h-3 w-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <div className="space-y-4">
               <div className="label-caps text-[9px] text-muted-foreground/50 border-b border-white/5 pb-1">Primary Label</div>
               <RelativeSlider label="Radial Depth" value={seg.label_radial_offset ?? null} min={0} max={1}
                 onChange={(v) => onUpdate(idx, 'label_radial_offset', v)} />
               <RelativeSlider label="Lateral Shift" value={seg.label_tangential_offset ?? null}
                 onChange={(v) => onUpdate(idx, 'label_tangential_offset', v)} />
               <div className="grid grid-cols-2 gap-4">
                 <RelativeSlider label="Scaling" value={seg.label_font_scale ?? null} min={0.02} max={0.2} step={0.005}
                   onChange={(v) => onUpdate(idx, 'label_font_scale', v)} />
                 <AngleSlider label="Rotation" value={seg.label_rotation_angle ?? null}
                   onChange={(v) => onUpdate(idx, 'label_rotation_angle', v)} />
               </div>
            </div>

            <div className={`space-y-4 ${!seg.icon_url && 'opacity-20 pointer-events-none'}`}>
               <div className="label-caps text-[9px] text-muted-foreground/50 border-b border-white/5 pb-1">Asset Mapping</div>
               <RelativeSlider label="Radial Depth" value={seg.icon_radial_offset ?? null} min={0} max={1}
                 onChange={(v) => onUpdate(idx, 'icon_radial_offset', v)} />
               <RelativeSlider label="Lateral Shift" value={seg.icon_tangential_offset ?? null}
                 onChange={(v) => onUpdate(idx, 'icon_tangential_offset', v)} />
               <div className="grid grid-cols-1 gap-4">
                 <AngleSlider label="Rotation" value={seg.icon_rotation_angle ?? null}
                   onChange={(v) => onUpdate(idx, 'icon_rotation_angle', v)} />
               </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 pt-2">
          {!premiumMode && (
            <div className="flex-1 min-w-[140px] space-y-1.5">
              <Label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest pl-0.5">Base Color</Label>
              <RGBAPicker
                value={seg.bg_color ?? '#7C3AED'}
                onChange={(v) => onUpdate(idx, 'bg_color', v)}
              />
            </div>
          )}
          <div className="flex-1 min-w-[140px] space-y-1.5">
            <Label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest pl-0.5">Text Vector</Label>
            <div className="flex h-9 gap-2 items-center bg-white/5 border border-white/5 rounded-xl px-2 focus-within:border-violet-500/50 transition-all">
              <input type="color"
                value={seg.text_color.startsWith('#') ? seg.text_color : '#FFFFFF'}
                onChange={(e) => onUpdate(idx, 'text_color', e.target.value)}
                className="w-6 h-6 rounded-lg cursor-pointer border-0 bg-transparent shrink-0" />
              <Input 
                value={seg.text_color} 
                onChange={(e) => onUpdate(idx, 'text_color', e.target.value)} 
                className="h-full border-0 bg-transparent text-xs font-mono p-0 focus-visible:ring-0" 
              />
            </div>
          </div>
          <div className="flex-[2] min-w-[200px] space-y-1.5">
            <Label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest pl-0.5">Reward Assignment</Label>
            <Select
              value={seg.prize_id ?? 'no-prize'}
              onValueChange={(v) => {
                const val = v ?? 'no-prize';
                onUpdate(idx, 'prize_id', val === 'no-prize' ? null : val);
                onUpdate(idx, 'is_no_prize', val === 'no-prize');
              }}
            >
              <SelectTrigger className="h-9 bg-white/5 border-white/5 rounded-xl hover:bg-white/10 transition-all text-xs font-medium">
                <SelectValue placeholder="Neutral Segment" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-white/10 text-white">
                <SelectItem value="no-prize" className="text-xs">No Reward</SelectItem>
                {prizes.map((p) => (
                  <SelectItem key={p.id} value={p.id} className="text-xs">{p.display_title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
});

SegmentRow.displayName = 'SegmentRow';

export function SegmentsTab({ 
  wheel, 
  segments, 
  prizes, 
  isSegmentLocked, 
  addSegment, 
  removeSegment, 
  updateSegment,
  applyOffsetsToAll 
}: SegmentsTabProps) {
  return (
    <div className="space-y-4">
      {/* Image-mode notice */}
      {wheel?.branding.premium_face_url && (
        <div className="flex items-start gap-3 rounded-2xl bg-amber-500/5 border border-amber-500/10 p-4 shadow-[0_8px_32px_rgba(245,158,11,0.05)]">
          <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">
            <ImageIcon className="h-4 w-4" />
          </div>
          <div className="text-xs leading-relaxed">
            <span className="font-bold text-amber-200 block mb-0.5">Image Mode Active</span>
            <p className="text-amber-200/60 font-medium">
              The premium wheel PNG provides all face visuals. Labels, colors, and prizes still apply for the logic.
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pb-2">
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            Configuration Matrix
            <Badge variant="outline" className="bg-white/5 border-white/10 text-[10px] h-5 px-1.5 font-bold text-muted-foreground/80">
              {segments.length}/24
            </Badge>
          </h3>
          {isSegmentLocked && (
            <p className="text-[11px] text-amber-400/80 flex items-center gap-1 mt-0.5 font-medium">
              <Lock className="w-3 h-3" />
              Dynamic segments disabled for this theme
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={addSegment}
            disabled={isSegmentLocked}
            className="h-8 border-white/5 bg-white/5 hover:bg-white/10 text-xs font-bold gap-1.5 transition-all outline-none focus:ring-0"
          >
            <Zap className="h-3.5 w-3.5 text-violet-400" />
            New Segment
          </Button>
        </div>
      </div>

      <div className="space-y-4 pb-24">
        {segments.map((seg, idx) => (
          <SegmentRow 
            key={seg.id || idx}
            seg={seg}
            idx={idx}
            isSegmentLocked={isSegmentLocked}
            premiumMode={!!wheel.branding.premium_face_url}
            prizes={prizes}
            onRemove={removeSegment}
            onUpdate={updateSegment}
            onPropagate={applyOffsetsToAll}
          />
        ))}
      </div>
    </div>
  );
}
