'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Upload, Play, Pause, Copy, Check, RotateCcw,
  ImageIcon, Info, Wand2, Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  drawWheel, preloadSegmentImages,
  type WheelSegment, type WheelConfig, type WheelBranding, type ImageCache,
} from '@/lib/utils/wheel-renderer';

// ── Sample segments shown in the live preview ──────────────────────────────
const PREVIEW_SEGMENTS: WheelSegment[] = [
  { id: '1', position: 0, label: '10% OFF',   bg_color: '#7C3AED', text_color: '#FFFFFF', weight: 1, is_no_prize: false },
  { id: '2', position: 1, label: 'FREE GIFT', bg_color: '#6D28D9', text_color: '#FFFFFF', weight: 1, is_no_prize: false },
  { id: '3', position: 2, label: '20% OFF',   bg_color: '#7C3AED', text_color: '#FFFFFF', weight: 1, is_no_prize: false },
  { id: '4', position: 3, label: 'TRY AGAIN', bg_color: '#5B21B6', text_color: '#FFFFFF', weight: 1, is_no_prize: false },
  { id: '5', position: 4, label: 'JACKPOT',   bg_color: '#7C3AED', text_color: '#FFFFFF', weight: 1, is_no_prize: false },
  { id: '6', position: 5, label: '5% OFF',    bg_color: '#6D28D9', text_color: '#FFFFFF', weight: 1, is_no_prize: false },
  { id: '7', position: 6, label: 'BONUS',     bg_color: '#7C3AED', text_color: '#FFFFFF', weight: 1, is_no_prize: false },
  { id: '8', position: 7, label: '50% OFF',   bg_color: '#5B21B6', text_color: '#FFFFFF', weight: 1, is_no_prize: false },
];

const BASE_CONFIG: WheelConfig = {
  spin_duration_ms: 4000,
  show_segment_labels: true,
  label_rotation: 'radial',
};

interface ImageInfo {
  name: string;
  width: number;
  height: number;
  size: string;
  url: string;
}

