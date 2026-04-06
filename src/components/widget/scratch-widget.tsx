'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { WinQRCard } from './win-qr-card';

interface FormConfig { enabled?: boolean; fields?: Array<{ key: string; label: string; type: string; required?: boolean }>; gdpr_enabled?: boolean; gdpr_text?: string; privacy_policy_url?: string | null; }
interface SpinResult { is_winner: boolean; segment: { id: string; label: string }; prize?: { display_title: string; display_description?: string; type: string; custom_message_html?: string; redirect_url?: string } | null; coupon_code?: string | null; consolation_message?: string | null; }
interface WheelSegment { id: string; label: string; bg_color: string; text_color: string; icon_url?: string | null; }
interface ScratchConfig {
  scratch_layer_color?: string;
  scratch_layer_style?: 'solid' | 'metallic' | 'foil' | 'striped';
  scratch_reveal_threshold?: number;
  scratch_card_layout?: 'single' | 'grid_2x2' | 'row_3x1';
  scratch_card_size?: 'small' | 'medium' | 'large';
  scratch_border_color?: string;
  scratch_border_radius?: number;
  scratch_brush_multiplier?: number;
  sound_enabled?: boolean;
  sound_url?: string | null;
}

type Phase = 'loading' | 'form' | 'ready' | 'scratching' | 'result' | 'error';

const CARD_SIZES = {
  small:  { w: 280, h: 160 },
  medium: { w: 340, h: 200 },
  large:  { w: 420, h: 260 },
};

// ─── Scratch layer drawing ────────────────────────────────────────────────────

