'use client';

import { useEffect, useState, use, useCallback } from 'react';
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
import type { WheelSegment } from '@/lib/utils/wheel-renderer';
import { WHEEL_TEMPLATES } from '@/lib/wheel-templates';

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

export default function WheelEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [wheel, setWheel] = useState<Wheel | null>(null);
  const [segments, setSegments] = useState<(Segment & { prize_display_title?: string })[]>([]);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [saving, setSaving]       = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [qrSize, setQrSize]       = useState(256);

  async function load() {
    const [wRes, pRes] = await Promise.all([
      api.get(`/api/wheels/${id}`),
      api.get('/api/prizes'),
    ]);
    const wData = await wRes.json();
    const pData = await pRes.json();
    if (!wRes.ok) { toast.error('Wheel not found'); router.push('/dashboard/wheels'); return; }
    setWheel(wData.wheel);
    setSegments(wData.segments ?? []);
    setPrizes(pData.prizes ?? []);
  }

  useEffect(() => { load(); }, [id]);

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
      if (res.ok) { setSegments(data.segments); toast.success('Segments saved'); }
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
    setSegments((prev) => [...prev, {
      id: `new-${Date.now()}`, wheel_id: id, position: prev.length,
      label: `Segment ${prev.length + 1}`, bg_color: color, text_color: '#FFFFFF',
      weight: 1.0, is_no_prize: true, wins_today: 0, wins_total: 0,
    }]);
  }

  function removeSegment(idx: number) {
    if (segments.length <= 2) { toast.error('Minimum 2 segments required'); return; }
    setSegments((prev) => prev.filter((_, i) => i !== idx));
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
          <Button variant="outline" onClick={() => router.push('/dashboard/wheels')}>Back</Button>
          <Button
            className={wheel.status === 'active' ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-600 hover:bg-green-700'}
            onClick={async () => {
              const newStatus = wheel.status === 'active' ? 'paused' : 'active';
              const res = await api.post(`/api/wheels/${id}/publish`, { status: newStatus });
              const data = await res.json();
              if (res.ok) { setWheel((w) => w ? { ...w, status: data.wheel.status } : w); toast.success(`Wheel ${newStatus}`); }
              else toast.error(data.error?.message);
            }}
          >
            {wheel.status === 'active' ? 'Pause' : 'Activate'}
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
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{segments.length} segments (min 2, max 24)</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={addSegment}>+ Add Segment</Button>
                  <Button size="sm" className="bg-violet-600 hover:bg-violet-700" onClick={saveSegments} disabled={saving}>
                    {saving ? 'Saving…' : 'Save Segments'}
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {segments.map((seg, idx) => (
                  <Card key={idx} className="overflow-hidden">
                    <CardContent className="pt-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full border-2 border-white shadow shrink-0" style={{ backgroundColor: seg.bg_color }} />
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

                      {/* Per-segment position overrides */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Label offset  X (radial) / Y (perp)</Label>
                          <div className="flex gap-1">
                            <Input
                              type="number" step="1" placeholder="X"
                              value={seg.label_offset_x ?? ''}
                              onChange={(e) => updateSegment(idx, 'label_offset_x', e.target.value === '' ? null : parseFloat(e.target.value))}
                              className="h-7 text-xs text-center"
                            />
                            <Input
                              type="number" step="1" placeholder="Y"
                              value={seg.label_offset_y ?? ''}
                              onChange={(e) => updateSegment(idx, 'label_offset_y', e.target.value === '' ? null : parseFloat(e.target.value))}
                              className="h-7 text-xs text-center"
                            />
                          </div>
                        </div>
                        {seg.icon_url && (
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Icon offset  X (radial) / Y (perp)</Label>
                            <div className="flex gap-1">
                              <Input
                                type="number" step="1" placeholder="X"
                                value={seg.icon_offset_x ?? ''}
                                onChange={(e) => updateSegment(idx, 'icon_offset_x', e.target.value === '' ? null : parseFloat(e.target.value))}
                                className="h-7 text-xs text-center"
                              />
                              <Input
                                type="number" step="1" placeholder="Y"
                                value={seg.icon_offset_y ?? ''}
                                onChange={(e) => updateSegment(idx, 'icon_offset_y', e.target.value === '' ? null : parseFloat(e.target.value))}
                                className="h-7 text-xs text-center"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <Label className="text-xs">Background Color</Label>
                          <div className="flex gap-2 items-center">
                            <input type="color" value={seg.bg_color} onChange={(e) => updateSegment(idx, 'bg_color', e.target.value)}
                              className="w-8 h-8 rounded cursor-pointer border" />
                            <Input value={seg.bg_color} onChange={(e) => updateSegment(idx, 'bg_color', e.target.value)} className="h-8 text-sm font-mono" />
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">Text Color</Label>
                          <div className="flex gap-2 items-center">
                            <input type="color" value={seg.text_color} onChange={(e) => updateSegment(idx, 'text_color', e.target.value)}
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
                <CardHeader><CardTitle className="text-base">General</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Wheel Name (internal)</Label>
                    <Input value={wheel.name} onChange={(e) => setWheel({ ...wheel, name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Game Type</Label>
                    <Select
                      value={wheel.config.game_type ?? 'wheel'}
                      onValueChange={(v) => setWheel({ ...wheel, config: { ...wheel.config, game_type: v as 'wheel' | 'scratch_card' | 'slot_machine' | 'roulette' } })}
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
                <CardHeader><CardTitle className="text-base">Spin Behaviour</CardTitle></CardHeader>
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
                  <div className="flex items-center justify-between col-span-2">
                    <Label>Show segment labels</Label>
                    <Switch checked={wheel.config.show_segment_labels ?? true}
                      onCheckedChange={(v) => setWheel({ ...wheel, config: { ...wheel.config, show_segment_labels: v } })} />
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
                <CardHeader>
                  <CardTitle className="text-base">Guaranteed Win</CardTitle>
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
                <CardHeader><CardTitle className="text-base">Branding</CardTitle></CardHeader>
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

              <Card>
                <CardHeader><CardTitle className="text-base">Visual Ring</CardTitle></CardHeader>
                <CardContent className="space-y-4">

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
                  <CardHeader><CardTitle className="text-base">Segment Labels</CardTitle></CardHeader>
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
                  <CardHeader><CardTitle className="text-base">Scratch Card</CardTitle></CardHeader>
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
                  <CardHeader><CardTitle className="text-base">Slot Machine</CardTitle></CardHeader>
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
                  <CardHeader><CardTitle className="text-base">Roulette</CardTitle></CardHeader>
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
                <CardHeader><CardTitle className="text-base">🌍 Geo-fence</CardTitle></CardHeader>
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
                <Button className="bg-violet-600 hover:bg-violet-700" onClick={saveWheel} disabled={saving}>
                  {saving ? 'Saving…' : 'Save Settings'}
                </Button>
              </div>
            </TabsContent>

            {/* TEMPLATES TAB */}
            <TabsContent value="templates" className="space-y-4 mt-0">
              <p className="text-sm text-muted-foreground">
                Apply a preset template to instantly change colours, style, and branding. Your segment labels and prizes are kept.
              </p>
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
                      {/* Colour swatches */}
                      <div className="flex gap-1">
                        {tpl.segmentPalette.slice(0, 6).map((c, i) => (
                          <div key={i} className="w-5 h-5 rounded-full border border-white shadow-sm" style={{ backgroundColor: c.bg_color }} />
                        ))}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full group-hover:bg-violet-600 group-hover:text-white group-hover:border-violet-600 transition-colors"
                        onClick={() => {
                          if (!wheel) return;
                          // Apply branding + config from template
                          setWheel({
                            ...wheel,
                            config: { ...wheel.config, ...tpl.config },
                            branding: { ...wheel.branding, ...tpl.branding },
                          });
                          // Re-colour segments using the palette
                          setSegments((prev) =>
                            prev.map((seg, i) => {
                              const palette = tpl.segmentPalette[i % tpl.segmentPalette.length];
                              return { ...seg, bg_color: palette.bg_color, text_color: palette.text_color };
                            }),
                          );
                          toast.success(`"${tpl.name}" template applied — save to persist`);
                        }}
                      >
                        Apply Template
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* LEAD FORM TAB */}
            <TabsContent value="form" className="space-y-4 mt-0">
              <Card>
                <CardHeader><CardTitle className="text-base">Lead Capture Form</CardTitle></CardHeader>
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
                <Button className="bg-violet-600 hover:bg-violet-700" onClick={saveWheel} disabled={saving}>
                  {saving ? 'Saving…' : 'Save Form Settings'}
                </Button>
              </div>
            </TabsContent>

            {/* EMBED TAB */}
            <TabsContent value="embed" className="space-y-4 mt-0">
              <Card>
                <CardHeader><CardTitle className="text-base">Embed Code</CardTitle></CardHeader>
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
              <Card className="border-violet-200 bg-violet-50/50 dark:bg-violet-950/20 dark:border-violet-800">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    🔗 Public Play Page
                    <Badge className="bg-green-500 text-white text-xs">Shareable</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    A full branded page anyone can open — no login required. Share the link or QR code directly with your customers.
                  </p>
                  <div className="flex gap-2">
                    <Input readOnly value={playPageUrl} className="font-mono text-xs" />
                    <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(playPageUrl); toast.success('Link copied!'); }}>Copy</Button>
                    <Button size="sm" onClick={() => window.open(playPageUrl, '_blank')}
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
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>📱 QR Code</span>
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
                <CardHeader><CardTitle className="text-base">Direct Widget URL</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">Minimal iframe/preview URL (no header or branding):</p>
                  <div className="flex gap-2">
                    <Input readOnly value={`${process.env.NEXT_PUBLIC_APP_URL ?? ''}/widget/${wheel.embed_token}`} className="text-xs" />
                    <Button variant="outline" size="sm" onClick={() => window.open(`/widget/${wheel.embed_token}?preview=1`, '_blank')}>
                      Open
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Instagram QR Image */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <span style={{ background: 'linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>📸</span>
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
                <CardHeader>
                  <CardTitle className="text-base">🔍 Google Business</CardTitle>
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
                <CardHeader>
                  <CardTitle className="text-base">🏪 In-Store Kiosk</CardTitle>
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
          <div className="lg:col-span-5 sticky top-24 space-y-6">
            <Card className="border-2 border-violet-100 shadow-xl overflow-hidden">
              <CardHeader className="bg-violet-50/50 pb-4">
                <CardTitle className="text-sm font-bold text-violet-900 uppercase tracking-tighter">Live Widget Console</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {wheel.config.game_type === 'scratch_card' ? (
                  <ScratchPreview
                    segments={segments as unknown as WheelSegment[]}
                    branding={wheel.branding}
                    config={wheel.config}
                  />
                ) : wheel.config.game_type === 'slot_machine' ? (
                  <SlotPreview
                    segments={segments as unknown as WheelSegment[]}
                    branding={wheel.branding}
                    config={wheel.config}
                  />
                ) : wheel.config.game_type === 'roulette' ? (
                  <RoulettePreview
                    segments={segments as unknown as WheelSegment[]}
                    branding={wheel.branding}
                    config={wheel.config}
                  />
                ) : (
                  <WheelPreview
                    segments={segments as unknown as WheelSegment[]}
                    config={wheel.config}
                    branding={wheel.branding}
                  />
                )}
                
                <div className="mt-6 space-y-3">
                  <Button 
                    className="w-full bg-violet-600 hover:bg-violet-700 font-bold h-12 shadow-md"
                    onClick={() => {
                      saveWheel();
                      saveSegments();
                    }}
                    disabled={saving}
                  >
                    {saving ? 'Saving Changes…' : 'Quick Save All'}
                  </Button>
                  <p className="text-[10px] text-center text-muted-foreground animate-pulse">
                    Rendering 1:1 Widget Simulation
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-100">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">!</div>
                <div className="text-xs">
                  <p className="font-semibold text-indigo-900">Pro Tip</p>
                  <p className="text-indigo-700/80">Keep segments between 4-12 for best visual clarity on mobile devices.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Tabs>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: 'bg-green-100 text-green-700', draft: 'bg-gray-100 text-gray-600',
    paused: 'bg-yellow-100 text-yellow-700', archived: 'bg-red-100 text-red-600',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${map[status] ?? ''}`}>
      {status}
    </span>
  );
}