// ── Spinning Canvas ─────────────────────────────────────────────────────────
function SpinningCanvas({
  segments, config, branding, isSpinning, spinSpeed, cacheKey,
}: {
  segments: WheelSegment[];
  config: WheelConfig;
  branding: WheelBranding;
  isSpinning: boolean;
  spinSpeed: number;
  cacheKey: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cacheRef  = useRef<ImageCache>(new Map());
  const rotRef    = useRef(0);
  const rafRef    = useRef<number>(0);
  const runRef    = useRef(true);
  const brandRef  = useRef(branding);
  const spinRef   = useRef(isSpinning);
  const speedRef  = useRef(spinSpeed);

  // Keep refs in sync without restarting the loop
  useEffect(() => { brandRef.current = branding; }, [branding]);
  useEffect(() => { spinRef.current  = isSpinning; }, [isSpinning]);
  useEffect(() => { speedRef.current = spinSpeed; }, [spinSpeed]);

  // Restart loop when segments, config, or image URLs change
  useEffect(() => {
    runRef.current = false;
    cancelAnimationFrame(rafRef.current);
    cacheRef.current = new Map(); // clear cache so new images load fresh

    runRef.current = true;
    let loaded = false;

    preloadSegmentImages(segments, config, branding, cacheRef.current).then(() => {
      if (!runRef.current) return;
      loaded = true;

      function tick() {
        if (!runRef.current) return;
        if (spinRef.current) {
          rotRef.current += (speedRef.current / 1000) * (2 * Math.PI / 60);
        }
        if (canvasRef.current) {
          drawWheel(canvasRef.current, segments, rotRef.current, config, brandRef.current, cacheRef.current);
        }
        rafRef.current = requestAnimationFrame(tick);
      }
      tick();
    });

    return () => {
      runRef.current = false;
      cancelAnimationFrame(rafRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, segments, config]);

  const pointerColor = branding.primary_color || '#7C3AED';

  return (
    <div className="relative isolate pt-5 flex flex-col items-center">
      {/* Pointer */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
        <div className="w-8 h-4 bg-gradient-to-b from-[#f8f9fa] to-[#d1d5db] rounded-t-md shadow-sm border border-b-0 border-black/10" />
        <div className="relative -mt-0.5 drop-shadow-xl">
          <svg width="28" height="38" viewBox="0 0 32 40" fill="none">
            <path d="M16 38L2 14V2C2 2 12 4 16 4C20 4 30 2 30 2V14L16 38Z"
              fill={pointerColor} stroke="rgba(255,255,255,0.6)" strokeWidth="2" />
            <path d="M16 34L4 15V5C7 6.5 11 7.5 16 7.5C21 7.5 25 6.5 28 5V15L16 34Z"
              fill="url(#tester-grad)" />
            <defs>
              <linearGradient id="tester-grad" x1="16" y1="5" x2="16" y2="34" gradientUnits="userSpaceOnUse">
                <stop stopColor="white" stopOpacity="0.3" />
                <stop offset="1" stopColor="black" stopOpacity="0.25" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={720}
        height={720}
        className="rounded-full shadow-2xl bg-transparent w-[360px] h-[360px]"
      />
    </div>
  );
}

// ── Slider control (no external dep) ───────────────────────────────────────
function SliderRow({
  label, value, min, max, step, unit = '', onChange,
}: {
  label: string; value: number; min: number; max: number; step: number; unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <span className="text-xs font-mono font-semibold text-foreground tabular-nums">
          {value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-violet-500"
        style={{ background: `linear-gradient(to right, oklch(0.55 0.22 264) ${((value - min) / (max - min)) * 100}%, oklch(1 0 0 / 10%) ${((value - min) / (max - min)) * 100}%)` }}
      />
    </div>
  );
}

// ── Upload dropzone ─────────────────────────────────────────────────────────
function DropZone({
  label, hint, info, onFile,
}: {
  label: string; hint: string; info?: ImageInfo; onFile: (f: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) onFile(file);
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-foreground/80">{label}</Label>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-150 min-h-[80px] p-3
          ${dragging
            ? 'border-violet-500 bg-violet-500/10'
            : info
              ? 'border-emerald-500/50 bg-emerald-500/5 hover:bg-emerald-500/10'
              : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20'
          }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
        />

        {info ? (
          <div className="flex items-center gap-2 w-full">
            {/* Thumbnail */}
            <img src={info.url} alt={label} className="w-12 h-12 rounded-lg object-contain bg-black/20 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium text-emerald-400 truncate">{info.name}</p>
              <p className="text-[10px] text-muted-foreground tabular-nums">
                {info.width} × {info.height}px &nbsp;·&nbsp; {info.size}
              </p>
              {(info.width !== info.height) && (
                <p className="text-[10px] text-amber-400/80 mt-0.5">
                  Non-square — square PNGs work best
                </p>
              )}
            </div>
            <div className="shrink-0">
              <Check className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
        ) : (
          <>
            <Upload className="w-5 h-5 text-muted-foreground/50" />
            <p className="text-[11px] text-muted-foreground/70 text-center leading-snug">{hint}</p>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────
export default function ThemeTesterPage() {
  // Image state
  const [faceInfo,  setFaceInfo]  = useState<ImageInfo | null>(null);
  const [standInfo, setStandInfo] = useState<ImageInfo | null>(null);
  const [cacheKey,  setCacheKey]  = useState('init');

  // Branding tuning
  const [contentScale,    setContentScale]    = useState(0.75);
  const [centerOffsetY,   setCenterOffsetY]   = useState(0);
  const [fontSize,        setFontSize]        = useState(12);
  const [fontWeight,      setFontWeight]      = useState<'400'|'600'|'700'|'800'>('800');
  const [labelPosition,   setLabelPosition]   = useState<'inner'|'center'|'outer'>('outer');
  const [textColor,       setTextColor]       = useState('#FFFFFF');
  const [textShadow,      setTextShadow]      = useState(true);
  const [primaryColor,    setPrimaryColor]    = useState('#7C3AED');

  // Animation
  const [isSpinning, setIsSpinning] = useState(true);
  const [spinSpeed,  setSpinSpeed]  = useState(30);

  // Copy state
  const [copied, setCopied] = useState(false);

  // Segments with text color applied
  const segments: WheelSegment[] = PREVIEW_SEGMENTS.map((s) => ({
    ...s,
    text_color: textColor,
    bg_color: faceInfo ? 'transparent' : s.bg_color,
  }));

  const branding: WheelBranding = {
    primary_color:          primaryColor,
    outer_ring_width:       faceInfo ? 0 : 20,
    inner_ring_enabled:     !faceInfo,
    rim_tick_style:         faceInfo ? 'none' : 'triangles',
    label_font_size:        fontSize,
    label_font_weight:      fontWeight,
    label_position:         labelPosition,
    premium_face_url:       faceInfo?.url ?? null,
    premium_stand_url:      standInfo?.url ?? null,
    premium_content_scale:  faceInfo ? contentScale : undefined,
    premium_center_offset_y: faceInfo ? centerOffsetY : undefined,
  };

  // Load image info from a File
  function loadImageInfo(file: File): Promise<ImageInfo> {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const sizeKB = (file.size / 1024).toFixed(0);
        const size   = file.size > 1024 * 1024
          ? `${(file.size / 1024 / 1024).toFixed(1)} MB`
          : `${sizeKB} KB`;
        resolve({ name: file.name, width: img.width, height: img.height, size, url });
      };
      img.src = url;
    });
  }

  async function handleFaceUpload(file: File) {
    if (faceInfo) URL.revokeObjectURL(faceInfo.url);
    const info = await loadImageInfo(file);
    setFaceInfo(info);
    setCacheKey(`face-${Date.now()}`);
    toast.success('Wheel face loaded');
  }

  async function handleStandUpload(file: File) {
    if (standInfo) URL.revokeObjectURL(standInfo.url);
    const info = await loadImageInfo(file);
    setStandInfo(info);
    setCacheKey(`stand-${Date.now()}`);
    toast.success('Stand / frame loaded');
  }

  function handleReset() {
    if (faceInfo)  URL.revokeObjectURL(faceInfo.url);
    if (standInfo) URL.revokeObjectURL(standInfo.url);
    setFaceInfo(null);
    setStandInfo(null);
    setContentScale(0.75);
    setCenterOffsetY(0);
    setFontSize(12);
    setFontWeight('800');
    setLabelPosition('outer');
    setTextColor('#FFFFFF');
    setPrimaryColor('#7C3AED');
    setCacheKey(`reset-${Date.now()}`);
  }

  // Build the template config JSON for export
  function buildConfig() {
    return {
      premium_face_url:        faceInfo  ? '/assets/premium-wheels/Wheel.png' : null,
      premium_stand_url:       standInfo ? '/assets/premium-wheels/Stand.png' : null,
      premium_content_scale:   contentScale,
      premium_center_offset_y: centerOffsetY || undefined,
      label_font_size:         fontSize,
      label_font_weight:       fontWeight,
      label_position:          labelPosition,
      outer_ring_width:        faceInfo ? 0 : 20,
      inner_ring_enabled:      faceInfo ? false : undefined,
      rim_tick_style:          faceInfo ? 'none' : undefined,
    };
  }

  function handleCopy() {
    const json = JSON.stringify(buildConfig(), null, 2);
    navigator.clipboard.writeText(json).then(() => {
      setCopied(true);
      toast.success('Config copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (faceInfo)  URL.revokeObjectURL(faceInfo.url);
      if (standInfo) URL.revokeObjectURL(standInfo.url);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-full p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Wand2 className="w-5 h-5 text-violet-400" />
            <h1 className="text-xl font-bold tracking-tight">Premium Theme Tester</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Upload a Wheel PNG + Stand PNG and tune the label placement live before adding it as a template.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleReset} className="gap-2 text-xs">
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-6 items-start">

        {/* ── Left: Controls ─────────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Upload */}
          <Card className="border-white/8">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-violet-400" />
                Image Layers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <DropZone
                label="Wheel.png — Spinning face"
                hint="Upload the spinning disc PNG (transparent background)"
                info={faceInfo ?? undefined}
                onFile={handleFaceUpload}
              />
              <DropZone
                label="Stand.png — Frame / pedestal"
                hint="Upload the static frame overlay PNG"
                info={standInfo ?? undefined}
                onFile={handleStandUpload}
              />

              {/* Size recommendation */}
              <div className="flex items-start gap-2 rounded-lg bg-blue-500/8 border border-blue-500/15 p-2.5">
                <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-blue-300/80 leading-relaxed">
                  Best results with <strong className="text-blue-300">square PNGs (600×600 or 800×800px)</strong> with transparent backgrounds. Non-square images are supported but may clip.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Label tuning — only relevant when face is loaded */}
          <Card className="border-white/8">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-400" />
                Label Placement
                {!faceInfo && <Badge variant="outline" className="text-[10px] ml-auto">Active when face uploaded</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <SliderRow
                label="Content Scale"
                value={contentScale} min={0.2} max={1.2} step={0.05}
                onChange={setContentScale}
              />
              <SliderRow
                label="Center Offset Y"
                value={centerOffsetY} min={-80} max={80} step={1} unit="px"
                onChange={setCenterOffsetY}
              />
              <SliderRow
                label="Font Size"
                value={fontSize} min={7} max={22} step={1} unit="px"
                onChange={setFontSize}
              />

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Label Position</Label>
                  <Select value={labelPosition} onValueChange={(v) => setLabelPosition(v as 'inner'|'center'|'outer')}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inner">Inner</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="outer">Outer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Font Weight</Label>
                  <Select value={fontWeight} onValueChange={(v) => setFontWeight(v as '400'|'600'|'700'|'800')}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="400">Regular</SelectItem>
                      <SelectItem value="600">Semi-Bold</SelectItem>
                      <SelectItem value="700">Bold</SelectItem>
                      <SelectItem value="800">Extra-Bold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Text Color</Label>
                  <div className="flex items-center gap-2 h-8 rounded-md border border-input bg-background px-2">
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0"
                    />
                    <span className="text-xs font-mono text-muted-foreground">{textColor}</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Pointer Color</Label>
                  <div className="flex items-center gap-2 h-8 rounded-md border border-input bg-background px-2">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0"
                    />
                    <span className="text-xs font-mono text-muted-foreground">{primaryColor}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Animation controls */}
          <Card className="border-white/8">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Play className="w-4 h-4 text-emerald-400" />
                Preview Animation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <SliderRow
                label="Spin Speed"
                value={spinSpeed} min={5} max={120} step={5} unit=" rpm"
                onChange={setSpinSpeed}
              />
              <Button
                variant={isSpinning ? 'outline' : 'default'}
                size="sm"
                className="w-full gap-2 text-xs"
                onClick={() => setIsSpinning((v) => !v)}
              >
                {isSpinning
                  ? <><Pause className="w-3.5 h-3.5" /> Pause Preview</>
                  : <><Play  className="w-3.5 h-3.5" /> Play Preview</>
                }
              </Button>
            </CardContent>
          </Card>

          {/* Export */}
          <Card className="border-white/8">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Download className="w-4 h-4 text-violet-400" />
                Export Config
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <pre className="text-[10px] font-mono bg-black/30 rounded-lg p-3 overflow-auto max-h-48 text-muted-foreground leading-relaxed">
                {JSON.stringify(buildConfig(), null, 2)}
              </pre>
              <Button
                size="sm"
                className="w-full gap-2 text-xs"
                onClick={handleCopy}
              >
                {copied
                  ? <><Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!</>
                  : <><Copy className="w-3.5 h-3.5" /> Copy Branding Config</>
                }
              </Button>
              <p className="text-[10px] text-muted-foreground/60 text-center leading-snug">
                Paste this config into <code className="font-mono">src/lib/wheel-templates.ts</code> to add it as a permanent template.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* ── Right: Live Preview ─────────────────────────────────────────── */}
        <div className="space-y-4">
          <Card className="border-white/8">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Live Preview</CardTitle>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-muted-foreground">Real-time</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6">
              <SpinningCanvas
                segments={segments}
                config={BASE_CONFIG}
                branding={branding}
                isSpinning={isSpinning}
                spinSpeed={spinSpeed}
                cacheKey={`${cacheKey}-${faceInfo?.url ?? ''}-${standInfo?.url ?? ''}`}
              />

              {/* Status chips */}
              <div className="flex flex-wrap gap-2 justify-center">
                <Badge variant={faceInfo  ? 'default' : 'outline'} className="text-[10px] gap-1">
                  {faceInfo  ? <Check className="w-3 h-3 text-emerald-400" /> : <Upload className="w-3 h-3" />}
                  {faceInfo  ? 'Face loaded' : 'No face — upload Wheel.png'}
                </Badge>
                <Badge variant={standInfo ? 'default' : 'outline'} className="text-[10px] gap-1">
                  {standInfo ? <Check className="w-3 h-3 text-emerald-400" /> : <Upload className="w-3 h-3" />}
                  {standInfo ? 'Stand loaded' : 'No stand — upload Stand.png'}
                </Badge>
              </div>

              {/* Parameter summary */}
              <div className="w-full rounded-xl bg-black/20 border border-white/5 p-4 grid grid-cols-2 gap-x-6 gap-y-2">
                {[
                  ['Content Scale', contentScale],
                  ['Center Offset Y', `${centerOffsetY}px`],
                  ['Font Size', `${fontSize}px`],
                  ['Font Weight', fontWeight],
                  ['Label Position', labelPosition],
                  ['Text Color', textColor],
                ].map(([k, v]) => (
                  <div key={k as string} className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-muted-foreground">{k}</span>
                    <span className="text-[11px] font-mono font-semibold text-foreground/80">{v}</span>
                  </div>
                ))}
              </div>

              {/* How-to hint */}
              {(!faceInfo || !standInfo) && (
                <div className="w-full flex items-start gap-2 rounded-lg bg-violet-500/8 border border-violet-500/15 p-3">
                  <Wand2 className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                  <div className="text-[11px] text-violet-300/80 leading-relaxed space-y-1">
                    <p className="font-semibold text-violet-300">How to use this tool</p>
                    <ol className="list-decimal list-inside space-y-0.5 text-violet-300/70">
                      <li>Upload <strong>Wheel.png</strong> — the spinning disc face (transparent background)</li>
                      <li>Upload <strong>Stand.png</strong> — the static frame / pedestal</li>
                      <li>Adjust <strong>Content Scale</strong> until labels sit inside the transparent area</li>
                      <li>Tweak <strong>Center Offset Y</strong> if the disc is vertically off-center</li>
                      <li>Copy the config and paste into <code>wheel-templates.ts</code></li>
                    </ol>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