function drawScratchLayer(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  style: ScratchConfig['scratch_layer_style'],
  color: string,
  instructionText: string,
) {
  ctx.globalCompositeOperation = 'source-over';

  if (style === 'metallic') {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0,   '#9e9e9e');
    grad.addColorStop(0.25,'#e0e0e0');
    grad.addColorStop(0.5, '#bdbdbd');
    grad.addColorStop(0.75,'#f5f5f5');
    grad.addColorStop(1,   '#9e9e9e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    // Subtle horizontal sheen lines
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;
    for (let y = 4; y < h; y += 8) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
  } else if (style === 'foil') {
    // Iridescent rainbow foil
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0,    '#FF6B6B');
    grad.addColorStop(0.16, '#FFD93D');
    grad.addColorStop(0.33, '#6BCB77');
    grad.addColorStop(0.5,  '#4D96FF');
    grad.addColorStop(0.66, '#C77DFF');
    grad.addColorStop(0.83, '#FF6B6B');
    grad.addColorStop(1,    '#FFD93D');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    // Semi-transparent white overlay for depth
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(0, 0, w, h);
    // Diagonal sheen
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 2;
    for (let x = -h; x < w + h; x += 14) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + h, h); ctx.stroke();
    }
  } else if (style === 'striped') {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.20)';
    ctx.lineWidth = 2;
    for (let x = -h; x < w + h; x += 18) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + h, h); ctx.stroke();
    }
  } else {
    // solid
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, w, h);
  }

  // "Scratch here" text overlay
  ctx.fillStyle = 'rgba(255,255,255,0.80)';
  ctx.font = `bold ${Math.round(w * 0.058)}px Inter, system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  ctx.shadowBlur = 4;
  ctx.fillText(instructionText, w / 2, h / 2 + 6);
  ctx.shadowBlur = 0;
}

// ─── Prize reveal background ──────────────────────────────────────────────────

function PrizeBg({
  layout, segments, primaryColor,
}: {
  layout: ScratchConfig['scratch_card_layout'];
  segments: WheelSegment[];
  primaryColor: string;
}) {
  const fill = (seg: WheelSegment | undefined, key: number) => (
    <div
      key={key}
      className="flex flex-col items-center justify-center gap-1 h-full"
      style={{ backgroundColor: seg?.bg_color ?? primaryColor, flex: 1 }}
    >
      {seg?.icon_url
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={seg.icon_url} alt={seg.label} className="w-8 h-8 object-contain rounded" />
        : <span className="text-2xl">🎁</span>}
      <span className="text-xs font-bold text-center px-1 truncate max-w-full" style={{ color: seg?.text_color ?? '#fff' }}>
        {seg?.label ?? '?'}
      </span>
    </div>
  );

  if (layout === 'grid_2x2') {
    const cells = [0, 1, 2, 3].map((i) => segments[i % (segments.length || 1)]);
    return (
      <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
        {cells.map((seg, i) => fill(seg, i))}
      </div>
    );
  }
  if (layout === 'row_3x1') {
    const cells = [0, 1, 2].map((i) => segments[i % (segments.length || 1)]);
    return (
      <div className="absolute inset-0 flex flex-row">
        {cells.map((seg, i) => fill(seg, i))}
      </div>
    );
  }
  // single
  const seg = segments[0];
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2"
      style={{ backgroundColor: seg?.bg_color ?? primaryColor }}>
      {seg?.icon_url
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={seg.icon_url} alt={seg.label} className="w-12 h-12 object-contain rounded" />
        : <span className="text-4xl">🎁</span>}
      <span className="text-base font-bold text-center px-2" style={{ color: seg?.text_color ?? '#fff' }}>
        {seg?.label ?? 'Scratch to reveal!'}
      </span>
    </div>
  );
}

// ─── Main widget ──────────────────────────────────────────────────────────────

export function ScratchWidget({ embedToken, isPreview = false }: { embedToken: string; isPreview?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [sessionId, setSessionId] = useState('');
  const [segments, setSegments] = useState<WheelSegment[]>([]);
  const [formConfig, setFormConfig] = useState<FormConfig>({});
  const [scratchConfig, setScratchConfig] = useState<ScratchConfig>({});
  const [branding, setBranding] = useState<{ primary_color?: string; button_text?: string; background_value?: string; font_family?: string }>({});
  const [isTriggered, setIsTriggered] = useState(false);
  const [spinResult, setSpinResult] = useState<SpinResult | null>(null);
  const [leadData, setLeadData] = useState<Record<string, string>>({ email: '', name: '', phone: '' });
  const [gdprConsent, setGdprConsent] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [streak, setStreak] = useState<number>(0);
  const scratchingRef = useRef(false);
  const revealedRef = useRef(false);
  const idempotencyKeyRef = useRef('');

  // Load session
  useEffect(() => {
    async function init() {
      try {
        const fp = `${navigator.userAgent}${screen.width}${screen.height}${Intl.DateTimeFormat().resolvedOptions().timeZone}`;
        const res = await fetch('/api/spin/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ embed_token: embedToken, fingerprint_data: fp, page_url: window.location.href, referrer_url: document.referrer || null, preview: isPreview || undefined }),
        });
        const data = await res.json();
        if (!res.ok) { setErrorMsg(data.error?.message ?? 'Unavailable'); setPhase('error'); return; }

        setSessionId(data.session_id);
        setSegments(data.segments ?? []);
        setFormConfig(data.wheel?.form_config ?? {});
        setBranding(data.wheel?.branding ?? {});
        setScratchConfig(data.wheel?.config ?? {});

        const rules = data.wheel?.trigger_rules || {};
        if (!rules.time_on_page && !rules.scroll_depth && !rules.exit_intent) setIsTriggered(true);
        setPhase(data.wheel?.form_config?.enabled ? 'form' : 'ready');
      } catch {
        setErrorMsg('Failed to load. Please try again.'); setPhase('error');
      }
    }
    init();
  }, [embedToken]);

  // Draw scratch layer on canvas when entering ready phase
  useEffect(() => {
    if (phase !== 'ready') return;
    const canvas = canvasRef.current;
    if (!canvas || revealedRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    revealedRef.current = false;
    const layerColor = scratchConfig.scratch_layer_color ?? '#B0B0B0';
    const layerStyle = scratchConfig.scratch_layer_style ?? 'solid';
    drawScratchLayer(ctx, canvas.width, canvas.height, layerStyle, layerColor, '✦ Scratch here to reveal ✦');
  }, [phase, scratchConfig]);

  function getScratchPos(e: React.PointerEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  }

  function scratch(e: React.PointerEvent) {
    if (!scratchingRef.current || revealedRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getScratchPos(e, canvas);
    // Mobile users get 20% larger brush for easier scratching
    const isMobileTouch = e.pointerType === 'touch' || (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0);
    const baseBrush = scratchConfig.scratch_card_size === 'large' ? 36 : scratchConfig.scratch_card_size === 'small' ? 22 : 28;
    const brushMultiplier = scratchConfig.scratch_brush_multiplier ?? 1.0;
    const brushSize = Math.round((isMobileTouch ? baseBrush * 1.2 : baseBrush) * brushMultiplier);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, brushSize, 0, 2 * Math.PI);
    ctx.fill();
    checkReveal(ctx, canvas);
  }

  function checkReveal(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    if (revealedRef.current) return;
    const threshold = scratchConfig.scratch_reveal_threshold ?? 0.6;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let transparent = 0;
    for (let i = 3; i < data.length; i += 4) { if (data[i] < 128) transparent++; }
    if (transparent / (canvas.width * canvas.height) >= threshold) {
      revealedRef.current = true;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      doReveal();
    }
  }

  async function doReveal() {
    if (!idempotencyKeyRef.current) idempotencyKeyRef.current = crypto.randomUUID();
    try {
      const res = await fetch('/api/spin/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, idempotency_key: idempotencyKeyRef.current, client_seed: Math.random().toString(36).slice(2) }),
      });
      const data = await res.json();
      if (res.ok) {
        setSpinResult(data.result);
        setPhase('result');
        // Fetch streak (non-blocking)
        fetch(`/api/spin/streak?session_id=${sessionId}`)
          .then(r => r.ok ? r.json() : null)
          .then(d => { if (d?.streak != null) setStreak(d.streak); })
          .catch(() => {});
      } else toast.error(data.error?.message ?? 'Error');
    } catch { toast.error('Network error'); }
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (formConfig.gdpr_enabled && !gdprConsent) { toast.error('Please accept the consent checkbox'); return; }
    idempotencyKeyRef.current = crypto.randomUUID();
    setPhase('ready');
  }

  const primaryColor = branding.primary_color ?? '#7C3AED';
  const bgColor = branding.background_value ?? '#FFFFFF';
  const fontFamily = branding.font_family ?? 'Inter, sans-serif';
  const layout = scratchConfig.scratch_card_layout ?? 'single';
  const sizeKey = scratchConfig.scratch_card_size ?? 'medium';
  const { w: cardW, h: cardH } = CARD_SIZES[sizeKey];
  const borderRadius = scratchConfig.scratch_border_radius ?? 16;
  const borderColor = scratchConfig.scratch_border_color ?? primaryColor;

  if (phase === 'error') return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: bgColor, fontFamily }}>
      <div className="text-center space-y-3 p-8">
        <p className="text-5xl">😕</p>
        <p className="text-lg font-semibold">Unavailable</p>
        <p className="text-sm text-gray-500">{errorMsg}</p>
      </div>
    </div>
  );

  if (!isTriggered && !isPreview) return null;

  if (phase === 'loading') return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: bgColor, fontFamily }}>
      <div className="text-center space-y-3">
        <div className="w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-500">Loading…</p>
      </div>
    </div>
  );

  if (phase === 'form') return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: bgColor, fontFamily }}>
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8 space-y-5">
        <div className="text-center"><p className="text-3xl mb-2">🎴</p><h2 className="text-xl font-bold">Scratch to Win!</h2><p className="text-sm text-gray-500">Enter your details to reveal your prize</p></div>
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {(formConfig.fields ?? [{ key: 'email', label: 'Email', type: 'email', required: true }]).map((field) => (
            <div key={field.key} className="space-y-1.5">
              <Label htmlFor={field.key}>{field.label}{field.required && ' *'}</Label>
              <Input id={field.key} type={field.type} required={field.required} value={leadData[field.key] ?? ''} onChange={(e) => setLeadData({ ...leadData, [field.key]: e.target.value })} />
            </div>
          ))}
          {formConfig.gdpr_enabled && (
            <div className="flex items-start gap-2">
              <input type="checkbox" id="gdpr" checked={gdprConsent} onChange={(e) => setGdprConsent(e.target.checked)} className="mt-1 rounded" required />
              <label htmlFor="gdpr" className="text-xs text-gray-500">
                {formConfig.gdpr_text ?? 'I agree to receive marketing communications.'}
                {formConfig.privacy_policy_url && <a href={formConfig.privacy_policy_url} target="_blank" rel="noreferrer" className="underline ml-1">Privacy Policy</a>}
              </label>
            </div>
          )}
          <Button type="submit" className="w-full font-bold" style={{ backgroundColor: primaryColor }}>Continue to Scratch</Button>
        </form>
      </div>
    </div>
  );

  if (phase === 'result' && spinResult) return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: bgColor, fontFamily }}>
      <WinQRCard
        result={spinResult}
        primaryColor={primaryColor}
        streak={streak}
        onPlayAgain={() => { setSpinResult(null); revealedRef.current = false; setStreak(0); setPhase('ready'); }}
      />
    </div>
  );

  // Ready / scratching phase
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-4" style={{ backgroundColor: bgColor, fontFamily }}>
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-bold">Scratch & Win!</h2>
        <p className="text-sm text-gray-500">Use your finger or mouse to scratch</p>
      </div>

      <div
        className="relative shadow-2xl overflow-hidden"
        style={{ width: cardW, height: cardH, borderRadius, border: `3px solid ${borderColor}` }}
      >
        {/* Prize reveal background */}
        <PrizeBg layout={layout} segments={segments} primaryColor={primaryColor} />

        {/* Scratch canvas on top */}
        <canvas
          ref={canvasRef}
          width={cardW}
          height={cardH}
          className="absolute inset-0 cursor-crosshair touch-none"
          style={{ width: cardW, height: cardH }}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            scratchingRef.current = true;
            setPhase('scratching');
            if (scratchConfig.sound_enabled && scratchConfig.sound_url && !revealedRef.current) {
              try { new Audio(scratchConfig.sound_url).play(); } catch { /* ignore */ }
            }
          }}
          onPointerUp={() => { scratchingRef.current = false; }}
          onPointerLeave={() => { scratchingRef.current = false; }}
          onPointerMove={scratch}
        />
      </div>

      <p className="text-xs text-gray-400">
        Scratch {Math.round((scratchConfig.scratch_reveal_threshold ?? 0.6) * 100)}% of the card to reveal your prize
      </p>
    </div>
  );
}
