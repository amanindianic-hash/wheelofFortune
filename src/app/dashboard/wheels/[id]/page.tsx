'use client';

import { useEffect, useState, use, useCallback, useRef } from 'react';
import QRCode from 'qrcode';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import type { Wheel, Segment, Prize } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WheelPreview } from '@/components/dashboard/wheels/wheel-preview';
import { ScratchPreview } from '@/components/dashboard/wheels/scratch-preview';
import { SlotPreview } from '@/components/dashboard/wheels/slot-preview';
import { RoulettePreview } from '@/components/dashboard/wheels/roulette-preview';
import { ThemeDialog } from '@/components/theme-dialog';
import type { WheelSegment } from '@/lib/utils/wheel-renderer';
import { WHEEL_TEMPLATES } from '@/lib/wheel-templates';
import { applyTemplateToWheel } from '@/lib/utils/theme-utils';
import { normalizeSegment } from '@/lib/utils/segment-utils';
import {
  ArrowLeft, Save, Lightbulb, Layers, Zap, Trophy,
  Palette, Type, Globe, Users, Code, QrCode,
  Share2, Monitor, Link, Camera, Search, CreditCard,
  Dices, Circle as CircleIcon, Play, Pause, ImageIcon, X, BookMarked,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const PLAN_COLORS = ['#E74C3C', '#3498DB', '#2ECC71', '#F39C12', '#9B59B6', '#1ABC9C', '#E67E22', '#2980B9'];

// Curated font list — { label shown in UI, css value stored, google font name for loading }
const FONT_OPTIONS: Array<{ label: string; value: string; google?: string; category: string }> = [
  { label: 'Inter',            value: 'Inter, sans-serif',              google: 'Inter',             category: 'Sans-serif' },
  { label: 'Roboto',           value: 'Roboto, sans-serif',             google: 'Roboto',            category: 'Sans-serif' },
  { label: 'Poppins',          value: 'Poppins, sans-serif',            google: 'Poppins',           category: 'Sans-serif' },
  { label: 'Montserrat',       value: 'Montserrat, sans-serif',         google: 'Montserrat',        category: 'Sans-serif' },
  { label: 'Raleway',          value: 'Raleway, sans-serif',            google: 'Raleway',           category: 'Sans-serif' },
  { label: 'Nunito',           value: 'Nunito, sans-serif',             google: 'Nunito',            category: 'Sans-serif' },
  { label: 'Lato',             value: 'Lato, sans-serif',               google: 'Lato',              category: 'Sans-serif' },
  { label: 'Oswald',           value: 'Oswald, sans-serif',             google: 'Oswald',            category: 'Display' },
  { label: 'Bebas Neue',       value: 'Bebas Neue, sans-serif',         google: 'Bebas+Neue',        category: 'Display' },
  { label: 'Righteous',        value: 'Righteous, sans-serif',          google: 'Righteous',         category: 'Display' },
  { label: 'Fredoka One',      value: 'Fredoka One, sans-serif',        google: 'Fredoka+One',       category: 'Display' },
  { label: 'Pacifico',         value: 'Pacifico, cursive',              google: 'Pacifico',          category: 'Handwriting' },
  { label: 'Caveat',           value: 'Caveat, cursive',                google: 'Caveat',            category: 'Handwriting' },
  { label: 'Playfair Display', value: 'Playfair Display, serif',        google: 'Playfair+Display',  category: 'Serif' },
  { label: 'Merriweather',     value: 'Merriweather, serif',            google: 'Merriweather',      category: 'Serif' },
  { label: 'Georgia',          value: 'Georgia, serif',                 category: 'Serif' },
  { label: 'Arial',            value: 'Arial, sans-serif',              category: 'System' },
  { label: 'Courier New',      value: 'Courier New, monospace',         category: 'Monospace' },
];

function loadGoogleFont(fontValue: string) {
  const match = FONT_OPTIONS.find((f) => f.value === fontValue);
  if (!match?.google) return;
  const id = `gfont-${match.google}`;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${match.google}:wght@400;600;700;800&display=swap`;
  document.head.appendChild(link);
}


function OffsetSlider({ label, value, onChange }: {
  label: string; value: number | null; onChange: (v: number | null) => void;
}) {
  const v = value ?? 0;
  const pct = ((v + 100) / 200) * 100;
  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between gap-1">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</span>
        <div className="flex items-center gap-0.5">
          <button type="button" onClick={() => onChange(Math.max(-100, v - 1))}
            className="w-4 h-4 text-[10px] rounded border border-border/50 flex items-center justify-center hover:bg-accent">−</button>
          <span className="text-[10px] font-mono w-7 text-center tabular-nums">{v}</span>
          <button type="button" onClick={() => onChange(Math.min(100, v + 1))}
            className="w-4 h-4 text-[10px] rounded border border-border/50 flex items-center justify-center hover:bg-accent">+</button>
        </div>
      </div>
      <input type="range" min={-100} max={100} step={1} value={v}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1 rounded-full appearance-none cursor-pointer accent-violet-500"
        style={{ background: `linear-gradient(to right, oklch(0.55 0.22 264) ${pct}%, oklch(1 0 0 / 10%) ${pct}%)` }}
      />
    </div>
  );
}

function AngleSlider({ label, value, onChange }: {
  label: string; value: number | null; onChange: (v: number | null) => void;
}) {
  const v = value ?? 0;
  const pct = ((v + 180) / 360) * 100;
  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between gap-1">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</span>
        <div className="flex items-center gap-0.5">
          <button type="button" onClick={() => onChange(Math.max(-180, v - 1))}
            className="w-4 h-4 text-[10px] rounded border border-border/50 flex items-center justify-center hover:bg-accent">−</button>
          <span className="text-[10px] font-mono w-8 text-center tabular-nums">{v}°</span>
          <button type="button" onClick={() => onChange(Math.min(180, v + 1))}
            className="w-4 h-4 text-[10px] rounded border border-border/50 flex items-center justify-center hover:bg-accent">+</button>
        </div>
      </div>
      <input type="range" min={-180} max={180} step={1} value={v}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1 rounded-full appearance-none cursor-pointer accent-orange-500"
        style={{ background: `linear-gradient(to right, oklch(0.65 0.18 55) ${pct}%, oklch(1 0 0 / 10%) ${pct}%)` }}
      />
    </div>
  );
}

export default function WheelEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [wheel, setWheel] = useState<Wheel | null>(null);
  const [segments, setSegments] = useState<(Segment & { prize_display_title?: string })[]>([]);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [saving, setSaving]       = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [qrSize, setQrSize]       = useState(256);
  const themeRestoredRef = useRef(false);

  // ── Saved custom themes ────────────────────────────────────────────────────
  const [savedThemes, setSavedThemes] = useState<Array<{
    id: string; name: string; emoji: string; description: string;
    branding: Record<string, unknown>; config: Record<string, unknown>;
    segment_palette: Array<{ bg_color: string; text_color: string }>;
  }>>([]);

  // ── Save-as-theme dialog ───────────────────────────────────────────────────
  const [saveThemeDialog, setSaveThemeDialog] = useState(false);
  const [saveThemeName, setSaveThemeName] = useState('');
  const [saveThemeEmoji, setSaveThemeEmoji] = useState('🎨');
  const [themeDialogOpen, setThemeDialogOpen] = useState(false);
  const [savingTheme, setSavingTheme] = useState(false);

  // ── Currently applied theme (persisted in localStorage) ───────────────────
  const [appliedTheme, setAppliedTheme] = useState<{
    id: string; name: string; emoji: string; type: 'custom' | 'built-in';
  } | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`wheel-${id}-theme`);
      if (saved) {
        try { return JSON.parse(saved); } catch { return null; }
      }
    }
    return null;
  });

  // Persist applied theme to localStorage
  useEffect(() => {
    if (appliedTheme) {
      localStorage.setItem(`wheel-${id}-theme`, JSON.stringify(appliedTheme));
    } else {
      localStorage.removeItem(`wheel-${id}-theme`);
    }
  }, [appliedTheme, id]);

  async function load() {
    const [wRes, pRes, tRes] = await Promise.all([
      api.get(`/api/wheels/${id}`),
      api.get('/api/prizes'),
      api.get('/api/themes'),
    ]);
    const wData = await wRes.json();
    const pData = await pRes.json();
    if (!wRes.ok) { toast.error('Wheel not found'); router.push('/dashboard/wheels'); return; }
    setWheel(wData.wheel);
    setSegments((wData.segments ?? []).map(normalizeSegment));
    setPrizes(pData.prizes ?? []);
    if (tRes.ok) { const tData = await tRes.json(); setSavedThemes(tData.themes ?? []); }
  }

  // Apply saved theme on load if exists — runs only once after both wheel and themes are loaded
  useEffect(() => {
    if (!wheel || !savedThemes.length || themeRestoredRef.current) return;
    const savedThemeStr = localStorage.getItem(`wheel-${id}-theme`);
    if (!savedThemeStr) return;

    let themeToApply: { id: string; name: string; emoji: string; type: 'custom' | 'built-in'; config?: Record<string, unknown>; branding?: Record<string, unknown>; segmentPalette?: Array<{ bg_color: string; text_color: string }> } | null = null;

    try {
      const savedTheme = JSON.parse(savedThemeStr);
      // Check custom themes
      const customTheme = savedThemes.find(t => t.id === savedTheme.id);
      if (customTheme) {
        themeToApply = { id: customTheme.id, name: customTheme.name, emoji: customTheme.emoji, type: 'custom', config: customTheme.config, branding: customTheme.branding, segmentPalette: customTheme.segment_palette };
      } else {
        // Check built-in templates
        const builtIn = WHEEL_TEMPLATES.find(t => t.id === savedTheme.id);
        if (builtIn) {
          themeToApply = { id: builtIn.id, name: builtIn.name, emoji: builtIn.emoji, type: 'built-in', config: builtIn.config, branding: builtIn.branding, segmentPalette: builtIn.segmentPalette };
        }
      }

      if (themeToApply) {
        themeRestoredRef.current = true; // prevent re-running when setWheel triggers re-render
        const tb = themeToApply.branding as Record<string, unknown>;
        setWheel({ ...wheel, config: { ...wheel.config, ...themeToApply.config }, branding: {
          ...wheel.branding,
          // Clear premium URLs when the restored theme doesn't carry them.
          premium_face_url: (tb.premium_face_url as string) ?? null,
          premium_stand_url: (tb.premium_stand_url as string) ?? null,
          ...themeToApply.branding,
        } });
        if (themeToApply.segmentPalette?.length) {
          setSegments(prev => prev.map((seg, i) => ({ ...seg, bg_color: themeToApply!.segmentPalette![i % themeToApply!.segmentPalette!.length].bg_color, text_color: themeToApply!.segmentPalette![i % themeToApply!.segmentPalette!.length].text_color })));
        }
        setAppliedTheme({ id: themeToApply.id, name: themeToApply.name, emoji: themeToApply.emoji, type: themeToApply.type });
      } else {
        themeRestoredRef.current = true; // no matching theme found, stop checking
      }
    } catch (e) {
      themeRestoredRef.current = true; // invalid JSON, stop checking
    }
  }, [wheel, savedThemes, id]);

  useEffect(() => { load(); }, [id]);

  async function reloadThemes() {
    const tRes = await api.get('/api/themes');
    if (tRes.ok) { const tData = await tRes.json(); setSavedThemes(tData.themes ?? []); }
  }

  async function saveCurrentAsTheme() {
    if (!wheel || !saveThemeName.trim()) { toast.error('Enter a theme name'); return; }
    setSavingTheme(true);
    try {
      const gameType = wheel.config.game_type ?? 'wheel';
      const res = await api.post('/api/themes', {
        name: saveThemeName.trim(),
        emoji: saveThemeEmoji,
        branding: wheel.branding,
        config: { ...wheel.config, game_type: gameType },
        segment_palette: segments.map((s) => ({ bg_color: s.bg_color, text_color: s.text_color })),
      });
      if (!res.ok) { toast.error('Failed to save theme'); return; }
      toast.success(`Theme "${saveThemeName.trim()}" saved`);
      setSaveThemeDialog(false);
      setSaveThemeName('');
      setSaveThemeEmoji('🎨');
      await reloadThemes();
    } finally { setSavingTheme(false); }
  }

  // Auto-load Google Font whenever the branding font changes
  useEffect(() => {
    if (wheel?.branding.font_family) loadGoogleFont(wheel.branding.font_family);
  }, [wheel?.branding.font_family]);

  async function saveWheel() {
    if (!wheel) return;
    setSaving(true);
    try {
      const res = await api.put(`/api/wheels/${id}`, {
        name: wheel.name,
        config: wheel.config,
        branding: wheel.branding,
        form_config: wheel.form_config,
        trigger_rules: wheel.trigger_rules,
      });
      if (res.ok) toast.success('Wheel saved');
      else toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function saveSegments() {
    setSaving(true);
    try {
      const res = await api.put(`/api/wheels/${id}/segments`, { segments });
      const data = await res.json();
      if (res.ok) { setSegments(data.segments.map(normalizeSegment)); toast.success('Segments saved'); }
      else toast.error(data.error?.message ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  function updateSegment(idx: number, field: string, value: unknown) {
    setSegments((prev) => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  }

  function addSegment() {
    if (segments.length >= 24) { toast.error('Maximum 24 segments allowed'); return; }
    const color = PLAN_COLORS[segments.length % PLAN_COLORS.length];
    const firstSeg = segments[0];
    setSegments((prev) => [...prev, {
      id: `new-${Date.now()}`, wheel_id: id, position: prev.length,
      label: `Segment ${prev.length + 1}`, bg_color: color, text_color: '#FFFFFF',
      weight: 1.0, is_no_prize: true, wins_today: 0, wins_total: 0,
      label_offset_x: firstSeg?.label_offset_x ?? null,
      label_offset_y: firstSeg?.label_offset_y ?? null,
      icon_offset_x:  firstSeg?.icon_offset_x  ?? null,
      icon_offset_y:  firstSeg?.icon_offset_y  ?? null,
    }]);
  }

  function removeSegment(idx: number) {
    if (segments.length <= 2) { toast.error('Minimum 2 segments required'); return; }
    setSegments((prev) => prev.filter((_, i) => i !== idx));
  }

  function applyOffsetsToAll(idx: number) {
    const src = segments[idx];
    setSegments(prev => prev.map(s => ({
      ...s,
      label_offset_x:       src.label_offset_x       ?? null,
      label_offset_y:       src.label_offset_y       ?? null,
      icon_offset_x:        src.icon_offset_x        ?? null,
      icon_offset_y:        src.icon_offset_y        ?? null,
      label_rotation_angle: src.label_rotation_angle ?? null,
      icon_rotation_angle:  src.icon_rotation_angle  ?? null,
    })));
    toast.success('Offsets & rotations applied to all segments');
  }

  const embedCode = wheel ? `<div data-spin-wheel data-token="${wheel.embed_token}"></div>\n<script src="${process.env.NEXT_PUBLIC_APP_URL ?? ''}/widget.js" async></script>` : '';
  const playPageUrl = wheel ? `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/play/${wheel.embed_token}` : '';

  // Generate QR whenever playPageUrl or size changes
  const generateQR = useCallback(async (url: string, size: number) => {
    try {
      const dataUrl = await QRCode.toDataURL(url, { width: size, margin: 2, errorCorrectionLevel: 'M', color: { dark: '#000000', light: '#FFFFFF' } });
      setQrDataUrl(dataUrl);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (playPageUrl) generateQR(playPageUrl, qrSize);
  }, [playPageUrl, qrSize, generateQR]);

  if (!wheel) {
    return <div className="p-8 text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[26px] font-bold tracking-[-0.03em]">{wheel.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <StatusBadge status={wheel.status} />
            <span className="text-sm text-muted-foreground">{wheel.total_spins.toLocaleString()} total spins</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/wheels')} className="gap-1.5 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button
            size="sm"
            className={wheel.status === 'active'
              ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white'}
            onClick={async () => {
              const newStatus = wheel.status === 'active' ? 'paused' : 'active';
              const res = await api.post(`/api/wheels/${id}/publish`, { status: newStatus });
              const data = await res.json();
              if (res.ok) { setWheel((w) => w ? { ...w, status: data.wheel.status } : w); toast.success(`Wheel ${newStatus}`); }
              else toast.error(data.error?.message);
            }}
          >
            {wheel.status === 'active' ? <><Pause className="w-3.5 h-3.5 mr-1.5" />Pause</> : <><Play className="w-3.5 h-3.5 mr-1.5" />Activate</>}
          </Button>
        </div>
      </div>
      <Tabs defaultValue="segments">
        <TabsList>
          <TabsTrigger value="segments">Segments</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="form">Lead Form</TabsTrigger>
          <TabsTrigger value="embed">Embed</TabsTrigger>
        </TabsList>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-8">
          <div className="lg:col-span-7 space-y-6">
            {/* SEGMENTS TAB */}
            <TabsContent value="segments" className="space-y-4 mt-0">
              {/* Image-mode notice */}
              {wheel?.branding.premium_face_url && (
                <div className="flex items-start gap-2.5 rounded-lg bg-amber-500/8 border border-amber-500/20 px-3 py-2.5">
                  <span className="text-amber-400 text-base leading-none mt-px">🖼</span>
                  <div className="text-[12px] leading-relaxed">
                    <span className="font-semibold text-amber-300">Image Mode active</span>
                    <span className="text-amber-300/70"> — the Wheel PNG provides all segment visuals. </span>
                    <span className="text-amber-300/70"><strong className="text-amber-300">Label</strong>, <strong className="text-amber-300">Text Color</strong>, and <strong className="text-amber-300">Prize</strong> still apply. Background Color is ignored.</span>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{segments.length} segments (min 2, max 24)</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={addSegment}>+ Add Segment</Button>
                  <Button size="sm" className="bg-violet-600 hover:bg-violet-500 shadow-[0_0_0_1px_rgb(124_58_237/0.4),0_4px_8px_-2px_rgb(124_58_237/0.3)] transition-all duration-200" onClick={saveSegments} disabled={saving}>
                    <Save className="w-3 h-3 mr-1" />
                    {saving ? 'Saving…' : 'Save Segments'}
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {segments.map((seg, idx) => (
                  <Card key={idx} className="overflow-hidden">
                    <CardContent className="pt-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full border-2 border-white shadow shrink-0 relative overflow-hidden"
                          style={{ backgroundColor: seg.bg_color === 'transparent' ? undefined : seg.bg_color }}>
                          {seg.bg_color === 'transparent' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-amber-500/30 to-amber-700/30">
                              <span className="text-[8px] text-amber-300 font-bold leading-none">IMG</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Label</Label>
                            <Input value={seg.label} onChange={(e) => updateSegment(idx, 'label', e.target.value)} className="h-8 text-sm" />
                          </div>
                          <div>
                            <Label className="text-xs">Weight (probability)</Label>
                            <Input type="number" min="0.0001" step="0.5" value={seg.weight}
                              onChange={(e) => updateSegment(idx, 'weight', parseFloat(e.target.value) || 1)}
                              className="h-8 text-sm" />
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="text-red-500 shrink-0" onClick={() => removeSegment(idx)}>✕</Button>
                      </div>
                      {/* Icon URL */}
                      <div className="space-y-1">
                        <Label className="text-xs">Icon Image URL (optional)</Label>
                        <Input
                          type="url"
                          placeholder="https://example.com/icon.png"
                          value={seg.icon_url ?? ''}
                          onChange={(e) => updateSegment(idx, 'icon_url', e.target.value || null)}
                          className="h-8 text-sm"
                        />
                      </div>

                      {/* Position Controls */}
                      <div className="rounded-md border border-border/40 bg-muted/20 p-2.5 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                            Position Controls
                          </span>
                          <button type="button" onClick={() => applyOffsetsToAll(idx)}
                            className="text-[10px] text-violet-400 hover:text-violet-300 px-1.5 py-0.5 rounded border border-violet-500/30 hover:border-violet-400/50 transition-colors"
                            title="Copy this segment's offsets to all other segments">
                            Apply to all ↓
                          </button>
                        </div>
                        <div className="space-y-1.5">
                          <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Label</span>
                          <OffsetSlider label="X  (radial — outward)" value={seg.label_offset_x ?? null}
                            onChange={(v) => updateSegment(idx, 'label_offset_x', v)} />
                          <OffsetSlider label="Y  (perpendicular)" value={seg.label_offset_y ?? null}
                            onChange={(v) => updateSegment(idx, 'label_offset_y', v)} />
                          <AngleSlider label="Rotation" value={seg.label_rotation_angle ?? null}
                            onChange={(v) => updateSegment(idx, 'label_rotation_angle', v)} />
                        </div>
                        {seg.icon_url && (
                          <div className="space-y-1.5">
                            <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Icon</span>
                            <OffsetSlider label="X  (radial — outward)" value={seg.icon_offset_x ?? null}
                              onChange={(v) => updateSegment(idx, 'icon_offset_x', v)} />
                            <OffsetSlider label="Y  (perpendicular)" value={seg.icon_offset_y ?? null}
                              onChange={(v) => updateSegment(idx, 'icon_offset_y', v)} />
                            <AngleSlider label="Rotation" value={seg.icon_rotation_angle ?? null}
                              onChange={(v) => updateSegment(idx, 'icon_rotation_angle', v)} />
                          </div>
                        )}
                      </div>

                      <div className={`grid gap-3 ${wheel?.branding.premium_face_url ? 'grid-cols-2' : 'grid-cols-3'}`}>
                        {!wheel?.branding.premium_face_url && (
                          <div>
                            <Label className="text-xs">Background Color</Label>
                            <div className="flex gap-2 items-center">
                              <input type="color"
                                value={seg.bg_color.startsWith('#') ? seg.bg_color : '#7C3AED'}
                                onChange={(e) => updateSegment(idx, 'bg_color', e.target.value)}
                                className="w-8 h-8 rounded cursor-pointer border" />
                              <Input value={seg.bg_color} onChange={(e) => updateSegment(idx, 'bg_color', e.target.value)} className="h-8 text-sm font-mono" />
                            </div>
                          </div>
                        )}
                        <div>
                          <Label className="text-xs">Text Color</Label>
                          <div className="flex gap-2 items-center">
                            <input type="color"
                              value={seg.text_color.startsWith('#') ? seg.text_color : '#FFFFFF'}
                              onChange={(e) => updateSegment(idx, 'text_color', e.target.value)}
                              className="w-8 h-8 rounded cursor-pointer border" />
                            <Input value={seg.text_color} onChange={(e) => updateSegment(idx, 'text_color', e.target.value)} className="h-8 text-sm font-mono" />
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">Prize</Label>
                          <Select
                            value={seg.prize_id ?? 'no-prize'}
                            onValueChange={(v) => {
                              const val = v ?? 'no-prize';
                              updateSegment(idx, 'prize_id', val === 'no-prize' ? null : val);
                              updateSegment(idx, 'is_no_prize', val === 'no-prize');
                            }}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue placeholder="No prize" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="no-prize">No Prize</SelectItem>
                              {prizes.map((p) => (
                                <SelectItem key={p.id} value={p.id}>{p.display_title}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* SETTINGS TAB */}
            <TabsContent value="settings" className="space-y-6 mt-0">
              <Card>
                <CardHeader className="border-b border-border/50 px-4 py-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Layers className="h-4 w-4 text-muted-foreground" />
                    General
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Wheel Name (internal)</Label>
                    <Input value={wheel.name} onChange={(e) => setWheel({ ...wheel, name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Game Type</Label>
                    <Select
                      value={wheel.config.game_type ?? 'wheel'}
                      onValueChange={(v) => {
                        setWheel({ ...wheel, config: { ...wheel.config, game_type: v as 'wheel' | 'scratch_card' | 'slot_machine' | 'roulette' } });
                        setAppliedTheme(null);
                      }}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="wheel">🎡 Spin Wheel</SelectItem>
                        <SelectItem value="scratch_card">🎴 Scratch Card</SelectItem>
                        <SelectItem value="slot_machine">🎰 Slot Machine</SelectItem>
                        <SelectItem value="roulette">🎰 Roulette</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Choose the game mechanic shown to your visitors</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="border-b border-border/50 px-4 py-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Zap className="h-4 w-4 text-muted-foreground" />
                    Spin Behaviour
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Spin Duration (ms)</Label>
                    <Input type="number" min="2000" max="10000" step="500"
                      value={wheel.config.spin_duration_ms ?? 4000}
                      onChange={(e) => setWheel({ ...wheel, config: { ...wheel.config, spin_duration_ms: parseInt(e.target.value) } })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Animation Speed</Label>
                    <Select value={wheel.config.animation_speed ?? 'medium'}
                      onValueChange={(v) => setWheel({ ...wheel, config: { ...wheel.config, animation_speed: (v ?? 'medium') as 'slow' | 'medium' | 'fast' | 'custom' } })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="slow">Slow</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="fast">Fast</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between col-span-2">
                    <Label>Confetti on win</Label>
                    <Switch checked={wheel.config.confetti_enabled ?? true}
                      onCheckedChange={(v) => setWheel({ ...wheel, config: { ...wheel.config, confetti_enabled: v } })} />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label>Show segment labels</Label>
                      <Switch checked={wheel.config.show_segment_labels ?? true}
                        onCheckedChange={(v) => setWheel({ ...wheel, config: { ...wheel.config, show_segment_labels: v } })} />
                    </div>
                    {wheel.branding.premium_face_url && (
                      <p className="text-[11px] text-amber-400/80 leading-relaxed">
                        Turn <strong>OFF</strong> if your wheel image already has labels drawn into it — otherwise labels will appear twice.
                      </p>
                    )}
                  </div>
                  {/* Sound */}
                  <div className="flex items-center justify-between col-span-2">
                    <Label>Sound on spin</Label>
                    <Switch checked={wheel.config.sound_enabled ?? false}
                      onCheckedChange={(v) => setWheel({ ...wheel, config: { ...wheel.config, sound_enabled: v } })} />
                  </div>
                  {wheel.config.sound_enabled && (
                    <div className="col-span-2 space-y-1.5">
                      <Label className="text-sm">Sound URL</Label>
                      <div className="flex gap-2 items-center">
                        <Input
                          type="url"
                          placeholder="https://example.com/spin.mp3"
                          value={wheel.config.sound_url ?? ''}
                          onChange={(e) => setWheel({ ...wheel, config: { ...wheel.config, sound_url: e.target.value || null } })}
                          className="h-8 text-sm"
                        />
                        <label className="cursor-pointer shrink-0 px-3 py-1.5 rounded-md border text-xs font-medium hover:bg-muted transition-colors">
                          Upload
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
                      <p className="text-[10px] text-muted-foreground">Hosted MP3/WAV URL or upload a local file for preview (save a hosted URL for production)</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* ── GUARANTEED WIN ─────────────────────────────────────────── */}
              <Card>
                <CardHeader className="border-b border-border/50 px-4 py-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-muted-foreground" />
                    Guaranteed Win
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-xs text-muted-foreground">Force a specific segment to win every N plays. Useful for promotions where every Nth visitor is guaranteed a prize.</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-sm">Win Every N Spins</Label>
                      <Input
                        type="number"
                        min="2"
                        max="1000"
                        step="1"
                        placeholder="Off"
                        value={wheel.config.guaranteed_win_every_n ?? ''}
                        onChange={(e) => setWheel({ ...wheel, config: { ...wheel.config, guaranteed_win_every_n: e.target.value ? parseInt(e.target.value) : null } })}
                        className="h-8 text-sm"
                      />
                      <p className="text-[10px] text-muted-foreground">e.g. 10 = every 10th spin wins. Leave blank to disable.</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm">Forced Winning Segment</Label>
                      <Select
                        value={wheel.config.guaranteed_win_segment_id ?? ''}
                        onValueChange={(v) => setWheel({ ...wheel, config: { ...wheel.config, guaranteed_win_segment_id: v || null } })}
                      >
                        <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select segment…" /></SelectTrigger>
                        <SelectContent>
                          {segments.filter(s => !s.is_no_prize).map((s) => (
                            <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-[10px] text-muted-foreground">Which segment lands on the Nth spin</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="border-b border-border/50 px-4 py-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Palette className="h-4 w-4 text-muted-foreground" />
                    Branding
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Button Text</Label>
                    <Input value={wheel.branding.button_text ?? 'SPIN NOW!'}
                      onChange={(e) => setWheel({ ...wheel, branding: { ...wheel.branding, button_text: e.target.value } })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Font Family</Label>
                    <Select
                      value={wheel.branding.font_family ?? 'Inter, sans-serif'}
                      onValueChange={(v) => setWheel({ ...wheel, branding: { ...wheel.branding, font_family: v ?? undefined } })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose font…" />
                      </SelectTrigger>
                      <SelectContent>
                        {['Sans-serif', 'Display', 'Handwriting', 'Serif', 'Monospace', 'System'].map((cat) => {
                          const opts = FONT_OPTIONS.filter((f) => f.category === cat);
                          if (!opts.length) return null;
                          return (
                            <div key={cat}>
                              <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{cat}</div>
                              {opts.map((f) => (
                                <SelectItem key={f.value} value={f.value}>
                                  <span style={{ fontFamily: f.value }}>{f.label}</span>
                                </SelectItem>
                              ))}
                            </div>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* ── PREMIUM IMAGE MODE ─────────────────────────────────────── */}
              {(!wheel.config.game_type || wheel.config.game_type === 'wheel') && (
                <Card>
                  <CardHeader className="border-b border-border/50 px-4 py-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-violet-400" />
                      Premium Image Mode
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Enable Image Mode</p>
                        <p className="text-xs text-muted-foreground">Use custom PNG layers instead of the standard rendered wheel</p>
                      </div>
                      <Switch
                        checked={!!wheel.branding.premium_face_url}
                        onCheckedChange={(enabled) => setWheel({
                          ...wheel,
                          branding: {
                            ...wheel.branding,
                            premium_face_url:  enabled ? (wheel.branding.premium_face_url  || '/assets/premium-wheels/Wheel.png') : null,
                            premium_stand_url: enabled ? (wheel.branding.premium_stand_url || '/assets/premium-wheels/Stand.png') : null,
                            premium_content_scale: enabled ? (wheel.branding.premium_content_scale ?? 0.75) : undefined,
                            // Suppress standard decorators that conflict with image layers
                            outer_ring_width:   enabled ? 0    : (wheel.branding.outer_ring_width ?? 20),
                            inner_ring_enabled: enabled ? false : wheel.branding.inner_ring_enabled,
                            rim_tick_style:     enabled ? 'none' : (wheel.branding.rim_tick_style ?? 'triangles'),
                          },
                        })}
                      />
                    </div>

                    {!!wheel.branding.premium_face_url && (
                      <>
                        {/* URLs */}
                        <div className="space-y-3">
                          <div className="space-y-1.5">
                            <Label className="text-sm">Wheel Face URL <span className="text-muted-foreground font-normal">(spinning disc PNG)</span></Label>
                            <div className="flex gap-2">
                              <Input
                                value={wheel.branding.premium_face_url ?? ''}
                                placeholder="/assets/premium-wheels/Wheel.png"
                                onChange={(e) => setWheel({ ...wheel, branding: { ...wheel.branding, premium_face_url: e.target.value || null } })}
                                className="h-8 text-sm font-mono"
                              />
                              {wheel.branding.premium_face_url && (
                                <button
                                  type="button"
                                  onClick={() => setWheel({ ...wheel, branding: { ...wheel.branding, premium_face_url: null } })}
                                  className="shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors border border-input"
                                  title="Clear"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground">Must be a publicly accessible URL or a path under <code>/public/</code></p>
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-sm">Stand / Frame URL <span className="text-muted-foreground font-normal">(static overlay PNG)</span></Label>
                            <div className="flex gap-2">
                              <Input
                                value={wheel.branding.premium_stand_url ?? ''}
                                placeholder="/assets/premium-wheels/Stand.png"
                                onChange={(e) => setWheel({ ...wheel, branding: { ...wheel.branding, premium_stand_url: e.target.value || null } })}
                                className="h-8 text-sm font-mono"
                              />
                              {wheel.branding.premium_stand_url && (
                                <button
                                  type="button"
                                  onClick={() => setWheel({ ...wheel, branding: { ...wheel.branding, premium_stand_url: null } })}
                                  className="shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors border border-input"
                                  title="Clear"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground">Leave empty to use no frame — just the spinning face</p>
                          </div>
                        </div>

                        {/* Tuning sliders */}
                        <div className="rounded-lg bg-black/20 border border-white/5 p-3 space-y-3">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Label Placement Tuning</p>

                          {/* Content Scale */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs text-muted-foreground">Content Scale</Label>
                              <span className="text-xs font-mono font-semibold tabular-nums">
                                {(wheel.branding.premium_content_scale ?? 0.75).toFixed(2)}
                              </span>
                            </div>
                            <input
                              type="range" min="0.2" max="1.2" step="0.05"
                              value={wheel.branding.premium_content_scale ?? 0.75}
                              onChange={(e) => setWheel({ ...wheel, branding: { ...wheel.branding, premium_content_scale: parseFloat(e.target.value) } })}
                              className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-violet-500"
                              style={{
                                background: `linear-gradient(to right, oklch(0.55 0.22 264) ${(((wheel.branding.premium_content_scale ?? 0.75) - 0.2) / 1.0) * 100}%, oklch(1 0 0 / 10%) ${(((wheel.branding.premium_content_scale ?? 0.75) - 0.2) / 1.0) * 100}%)`
                              }}
                            />
                            <p className="text-[10px] text-muted-foreground">Move labels in/out — increase if labels are too central, decrease if they appear outside the wheel</p>
                          </div>

                          {/* Center Offset Y */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs text-muted-foreground">Center Offset Y</Label>
                              <span className="text-xs font-mono font-semibold tabular-nums">
                                {wheel.branding.premium_center_offset_y ?? 0}px
                              </span>
                            </div>
                            <input
                              type="range" min="-80" max="80" step="1"
                              value={wheel.branding.premium_center_offset_y ?? 0}
                              onChange={(e) => setWheel({ ...wheel, branding: { ...wheel.branding, premium_center_offset_y: parseFloat(e.target.value) || undefined } })}
                              className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-violet-500"
                              style={{
                                background: `linear-gradient(to right, oklch(0.55 0.22 264) ${(((wheel.branding.premium_center_offset_y ?? 0) + 80) / 160) * 100}%, oklch(1 0 0 / 10%) ${(((wheel.branding.premium_center_offset_y ?? 0) + 80) / 160) * 100}%)`
                              }}
                            />
                            <p className="text-[10px] text-muted-foreground">Shift label centre vertically — use if the disc is not centred in the image</p>
                          </div>
                        </div>

                        {/* Paste Config from Theme Tester */}
                        <div className="rounded-lg bg-violet-500/8 border border-violet-500/20 p-3 space-y-2">
                          <p className="text-[11px] font-semibold text-violet-300 flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5" />
                            Import from Theme Tester
                          </p>
                          <p className="text-[11px] text-muted-foreground/70 leading-relaxed">
                            Paste the JSON copied from Theme Tester and all settings will be applied automatically.
                          </p>
                          <div className="flex gap-2">
                            <Textarea
                              id="paste-config-input"
                              placeholder={'{\n  "premium_content_scale": 0.75,\n  "label_font_size": 12,\n  ...\n}'}
                              className="h-20 text-xs font-mono resize-none bg-black/30"
                            />
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="w-full h-7 text-xs gap-1.5 border-violet-500/30 text-violet-300 hover:bg-violet-500/10"
                            onClick={() => {
                              const textarea = document.getElementById('paste-config-input') as HTMLTextAreaElement;
                              try {
                                const cfg = JSON.parse(textarea.value);
                                setWheel((prev) => {
                                  if (!prev) return prev;
                                  return {
                                    ...prev,
                                    config: {
                                      ...prev.config,
                                      ...(cfg.show_segment_labels !== undefined ? { show_segment_labels: cfg.show_segment_labels } : {}),
                                    },
                                    branding: {
                                      ...prev.branding,
                                      ...(cfg.premium_face_url        !== undefined ? { premium_face_url:        cfg.premium_face_url        } : {}),
                                      ...(cfg.premium_stand_url       !== undefined ? { premium_stand_url:       cfg.premium_stand_url       } : {}),
                                      ...(cfg.premium_content_scale   !== undefined ? { premium_content_scale:   cfg.premium_content_scale   } : {}),
                                      ...(cfg.premium_center_offset_y !== undefined ? { premium_center_offset_y: cfg.premium_center_offset_y } : {}),
                                      ...(cfg.label_font_size         !== undefined ? { label_font_size:         cfg.label_font_size         } : {}),
                                      ...(cfg.label_font_weight       !== undefined ? { label_font_weight:       cfg.label_font_weight       } : {}),
                                      ...(cfg.label_position          !== undefined ? { label_position:          cfg.label_position          } : {}),
                                      ...(cfg.outer_ring_width        !== undefined ? { outer_ring_width:        cfg.outer_ring_width        } : {}),
                                      ...(cfg.inner_ring_enabled      !== undefined ? { inner_ring_enabled:      cfg.inner_ring_enabled      } : {}),
                                      ...(cfg.rim_tick_style          !== undefined ? { rim_tick_style:          cfg.rim_tick_style          } : {}),
                                    },
                                  };
                                });
                                textarea.value = '';
                                toast.success('Config applied — remember to Save');
                              } catch {
                                toast.error('Invalid JSON — copy again from Theme Tester');
                              }
                            }}
                          >
                            Apply Config
                          </Button>
                        </div>

                        <div className="flex items-start gap-2 rounded-lg bg-amber-500/8 border border-amber-500/15 p-2.5">
                          <ImageIcon className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <p className="text-[11px] text-amber-300/80 leading-relaxed">
                            Use the <strong className="text-amber-300">Theme Tester</strong> tool to upload and preview images locally before entering URLs here.
                          </p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader className="border-b border-border/50 px-4 py-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <CircleIcon className="h-4 w-4 text-muted-foreground" />
                    Visual Ring
                    {!!wheel.branding.premium_face_url && (
                      <Badge variant="outline" className="ml-auto text-[10px] text-amber-400 border-amber-500/30">
                        Overridden by Image Mode
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className={`space-y-4 ${wheel.branding.premium_face_url ? 'opacity-40 pointer-events-none select-none' : ''}`}>

                  {/* Outer ring */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-sm">Outer Ring Color</Label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="color"
                          value={wheel.branding.outer_ring_color ?? wheel.branding.primary_color ?? '#7C3AED'}
                          onChange={(e) => setWheel({ ...wheel, branding: { ...wheel.branding, outer_ring_color: e.target.value } })}
                          className="w-8 h-8 rounded cursor-pointer border"
                        />
                        <Input
                          value={wheel.branding.outer_ring_color ?? ''}
                          placeholder={wheel.branding.primary_color ?? '#7C3AED'}
                          onChange={(e) => setWheel({ ...wheel, branding: { ...wheel.branding, outer_ring_color: e.target.value } })}
                          className="h-8 text-sm font-mono"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm">Ring Width (px)</Label>
                      <Input
                        type="number" min="8" max="40" step="2"
                        value={wheel.branding.outer_ring_width ?? 20}
                        onChange={(e) => setWheel({ ...wheel, branding: { ...wheel.branding, outer_ring_width: parseInt(e.target.value) || 20 } })}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>

                  {/* Rim ticks */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-sm">Rim Tick Style</Label>
                      <Select
                        value={wheel.branding.rim_tick_style ?? 'triangles'}
                        onValueChange={(v) => setWheel({ ...wheel, branding: { ...wheel.branding, rim_tick_style: (v ?? 'triangles') as 'none' | 'dots' | 'triangles' } })}
                      >
                        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="triangles">Triangles</SelectItem>
                          <SelectItem value="dots">Dots</SelectItem>
                          <SelectItem value="none">None</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm">Tick Color</Label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="color"
                          value={wheel.branding.rim_tick_color ?? '#FFFFFF'}
                          onChange={(e) => setWheel({ ...wheel, branding: { ...wheel.branding, rim_tick_color: e.target.value } })}
                          className="w-8 h-8 rounded cursor-pointer border"
                        />
                        <Input
                          value={wheel.branding.rim_tick_color ?? '#FFFFFF'}
                          onChange={(e) => setWheel({ ...wheel, branding: { ...wheel.branding, rim_tick_color: e.target.value } })}
                          className="h-8 text-sm font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Inner ring */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Inner Ring Band</Label>
                      <Switch
                        checked={wheel.branding.inner_ring_enabled ?? false}
                        onCheckedChange={(v) => setWheel({ ...wheel, branding: { ...wheel.branding, inner_ring_enabled: v } })}
                      />
                    </div>
                    {wheel.branding.inner_ring_enabled && (
                      <div className="space-y-1.5">
                        <Label className="text-sm">Inner Ring Color</Label>
                        <div className="flex gap-2 items-center">
                          <input
                            type="color"
                            value={wheel.branding.inner_ring_color ?? '#ffffff'}
                            onChange={(e) => setWheel({ ...wheel, branding: { ...wheel.branding, inner_ring_color: e.target.value } })}
                            className="w-8 h-8 rounded cursor-pointer border"
                          />
                          <Input
                            value={wheel.branding.inner_ring_color ?? ''}
                            placeholder="rgba(255,255,255,0.18)"
                            onChange={(e) => setWheel({ ...wheel, branding: { ...wheel.branding, inner_ring_color: e.target.value } })}
                            className="h-8 text-sm font-mono"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Center image */}
                  <div className="space-y-1.5">
                    <Label className="text-sm">Center Hub Image URL (optional)</Label>
                    <Input
                      type="url"
                      placeholder="https://example.com/logo.png"
                      value={wheel.config.center_image_url ?? ''}
                      onChange={(e) => setWheel({ ...wheel, config: { ...wheel.config, center_image_url: e.target.value || null } })}
                      className="h-8 text-sm"
                    />
                    <p className="text-xs text-muted-foreground">Logo displayed in the center circle of the wheel</p>
                  </div>

                </CardContent>
              </Card>

              {/* ── SEGMENT LABELS (wheel only) ── */}
              {(!wheel.config.game_type || wheel.config.game_type === 'wheel') && (
                <Card>
                  <CardHeader className="border-b border-border/50 px-4 py-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Type className="h-4 w-4 text-muted-foreground" />
                      Segment Labels
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Font size */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Font Size (px)</Label>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-muted-foreground">Auto</span>
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
                          placeholder="Auto"
                          onChange={(e) => setWheel({ ...wheel, branding: { ...wheel.branding, label_font_size: parseInt(e.target.value) || null } })}
                          className="h-8 text-sm"
                        />
                      </div>

                      {/* Font weight */}
                      <div className="space-y-1.5">
                        <Label className="text-sm">Font Weight</Label>
                        <Select
                          value={wheel.branding.label_font_weight ?? '700'}
                          onValueChange={(v) => setWheel({ ...wheel, branding: { ...wheel.branding, label_font_weight: v as '400' | '600' | '700' | '800' } })}
                        >
                          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="400">Normal</SelectItem>
                            <SelectItem value="600">SemiBold</SelectItem>
                            <SelectItem value="700">Bold</SelectItem>
                            <SelectItem value="800">ExtraBold</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Label position */}
                      <div className="space-y-1.5">
                        <Label className="text-sm">Text Position</Label>
                        <Select
                          value={wheel.branding.label_position ?? 'outer'}
                          onValueChange={(v) => setWheel({ ...wheel, branding: { ...wheel.branding, label_position: v as 'inner' | 'center' | 'outer' } })}
                        >
                          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="inner">Inner (near hub)</SelectItem>
                            <SelectItem value="center">Center</SelectItem>
                            <SelectItem value="outer">Outer (near rim)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Label rotation */}
                      <div className="space-y-1.5">
                        <Label className="text-sm">Label Rotation</Label>
                        <Select
                          value={wheel.config.label_rotation ?? 'radial'}
                          onValueChange={(v) => setWheel({ ...wheel, config: { ...wheel.config, label_rotation: v as 'radial' | 'horizontal' } })}
                        >
                          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="radial">Radial (rotates with segment)</SelectItem>
                            <SelectItem value="horizontal">Horizontal (always upright)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Text transform */}
                      <div className="space-y-1.5">
                        <Label className="text-sm">Text Transform</Label>
                        <Select
                          value={wheel.branding.label_text_transform ?? 'none'}
                          onValueChange={(v) => setWheel({ ...wheel, branding: { ...wheel.branding, label_text_transform: v as 'none' | 'uppercase' | 'capitalize' } })}
                        >
                          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="uppercase">UPPERCASE</SelectItem>
                            <SelectItem value="capitalize">Capitalize Each Word</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Letter spacing */}
                      <div className="space-y-1.5">
                        <Label className="text-sm">Letter Spacing (px)</Label>
                        <Input
                          type="number" min="-2" max="10" step="0.5"
                          value={wheel.branding.label_letter_spacing ?? 0}
                          onChange={(e) => setWheel({ ...wheel, branding: { ...wheel.branding, label_letter_spacing: parseFloat(e.target.value) || 0 } })}
                          className="h-8 text-sm"
                        />
                      </div>

                      {/* Icon position */}
                      <div className="space-y-1.5 col-span-2">
                        <Label className="text-sm">Icon Position (when segment has icon)</Label>
                        <Select
                          value={wheel.branding.icon_position ?? 'outer'}
                          onValueChange={(v) => setWheel({ ...wheel, branding: { ...wheel.branding, icon_position: v as 'outer' | 'inner' | 'overlay' } })}
                        >
                          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="outer">Outer — icon near rim, label near hub</SelectItem>
                            <SelectItem value="inner">Inner — icon near hub, label near rim</SelectItem>
                            <SelectItem value="overlay">Overlay — label on top of icon</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">Controls where the icon sits relative to the label so they never overlap</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* ── SCRATCH CARD SETTINGS (shown only when game_type = scratch_card) ── */}
              {wheel.config.game_type === 'scratch_card' && (
                <Card>
                  <CardHeader className="border-b border-border/50 px-4 py-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      Scratch Card
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Layer color */}
                      <div className="space-y-1.5">
                        <Label className="text-sm">Scratch Layer Color</Label>
                        <div className="flex gap-2 items-center">
                          <input type="color" value={wheel.config.scratch_layer_color ?? '#B0B0B0'}
                            onChange={(e) => setWheel({ ...wheel, config: { ...wheel.config, scratch_layer_color: e.target.value } })}
                            className="w-8 h-8 rounded cursor-pointer border" />
                          <Input value={wheel.config.scratch_layer_color ?? '#B0B0B0'}
                            onChange={(e) => setWheel({ ...wheel, config: { ...wheel.config, scratch_layer_color: e.target.value } })}
                            className="h-8 text-sm font-mono" />
                        </div>
                      </div>
                      {/* Layer style */}
                      <div className="space-y-1.5">
                        <Label className="text-sm">Scratch Layer Style</Label>
                        <Select value={wheel.config.scratch_layer_style ?? 'solid'}
                          onValueChange={(v) => setWheel({ ...wheel, config: { ...wheel.config, scratch_layer_style: v as 'solid' | 'metallic' | 'foil' | 'striped' } })}>
                          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="solid">Solid</SelectItem>
                            <SelectItem value="metallic">Metallic Silver</SelectItem>
                            <SelectItem value="foil">Rainbow Foil</SelectItem>
                            <SelectItem value="striped">Striped</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {/* Card layout */}
                      <div className="space-y-1.5">
                        <Label className="text-sm">Card Layout</Label>
                        <Select value={wheel.config.scratch_card_layout ?? 'single'}
                          onValueChange={(v) => setWheel({ ...wheel, config: { ...wheel.config, scratch_card_layout: v as 'single' | 'grid_2x2' | 'row_3x1' } })}>
                          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="single">Single Prize</SelectItem>
                            <SelectItem value="grid_2x2">2×2 Grid</SelectItem>
                            <SelectItem value="row_3x1">3×1 Row</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {/* Card size */}
                      <div className="space-y-1.5">
                        <Label className="text-sm">Card Size</Label>
                        <Select value={wheel.config.scratch_card_size ?? 'medium'}
                          onValueChange={(v) => setWheel({ ...wheel, config: { ...wheel.config, scratch_card_size: v as 'small' | 'medium' | 'large' } })}>
                          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="small">Small (280×160)</SelectItem>
                            <SelectItem value="medium">Medium (340×200)</SelectItem>
                            <SelectItem value="large">Large (420×260)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {/* Border color */}
                      <div className="space-y-1.5">
                        <Label className="text-sm">Border Color</Label>
                        <div className="flex gap-2 items-center">
                          <input type="color" value={wheel.config.scratch_border_color ?? wheel.branding.primary_color ?? '#7C3AED'}
                            onChange={(e) => setWheel({ ...wheel, config: { ...wheel.config, scratch_border_color: e.target.value } })}
                            className="w-8 h-8 rounded cursor-pointer border" />
                          <Input value={wheel.config.scratch_border_color ?? ''}
                            placeholder={wheel.branding.primary_color ?? '#7C3AED'}
                            onChange={(e) => setWheel({ ...wheel, config: { ...wheel.config, scratch_border_color: e.target.value } })}
                            className="h-8 text-sm font-mono" />
                        </div>
                      </div>
                      {/* Border radius */}
                      <div className="space-y-1.5">
                        <Label className="text-sm">Corner Radius (px)</Label>
                        <Input type="number" min="0" max="40" step="4"
                          value={wheel.config.scratch_border_radius ?? 16}
                          onChange={(e) => setWheel({ ...wheel, config: { ...wheel.config, scratch_border_radius: parseInt(e.target.value) || 16 } })}
                          className="h-8 text-sm" />
                      </div>
                    </div>
                    {/* Reveal threshold slider */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Reveal Threshold</Label>
                        <span className="text-sm font-mono text-muted-foreground">
                          {Math.round((wheel.config.scratch_reveal_threshold ?? 0.6) * 100)}%
                        </span>
                      </div>
                      <input
                        type="range" min="10" max="90" step="5"
                        value={Math.round((wheel.config.scratch_reveal_threshold ?? 0.6) * 100)}
                        onChange={(e) => setWheel({ ...wheel, config: { ...wheel.config, scratch_reveal_threshold: parseInt(e.target.value) / 100 } })}
                        className="w-full accent-violet-600"
                      />
                      <p className="text-xs text-muted-foreground">How much of the card must be scratched before auto-revealing the prize</p>
                    </div>

                    {/* Scratch sensitivity / brush size */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Scratch Sensitivity</Label>
                        <span className="text-sm font-mono text-muted-foreground">
                          {(wheel.config.scratch_brush_multiplier ?? 1.0).toFixed(1)}×
                        </span>
                      </div>
                      <input
                        type="range" min="5" max="30" step="1"
                        value={Math.round((wheel.config.scratch_brush_multiplier ?? 1.0) * 10)}
                        onChange={(e) => setWheel({ ...wheel, config: { ...wheel.config, scratch_brush_multiplier: parseInt(e.target.value) / 10 } })}
                        className="w-full accent-violet-600"
                      />
                      <p className="text-xs text-muted-foreground">Higher = larger brush, easier/faster to scratch. Range 0.5× (tiny) → 3.0× (huge).</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* ── SLOT MACHINE SETTINGS (shown only when game_type = slot_machine) ── */}
              {wheel.config.game_type === 'slot_machine' && (
                <Card>
                  <CardHeader className="border-b border-border/50 px-4 py-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Dices className="h-4 w-4 text-muted-foreground" />
                      Slot Machine
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Reel count */}
                      <div className="space-y-1.5">
                        <Label className="text-sm">Number of Reels</Label>
                        <Select value={String(wheel.config.slot_reel_count ?? 3)}
                          onValueChange={(v) => setWheel({ ...wheel, config: { ...wheel.config, slot_reel_count: parseInt(v ?? '3') as 2 | 3 | 5 } })}>
                          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="2">2 Reels</SelectItem>
                            <SelectItem value="3">3 Reels</SelectItem>
                            <SelectItem value="5">5 Reels</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {/* Visible rows */}
                      <div className="space-y-1.5">
                        <Label className="text-sm">Visible Rows</Label>
                        <Select value={String(wheel.config.slot_visible_rows ?? 3)}
                          onValueChange={(v) => setWheel({ ...wheel, config: { ...wheel.config, slot_visible_rows: parseInt(v ?? '3') as 1 | 3 | 5 } })}>
                          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 Row</SelectItem>
                            <SelectItem value="3">3 Rows</SelectItem>
                            <SelectItem value="5">5 Rows</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {/* Symbol mode */}
                      <div className="space-y-1.5">
                        <Label className="text-sm">Symbol Display</Label>
                        <Select value={wheel.config.slot_symbol_mode ?? 'both'}
                          onValueChange={(v) => setWheel({ ...wheel, config: { ...wheel.config, slot_symbol_mode: v as 'icon' | 'label' | 'both' } })}>
                          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="both">Icon + Label</SelectItem>
                            <SelectItem value="icon">Icon Only</SelectItem>
                            <SelectItem value="label">Label Only</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {/* Cabinet style */}
                      <div className="space-y-1.5">
                        <Label className="text-sm">Cabinet Style</Label>
                        <Select value={wheel.config.slot_cabinet_style ?? 'modern'}
                          onValueChange={(v) => setWheel({ ...wheel, config: { ...wheel.config, slot_cabinet_style: v as 'classic' | 'modern' | 'neon' } })}>
                          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="modern">Modern (Flat)</SelectItem>
                            <SelectItem value="classic">Classic (Red)</SelectItem>
                            <SelectItem value="neon">Neon (Glow)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {/* Spin duration */}
                      <div className="space-y-1.5">
                        <Label className="text-sm">Total Spin Duration (ms)</Label>
                        <Input type="number" min="1000" max="8000" step="500"
                          value={wheel.config.slot_spin_duration_ms ?? 3000}
                          onChange={(e) => setWheel({ ...wheel, config: { ...wheel.config, slot_spin_duration_ms: parseInt(e.target.value) || 3000 } })}
                          className="h-8 text-sm" />
                      </div>
                      {/* Stop delay */}
                      <div className="space-y-1.5">
                        <Label className="text-sm">Reel Stop Delay (ms)</Label>
                        <Input type="number" min="100" max="1500" step="100"
                          value={wheel.config.slot_stop_delay_ms ?? 600}
                          onChange={(e) => setWheel({ ...wheel, config: { ...wheel.config, slot_stop_delay_ms: parseInt(e.target.value) || 600 } })}
                          className="h-8 text-sm" />
                        <p className="text-xs text-muted-foreground">Gap between each reel stopping</p>
                      </div>
                      {/* Win-line color */}
                      <div className="space-y-1.5 col-span-2">
                        <Label className="text-sm">Win-line Color</Label>
                        <div className="flex gap-2 items-center">
                          <input type="color" value={wheel.config.slot_win_line_color ?? wheel.branding.primary_color ?? '#7C3AED'}
                            onChange={(e) => setWheel({ ...wheel, config: { ...wheel.config, slot_win_line_color: e.target.value } })}
                            className="w-8 h-8 rounded cursor-pointer border" />
                          <Input value={wheel.config.slot_win_line_color ?? ''}
                            placeholder={wheel.branding.primary_color ?? '#7C3AED'}
                            onChange={(e) => setWheel({ ...wheel, config: { ...wheel.config, slot_win_line_color: e.target.value } })}
                            className="h-8 text-sm font-mono" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* ── ROULETTE SETTINGS (shown only when game_type = roulette) ── */}
              {wheel.config.game_type === 'roulette' && (
                <Card>
                  <CardHeader className="border-b border-border/50 px-4 py-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Dices className="h-4 w-4 text-muted-foreground" />
                      Roulette
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Pocket style */}
                      <div className="space-y-1.5">
                        <Label className="text-sm">Pocket Style</Label>
                        <Select value={wheel.config.roulette_pocket_style ?? 'classic'}
                          onValueChange={(v) => setWheel({ ...wheel, config: { ...wheel.config, roulette_pocket_style: v as 'classic' | 'modern' | 'neon' } })}>
                          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="classic">Classic (Wood)</SelectItem>
                            <SelectItem value="modern">Modern (Flat)</SelectItem>
                            <SelectItem value="neon">Neon (Glow)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {/* Spin duration */}
                      <div className="space-y-1.5">
                        <Label className="text-sm">Spin Duration (ms)</Label>
                        <Input type="number" min="2000" max="10000" step="500"
                          value={wheel.config.roulette_spin_duration_ms ?? 5000}
                          onChange={(e) => setWheel({ ...wheel, config: { ...wheel.config, roulette_spin_duration_ms: parseInt(e.target.value) || 5000 } })}
                          className="h-8 text-sm" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Segments and prizes are shared with the wheel — configure them in the Segments tab.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* ── GEO-FENCE ─────────────────────────────────────────────── */}
              <Card>
                <CardHeader className="border-b border-border/50 px-4 py-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    Geo-fence
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-xs text-muted-foreground">
                    Control which countries can see this wheel. Uses visitor IP via Vercel edge headers.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-sm">Mode</Label>
                      <Select
                        value={(wheel.trigger_rules?.geo_fence?.mode) ?? 'off'}
                        onValueChange={(v) => {
                          if (v === 'off') {
                            setWheel({ ...wheel, trigger_rules: { ...wheel.trigger_rules, geo_fence: null } });
                          } else {
                            setWheel({ ...wheel, trigger_rules: { ...wheel.trigger_rules, geo_fence: { mode: v as 'allow' | 'block', countries: wheel.trigger_rules?.geo_fence?.countries ?? [] } } });
                          }
                        }}
                      >
                        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="off">Off (show everywhere)</SelectItem>
                          <SelectItem value="allow">Allow only listed countries</SelectItem>
                          <SelectItem value="block">Block listed countries</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm">Country Codes</Label>
                      <Input
                        className="h-8 text-sm font-mono"
                        placeholder="IN, US, GB, AE"
                        disabled={!wheel.trigger_rules?.geo_fence?.mode}
                        value={(wheel.trigger_rules?.geo_fence?.countries ?? []).join(', ')}
                        onChange={(e) => {
                          const codes = e.target.value.split(',').map(c => c.trim().toUpperCase()).filter(Boolean);
                          setWheel({ ...wheel, trigger_rules: { ...wheel.trigger_rules, geo_fence: { mode: wheel.trigger_rules?.geo_fence?.mode ?? 'allow', countries: codes } } });
                        }}
                      />
                      <p className="text-[10px] text-muted-foreground">Comma-separated ISO codes (e.g. IN, US, GB)</p>
                    </div>
                  </div>
                  {wheel.trigger_rules?.geo_fence?.mode && (
                    <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                      {wheel.trigger_rules.geo_fence.mode === 'allow'
                        ? `✓ Only visitors from ${(wheel.trigger_rules.geo_fence.countries ?? []).join(', ') || '…'} will see this wheel`
                        : `✗ Visitors from ${(wheel.trigger_rules.geo_fence.countries ?? []).join(', ') || '…'} will be blocked`}
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button className="bg-violet-600 hover:bg-violet-500 shadow-[0_0_0_1px_rgb(124_58_237/0.4),0_4px_12px_-2px_rgb(124_58_237/0.35)] transition-all duration-200" onClick={saveWheel} disabled={saving}>
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                  {saving ? 'Saving…' : 'Save Settings'}
                </Button>
              </div>
            </TabsContent>

            {/* TEMPLATES TAB */}
            <TabsContent value="templates" className="space-y-5 mt-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">
                  Apply a template to instantly change colours, style, and branding. Your segment labels and prizes are kept.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
                  onClick={() => setThemeDialogOpen(true)}
                >
                  <BookMarked className="w-3.5 h-3.5 mr-1.5" />
                  Theme Manager
                </Button>
              </div>

              {/* ── Theme Manager Dialog (with presets + save) ── */}
              <ThemeDialog
                open={themeDialogOpen}
                onOpenChange={setThemeDialogOpen}
                gametype={wheel?.config?.game_type ?? 'wheel'}
                onApplyPreset={(presetConfig) => {
                  if (wheel && presetConfig?.colorPalette) {
                    const palette = presetConfig.colorPalette;
                    // Apply preset colors to wheel segments
                    const newSegments = segments.map((seg) => ({
                      ...seg,
                      bg_color: palette.primary || seg.bg_color,
                      text_color: palette.foreground || seg.text_color,
                    }));
                    setSegments(newSegments);
                    // Update wheel branding and config
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
                    // Close dialog after applying
                    setThemeDialogOpen(false);
                  }
                }}
                onSaveTheme={saveCurrentAsTheme}
                saving={savingTheme}
              />

              {/* ── Currently applied theme indicator ── */}
              {appliedTheme && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <span className="text-lg">{appliedTheme.emoji}</span>
                  <span className="text-sm font-medium">Currently applied:</span>
                  <span className="text-sm text-amber-400">{appliedTheme.name}</span>
                  <span className="text-xs text-muted-foreground capitalize">({appliedTheme.type})</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto h-6 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => setAppliedTheme(null)}
                  >
                    Clear
                  </Button>
                </div>
              )}

              {/* ── Saved custom themes ── */}
              {(() => {
                const currentGameType = wheel.config.game_type ?? 'wheel';
                const filteredThemes = savedThemes.filter((t) => (t.config?.game_type ?? 'wheel') === currentGameType);
                return filteredThemes.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Your Saved Themes</p>
                    <div className="flex-1 h-px bg-amber-500/20" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {filteredThemes.map((theme) => (
                      <Card key={theme.id} className="overflow-hidden hover:border-amber-400/60 transition-colors cursor-pointer group border-amber-500/20">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">{theme.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm">{theme.name}</p>
                              <p className="text-[10px] text-muted-foreground">Custom theme</p>
                            </div>
                          </div>
                          {theme.segment_palette.length > 0 && (
                            <div className="flex gap-1">
                              {theme.segment_palette.slice(0, 6).map((c, i) => (
                                <div key={i} className="w-5 h-5 rounded-full border border-white/20 shadow-sm"
                                  style={{ backgroundColor: c.bg_color === 'transparent' ? '#888' : c.bg_color }} />
                              ))}
                            </div>
                          )}
                          <Button
                            size="sm"
                            variant={appliedTheme?.id === theme.id ? 'default' : 'outline'}
                            className={`w-full transition-colors ${appliedTheme?.id === theme.id ? 'bg-amber-500 text-black border-amber-500' : 'group-hover:bg-amber-500 group-hover:text-black group-hover:border-amber-500'}`}
                            onClick={() => {
                              if (!wheel) return;
                              const tb = theme.branding as Record<string, unknown>;
                              setWheel({
                                ...wheel,
                                config: { ...wheel.config, ...theme.config },
                                branding: {
                                  ...wheel.branding,
                                  // Explicitly clear premium URLs when the custom theme doesn't set them,
                                  // so switching away from a premium theme always removes the overlay.
                                  premium_face_url: (tb.premium_face_url as string) ?? null,
                                  premium_stand_url: (tb.premium_stand_url as string) ?? null,
                                  ...theme.branding,
                                },
                              });
                              if (theme.segment_palette.length > 0) {
                                setSegments((prev) =>
                                  prev.map((seg, i) => {
                                    const palette = theme.segment_palette[i % theme.segment_palette.length];
                                    return { ...seg, bg_color: palette.bg_color, text_color: palette.text_color };
                                  }),
                                );
                                setAppliedTheme({ id: theme.id, name: theme.name, emoji: theme.emoji, type: 'custom' });
                                toast.success(`"${theme.name}" applied — save to persist`);
                              } else {
                                setAppliedTheme({ id: theme.id, name: theme.name, emoji: theme.emoji, type: 'custom' });
                                toast.warning(`"${theme.name}" branding applied — this theme has no segment colors saved`);
                              }
                            }}
                          >
                            {appliedTheme?.id === theme.id ? 'Applied' : 'Apply Theme'}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
                ) : null;
              })()}

              {/* ── Built-in templates ── */}
              <div className="space-y-2">
                {savedThemes.some((t) => (t.config?.game_type ?? 'wheel') === (wheel.config.game_type ?? 'wheel')) && (
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Built-in Templates</p>
                    <div className="flex-1 h-px bg-white/5" />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  {WHEEL_TEMPLATES.filter((tpl) => tpl.gameType === (wheel.config.game_type ?? 'wheel')).map((tpl) => (
                    <Card key={tpl.id} className="overflow-hidden hover:border-violet-400 transition-colors cursor-pointer group">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{tpl.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm">{tpl.name}</p>
                            <p className="text-xs text-muted-foreground">{tpl.description}</p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {tpl.segmentPalette.slice(0, 6).map((c, i) => (
                            <div key={i} className="w-5 h-5 rounded-full border border-white shadow-sm" style={{ backgroundColor: c.bg_color }} />
                          ))}
                        </div>
                        <Button
                          size="sm"
                          variant={appliedTheme?.id === tpl.id ? 'default' : 'outline'}
                          className={`w-full transition-colors ${appliedTheme?.id === tpl.id ? 'bg-violet-600 text-white border-violet-600' : 'group-hover:bg-violet-600 group-hover:text-white group-hover:border-violet-600'}`}
                          onClick={() => {
                            if (!wheel) {
                              console.error('Apply Template Error: wheel state is null/undefined!');
                              return;
                            }
                            
                            const { newConfig, newBranding, newSegments } = applyTemplateToWheel(tpl, segments);
                            
                            const newWheel = {
                              ...wheel,
                              config: { ...wheel.config, ...newConfig },
                              branding: { ...wheel.branding, ...newBranding },
                            };
                            
                            setWheel(newWheel);
                            setSegments(newSegments);
                            setAppliedTheme({ id: tpl.id, name: tpl.name, emoji: tpl.emoji, type: 'built-in' });
                            
                            toast.success(`"${tpl.name}" template applied — save to persist`);
                          }}
                        >
                          {appliedTheme?.id === tpl.id ? 'Applied' : 'Apply Template'}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* LEAD FORM TAB */}
            <TabsContent value="form" className="space-y-4 mt-0">
              <Card>
                <CardHeader className="border-b border-border/50 px-4 py-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    Lead Capture Form
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Enable lead form before spin</Label>
                    <Switch
                      checked={wheel.form_config.enabled ?? false}
                      onCheckedChange={(v) => setWheel({ ...wheel, form_config: { ...wheel.form_config, enabled: v } })}
                    />
                  </div>
                  {wheel.form_config.enabled && (
                    <>
                      {/* Field configuration */}
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">Form Fields</Label>
                        <p className="text-xs text-muted-foreground">Choose which fields to collect before the spin.</p>
                        {([
                          { key: 'name',  label: 'Full Name',      type: 'text'  as const, defaultLabel: 'Your Name' },
                          { key: 'email', label: 'Email Address',  type: 'email' as const, defaultLabel: 'Email' },
                          { key: 'phone', label: 'Mobile Number',  type: 'tel'   as const, defaultLabel: 'Phone' },
                        ] as const).map((f) => {
                          const fields: Array<{ key: string; label: string; type: 'email' | 'text' | 'tel' | 'checkbox'; required?: boolean }> = wheel.form_config.fields ?? [];
                          const existing = fields.find(x => x.key === f.key);
                          const isEnabled = !!existing;
                          const isRequired = existing?.required ?? false;

                          function toggleField(enabled: boolean) {
                            if (!wheel) return;
                            const next = fields.filter(x => x.key !== f.key);
                            if (enabled) next.push({ key: f.key, label: f.defaultLabel, type: f.type, required: isRequired });
                            setWheel({ ...wheel, form_config: { ...wheel.form_config, fields: next } });
                          }
                          function toggleRequired(required: boolean) {
                            if (!wheel) return;
                            const next = fields.map(x => x.key === f.key ? { ...x, required } : x);
                            setWheel({ ...wheel, form_config: { ...wheel.form_config, fields: next } });
                          }

                          return (
                            <div key={f.key} className="flex items-center justify-between rounded-lg border p-3">
                              <div className="flex items-center gap-3">
                                <Switch checked={isEnabled} onCheckedChange={toggleField} />
                                <span className="text-sm font-medium">{f.label}</span>
                              </div>
                              {isEnabled && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Switch checked={isRequired} onCheckedChange={toggleRequired} />
                                  <span>Required</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex items-center justify-between">
                        <Label>Enable GDPR consent checkbox</Label>
                        <Switch
                          checked={wheel.form_config.gdpr_enabled ?? false}
                          onCheckedChange={(v) => setWheel({ ...wheel, form_config: { ...wheel.form_config, gdpr_enabled: v } })}
                        />
                      </div>
                      {wheel.form_config.gdpr_enabled && (
                        <div className="space-y-2">
                          <Label>GDPR Consent Text</Label>
                          <Textarea
                            value={wheel.form_config.gdpr_text ?? ''}
                            onChange={(e) => setWheel({ ...wheel, form_config: { ...wheel.form_config, gdpr_text: e.target.value } })}
                            placeholder="I agree to receive marketing communications…"
                            rows={2}
                          />
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label>Privacy Policy URL (optional)</Label>
                        <Input
                          type="url"
                          value={wheel.form_config.privacy_policy_url ?? ''}
                          onChange={(e) => setWheel({ ...wheel, form_config: { ...wheel.form_config, privacy_policy_url: e.target.value } })}
                          placeholder="https://example.com/privacy"
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
              <div className="flex justify-end">
                <Button className="bg-violet-600 hover:bg-violet-500 shadow-[0_0_0_1px_rgb(124_58_237/0.4),0_4px_12px_-2px_rgb(124_58_237/0.35)] transition-all duration-200" onClick={saveWheel} disabled={saving}>
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                  {saving ? 'Saving…' : 'Save Form Settings'}
                </Button>
              </div>
            </TabsContent>

            {/* EMBED TAB */}
            <TabsContent value="embed" className="space-y-4 mt-0">
              <Card>
                <CardHeader className="border-b border-border/50 px-4 py-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Code className="h-4 w-4 text-muted-foreground" />
                    Embed Code
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Copy and paste this code into your website to display the spin wheel.
                  </p>
                  <pre className="bg-muted rounded-lg p-4 text-sm font-mono overflow-x-auto whitespace-pre-wrap break-all">
                    {embedCode}
                  </pre>
                  <Button variant="outline" onClick={() => { navigator.clipboard.writeText(embedCode); toast.success('Copied!'); }}>
                    Copy Code
                  </Button>
                </CardContent>
              </Card>
              {/* Public Play Page */}
              <Card className="border-violet-500/20 bg-violet-500/5">
                <CardHeader className="border-b border-border/50 px-4 py-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Share2 className="h-4 w-4 text-violet-400" />
                    Public Play Page
                    <Badge className="bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30 text-[10px] font-medium">Shareable</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    A full branded page anyone can open — no login required. Share the link or QR code directly with your customers.
                  </p>
                  <div className="flex gap-2">
                    <Input readOnly value={playPageUrl} className="font-mono text-xs" />
                    <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(playPageUrl); toast.success('Link copied!'); }}>Copy</Button>
                    <Button size="sm" onClick={() => window.open(`${playPageUrl}?_=${Date.now()}`, '_blank')}
                      style={{ backgroundColor: wheel.branding.primary_color ?? '#7C3AED' }} className="text-white">Open ↗</Button>
                  </div>

                  {/* Share channels */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Share via</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                      <a href={`https://wa.me/?text=${encodeURIComponent(`🎡 ${wheel.name} — Spin to win! ${playPageUrl}`)}`}
                        target="_blank" rel="noreferrer"
                        className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-white font-medium transition-opacity hover:opacity-90"
                        style={{ backgroundColor: '#25D366' }}>
                        <span>💬</span> WhatsApp
                      </a>
                      <a href={`https://t.me/share/url?url=${encodeURIComponent(playPageUrl)}&text=${encodeURIComponent(`🎡 ${wheel.name} — Spin to win!`)}`}
                        target="_blank" rel="noreferrer"
                        className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-white font-medium transition-opacity hover:opacity-90"
                        style={{ backgroundColor: '#229ED9' }}>
                        <span>✈️</span> Telegram
                      </a>
                      <a href={`mailto:?subject=${encodeURIComponent(`Spin to Win — ${wheel.name}`)}&body=${encodeURIComponent(`Try your luck! Click to spin: ${playPageUrl}`)}`}
                        className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-white font-medium transition-opacity hover:opacity-90"
                        style={{ backgroundColor: '#EA4335' }}>
                        <span>📧</span> Email
                      </a>
                      <a href={`sms:?body=${encodeURIComponent(`🎡 Spin to win! ${playPageUrl}`)}`}
                        className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-white font-medium transition-opacity hover:opacity-90"
                        style={{ backgroundColor: '#34C759' }}>
                        <span>💬</span> SMS
                      </a>
                      <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(playPageUrl)}`}
                        target="_blank" rel="noreferrer"
                        className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-white font-medium transition-opacity hover:opacity-90"
                        style={{ backgroundColor: '#1877F2' }}>
                        <span>📘</span> Facebook
                      </a>
                      <button
                        onClick={() => { navigator.clipboard.writeText(playPageUrl); toast.success('Link copied!'); }}
                        className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg border font-medium hover:bg-muted transition-colors">
                        📋 Copy Link
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* QR Code */}
              <Card>
                <CardHeader className="border-b border-border/50 px-4 py-3">
                  <CardTitle className="text-sm font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <QrCode className="h-4 w-4 text-muted-foreground" />
                      QR Code
                    </span>
                    <div className="flex gap-1">
                      {[128, 256, 512].map(s => (
                        <button key={s} onClick={() => setQrSize(s)}
                          className={`px-2 py-1 text-xs rounded border transition-colors ${qrSize === s ? 'bg-violet-600 text-white border-violet-600' : 'border-border hover:bg-muted'}`}>
                          {s === 128 ? 'S' : s === 256 ? 'M' : 'L'}
                        </button>
                      ))}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row items-start gap-6">
                  {qrDataUrl && (
                    <img src={qrDataUrl} alt="QR Code" width={140} height={140} className="rounded-lg border shadow-sm shrink-0" />
                  )}
                  <div className="space-y-3 flex-1">
                    <p className="text-sm text-muted-foreground">Print this QR code on receipts, packaging, tables, or in-store displays. Customers scan to spin instantly.</p>
                    <div className="flex flex-wrap gap-2">
                      {qrDataUrl && (
                        <a href={qrDataUrl} download={`${wheel.name}-qr.png`}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors">
                          ⬇️ Download PNG
                        </a>
                      )}
                      <Button variant="outline" size="sm" onClick={() => generateQR(playPageUrl, qrSize)}>
                        🔄 Regenerate
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Tip: Use size L (512px) for print materials.</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="border-b border-border/50 px-4 py-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Link className="h-4 w-4 text-muted-foreground" />
                    Direct Widget URL
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">Minimal iframe/preview URL (no header or branding):</p>
                  <div className="flex gap-2">
                    <Input readOnly value={`${process.env.NEXT_PUBLIC_APP_URL ?? ''}/widget/${wheel.embed_token}`} className="text-xs" />
                    <Button variant="outline" size="sm" onClick={() => window.open(`/widget/${wheel.embed_token}?preview=1&_=${Date.now()}`, '_blank')}>
                      Open
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Instagram QR Image */}
              <Card>
                <CardHeader className="border-b border-border/50 px-4 py-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Camera className="h-4 w-4 text-muted-foreground" />
                    Instagram Post QR
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">Download a 1080×1080 square image with your QR code — ready to post on Instagram.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      if (!qrDataUrl) return;
                      // Generate 1080x1080 canvas with QR + branding
                      const canvas = document.createElement('canvas');
                      canvas.width = 1080;
                      canvas.height = 1080;
                      const ctx = canvas.getContext('2d')!;
                      const primary = wheel.branding.primary_color ?? '#7C3AED';
                      // Background gradient
                      const grad = ctx.createLinearGradient(0, 0, 1080, 1080);
                      grad.addColorStop(0, primary + 'ee');
                      grad.addColorStop(1, primary + '88');
                      ctx.fillStyle = grad;
                      ctx.fillRect(0, 0, 1080, 1080);
                      // White card
                      ctx.fillStyle = '#ffffff';
                      ctx.beginPath();
                      (ctx as any).roundRect(190, 190, 700, 700, 40);
                      ctx.fill();
                      // QR image
                      const img = new Image();
                      img.src = qrDataUrl;
                      await new Promise(r => { img.onload = r; });
                      ctx.drawImage(img, 290, 240, 500, 500);
                      // Title text
                      ctx.fillStyle = primary;
                      ctx.font = 'bold 52px system-ui, sans-serif';
                      ctx.textAlign = 'center';
                      ctx.fillText(wheel.name, 540, 800);
                      ctx.font = '36px system-ui, sans-serif';
                      ctx.fillStyle = '#6b7280';
                      ctx.fillText('Scan to Spin & Win! 🎡', 540, 860);
                      // Download
                      const a = document.createElement('a');
                      a.href = canvas.toDataURL('image/png');
                      a.download = `${wheel.name.replace(/\s+/g, '-').toLowerCase()}-instagram.png`;
                      a.click();
                      toast.success('Instagram image downloaded!');
                    }}
                    className="flex items-center gap-2"
                    disabled={!qrDataUrl}
                  >
                    ⬇️ Download 1080×1080 PNG
                  </Button>
                  <p className="text-xs text-muted-foreground">Tip: Use a size L QR code for best quality.</p>
                </CardContent>
              </Card>

              {/* Google Business */}
              <Card>
                <CardHeader className="border-b border-border/50 px-4 py-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    Google Business
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">Share your spin wheel link in your Google Business profile posts to drive foot traffic.</p>
                  <div className="flex gap-2">
                    <Input readOnly value={playPageUrl} className="text-xs" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { navigator.clipboard.writeText(playPageUrl); toast.success('Link copied!'); }}
                    >
                      Copy
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Paste this link in your Google Business post or profile description. Customers tap to spin instantly.</p>
                </CardContent>
              </Card>

              {/* Kiosk Mode */}
              <Card>
                <CardHeader className="border-b border-border/50 px-4 py-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-muted-foreground" />
                    In-Store Kiosk
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">Open this URL on a tablet or display in your store. The wheel auto-resets after each spin for the next customer.</p>
                  <div className="flex gap-2">
                    <Input readOnly value={`${playPageUrl}?kiosk=1`} className="text-xs" />
                    <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(`${playPageUrl}?kiosk=1`); toast.success('Kiosk URL copied!'); }}>
                      Copy
                    </Button>
                    <Button size="sm" onClick={() => window.open(`${playPageUrl}?kiosk=1`, '_blank')}>
                      Open
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>

          {/* PREVIEW SIDEBAR */}
          <div className="lg:col-span-5 sticky top-24 space-y-4">
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Live Preview</span>
                </div>
                <span className="text-[10px] text-muted-foreground/60">1:1 simulation</span>
              </div>
              <CardContent className="p-5">
                {wheel.config.game_type === 'scratch_card' ? (
                  <ScratchPreview
                    key={appliedTheme?.id ?? 'default'}
                    segments={segments as unknown as WheelSegment[]}
                    branding={wheel.branding}
                    config={wheel.config}
                  />
                ) : wheel.config.game_type === 'slot_machine' ? (
                  <SlotPreview
                    key={appliedTheme?.id ?? 'default'}
                    segments={segments as unknown as WheelSegment[]}
                    branding={wheel.branding}
                    config={wheel.config}
                  />
                ) : wheel.config.game_type === 'roulette' ? (
                  <RoulettePreview
                    key={appliedTheme?.id ?? 'default'}
                    segments={segments as unknown as WheelSegment[]}
                    branding={wheel.branding}
                    config={wheel.config}
                  />
                ) : (
                  <WheelPreview
                    key={appliedTheme?.id ?? 'default'}
                    segments={segments as unknown as WheelSegment[]}
                    config={wheel.config}
                    branding={wheel.branding}
                  />
                )}

                <div className="mt-5">
                  <Button
                    className="w-full bg-violet-600 hover:bg-violet-500 font-semibold h-10 shadow-[0_0_0_1px_rgb(124_58_237/0.4),0_4px_12px_-2px_rgb(124_58_237/0.35)] transition-all duration-200"
                    onClick={() => { saveWheel(); saveSegments(); }}
                    disabled={saving}
                  >
                    <Save className="w-3.5 h-3.5 mr-1.5" />
                    {saving ? 'Saving…' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-3.5 flex items-start gap-3">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500/15 ring-1 ring-violet-500/25">
                <Lightbulb className="h-3.5 w-3.5 text-violet-400" />
              </div>
              <div className="text-xs text-muted-foreground">
                <p className="font-semibold text-foreground mb-0.5">Pro Tip</p>
                Keep segments between 4–12 for best visual clarity on mobile devices.
              </div>
            </div>
          </div>
        </div>
      </Tabs>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; dot: string }> = {
    active:   { cls: 'ring-emerald-500/30 text-emerald-400 bg-emerald-500/10', dot: 'bg-emerald-400' },
    draft:    { cls: 'ring-zinc-500/30 text-zinc-400 bg-zinc-500/10',          dot: 'bg-zinc-400' },
    paused:   { cls: 'ring-amber-500/30 text-amber-400 bg-amber-500/10',       dot: 'bg-amber-400' },
    archived: { cls: 'ring-rose-500/30 text-rose-400 bg-rose-500/10',          dot: 'bg-rose-400' },
  };
  const s = map[status] ?? map.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ring-1 capitalize ${s.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot} ${status === 'active' ? 'animate-pulse' : ''}`} />
      {status}
    </span>
  );
}
