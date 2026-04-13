'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { WinQRCard } from './win-qr-card';

interface FormConfig { enabled?: boolean; fields?: Array<{ key: string; label: string; type: string; required?: boolean }>; gdpr_enabled?: boolean; gdpr_text?: string; privacy_policy_url?: string | null; }
interface SpinResult { is_winner: boolean; segment: { id: string; label: string }; prize?: { display_title: string; display_description?: string; type: string; custom_message_html?: string; redirect_url?: string } | null; coupon_code?: string | null; consolation_message?: string | null; }
interface SlotSegment { id: string; label: string; bg_color: string; text_color: string; icon_url?: string | null; weight: number; }
interface SlotConfig {
  slot_reel_count?: 2 | 3 | 5;
  slot_visible_rows?: 1 | 3 | 5;
  slot_symbol_mode?: 'icon' | 'label' | 'both';
  slot_spin_duration_ms?: number;
  slot_stop_delay_ms?: number;
  slot_cabinet_style?: 'classic' | 'modern' | 'neon';
  slot_win_line_color?: string;
  sound_enabled?: boolean;
  sound_url?: string | null;
}

type Phase = 'loading' | 'form' | 'ready' | 'spinning' | 'result' | 'error';

// ─── Cabinet style definitions ────────────────────────────────────────────────

function getCabinetStyles(style: SlotConfig['slot_cabinet_style'], primaryColor: string) {
  switch (style) {
    case 'classic':
      return {
        cabinet: {
          background: `linear-gradient(160deg, #c0392b, #8e1c12, #c0392b)`,
          border: `5px solid #f39c12`,
          borderRadius: 28,
          padding: 24,
          boxShadow: '0 20px 60px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -2px 4px rgba(0,0,0,0.5)',
        },
        reelBg: 'linear-gradient(135deg, #1a0000 0%, #2a1a1a 50%, #1a0000 100%)',
        reelBorder: '3px solid #f39c12',
        panelBg: 'linear-gradient(180deg,#c0392b,#8e1c12)',
      };
    case 'neon':
      return {
        cabinet: {
          background: '#0A0A14',
          border: `4px solid ${primaryColor}`,
          borderRadius: 24,
          padding: 20,
          boxShadow: `0 0 30px ${primaryColor}aa, 0 0 80px ${primaryColor}55, inset 0 0 20px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.1)`,
        },
        reelBg: 'linear-gradient(135deg, #05050D 0%, #0a0a18 50%, #05050D 100%)',
        reelBorder: `3px solid ${primaryColor}`,
        panelBg: '#0A0A14',
      };
    default: // modern
      return {
        cabinet: {
          background: `linear-gradient(135deg, ${primaryColor}33, ${primaryColor}55)`,
          border: `4px solid ${primaryColor}`,
          borderRadius: 28,
          padding: 20,
          boxShadow: `0 20px 50px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 2px rgba(0,0,0,0.3)`,
        },
        reelBg: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #1a1a2e 100%)',
        reelBorder: `2px solid ${primaryColor}`,
        panelBg: `linear-gradient(180deg, ${primaryColor}11, ${primaryColor}08)`,
      };
  }
}

// ─── Symbol cell ──────────────────────────────────────────────────────────────

