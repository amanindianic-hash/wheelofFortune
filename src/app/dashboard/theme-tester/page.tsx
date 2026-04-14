'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Upload, Play, Pause, Copy, Check, RotateCcw,
  ImageIcon, Info, Wand2, Download, X, Layers, SplitSquareHorizontal,
  Save, Pencil, Trash2, BookMarked, Palette, Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  drawWheel, preloadSegmentImages,
  type WheelSegment, type WheelConfig, type WheelBranding, type ImageCache,
} from '@/lib/utils/wheel-renderer';
import { WHEEL_TEMPLATES } from '@/lib/wheel-templates';
import { SegmentUploader } from '@/components/segment-uploader/segment-upload';
import { SegmentPreview } from '@/components/segment-uploader/segment-preview';

// ── Sample labels ────────────────────────────────────────────────────────────
const PREVIEW_LABELS = ['10% OFF', 'FREE GIFT', '20% OFF', 'TRY AGAIN', 'JACKPOT', '5% OFF', 'BONUS', '50% OFF'];

const BASE_CONFIG: WheelConfig = {
  spin_duration_ms: 4000,
  show_segment_labels: true,
  label_rotation: 'radial',
};

// Only wheel-type templates for comparison
const WHEEL_ONLY_TEMPLATES = WHEEL_TEMPLATES.filter((t) => t.gameType === 'wheel');

interface ImageInfo {
  name: string; width: number; height: number; size: string; url: string;
}

interface SavedTheme {
  id: string;
  name: string;
  emoji: string;
  description: string;
  branding: Partial<WheelBranding>;
  config: Partial<WheelConfig>;
  segment_palette: Array<{ bg_color: string; text_color: string }>;
  created_at: string;
  updated_at: string;
}

// ── Build segments from a template palette ───────────────────────────────────
function buildSegmentsFromPalette(
  palette: Array<{ bg_color: string; text_color: string }>,
  labels = PREVIEW_LABELS,
): WheelSegment[] {
  return labels.map((label, i) => ({
    id: String(i + 1),
    position: i,
    label,
    bg_color:   palette[i % palette.length].bg_color,
    text_color: palette[i % palette.length].text_color,
    weight: 1,
    is_no_prize: false,
  }));
}

