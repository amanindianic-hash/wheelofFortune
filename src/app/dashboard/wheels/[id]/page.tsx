'use client';

import { useEffect, useState, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import type { Wheel, Segment, Prize } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, Share2, Monitor, Code, QrCode, 
  Palette, Type, Globe, Users, Layers, Zap,
  Search, Link, Download, Lock
} from 'lucide-react';

import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

// Shared Utilities
import { normalizeSegment } from '@/lib/utils/segment-utils';
import { 
  getFinalVisualConfig, 
  applyTemplateToWheel, 
  BRANDING_RESET_BASE 
} from '@/lib/utils/theme-utils';

// Modularized Components
import { DesignTab } from '@/components/dashboard/wheels/editor/design-tab';
import { SegmentsTab } from '@/components/dashboard/wheels/editor/segments-tab';
import { DistributionTab } from '@/components/dashboard/wheels/editor/distribution-tab';
import { SettingsTab } from '@/components/dashboard/wheels/editor/settings-tab';
import { TemplatesTab } from '@/components/dashboard/wheels/editor/templates-tab';
import { FormTab } from '@/components/dashboard/wheels/editor/form-tab';
import { PreviewMonitor } from '@/components/dashboard/wheels/editor/preview-monitor';

function StatusBadge({ status }: { status: string }) {
  const isProd = status === 'production';
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${isProd ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
      <div className={`h-1.5 w-1.5 rounded-full ${isProd ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
      <span className="text-[10px] font-black uppercase tracking-widest">{status}</span>
    </div>
  );
}

export default function WheelEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  
  // ── State Management ──────────────────────────────────────────────────────
  const [wheel, setWheel] = useState<Wheel | null>(null);
  const [segments, setSegments] = useState<(Segment & { prize_display_title?: string })[]>([]);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [saving, setSaving] = useState(false);
  const [savingTheme, setSavingTheme] = useState(false);
  const [savedThemes, setSavedThemes] = useState<any[]>([]);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  
  // Save-as-theme state
  const [saveThemeDialog, setSaveThemeDialog] = useState(false);
  const [saveThemeName, setSaveThemeName] = useState('');

  // ── Distribution State ────────────────────────────────────────────────────
  const [qrSize, setQrSize] = useState(256);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const generateQR = useCallback(async (url: string, size: number) => {
    try {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}`;
      setQrDataUrl(qrUrl);
    } catch (err) {
      console.error('Failed to generate QR:', err);
    }
  }, []);

  // ── Theme State ──────────────────────────────────────────────────────────
  const [appliedTheme, setAppliedTheme] = useState<{
    id: string; name: string; emoji: string; type: 'custom' | 'system';
  } | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`wheel-${id}-theme`);
      if (saved) {
        try { return JSON.parse(saved); } catch { return null; }
      }
    }
    return null;
  });

  // Sync Applied Theme to LS
  useEffect(() => {
    if (appliedTheme) {
      localStorage.setItem(`wheel-${id}-theme`, JSON.stringify(appliedTheme));
    } else {
      localStorage.removeItem(`wheel-${id}-theme`);
    }
  }, [appliedTheme, id]);

  // ── Data Loading ──────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    try {
      const [wRes, pRes, tRes] = await Promise.all([
        api.get(`/api/wheels/${id}`),
        api.get('/api/prizes'),
        api.get('/api/themes'),
      ]);
      
      if (!wRes.ok) {
        toast.error('Campaign not found');
        router.push('/dashboard/wheels');
        return;
      }

      const wData = await wRes.json();
      const pData = await pRes.json();
      const tData = tRes.ok ? await tRes.json() : { themes: [] };

      // Normalization
      const normalizedSegments = (wData.segments ?? []).map((s: Segment) => {
        const norm = normalizeSegment(s);
        return {
          ...norm,
          background: {
            color: norm.bg_color || '#7c3aed',
            imageUrl: norm.segment_image_url || null,
          }
        };
      });

      setWheel(wData.wheel);
      setSegments(normalizedSegments);
      setPrizes(pData.prizes || []);
      setSavedThemes(tData.themes || []);
    } catch (error) {
      console.error('Failed to load campaign:', error);
      toast.error('Neural uplink failed');
    }
  }, [id, router]);

  useEffect(() => {
    load();
  }, [load]);

  // Initial QR generation
  useEffect(() => {
    if (wheel) {
      const url = typeof window !== 'undefined' ? `${window.location.origin}/play/${wheel.embed_token}` : '';
      generateQR(url, qrSize);
    }
  }, [wheel, qrSize, generateQR]);

  // ── Save Logic ────────────────────────────────────────────────────────────
  const saveWheel = useCallback(async () => {
    if (!wheel) return;
    setSaving(true);
    try {
      const res = await api.put(`/api/wheels/${id}`, {
        ...wheel,
        config: {
          ...wheel.config,
          applied_theme_id: appliedTheme?.id || null
        }
      });
      if (res.ok) toast.success('Campaign core synchronized');
      else throw new Error('Sync failed');
    } catch (error) {
      toast.error('Failed to sync campaign');
    } finally {
      setSaving(false);
    }
  }, [wheel, id, appliedTheme]);

  const saveSegments = useCallback(async () => {
    if (!segments.length) return;
    try {
      await api.put(`/api/wheels/${id}/segments`, { segments });
    } catch (error) {
      console.error('Segment sync failed:', error);
    }
  }, [segments, id]);

  const saveCurrentAsTheme = useCallback(async (name?: string, emoji?: string) => {
    const finalName = name || saveThemeName;
    if (!wheel || !finalName) return;
    setSavingTheme(true);
    try {
      const res = await api.post('/api/themes', {
        name: finalName,
        emoji: emoji || '🎨',
        branding: wheel.branding,
        config: { ...wheel.config, game_type: wheel.config.game_type || 'wheel' },
        segment_palette: segments.map(s => ({
          bg_color: s.bg_color,
          text_color: s.text_color,
          segment_image_url: s.segment_image_url,
          icon_url: s.icon_url
        }))
      });
      if (res.ok) {
        toast.success('Theme architecture archived');
        setSaveThemeDialog(false);
        setSaveThemeName('');
        load();
      }
    } catch (error) {
      toast.error('Failed to archive theme');
    } finally {
      setSavingTheme(false);
    }
  }, [wheel, segments, saveThemeName, load]);

  // ── State Setters ────────────────────────────────────────────────────────
  const updateWheel = useCallback((w: Wheel) => setWheel(w), []);
  const updateSegments = useCallback((s: Segment[]) => setSegments(s as any), []);
  const clearAppliedTheme = useCallback(() => setAppliedTheme(null), []);

  // ── Segment Handlers ──────────────────────────────────────────────────────
  const addSegment = useCallback(() => {
    if (!wheel) return;
    const newIdx = segments.length;
    const newSegment: Segment = {
      id: crypto.randomUUID(),
      wheel_id: id,
      position: newIdx,
      label: `PRIZE #${newIdx + 1}`,
      background: { color: '#7c3aed', imageUrl: null },
      weight: 1,
      is_no_prize: true,
      wins_today: 0,
      wins_total: 0
    };
    setSegments(prev => [...prev, newSegment as any]);
  }, [id, segments.length, wheel]);

  const removeSegment = useCallback((idx: number) => {
    setSegments(prev => prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, position: i })));
  }, []);

  const updateSegment = useCallback((idx: number, field: string, value: any) => {
    setSegments(prev => {
      const next = [...prev];
      const segment = { ...next[idx] };
      
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        (segment as any)[parent] = { 
          ...(segment as any)[parent], 
          [child]: value 
        };
      } else {
        (segment as any)[field] = value;
      }
      
      next[idx] = segment;
      return next;
    });
  }, []);

  const applyOffsetsToAll = useCallback((sourceIdx: number) => {
    const source = segments[sourceIdx];
    if (!source) return;
    setSegments(prev => prev.map((s, i) => {
      if (i === sourceIdx) return s;
      return {
        ...s,
        label_offset_x: source.label_offset_x,
        label_offset_y: source.label_offset_y,
        icon_offset_x: source.icon_offset_x,
        icon_offset_y: source.icon_offset_y,
        label_rotation_angle: source.label_rotation_angle,
        icon_rotation_angle: source.icon_rotation_angle,
        label_radial_offset: source.label_radial_offset,
        label_tangential_offset: source.label_tangential_offset,
        icon_radial_offset: source.icon_radial_offset,
        icon_tangential_offset: source.icon_tangential_offset,
        label_font_scale: source.label_font_scale,
        icon_scale: source.icon_scale,
      };
    }));
  }, [segments]);

  if (!wheel) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#09090b] gap-4">
        <div className="h-12 w-12 rounded-2xl border-2 border-violet-500/20 border-t-violet-500 animate-spin" />
        <p className="text-[10px] font-black text-violet-400 uppercase tracking-[0.4em] animate-pulse">Initializing Neural Link...</p>
      </div>
    );
  }

  const publicUrl = typeof window !== 'undefined' ? `${window.location.origin}/play/${wheel.embed_token}` : '';

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 will-change-transform">
      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-black/60 backdrop-blur-2xl px-6 h-20">
        <div className="max-w-[1600px] mx-auto h-full flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-2xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all"
              onClick={() => router.push('/dashboard/wheels')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="space-y-0.5">
              <div className="flex items-center gap-3">
                <h1 className="text-lg font-black tracking-tight text-white">{wheel.name}</h1>
                <StatusBadge status={wheel.status} />
              </div>
              <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60">
                 <span className="flex items-center gap-1.5"><Layers className="w-3 h-3" /> CAMPAIGN ID: {id.slice(0, 8)}</span>
                 <span className="h-1 w-1 rounded-full bg-white/10" />
                 <span className="flex items-center gap-1.5"><Lock className="w-3 h-3 text-emerald-500/80" /> SSL SECURED</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              className="h-11 bg-white/5 border-white/5 hover:bg-white/10 text-white rounded-2xl px-6 font-bold shadow-xl transition-all gap-2"
              onClick={() => setShareDialogOpen(true)}
            >
              <Share2 className="w-4 h-4" />
              Deploy Link
            </Button>
            <Button 
              className="h-11 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl px-8 font-black uppercase tracking-widest shadow-[0_0_30px_rgba(124,58,237,0.3)] transition-all flex items-center gap-2.5"
              onClick={() => { saveWheel(); saveSegments(); }}
              disabled={saving}
            >
              <Zap className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
              {saving ? 'Syncing...' : 'Live Publish'}
            </Button>
          </div>
        </div>
      </header>

      {/* ── MAIN EDITOR ────────────────────────────────────────────────────── */}
      <main className="max-w-[1600px] mx-auto px-6 py-8">
        <Tabs defaultValue="design" className="space-y-8">
          <div className="flex items-center justify-between">
            <TabsList className="bg-white/5 border border-white/5 p-1 rounded-2xl h-12">
              <TabsTrigger value="design" className="px-6 rounded-xl data-[state=active]:bg-violet-600 data-[state=active]:text-white font-bold text-xs gap-2">
                <Palette className="w-4 h-4" /> Aesthetics
              </TabsTrigger>
              <TabsTrigger value="segments" className="px-6 rounded-xl data-[state=active]:bg-violet-600 data-[state=active]:text-white font-bold text-xs gap-2">
                <Layers className="w-4 h-4" /> Canvas
              </TabsTrigger>
              <TabsTrigger value="distribution" className="px-6 rounded-xl data-[state=active]:bg-violet-600 data-[state=active]:text-white font-bold text-xs gap-2">
                <Search className="w-4 h-4" /> Distribution
              </TabsTrigger>
              <TabsTrigger value="settings" className="px-6 rounded-xl data-[state=active]:bg-violet-600 data-[state=active]:text-white font-bold text-xs gap-2">
                <Zap className="w-4 h-4" /> Mechanics
              </TabsTrigger>
              <TabsTrigger value="templates" className="px-6 rounded-xl data-[state=active]:bg-white/10 font-bold text-xs gap-2">
                <Layers className="w-4 h-4" /> Presets
              </TabsTrigger>
              <TabsTrigger value="form" className="px-6 rounded-xl data-[state=active]:bg-violet-600 data-[state=active]:text-white font-bold text-xs gap-2">
                <Users className="w-4 h-4" /> Capture
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5">
              <Monitor className="w-3.5 h-3.5 text-muted-foreground/60" />
              <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">Real-time Visual Feedback</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 xl:col-span-8 space-y-6">
              <TabsContent value="design" className="mt-0">
                <DesignTab 
                  wheel={wheel} 
                  setWheel={updateWheel} 
                  segments={segments}
                  setAppliedTheme={clearAppliedTheme}
                />
              </TabsContent>

              <TabsContent value="segments" className="mt-0">
                <SegmentsTab 
                  wheel={wheel} 
                  segments={segments} 
                  prizes={prizes}
                  isSegmentLocked={false}
                  addSegment={addSegment}
                  removeSegment={removeSegment}
                  updateSegment={updateSegment}
                  applyOffsetsToAll={applyOffsetsToAll}
                />
              </TabsContent>

              <TabsContent value="distribution" className="mt-0">
                <DistributionTab 
                  wheel={wheel} 
                  playPageUrl={publicUrl}
                  qrSize={qrSize}
                  qrDataUrl={qrDataUrl}
                  setQrSize={setQrSize}
                  generateQR={generateQR}
                />
              </TabsContent>

              <TabsContent value="settings" className="mt-0">
                <SettingsTab 
                  wheel={wheel} 
                  segments={segments}
                  setWheel={updateWheel}
                  setAppliedTheme={setAppliedTheme}
                />
              </TabsContent>

              <TabsContent value="templates" className="mt-0">
                <TemplatesTab 
                  wheel={wheel}
                  segments={segments}
                  savedThemes={savedThemes}
                  appliedTheme={appliedTheme}
                  setWheel={updateWheel}
                  setSegments={updateSegments}
                  setAppliedTheme={setAppliedTheme}
                  saveCurrentAsTheme={saveCurrentAsTheme}
                  savingTheme={savingTheme}
                />
              </TabsContent>

              <TabsContent value="form" className="mt-0">
                <FormTab 
                  wheel={wheel} 
                  setWheel={updateWheel} 
                  saveWheel={saveWheel} 
                  saving={saving} 
                />
              </TabsContent>
            </div>

            <div className="lg:col-span-5 xl:col-span-4 sticky top-8 self-start">
              <PreviewMonitor 
                wheel={wheel} 
                segments={segments} 
                appliedTheme={appliedTheme} 
                savedThemes={savedThemes}
                saving={saving}
                saveWheel={saveWheel}
                saveSegments={saveSegments}
              />
            </div>
          </div>
        </Tabs>
      </main>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="bg-[#0c0c0e] border border-white/10 text-white max-w-2xl p-0 overflow-hidden rounded-[2rem]">
          <div className="p-8 space-y-8">
            <div className="space-y-1">
              <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
                <Share2 className="w-6 h-6 text-violet-400" /> Deployment Hub
              </h2>
              <p className="text-zinc-400 text-sm">Launch your campaign or integrate it into your site.</p>
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] flex items-center gap-2">
                <Link className="w-3 h-3" /> Public Campaign Link
              </Label>
              <div className="flex gap-2 p-2 rounded-2xl bg-white/5 border border-white/5 group hover:border-violet-500/30 transition-all">
                <div className="flex-1 px-4 py-2 text-xs font-mono text-violet-300 truncate">{publicUrl}</div>
                <Button className="bg-violet-600 hover:bg-violet-500 font-bold h-10 px-6 rounded-xl" onClick={() => { navigator.clipboard.writeText(publicUrl); toast.success('Link copied'); }}>Copy</Button>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] flex items-center gap-2">
                  <QrCode className="w-3 h-3" /> QR Access Point
                </Label>
                <div className="aspect-square rounded-3xl bg-white/5 p-8 flex flex-col items-center justify-center gap-6 border border-white/5">
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(publicUrl)}`} alt="QR" className="h-40 w-40 bg-white rounded-2xl p-2" />
                </div>
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Code className="w-3 h-3" /> Widget Integration
                </Label>
                <div className="aspect-square rounded-3xl bg-white/5 p-6 flex flex-col gap-4 border border-white/5">
                  <div className="flex-1 rounded-2xl bg-black/40 p-4 font-mono text-[10px] text-zinc-500 overflow-hidden">{`<script src="${typeof window !== 'undefined' ? window.location.origin : ''}/widget.js"></script>`}</div>
                  <Button variant="outline" className="w-full bg-white/5 border-white/10 hover:bg-white/10 text-white font-bold h-10 rounded-xl" onClick={() => toast.success('Code copied')}>Copy Fragment</Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Save Theme Dialog */}
      <Dialog open={saveThemeDialog} onOpenChange={setSaveThemeDialog}>
        <DialogContent className="bg-zinc-900 border-white/10 text-white">
          <DialogHeader><DialogTitle>Archive Current Architecture</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Architecture Name</Label>
              <Input value={saveThemeName} onChange={(e) => setSaveThemeName(e.target.value)} placeholder="e.g., Midnight Gold" className="bg-white/5 border-white/10" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSaveThemeDialog(false)}>Cancel</Button>
            <Button className="bg-violet-600 hover:bg-violet-500" onClick={() => saveCurrentAsTheme()} disabled={savingTheme}>Archive</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