function SymbolCell({
  seg, mode, rowH,
}: {
  seg: SlotSegment | undefined;
  mode: SlotConfig['slot_symbol_mode'];
  rowH: number;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-0.5 w-full"
      style={{
        height: rowH,
        backgroundColor: seg?.bg_color ?? '#2A2A2A',
        backgroundImage: `linear-gradient(135deg, ${seg?.bg_color ?? '#2A2A2A'} 0%, ${seg?.bg_color ?? '#2A2A2A'}dd 100%)`,
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        borderTop: '1px solid rgba(0,0,0,0.3)',
        boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.05)',
        flexShrink: 0,
      }}
    >
      {(mode === 'icon' || mode === 'both') && (
        seg?.icon_url
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={seg.icon_url} alt={seg.label} className="object-contain rounded drop-shadow-lg" style={{ width: rowH * 0.4, height: rowH * 0.4 }} />
          : <span style={{ fontSize: rowH * 0.35, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>🎁</span>
      )}
      {(mode === 'label' || mode === 'both') && (
        <span
          className="font-bold text-center leading-tight px-1 truncate w-full text-center drop-shadow"
          style={{ color: seg?.text_color ?? '#FFFFFF', fontSize: rowH * 0.17, textShadow: '0 2px 4px rgba(0,0,0,0.4)' }}
        >
          {(seg?.label ?? '?').length > 8 ? seg!.label.slice(0, 7) + '…' : (seg?.label ?? '?')}
        </span>
      )}
    </div>
  );
}

// ─── Main widget ──────────────────────────────────────────────────────────────

export function SlotWidget({ embedToken, isPreview = false }: { embedToken: string; isPreview?: boolean }) {
  const [phase, setPhase] = useState<Phase>('loading');
  const [sessionId, setSessionId] = useState('');
  const [segments, setSegments] = useState<SlotSegment[]>([]);
  const [formConfig, setFormConfig] = useState<FormConfig>({});
  const [branding, setBranding] = useState<{ primary_color?: string; button_text?: string; background_value?: string; font_family?: string }>({});
  const [slotConfig, setSlotConfig] = useState<SlotConfig>({});
  const [isTriggered, setIsTriggered] = useState(false);
  const [spinResult, setSpinResult] = useState<SpinResult | null>(null);
  const [leadData, setLeadData] = useState<Record<string, string>>({ email: '', name: '', phone: '' });
  const [gdprConsent, setGdprConsent] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [reelOffsets, setReelOffsets] = useState<number[]>([0, 0, 0, 0, 0]);
  const [reelTransitions, setReelTransitions] = useState<string[]>(['none', 'none', 'none', 'none', 'none']);
  const [streak, setStreak] = useState<number>(0);
  const spinningRef = useRef(false);

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
        setSlotConfig(data.wheel?.config ?? {});
        const rules = data.wheel?.trigger_rules || {};
        if (!rules.time_on_page && !rules.scroll_depth && !rules.exit_intent) setIsTriggered(true);
        setPhase(data.wheel?.form_config?.enabled ? 'form' : 'ready');
      } catch { setErrorMsg('Failed to load.'); setPhase('error'); }
    }
    init();
  }, [embedToken]);

  async function handleSpin() {
    if (spinningRef.current || segments.length === 0) return;
    spinningRef.current = true;
    setPhase('spinning');

    // Play sound if configured
    if (slotConfig.sound_enabled && slotConfig.sound_url) {
      try { new Audio(slotConfig.sound_url).play(); } catch { /* ignore */ }
    }

    const reelCount = slotConfig.slot_reel_count ?? 3;
    const visRowsLocal = slotConfig.slot_visible_rows ?? 3;
    const rowH = visRowsLocal === 1 ? 96 : visRowsLocal === 5 ? 56 : 72;
    const visRows = slotConfig.slot_visible_rows ?? 3;
    const totalDuration = slotConfig.slot_spin_duration_ms ?? 3000;
    const stopDelay = slotConfig.slot_stop_delay_ms ?? 600;
    const stripLen = 24 + visRows;
    const idempotencyKey = crypto.randomUUID();

    // Animate all reels, start from fastest → slowest (staggered)
    const durations = Array.from({ length: reelCount }, (_, i) =>
      (totalDuration + i * stopDelay) / 1000
    );

    const finalOffsets = Array.from({ length: reelCount }, () =>
      -((20 + Math.floor(Math.random() * (segments.length || 1))) * rowH)
    );

    setReelTransitions(
      durations.map((d) => `transform ${d}s cubic-bezier(0.15,0.85,0.35,1.0)`)
    );
    setReelOffsets(finalOffsets);

    await new Promise<void>((resolve) =>
      setTimeout(resolve, durations[reelCount - 1] * 1000 + 300)
    );

    try {
      const res = await fetch('/api/spin/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          idempotency_key: idempotencyKey,
          client_seed: Math.random().toString(36).slice(2),
        }),
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
      } else { toast.error(data.error?.message ?? 'Spin failed'); setPhase('ready'); }
    } finally { spinningRef.current = false; }
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (formConfig.gdpr_enabled && !gdprConsent) { toast.error('Please accept the consent checkbox'); return; }
    setIsTriggered(true);
    setPhase('ready');
  }

  const primaryColor = branding.primary_color ?? '#7C3AED';
  const bgColor = branding.background_value ?? '#F3E8FF';
  const fontFamily = branding.font_family ?? 'Inter, sans-serif';
  const buttonText = branding.button_text ?? 'SPIN!';
  const reelCount = slotConfig.slot_reel_count ?? 3;
  const visRows = slotConfig.slot_visible_rows ?? 3;
  const symbolMode = slotConfig.slot_symbol_mode ?? 'both';
  const cabinetStyle = slotConfig.slot_cabinet_style ?? 'modern';
  const winLineColor = slotConfig.slot_win_line_color ?? primaryColor;
  const rowH = visRows === 1 ? 96 : visRows === 5 ? 56 : 72;
  const windowH = rowH * visRows;
  const reelW = reelCount === 5 ? 68 : reelCount === 2 ? 110 : 88;
  const stripLen = 24 + visRows;
  const styles = getCabinetStyles(cabinetStyle, primaryColor);

  function buildStrip(offset: number): SlotSegment[] {
    if (segments.length === 0) return [];
    return Array.from({ length: stripLen }, (_, i) => segments[(i + offset) % segments.length]);
  }

  if (phase === 'error') return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: bgColor, fontFamily }}>
      <div className="text-center space-y-3 p-8"><p className="text-5xl">😕</p><p className="text-lg font-semibold">Unavailable</p><p className="text-sm text-gray-500">{errorMsg}</p></div>
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
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-8 space-y-5 text-gray-900 border border-gray-100">
        <div className="text-center">
          <p className="text-4xl mb-3 drop-shadow-md">🎰</p>
          <h2 className="text-2xl font-bold text-gray-900">Spin the Slots!</h2>
          <p className="text-sm text-gray-500 mt-1">Enter your details to play</p>
        </div>
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
          <Button type="submit" className="w-full font-bold" style={{ backgroundColor: primaryColor }}>Play Now</Button>
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
        onPlayAgain={() => {
          setSpinResult(null);
          setReelOffsets([0, 0, 0, 0, 0]);
          setReelTransitions(['none', 'none', 'none', 'none', 'none']);
          setStreak(0);
          setPhase('ready');
        }}
      />
    </div>
  );

  // ── Ready / spinning ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 p-4" style={{ backgroundColor: bgColor, fontFamily }}>
      <div className="text-center">
        <h2 className="text-2xl font-bold">🎰 Slot Machine</h2>
        <p className="text-sm text-gray-500 mt-1">Match symbols to win!</p>
      </div>

      {/* Cabinet */}
      <div style={styles.cabinet as React.CSSProperties}>
        {/* Reel window */}
        <div
          className="flex gap-3 rounded-3xl p-3"
          style={{
            background: styles.reelBg,
            boxShadow: 'inset 0 8px 24px rgba(0,0,0,0.8), inset 0 -2px 4px rgba(255,255,255,0.08)',
            border: styles.reelBorder,
          }}
        >
          {Array.from({ length: reelCount }, (_, reelIdx) => (
            <div key={reelIdx} className="relative rounded-xl overflow-hidden" style={{ width: reelW, height: windowH }}>
              {/* Win-line highlight on center row (or only row if visRows=1) */}
              {visRows >= 1 && (
                <div
                  className="absolute inset-x-0 z-10 pointer-events-none"
                  style={{
                    top: Math.floor(visRows / 2) * rowH,
                    height: rowH,
                    border: `3px solid ${winLineColor}`,
                    borderRadius: 8,
                    boxShadow: `0 0 20px ${winLineColor}cc, inset 0 0 10px ${winLineColor}66, 0 0 40px ${winLineColor}44`,
                  }}
                />
              )}
              {/* Scrolling strip */}
              <div
                style={{
                  transform: `translateY(${reelOffsets[reelIdx] ?? 0}px)`,
                  transition: reelTransitions[reelIdx] ?? 'none',
                }}
              >
                {buildStrip(reelIdx * 3).map((seg, rowIdx) => (
                  <SymbolCell key={rowIdx} seg={seg} mode={symbolMode} rowH={rowH} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Spin button */}
        <Button
          className="w-full font-bold mt-6 transition-all active:scale-95 duration-200"
          style={{
            backgroundColor: primaryColor,
            height: 56,
            fontSize: 18,
            borderRadius: 20,
            boxShadow: `0 8px 20px ${primaryColor}44, inset 0 2px 4px rgba(255,255,255,0.2)`,
            border: `2px solid ${primaryColor}`,
          }}
          onClick={handleSpin}
          disabled={phase === 'spinning'}
        >
          {phase === 'spinning' ? (
            <span className="flex items-center gap-2">
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Spinning…
            </span>
          ) : (
            <span className="flex items-center gap-2 justify-center">
              🎰 {buttonText}
            </span>
          )}
        </Button>
      </div>

      <p className="text-xs text-gray-400">{reelCount} reels · {visRows} visible row{visRows !== 1 ? 's' : ''}</p>
    </div>
  );
}