// ── Spinning Canvas ──────────────────────────────────────────────────────────
function SpinningCanvas({
  segments, config, branding, isSpinning, spinSpeed, cacheKey, label,
  frameInfo, hubInfo, pointerInfo,
}: {
  segments: WheelSegment[];
  config: WheelConfig;
  branding: WheelBranding;
  isSpinning: boolean;
  spinSpeed: number;
  cacheKey: string;
  label?: string;
  frameInfo?: ImageInfo | null;
  hubInfo?: ImageInfo | null;
  pointerInfo?: ImageInfo | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cacheRef  = useRef<ImageCache>(new Map());
  const rotRef    = useRef(0);
  const rafRef    = useRef<number>(0);
  const runRef    = useRef(true);
  const brandRef  = useRef(branding);
  const spinRef   = useRef(isSpinning);
  const speedRef  = useRef(spinSpeed);

  useEffect(() => { brandRef.current = branding; }, [branding]);
  useEffect(() => { spinRef.current  = isSpinning; }, [isSpinning]);
  useEffect(() => { speedRef.current = spinSpeed; }, [spinSpeed]);

  useEffect(() => {
    runRef.current = false;
    cancelAnimationFrame(rafRef.current);
    cacheRef.current = new Map();
    runRef.current = true;

    preloadSegmentImages(segments, config, branding, cacheRef.current).then(() => {
      if (!runRef.current) return;
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

    return () => { runRef.current = false; cancelAnimationFrame(rafRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, segments, config]);

  const pointerColor = branding.pointer_color || branding.primary_color || '#7C3AED';

  return (
    <div className="flex flex-col items-center gap-2">
      {label && (
        <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">{label}</span>
      )}
      <div className="relative w-[320px] h-[320px] mx-auto overflow-visible perspective-[1200px] mt-4 mb-4">
        {/* Frame / Outer Rim Overlay (Z=10) */}
        {frameInfo && (
          <img src={frameInfo.url} className="absolute inset-0 w-full h-full object-contain z-10 pointer-events-none drop-shadow-xl" alt="Outer Frame Overlay" />
        )}

        {/* Floating Center Pointer (HTML Overlay / Custom Image Z=30) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-30 drop-shadow-md pointer-events-none">
          {pointerInfo ? (
             <img src={pointerInfo.url} className="w-[320px] h-[320px] max-w-none object-contain -translate-x-1/2 -translate-y-[-2px]" alt="Custom Pointer" />
          ) : (
            <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 38L2 14V2C2 2 12 4 16 4C20 4 30 2 30 2V14L16 38Z" fill={pointerColor} />
              <path d="M16 38L2 14V2C2 2 12 4 16 4C20 4 30 2 30 2V14L16 38Z" stroke="white" strokeWidth="2" />
            </svg>
          )}
        </div>

        <canvas
          ref={canvasRef}
          width={720} height={720}
          className="rounded-full shadow-2xl bg-transparent w-[320px] h-[320px]"
        />
      </div>
    </div>
  );
}

// ── Slider ───────────────────────────────────────────────────────────────────
function SliderRow({ label, value, min, max, step, unit = '', onChange }: {
  label: string; value: number; min: number; max: number; step: number; unit?: string;
  onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <span className="text-xs font-mono font-semibold text-foreground tabular-nums">{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-violet-500"
        style={{ background: `linear-gradient(to right, oklch(0.55 0.22 264) ${pct}%, oklch(1 0 0 / 10%) ${pct}%)` }}
      />
    </div>
  );
}

// ── DropZone with remove button ──────────────────────────────────────────────
function DropZone({ label, hint, info, onFile, onRemove, isLoading }: {
  label: string; hint: string; info?: ImageInfo;
  onFile: (f: File) => void;
  onRemove: () => void;
  isLoading?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setDragging(false);
    if (isLoading) return;
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) onFile(file);
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-foreground/80">{label}</Label>
      <div
        onClick={() => !info && !isLoading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); if (!info && !isLoading) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed transition-all duration-150 min-h-[80px] p-3
          ${dragging
            ? 'border-violet-500 bg-violet-500/10 cursor-copy'
            : info
              ? 'border-emerald-500/40 bg-emerald-500/5'
              : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20 cursor-pointer'
          }`}
      >
        <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ''; }}
        />

        {/* Upload spinner overlay */}
        {isLoading && (
          <div className="absolute inset-0 rounded-xl bg-black/50 flex items-center justify-center z-10">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}

        {info ? (
          <div className="flex items-center gap-2 w-full">
            <img src={info.url} alt={label} className="w-12 h-12 rounded-lg object-contain bg-black/20 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium text-emerald-400 truncate">{info.name}</p>
              <p className="text-[10px] text-muted-foreground tabular-nums">
                {info.width} × {info.height}px · {info.size}
              </p>
              {info.width !== info.height && (
                <p className="text-[10px] text-amber-400/80 mt-0.5">Non-square — square works best</p>
              )}
            </div>
            {/* Action buttons */}
            <div className="flex flex-col gap-1 shrink-0">
              {/* Replace */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
                title="Replace image"
              >
                <Upload className="w-3.5 h-3.5" />
              </button>
              {/* Remove */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onRemove(); }}
                className="p-1 rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Remove image"
              >
                <X className="w-3.5 h-3.5" />
              </button>
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

// ── Main Page ────────────────────────────────────────────────────────────────
export default function ThemeTesterPage() {
  const [faceInfo,  setFaceInfo]  = useState<ImageInfo | null>(null);
  const [standInfo, setStandInfo] = useState<ImageInfo | null>(null);
  
  // ── Local Figma Overlay Testing ───────────────────────────────────────────
  const [hubInfo,     setHubInfo]     = useState<ImageInfo | null>(null);
  const [pointerInfo, setPointerInfo] = useState<ImageInfo | null>(null);
  const [frameInfo,   setFrameInfo]   = useState<ImageInfo | null>(null);

  const [cacheKey,  setCacheKey]  = useState('init');
  const [faceUploading,  setFaceUploading]  = useState(false);
  const [standUploading, setStandUploading] = useState(false);
  const [hubUploading,     setHubUploading]     = useState(false);
  const [pointerUploading, setPointerUploading] = useState(false);
  const [frameUploading,   setFrameUploading]   = useState(false);

  const [contentScale,  setContentScale]  = useState(0.75);
  const [centerOffsetY, setCenterOffsetY] = useState(0);
  const [segmentImageOffsetX, setSegmentImageOffsetX] = useState(0);
  const [segmentImageOffsetY, setSegmentImageOffsetY] = useState(0);
  const [fontSize,      setFontSize]      = useState(12);
  const [fontWeight,    setFontWeight]    = useState<'400'|'600'|'700'|'800'>('800');
  const [labelPosition, setLabelPosition] = useState<'inner'|'center'|'outer'>('outer');
  const [primaryColor,  setPrimaryColor]  = useState('#7C3AED');
  const [pointerColor,  setPointerColor]  = useState('#7C3AED');
  const [outerRingColor, setOuterRingColor] = useState('#7C3AED');
  const [innerRingColor, setInnerRingColor] = useState('rgba(255,255,255,0.18)');
  const [rimTickColor,  setRimTickColor]  = useState('#FFFFFF');
  const [numSegments, setNumSegments] = useState(2);
  const [segmentPalette, setSegmentPalette] = useState<Array<{bg_color: string, text_color: string}>>(
    Array.from({ length: 8 }).map((_, i) => ({
      bg_color: i % 2 === 0 ? '#7C3AED' : '#5B21B6',
      text_color: '#FFFFFF'
    }))
  );
  const [showLabels,    setShowLabels]    = useState(false); // default OFF — most PNG wheels have pre-baked labels

  const [isSpinning,    setIsSpinning]    = useState(true);
  const [spinSpeed,     setSpinSpeed]     = useState(30);
  const [compareId,     setCompareId]     = useState<string>('none');
  const [copied,        setCopied]        = useState(false);

  // ── Saved themes (DB) ──────────────────────────────────────────────────────
  const [savedThemes,   setSavedThemes]   = useState<SavedTheme[]>([]);
  const [themesLoading, setThemesLoading] = useState(false);
  const [saveName,      setSaveName]      = useState('');
  const [saveEmoji,     setSaveEmoji]     = useState('🎨');
  const [saving,        setSaving]        = useState(false);
  const [editingTheme,  setEditingTheme]  = useState<SavedTheme | null>(null);
  const [editName,      setEditName]      = useState('');
  const [editEmoji,     setEditEmoji]     = useState('');
  const [editSaving,    setEditSaving]    = useState(false);

  // ── Segment images for custom wheel segments ────────────────────────────────
  const [segmentImages, setSegmentImages] = useState<(string | null)[]>(Array(8).fill(null));
  const [segmentImageOffsets, setSegmentImageOffsets] = useState<Array<{x: number, y: number}>>(
    Array(8).fill({ x: 0, y: 0 })
  );
  const [selectedThemeForSegments, setSelectedThemeForSegments] = useState<SavedTheme | null>(null);

  // ── Custom theme segments & branding ───────────────────────────────────────
  const customSegments: WheelSegment[] = Array.from({ length: numSegments }).map((_, i) => ({
    id: String(i + 1), position: i, label: PREVIEW_LABELS[i % PREVIEW_LABELS.length],
    bg_color:   faceInfo ? 'transparent' : segmentPalette[i].bg_color,
    text_color: segmentPalette[i].text_color,
    weight: 1, is_no_prize: false,
    segment_image_url: segmentImages[i] ?? undefined,
    icon_offset_x: segmentImageOffsets[i].x !== 0 ? segmentImageOffsets[i].x : undefined,
    icon_offset_y: segmentImageOffsets[i].y !== 0 ? segmentImageOffsets[i].y : undefined,
  }));

  const customBranding: WheelBranding = {
    primary_color:           primaryColor,
    pointer_color:           pointerColor,
    outer_ring_color:        outerRingColor,
    inner_ring_color:        innerRingColor,
    rim_tick_color:          rimTickColor,
    outer_ring_width:        faceInfo ? 0 : 20,
    inner_ring_enabled:      !faceInfo,
    rim_tick_style:          faceInfo ? 'none' : 'triangles',
    label_font_size:         fontSize,
    label_font_weight:       fontWeight,
    label_position:          labelPosition,
    premium_face_url:        faceInfo?.url  ?? null,
    premium_stand_url:       standInfo?.url ?? null,
    premium_frame_url:       frameInfo?.url ?? null,
    premium_pointer_url:     pointerInfo?.url ?? null,
    premium_content_scale:   faceInfo ? contentScale : undefined,
    premium_center_offset_y: faceInfo ? centerOffsetY : undefined,
  };

  const customConfig: WheelConfig = {
    ...BASE_CONFIG,
    spin_duration_ms: 4000,
    show_segment_labels: showLabels,
    center_image_url: hubInfo?.url ?? null,
  };

  // ── Comparison template ─────────────────────────────────────────────────────
  const compareTemplate = compareId !== 'none'
    ? WHEEL_ONLY_TEMPLATES.find((t) => t.id === compareId) ?? null
    : null;

  const compareSegments: WheelSegment[] = compareTemplate
    ? buildSegmentsFromPalette(compareTemplate.segmentPalette)
    : [];

  const compareBranding: WheelBranding = compareTemplate
    ? {
        ...compareTemplate.branding,
        label_font_size:   compareTemplate.branding.label_font_size   ?? 12,
        label_font_weight: compareTemplate.branding.label_font_weight ?? '700',
        label_position:    compareTemplate.branding.label_position    ?? 'outer',
        outer_ring_width:  compareTemplate.branding.outer_ring_width  ?? 20,
      }
    : {};

  // ── Helpers ─────────────────────────────────────────────────────────────────
  function loadImageInfo(file: File): Promise<ImageInfo> {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const size = file.size > 1024 * 1024
          ? `${(file.size / 1024 / 1024).toFixed(1)} MB`
          : `${(file.size / 1024).toFixed(0)} KB`;
        resolve({ name: file.name, width: img.width, height: img.height, size, url });
      };
      img.src = url;
    });
  }

  function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleFaceUpload(file: File) {
    if (faceInfo) URL.revokeObjectURL(faceInfo.url);
    const localInfo = await loadImageInfo(file);
    setFaceInfo(localInfo);
    setCacheKey(`face-${Date.now()}`);

    setFaceUploading(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      URL.revokeObjectURL(localInfo.url);
      setFaceInfo({ ...localInfo, url: dataUrl });
      toast.success('Wheel face loaded');
    } catch {
      toast.error('Failed to process image');
    } finally {
      setFaceUploading(false);
    }
  }

  async function handleStandUpload(file: File) {
    if (standInfo) URL.revokeObjectURL(standInfo.url);
    const localInfo = await loadImageInfo(file);
    setStandInfo(localInfo);
    setCacheKey(`stand-${Date.now()}`);

    setStandUploading(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      URL.revokeObjectURL(localInfo.url);
      setStandInfo({ ...localInfo, url: dataUrl });
      toast.success('Stand / frame loaded');
    } catch {
      toast.error('Failed to process image');
    } finally {
      setStandUploading(false);
    }
  }

  async function handleHubUpload(file: File) {
    if (hubInfo) URL.revokeObjectURL(hubInfo.url);
    const localInfo = await loadImageInfo(file);
    setHubInfo(localInfo);
    setHubUploading(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      URL.revokeObjectURL(localInfo.url);
      setHubInfo({ ...localInfo, url: dataUrl });
      toast.success('Hub overlay loaded');
    } catch { toast.error('Failed to process image'); } 
    finally { setHubUploading(false); }
  }

  async function handlePointerUpload(file: File) {
    if (pointerInfo) URL.revokeObjectURL(pointerInfo.url);
    const localInfo = await loadImageInfo(file);
    setPointerInfo(localInfo);
    setPointerUploading(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      URL.revokeObjectURL(localInfo.url);
      setPointerInfo({ ...localInfo, url: dataUrl });
      toast.success('Pointer overlay loaded');
    } catch { toast.error('Failed to process image'); } 
    finally { setPointerUploading(false); }
  }

  async function handleFrameUpload(file: File) {
    if (frameInfo) URL.revokeObjectURL(frameInfo.url);
    const localInfo = await loadImageInfo(file);
    setFrameInfo(localInfo);
    setFrameUploading(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      URL.revokeObjectURL(localInfo.url);
      setFrameInfo({ ...localInfo, url: dataUrl });
      toast.success('Frame overlay loaded');
    } catch { toast.error('Failed to process image'); } 
    finally { setFrameUploading(false); }
  }

  function removeFace() {
    if (faceInfo) URL.revokeObjectURL(faceInfo.url);
    setFaceInfo(null);
    setCacheKey(`rm-face-${Date.now()}`);
    toast.success('Wheel face removed');
  }

  function removeStand() {
    if (standInfo) URL.revokeObjectURL(standInfo.url);
    setStandInfo(null);
    setCacheKey(`rm-stand-${Date.now()}`);
    toast.success('Stand removed');
  }

  function handleReset() {
    if (faceInfo)  URL.revokeObjectURL(faceInfo.url);
    if (standInfo) URL.revokeObjectURL(standInfo.url);
    if (hubInfo)     URL.revokeObjectURL(hubInfo.url);
    if (pointerInfo) URL.revokeObjectURL(pointerInfo.url);
    if (frameInfo)   URL.revokeObjectURL(frameInfo.url);
    
    setFaceInfo(null); setStandInfo(null);
    setHubInfo(null); setPointerInfo(null); setFrameInfo(null);
    setContentScale(0.75); setCenterOffsetY(0);
    setFontSize(12); setFontWeight('800');
    setLabelPosition('outer'); setPrimaryColor('#7C3AED');
    setOuterRingColor('#7C3AED'); setInnerRingColor('rgba(255,255,255,0.18)'); setRimTickColor('#FFFFFF');
    setSegmentPalette(
      Array.from({ length: 8 }).map((_, i) => ({
        bg_color: i % 2 === 0 ? '#7C3AED' : '#5B21B6',
        text_color: '#FFFFFF'
      }))
    );
    setShowLabels(false);
    setCompareId('none');
    setCacheKey(`reset-${Date.now()}`);
  }

  // ── Theme CRUD ────────────────────────────────────────────────────────────
  async function loadThemes() {
    setThemesLoading(true);
    try {
      const res = await fetch('/api/themes');
      const data = await res.json();
      if (res.ok) setSavedThemes(data.themes ?? []);
    } catch { /* silent */ }
    finally { setThemesLoading(false); }
  }

  async function handleSaveTheme() {
    if (!saveName.trim()) { toast.error('Enter a theme name'); return; }
    // Warn when a premium face image is loaded — saving now will bake
    // outer_ring_width:0 / rim_tick_style:none / inner_ring_enabled:false into
    // the theme, which makes it look broken when applied without the premium PNG.
    if (faceInfo) {
      const proceed = confirm(
        'A premium face image is currently loaded.\n\n' +
        'Saving now will bake premium-only settings (no outer ring, no rim ticks) ' +
        'into the theme. When applied on a wheel without the premium image these ' +
        'settings will produce a broken look.\n\n' +
        'Remove the face image first, then save — or press OK to save anyway.'
      );
      if (!proceed) return;
    }
    setSaving(true);
    try {
      const cfg = buildConfig();
      const res = await fetch('/api/themes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: saveName.trim(),
          emoji: saveEmoji,
          branding: cfg,
          config: buildFinalConfig(),
          segment_palette: segmentPalette.map((p, i) => ({
            ...p,
            image_url: segmentImages[i] ?? null,
            offset_x: segmentImageOffsets[i].x,
            offset_y: segmentImageOffsets[i].y
          })).slice(0, numSegments),
        }),
      });
      if (!res.ok) { toast.error('Failed to save theme'); return; }
      toast.success(`Theme "${saveName.trim()}" saved`);
      setSaveName('');
      await loadThemes();
    } finally { setSaving(false); }
  }

  async function handleDeleteTheme(theme: SavedTheme) {
    if (!confirm(`Delete theme "${theme.name}"?`)) return;
    try {
      const res = await fetch(`/api/themes/${theme.id}`, { method: 'DELETE' });
      if (!res.ok) { toast.error('Failed to delete theme'); return; }
      toast.success(`"${theme.name}" deleted`);
      setSavedThemes((prev) => prev.filter((t) => t.id !== theme.id));
    } catch { toast.error('Failed to delete theme'); }
  }

  async function handleEditSave() {
    if (!editingTheme || !editName.trim()) return;
    setEditSaving(true);
    try {
      const res = await fetch(`/api/themes/${editingTheme.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim(), emoji: editEmoji }),
      });
      if (!res.ok) { toast.error('Failed to update theme'); return; }
      toast.success('Theme updated');
      setEditingTheme(null);
      await loadThemes();
    } finally { setEditSaving(false); }
  }

  function handleLoadTheme(theme: SavedTheme) {
    const b = theme.branding as any;
    if (b.premium_content_scale   !== undefined) setContentScale(b.premium_content_scale);
    if (b.premium_center_offset_y !== undefined) setCenterOffsetY(b.premium_center_offset_y);
    if (b.label_font_size         !== undefined) setFontSize(b.label_font_size);
    if (b.label_font_weight       !== undefined) setFontWeight(b.label_font_weight);
    if (b.label_position          !== undefined) setLabelPosition(b.label_position);
    if (b.primary_color           !== undefined) setPrimaryColor(b.primary_color);
    if (b.pointer_color           !== undefined) setPointerColor(b.pointer_color);
    if (b.outer_ring_color        !== undefined) setOuterRingColor(b.outer_ring_color);
    if (b.inner_ring_color        !== undefined) setInnerRingColor(b.inner_ring_color);
    if (b.rim_tick_color          !== undefined) setRimTickColor(b.rim_tick_color);
    
    if (theme.segment_palette && theme.segment_palette.length > 0) {
      const dbLength = Math.max(2, Math.min(8, theme.segment_palette.length));
      setNumSegments(dbLength);
      
      setSegmentPalette(Array.from({ length: 8 }).map((_, i) => ({
        bg_color: theme.segment_palette[i % theme.segment_palette.length].bg_color,
        text_color: theme.segment_palette[i % theme.segment_palette.length].text_color
      })));
      
      setSegmentImages(Array.from({ length: 8 }).map((_, i) => 
        (i < theme.segment_palette.length) ? (theme.segment_palette[i].image_url ?? null) : null
      ));
      
      setSegmentImageOffsets(Array.from({ length: 8 }).map((_, i) => ({
        x: (i < theme.segment_palette.length) ? (theme.segment_palette[i].offset_x ?? 0) : 0,
        y: (i < theme.segment_palette.length) ? (theme.segment_palette[i].offset_y ?? 0) : 0
      })));
    }

    const c = theme.config as any;
    if (c.show_segment_labels !== undefined) setShowLabels(c.show_segment_labels);
    if (c.center_image_url) {
      setHubInfo({ url: c.center_image_url, name: 'hub-from-db', size: '—', width: 800, height: 800 });
    } else {
      setHubInfo(null);
    }
    
    if (b.premium_frame_url) {
      setFrameInfo({ url: b.premium_frame_url, name: 'frame-from-db', size: '—', width: 800, height: 800 });
    } else {
      setFrameInfo(null);
    }
    
    if (b.premium_pointer_url) {
      setPointerInfo({ url: b.premium_pointer_url, name: 'pointer-from-db', size: '—', width: 800, height: 800 });
    } else {
      setPointerInfo(null);
    }

    toast.success(`Loaded "${theme.name}"`);
  }

  function buildConfig() {
    return {
      premium_face_url:        faceInfo?.url  ?? null,
      premium_stand_url:       standInfo?.url ?? null,
      premium_content_scale:   contentScale,
      ...(centerOffsetY ? { premium_center_offset_y: centerOffsetY } : {}),
      primary_color:           primaryColor,
      pointer_color:           pointerColor,
      outer_ring_color:        outerRingColor,
      inner_ring_color:        innerRingColor,
      rim_tick_color:          rimTickColor,
      label_font_size:   fontSize,
      label_font_weight: fontWeight,
      label_position:    labelPosition,
      show_segment_labels: showLabels,
      outer_ring_width:  faceInfo ? 0 : 20,
      premium_frame_url: frameInfo?.url ?? null,
      premium_pointer_url: pointerInfo?.url ?? null,
      ...(faceInfo ? { inner_ring_enabled: false, rim_tick_style: 'none' } : {}),
    };
  }
  
  function buildFinalConfig() {
    return {
      show_segment_labels: showLabels,
      center_image_url: hubInfo?.url ?? null,
    };
  }

  function handleCopy() {
    navigator.clipboard.writeText(JSON.stringify(buildConfig(), null, 2)).then(() => {
      setCopied(true);
      toast.success('Config copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // ── Segment image functions ───────────────────────────────────────────────
  async function loadThemeSegments(themeId: string) {
    try {
      const res = await fetch(`/api/segments/${themeId}`);
      if (res.ok) {
        const { segmentImages: images } = await res.json();
        setSegmentImages(images);
      }
    } catch (err) {
      console.error('Error loading segments:', err);
    }
  }

  function handleSegmentPreview(urls: (string | null)[]) {
    setSegmentImages(urls);
    setCacheKey(`segments-${Date.now()}`);
  }

  function handleSegmentSaveComplete(urls: (string | null)[]) {
    setSegmentImages(urls);
    setCacheKey(`segments-saved-${Date.now()}`);
  }

  // Load comparison template images on select (for server URLs)
  const compareKey = `compare-${compareId}`;

  useEffect(() => {
    loadThemes();
    return () => {
      if (faceInfo)  URL.revokeObjectURL(faceInfo.url);
      if (standInfo) URL.revokeObjectURL(standInfo.url);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showCompare = compareTemplate !== null;
  const customCacheKey = `${cacheKey}-${faceInfo?.url ?? ''}-${standInfo?.url ?? ''}-sox${segmentImageOffsetX}-soy${segmentImageOffsetY}`;
  return (
    <div className="min-h-full p-6 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Wand2 className="w-5 h-5 text-violet-400" />
            <h1 className="text-xl font-bold tracking-tight">Premium Theme Tester</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Upload Wheel + Stand PNGs, tune label placement live, and compare against any existing template.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5 text-xs shrink-0">
          <RotateCcw className="w-3.5 h-3.5" /> Reset
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-6 items-start">

        {/* ── Left Panel ───────────────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Image Layers */}
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
                hint="Drag & drop or click to upload the spinning disc PNG"
                info={faceInfo ?? undefined}
                onFile={handleFaceUpload}
                onRemove={removeFace}
                isLoading={faceUploading}
              />
              {/* Stand/Background upload hidden per request 
                  <DropZone 
                    label="Stand / Background" hint="Static graphic behind the wheel (Layer 0)"
                    info={standInfo ?? undefined} onFile={handleStandUpload} onRemove={removeStand} isLoading={standUploading}
                  /> 
              */}
              <div className="flex items-start gap-2 rounded-lg bg-blue-500/8 border border-blue-500/15 p-2.5">
                <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-blue-300/80 leading-relaxed">
                  Best results with <strong className="text-blue-300">square PNGs (600×600 or 800×800px)</strong> with transparent backgrounds.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Compare with template */}
          <Card className="border-white/8">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <SplitSquareHorizontal className="w-4 h-4 text-sky-400" />
                Compare with Template
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Select existing template to compare</Label>
                <Select value={compareId} onValueChange={(v) => setCompareId(v ?? 'none')}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="— No comparison —" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— No comparison —</SelectItem>
                    {WHEEL_ONLY_TEMPLATES.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.emoji} {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {compareTemplate && (
                <div className="rounded-lg bg-sky-500/8 border border-sky-500/15 p-2.5 space-y-1">
                  <p className="text-[11px] font-semibold text-sky-300">
                    {compareTemplate.emoji} {compareTemplate.name}
                  </p>
                  <p className="text-[10px] text-sky-300/60">{compareTemplate.description}</p>
                  <div className="flex gap-1 mt-1.5 flex-wrap">
                    {compareTemplate.segmentPalette.slice(0, 6).map((p, i) => (
                      <div key={i} className="w-4 h-4 rounded-full border border-white/10 shrink-0"
                        style={{ background: p.bg_color === 'transparent' ? '#888' : p.bg_color }} />
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Label Tuning */}
          <Card className="border-white/8">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                Label Placement
                {!faceInfo && <Badge variant="outline" className="text-[10px] ml-auto">Applies when face loaded</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Show / hide dynamic labels */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Show Dynamic Labels</Label>
                  <Switch checked={showLabels} onCheckedChange={setShowLabels} />
                </div>
                {faceInfo && !showLabels && (
                  <p className="text-[11px] text-amber-400/80 leading-relaxed">
                    Labels hidden — using image&apos;s own pre-baked labels.
                  </p>
                )}
                {faceInfo && showLabels && (
                  <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
                    Dynamic labels visible. Turn OFF if your wheel image already has labels drawn in.
                  </p>
                )}
              </div>
              <SliderRow label="Content Scale"  value={contentScale}  min={0.2} max={1.2} step={0.05} onChange={setContentScale} />
              <SliderRow label="Center Offset Y" value={centerOffsetY} min={-80} max={80}  step={1}    unit="px" onChange={setCenterOffsetY} />
              <SliderRow label="Font Size"        value={fontSize}      min={7}   max={22}  step={1}    unit="px" onChange={setFontSize} />

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Label Position</Label>
                  <Select value={labelPosition} onValueChange={(v) => setLabelPosition(v as 'inner'|'center'|'outer')}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
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
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="400">Regular</SelectItem>
                      <SelectItem value="600">Semi-Bold</SelectItem>
                      <SelectItem value="700">Bold</SelectItem>
                      <SelectItem value="800">Extra-Bold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Color Palettes */}
          <Card className="border-white/8">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Palette className="w-4 h-4 text-pink-400" />
                Ring & Hub Styles
                {faceInfo && <Badge variant="outline" className="text-[10px] ml-auto">Rings hidden in Premium</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              
              <p className="text-[11px] text-muted-foreground/80 mb-2 leading-relaxed">
                Configure default solid colors on the left, or override the component entirely with a transparent Figma layer (800x800) on the right.
              </p>

              <div className="space-y-6 pt-2">
                {/* 1. Center Hub */}
                <div className="grid grid-cols-[1fr_1fr] gap-6 items-start">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-foreground">Center Hub</Label>
                    <p className="text-[10px] text-muted-foreground leading-snug">Base color used for the central pivot.</p>
                    <div className="flex items-center gap-2 h-8 rounded-md border border-input bg-background px-2">
                      <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0 shrink-0" />
                      <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="h-6 w-full border-0 p-0 text-xs font-mono bg-transparent" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-foreground">Center Hub Image</Label>
                    <DropZone 
                      label="Logo Upload" hint="(Direct crop, any size)"
                      info={hubInfo ?? undefined} onFile={handleHubUpload} onRemove={() => setHubInfo(null)} isLoading={hubUploading}
                    />
                  </div>
                </div>

                {/* 2. Pointer */}
                <div className="grid grid-cols-[1fr_1fr] gap-6 items-start">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-foreground">Pointer / Arrow</Label>
                    <p className="text-[10px] text-muted-foreground leading-snug">Base color used for the 3D SVG pointer.</p>
                    <div className="flex items-center gap-2 h-8 rounded-md border border-input bg-background px-2">
                      <input type="color" value={pointerColor} onChange={(e) => setPointerColor(e.target.value)}
                        className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0 shrink-0" />
                      <Input value={pointerColor} onChange={(e) => setPointerColor(e.target.value)} className="h-6 w-full border-0 p-0 text-xs font-mono bg-transparent" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-foreground">Pointer / Arrow Image</Label>
                    <DropZone 
                      label="Custom Pointer" hint="(800x800)"
                      info={pointerInfo ?? undefined} onFile={handlePointerUpload} onRemove={() => setPointerInfo(null)} isLoading={pointerUploading}
                    />
                  </div>
                </div>

                {/* 3. Outer Ring */}
                {!faceInfo && (
                  <div className="grid grid-cols-[1fr_1fr] gap-6 items-start pt-4 border-t border-white/5">
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-bold text-foreground">Outer Rim Colors</Label>
                        <p className="text-[10px] text-muted-foreground leading-snug">Tune the 3 concentric rings of the wheel boundary.</p>
                      </div>
                      
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground uppercase font-semibold">Outer Edge</Label>
                        <div className="flex items-center gap-2 h-8 rounded-md border border-input bg-background px-2">
                          <input type="color" value={outerRingColor} onChange={(e) => setOuterRingColor(e.target.value)}
                            className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0 shrink-0" />
                          <Input value={outerRingColor} onChange={(e) => setOuterRingColor(e.target.value)} className="h-6 w-full border-0 p-0 text-xs font-mono bg-transparent" />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground uppercase font-semibold">Inner Band</Label>
                        <div className="flex items-center gap-2 h-8 rounded-md border border-input bg-background px-2">
                          <div className="relative w-5 h-5 rounded overflow-hidden shrink-0 ring-1 ring-inset ring-white/20">
                            <div className="absolute inset-0 bg-[repeating-conic-gradient(#80808033_0%_25%,_transparent_0%_50%)] bg-[length:8px_8px]"></div>
                            <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: innerRingColor }}></div>
                            <input type="color" value={innerRingColor.startsWith('#') ? innerRingColor.slice(0, 7) : '#ffffff'} 
                              onChange={(e) => setInnerRingColor(e.target.value)}
                              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
                          </div>
                          <Input value={innerRingColor} onChange={(e) => setInnerRingColor(e.target.value)} className="h-6 w-full border-0 p-0 text-xs font-mono bg-transparent" />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground uppercase font-semibold">Rim Ticks</Label>
                        <div className="flex items-center gap-2 h-8 rounded-md border border-input bg-background px-2">
                          <input type="color" value={rimTickColor} onChange={(e) => setRimTickColor(e.target.value)}
                            className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0 shrink-0" />
                          <Input value={rimTickColor} onChange={(e) => setRimTickColor(e.target.value)} className="h-6 w-full border-0 p-0 text-xs font-mono bg-transparent" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="space-y-1">
                        <Label className="text-xs font-bold text-foreground">Outer Rim Image</Label>
                        <p className="text-[10px] text-muted-foreground leading-snug">Masks Outer Edge, Inner Band & Ticks</p>
                      </div>
                      <DropZone 
                        label="Exact Rim Upload" hint="(800x800)"
                        info={frameInfo ?? undefined} onFile={handleFrameUpload} onRemove={() => setFrameInfo(null)} isLoading={frameUploading}
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Segment Colors */}
          <Card className="border-white/8">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                Segment Colors
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-y-3 gap-x-6">
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest pb-1 border-b border-white/10">Backgrounds {faceInfo && '(Hidden)'}</div>
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest pb-1 border-b border-white/10">Text</div>
                {Array.from({ length: numSegments }).map((_, i) => (
                  <div key={i} className="contents">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] w-3 text-muted-foreground">{i + 1}</span>

                      {/* Segment Image Upload trigger */}
                      <input type="file" id={`seg-img-${i}`} accept="image/png,image/jpeg,image/webp" className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]; if (!file) return;
                          try {
                            const dataUrl = await fileToDataUrl(file);
                            setSegmentImages(prev => { const next = [...prev]; next[i] = dataUrl; return next; });
                            setCacheKey(`segimg-${Date.now()}`);
                            toast.success(`Segment ${i+1} image loaded`);
                          } catch { toast.error('Failed to load image'); e.target.value = ''; }
                        }}
                      />
                      {segmentImages[i] ? (
                        <button onClick={() => { setSegmentImages(prev => { const next = [...prev]; next[i] = null; return next; }); setCacheKey(`segimg-del-${Date.now()}`); }}
                          className="h-7 w-7 rounded border border-emerald-500/50 bg-emerald-500/10 flex items-center justify-center relative overflow-hidden group shrink-0" title="Remove custom image">
                          <img src={segmentImages[i]!} className="absolute inset-0 w-full h-full object-cover opacity-60" />
                          <X className="w-4 h-4 text-white drop-shadow-md relative z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ) : (
                        <button onClick={() => document.getElementById(`seg-img-${i}`)?.click()} disabled={!!faceInfo}
                          className="h-7 w-7 rounded border border-dashed border-white/20 hover:border-emerald-500/50 hover:bg-white/5 flex items-center justify-center text-muted-foreground hover:text-emerald-400 shrink-0 disabled:opacity-50 transition-colors" title="Upload custom segment image">
                          <ImageIcon className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <input type="color" value={segmentPalette[i].bg_color.startsWith('#') && segmentPalette[i].bg_color.length <= 7 ? segmentPalette[i].bg_color : '#000000'} disabled={!!faceInfo}
                        onChange={(e) => setSegmentPalette(prev => prev.map((item, idx) => idx === i ? { ...item, bg_color: e.target.value } : item))}
                        className="w-6 h-6 rounded cursor-pointer border-0 p-0 disabled:opacity-50 shrink-0" />
                      <Input value={segmentPalette[i].bg_color} disabled={!!faceInfo}
                        onChange={(e) => setSegmentPalette(prev => prev.map((item, idx) => idx === i ? { ...item, bg_color: e.target.value } : item))}
                        placeholder="rgba, hex8..."
                        className="h-7 border border-input bg-background text-xs font-mono disabled:opacity-50 min-w-0" />
                    </div>
                    <div className="flex items-center gap-2">
                       {/* Per-segment image offset controls (inline) */}
                       {segmentImages[i] !== null && (
                         <div className="flex flex-col gap-1 px-2 border-l border-white/10 w-[90px] shrink-0">
                           <div className="flex items-center gap-1" title="Radial Offset (In/Out)">
                             <span className="text-[9px] text-muted-foreground w-2">R</span>
                             <input type="range" min={-100} max={100} value={segmentImageOffsets[i].x} 
                               onChange={(e) => {
                                 const val = parseInt(e.target.value);
                                 setSegmentImageOffsets(prev => prev.map((item, idx) => idx === i ? { ...item, x: val } : item));
                                 setCacheKey(`segimg-off-${Date.now()}`);
                               }}
                               className="w-full h-1 accent-emerald-500 rounded-full appearance-none bg-white/10" />
                           </div>
                           <div className="flex items-center gap-1" title="Lateral Offset (Left/Right)">
                             <span className="text-[9px] text-muted-foreground w-2">L</span>
                             <input type="range" min={-50} max={50} value={segmentImageOffsets[i].y} 
                               onChange={(e) => {
                                 const val = parseInt(e.target.value);
                                 setSegmentImageOffsets(prev => prev.map((item, idx) => idx === i ? { ...item, y: val } : item));
                                 setCacheKey(`segimg-off-${Date.now()}`);
                               }}
                               className="w-full h-1 accent-emerald-500 rounded-full appearance-none bg-white/10" />
                           </div>
                         </div>
                       )}
                      <input type="color" value={segmentPalette[i].text_color.startsWith('#') ? segmentPalette[i].text_color : '#ffffff'}
                        onChange={(e) => setSegmentPalette(prev => prev.map((item, idx) => idx === i ? { ...item, text_color: e.target.value } : item))}
                        className="w-6 h-6 rounded cursor-pointer border-0 p-0" />
                      <Input value={segmentPalette[i].text_color}
                        onChange={(e) => setSegmentPalette(prev => prev.map((item, idx) => idx === i ? { ...item, text_color: e.target.value } : item))}
                        className="h-7 border border-input bg-background text-xs font-mono" />
                      
                      {/* Delete specific segment */}
                      <button 
                        onClick={() => {
                          if (numSegments <= 2) {
                            toast.error("You must have at least 2 segments.");
                            return;
                          }
                          setNumSegments(prev => prev - 1);
                          setSegmentPalette(prev => prev.filter((_, idx) => idx !== i).concat([{bg_color: '#5B21B6', text_color: '#FFFFFF'}]));
                          setSegmentImages(prev => prev.filter((_, idx) => idx !== i).concat([null]));
                          setSegmentImageOffsets(prev => prev.filter((_, idx) => idx !== i).concat([{x: 0, y: 0}]));
                          setCacheKey(`segm-del-${Date.now()}`);
                        }}
                        disabled={numSegments <= 2}
                        className="h-7 w-7 rounded border border-white/10 hover:border-red-500/50 hover:bg-red-500/10 flex items-center justify-center text-muted-foreground hover:text-red-400 shrink-0 disabled:opacity-20 transition-colors"
                        title="Remove segment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-2 pt-2 border-t border-white/5">
                <Button variant="outline" size="sm" className="w-full text-xs" 
                  disabled={numSegments >= 8} onClick={() => { setNumSegments(prev => Math.min(8, prev + 1)); setCacheKey(`segc-${Date.now()}`); }}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Segment
                </Button>
              </div>

            </CardContent>
          </Card>

          {/* Animation */}
          <Card className="border-white/8">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Play className="w-4 h-4 text-emerald-400" />
                Animation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <SliderRow label="Spin Speed" value={spinSpeed} min={5} max={120} step={5} unit=" rpm" onChange={setSpinSpeed} />
              <Button variant={isSpinning ? 'outline' : 'default'} size="sm" className="w-full gap-2 text-xs"
                onClick={() => setIsSpinning((v) => !v)}>
                {isSpinning ? <><Pause className="w-3.5 h-3.5" /> Pause</> : <><Play className="w-3.5 h-3.5" /> Play</>}
              </Button>
            </CardContent>
          </Card>

          {/* Segment Images Upload UI explicitly hidden here for now */}

          {/* Save Theme */}
          <Card className="border-white/8">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Save className="w-4 h-4 text-emerald-400" />
                Save Theme
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={saveEmoji}
                  onChange={(e) => setSaveEmoji(e.target.value)}
                  className="h-8 w-14 text-center text-base shrink-0"
                  maxLength={2}
                />
                <Input
                  placeholder="Theme name…"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  className="h-8 text-xs flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveTheme()}
                />
              </div>
              <Button size="sm" className="w-full gap-2 text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                onClick={handleSaveTheme} disabled={saving}>
                {saving ? 'Saving…' : <><Save className="w-3.5 h-3.5" /> Save to Library</>}
              </Button>
            </CardContent>
          </Card>

          {/* Saved Themes Library */}
          <Card className="border-white/8">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BookMarked className="w-4 h-4 text-amber-400" />
                Saved Themes
                {savedThemes.length > 0 && (
                  <Badge variant="outline" className="ml-auto text-[10px]">{savedThemes.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {themesLoading ? (
                <p className="text-xs text-muted-foreground text-center py-4">Loading…</p>
              ) : savedThemes.length === 0 ? (
                <p className="text-xs text-muted-foreground/60 text-center py-4">
                  No saved themes yet. Tune your wheel above and save it.
                </p>
              ) : (
                <div className="space-y-2">
                  {savedThemes.map((theme) => (
                    <div key={theme.id} className="rounded-lg border border-white/8 bg-black/20 p-2.5">
                      {editingTheme?.id === theme.id ? (
                        /* ── Edit mode ── */
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Input value={editEmoji} onChange={(e) => setEditEmoji(e.target.value)}
                              className="h-7 w-12 text-center text-base shrink-0" maxLength={2} />
                            <Input value={editName} onChange={(e) => setEditName(e.target.value)}
                              className="h-7 text-xs flex-1" />
                          </div>
                          <div className="flex gap-1.5">
                            <Button size="sm" className="flex-1 h-6 text-[11px] bg-violet-600 hover:bg-violet-500"
                              onClick={handleEditSave} disabled={editSaving}>
                              {editSaving ? 'Saving…' : 'Save'}
                            </Button>
                            <Button size="sm" variant="outline" className="flex-1 h-6 text-[11px]"
                              onClick={() => setEditingTheme(null)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        /* ── View mode ── */
                        <div className="flex items-center gap-2">
                          <span className="text-base shrink-0">{theme.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{theme.name}</p>
                            <p className="text-[10px] text-muted-foreground/50">
                              {new Date(theme.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              title="Load into editor"
                              onClick={() => handleLoadTheme(theme)}
                              className="p-1.5 rounded text-muted-foreground/50 hover:text-violet-400 hover:bg-violet-500/10 transition-colors"
                            >
                              <Download className="w-3 h-3" />
                            </button>
                            <button
                              title="Edit name"
                              onClick={() => { setEditingTheme(theme); setEditName(theme.name); setEditEmoji(theme.emoji); }}
                              className="p-1.5 rounded text-muted-foreground/50 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button
                              title="Delete"
                              onClick={() => handleDeleteTheme(theme)}
                              className="p-1.5 rounded text-muted-foreground/50 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Export Config (copy JSON) */}
          <Card className="border-white/8">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Download className="w-4 h-4 text-violet-400" />
                Export Config
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <pre className="text-[10px] font-mono bg-black/30 rounded-lg p-3 overflow-auto max-h-44 text-muted-foreground leading-relaxed">
                {JSON.stringify(buildConfig(), null, 2)}
              </pre>
              <Button size="sm" className="w-full gap-2 text-xs" onClick={handleCopy}>
                {copied
                  ? <><Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!</>
                  : <><Copy className="w-3.5 h-3.5" /> Copy Branding Config</>}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* ── Right Panel — Preview(s) ─────────────────────────────────────── */}
        <div className="space-y-4 sticky top-6">
          <Card className="border-white/8">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  {showCompare
                    ? <><SplitSquareHorizontal className="w-4 h-4 text-sky-400" /> Side-by-Side Comparison</>
                    : <><Wand2 className="w-4 h-4 text-violet-400" /> Live Preview</>
                  }
                </CardTitle>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-muted-foreground">Real-time</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {showCompare ? (
                /* ── Side-by-side ─────────────────────────────────────────── */
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4 divide-x divide-white/5">
                    {/* Custom */}
                    <div className="pr-4">
                      <SpinningCanvas
                        segments={customSegments} config={customConfig} branding={customBranding}
                        isSpinning={isSpinning} spinSpeed={spinSpeed} cacheKey={customCacheKey}
                        label="Your Custom Theme"
                        frameInfo={frameInfo} hubInfo={hubInfo} pointerInfo={pointerInfo}
                      />
                    </div>
                    {/* Compare */}
                    <div className="pl-4">
                      <SpinningCanvas
                        segments={compareSegments} config={BASE_CONFIG} branding={compareBranding}
                        isSpinning={isSpinning} spinSpeed={spinSpeed} cacheKey={compareKey}
                        label={`${compareTemplate!.emoji} ${compareTemplate!.name}`}
                      />
                    </div>
                  </div>

                  <Separator className="opacity-10" />

                  {/* Diff table */}
                  <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 gap-y-1.5 text-[11px]">
                    <span className="text-muted-foreground/50 font-semibold uppercase tracking-wider text-[10px]">Property</span>
                    <span className="text-violet-300/60 font-semibold uppercase tracking-wider text-[10px] text-center">Your Theme</span>
                    <span className="text-sky-300/60 font-semibold uppercase tracking-wider text-[10px] text-center">{compareTemplate!.name}</span>

                    {([
                      ['Face Image',     faceInfo  ? '✓ custom' : '— none',  compareTemplate!.branding.premium_face_url  ? '✓ image' : '— none'],
                      ['Stand Image',    standInfo ? '✓ custom' : '— none',  compareTemplate!.branding.premium_stand_url ? '✓ image' : '— none'],
                      ['Font Size',      `${fontSize}px`,                    `${compareTemplate!.branding.label_font_size ?? 'auto'}px`],
                      ['Font Weight',    fontWeight,                          compareTemplate!.branding.label_font_weight ?? '700'],
                      ['Label Position', labelPosition,                       compareTemplate!.branding.label_position ?? 'outer'],
                      ['Ring Width',     `${faceInfo ? 0 : 20}px`,           `${compareTemplate!.branding.outer_ring_width ?? 20}px`],
                    ] as [string, string, string][]).map(([prop, a, b]) => (
                      <div key={prop} className="contents">
                        <span className="text-muted-foreground/70">{prop}</span>
                        <span className="text-center font-mono text-violet-300/80">{a}</span>
                        <span className="text-center font-mono text-sky-300/80">{b}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* ── Single preview ───────────────────────────────────────── */
                <div className="flex flex-col items-center gap-6">
                  <SpinningCanvas
                    segments={customSegments} config={customConfig} branding={customBranding}
                    isSpinning={isSpinning} spinSpeed={spinSpeed} cacheKey={customCacheKey}
                    frameInfo={frameInfo} hubInfo={hubInfo} pointerInfo={pointerInfo}
                  />

                  {/* Status */}
                  <div className="flex flex-wrap gap-2 justify-center">
                    <Badge variant={faceInfo  ? 'default' : 'outline'} className="text-[10px] gap-1">
                      {faceInfo  ? <Check className="w-3 h-3 text-emerald-400" /> : <Upload className="w-3 h-3" />}
                      {faceInfo  ? 'Face loaded' : 'No face'}
                    </Badge>
                    <Badge variant={standInfo ? 'default' : 'outline'} className="text-[10px] gap-1">
                      {standInfo ? <Check className="w-3 h-3 text-emerald-400" /> : <Upload className="w-3 h-3" />}
                      {standInfo ? 'Stand loaded' : 'No stand'}
                    </Badge>
                  </div>

                  {/* Params */}
                  <div className="w-full rounded-xl bg-black/20 border border-white/5 p-4 grid grid-cols-2 gap-x-6 gap-y-2">
                    {([
                      ['Content Scale', contentScale],
                      ['Center Offset Y', `${centerOffsetY}px`],
                      ['Font Size', `${fontSize}px`],
                      ['Font Weight', fontWeight],
                      ['Label Position', labelPosition],
                    ] as [string, string|number][]).map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-muted-foreground">{k}</span>
                        <span className="text-[11px] font-mono font-semibold text-foreground/80">{v}</span>
                      </div>
                    ))}
                  </div>

                  {/* How-to */}
                  {(!faceInfo || !standInfo) && (
                    <div className="w-full flex items-start gap-2 rounded-lg bg-violet-500/8 border border-violet-500/15 p-3">
                      <Wand2 className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                      <div className="text-[11px] text-violet-300/80 space-y-1">
                        <p className="font-semibold text-violet-300">How to use</p>
                        <ol className="list-decimal list-inside space-y-0.5 text-violet-300/70">
                          <li>Upload <strong>Wheel.png</strong> — spinning disc (transparent background)</li>
                          <li>Upload <strong>Stand.png</strong> — static frame / pedestal</li>
                          <li>Adjust <strong>Content Scale</strong> until labels sit inside the wheel</li>
                          <li>Use <strong>Compare</strong> to match against an existing template</li>
                          <li>Copy config → paste into <code>wheel-templates.ts</code></li>
                        </ol>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
