'use client';

import React from 'react';

interface SliderProps {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
}

interface RelativeSliderProps extends SliderProps {
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

export function RelativeSlider({ 
  label, 
  value, 
  min = -0.5, 
  max = 0.5, 
  step = 0.01, 
  unit = '', 
  onChange 
}: RelativeSliderProps) {
  const v = value ?? 0;
  const range = max - min;
  const pct = ((v - min) / range) * 100;
  
  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between gap-1">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</span>
        <div className="flex items-center gap-0.5">
          <button 
            type="button" 
            onClick={() => onChange(Math.max(min, v - step))}
            className="w-4 h-4 text-[10px] rounded border border-border/50 flex items-center justify-center hover:bg-accent"
          >
            −
          </button>
          <span className="text-[10px] font-mono w-9 text-center tabular-nums">
            {v.toFixed(step < 0.1 ? 2 : 1)}{unit}
          </span>
          <button 
            type="button" 
            onClick={() => onChange(Math.min(max, v + step))}
            className="w-4 h-4 text-[10px] rounded border border-border/50 flex items-center justify-center hover:bg-accent"
          >
            +
          </button>
        </div>
      </div>
      <input 
        type="range" 
        min={min} 
        max={max} 
        step={step} 
        value={v}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1 rounded-full appearance-none cursor-pointer accent-violet-500"
        style={{ background: `linear-gradient(to right, oklch(0.55 0.22 264) ${pct}%, oklch(1 0 0 / 10%) ${pct}%)` }}
      />
    </div>
  );
}

export function AngleSlider({ label, value, onChange }: SliderProps) {
  const v = value ?? 0;
  const pct = ((v + 180) / 360) * 100;
  
  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between gap-1">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</span>
        <div className="flex items-center gap-0.5">
          <button 
            type="button" 
            onClick={() => onChange(Math.max(-180, v - 1))}
            className="w-4 h-4 text-[10px] rounded border border-border/50 flex items-center justify-center hover:bg-accent"
          >
            −
          </button>
          <span className="text-[10px] font-mono w-8 text-center tabular-nums">{v}°</span>
          <button 
            type="button" 
            onClick={() => onChange(Math.min(180, v + 1))}
            className="w-4 h-4 text-[10px] rounded border border-border/50 flex items-center justify-center hover:bg-accent"
          >
            +
          </button>
        </div>
      </div>
      <input 
        type="range" 
        min={-180} 
        max={180} 
        step={1} 
        value={v}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1 rounded-full appearance-none cursor-pointer accent-orange-500"
        style={{ background: `linear-gradient(to right, oklch(0.65 0.18 55) ${pct}%, oklch(1 0 0 / 10%) ${pct}%)` }}
      />
    </div>
  );
}
