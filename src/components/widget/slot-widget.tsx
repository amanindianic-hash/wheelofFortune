'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getRandomSlotIcon } from '@/lib/utils/slot-utils';
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

// ─── Premium Symbol cell with 3D effects ──────────────────────────────────────

function SymbolCell({
  seg, mode, rowH,
}: {
  seg: SlotSegment | undefined;
  mode: SlotConfig['slot_symbol_mode'];
  rowH: number;
}) {
  const bgColor = seg?.bg_color ?? '#2A2A2A';
  const textColor = seg?.text_color ?? '#FFFFFF';

  return (
    <div
      className="flex flex-col items-center justify-center gap-0.5 w-full relative"
      style={{
        height: rowH,
        background: `linear-gradient(135deg, ${bgColor} 0%, ${bgColor}dd 50%, ${bgColor}cc 100%)`,
        borderBottom: '1px solid rgba(0,0,0,0.4)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        boxShadow: `
          inset 0 1px 3px rgba(255,255,255,0.1),
          inset 0 -1px 2px rgba(0,0,0,0.3),
          0 2px 4px rgba(0,0,0,0.2)
        `,
        flexShrink: 0,
        position: 'relative',
      }}
    >
      {/* Glossy overlay for premium look */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 50%, rgba(0,0,0,0.02) 100%)',
        pointerEvents: 'none',
      }} />

      {(mode === 'icon' || mode === 'both') && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={seg?.icon_url ?? getRandomSlotIcon()}
          alt={seg?.label ?? 'slot icon'}
          className="object-contain rounded"
          style={{
            width: rowH * 0.45,
            height: rowH * 0.45,
            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5)) brightness(1.05)',
            zIndex: 1,
          }}
        />
      )}
      {(mode === 'label' || mode === 'both') && (
        <span
          className="font-bold text-center leading-tight px-1 truncate w-full text-center"
          style={{
            color: textColor,
            fontSize: rowH * 0.18,
            textShadow: `
              0 2px 4px rgba(0,0,0,0.6),
              0 -1px 1px rgba(255,255,255,0.1),
              0 0 2px ${textColor}33
            `,
            zIndex: 1,
            fontWeight: 800,
            letterSpacing: '0.5px',
          }}
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
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-8 p-4"
      style={{
        backgroundColor: bgColor,
        fontFamily,
        background: `linear-gradient(135deg, ${bgColor} 0%, ${bgColor}dd 100%), radial-gradient(circle at 50% 0%, rgba(255,255,255,0.05) 0%, transparent 50%)`,
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Classic Casino Slot Machine Cabinet */}
      <div style={{
        width: '100%',
        maxWidth: 520,
        perspective: '1200px',
        filter: 'drop-shadow(0 40px 100px rgba(0,0,0,0.3))',
      }}>
        {/* Cabinet Container with premium metallic finish */}
        <div style={{
          background: `linear-gradient(165deg, #2a2a2a 0%, #1a1a1a 30%, #0a0a0a 60%, #1a1a1a 100%)`,
          borderRadius: '40px 40px 20px 20px',
          padding: '20px',
          boxShadow: `
            0 40px 100px rgba(0,0,0,0.8),
            inset 0 1px 2px rgba(255,255,255,0.15),
            inset 0 -2px 4px rgba(0,0,0,0.5),
            inset 0 0 30px rgba(0,0,0,0.3)
          `,
          border: '3px solid #0a0a0a',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Premium metal texture background */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: `
              repeating-linear-gradient(
                90deg,
                transparent,
                transparent 2px,
                rgba(255,255,255,0.01) 2px,
                rgba(255,255,255,0.01) 4px
              ),
              repeating-linear-gradient(
                0deg,
                transparent,
                transparent 2px,
                rgba(0,0,0,0.02) 2px,
                rgba(0,0,0,0.02) 4px
              )
            `,
            pointerEvents: 'none',
          }} />
          {/* Top Marquee - CASINO (Premium gold with premium effects) */}
          <div style={{
            background: `linear-gradient(165deg, #FFE55C 0%, #FFD700 25%, #FFA500 50%, #FFD700 75%, #FFE55C 100%)`,
            borderRadius: '20px 20px 0 0',
            padding: '18px 16px',
            marginBottom: '20px',
            textAlign: 'center',
            boxShadow: `
              0 12px 30px rgba(255,165,0,0.6),
              inset 0 1px 1px rgba(255,255,255,0.4),
              inset 0 -2px 3px rgba(139,69,19,0.3),
              0 0 40px rgba(255,215,0,0.3)
            `,
            border: '3px solid #DAA520',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Metallic shine effect */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
              pointerEvents: 'none',
            }} />
            <h1 style={{
              fontSize: '36px',
              fontWeight: 'bold',
              color: '#8B0000',
              textShadow: `
                3px 3px 6px rgba(0,0,0,0.5),
                -1px -1px 0 rgba(255,255,255,0.3),
                0 0 15px rgba(255,215,0,0.4)
              `,
              letterSpacing: '5px',
              margin: 0,
              position: 'relative',
              zIndex: 1,
            }}>
              ♦ CASINO ♦
            </h1>
          </div>

          {/* Main Cabinet Body */}
          <div style={{
            display: 'flex',
            gap: '16px',
            alignItems: 'flex-start',
            position: 'relative',
            zIndex: 1,
          }}>
            {/* Reels Container */}
            <div style={{ flex: 1, position: 'relative' }}>
              {/* Premium Chrome Frame around reels */}
              <div style={{
                background: `linear-gradient(165deg, #F5F5F5 0%, #E8E8E8 15%, #C0C0C0 50%, #A9A9A9 85%, #909090 100%)`,
                borderRadius: '12px',
                padding: '14px',
                boxShadow: `
                  inset 0 2px 6px rgba(255,255,255,0.8),
                  inset 0 -2px 6px rgba(0,0,0,0.4),
                  inset 0 0 20px rgba(0,0,0,0.15),
                  0 6px 16px rgba(0,0,0,0.6),
                  0 0 30px rgba(0,0,0,0.2)
                `,
                border: '3px solid #606060',
                position: 'relative',
              }}>
                {/* Metallic texture on chrome */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: `
                    repeating-linear-gradient(
                      90deg,
                      transparent,
                      transparent 1px,
                      rgba(255,255,255,0.05) 1px,
                      rgba(255,255,255,0.05) 2px
                    )
                  `,
                  borderRadius: '12px',
                  pointerEvents: 'none',
                }} />
                {/* Reel Display Window - Premium deep black */}
                <div
                  className="flex gap-2 rounded-lg p-2 relative"
                  style={{
                    background: `linear-gradient(165deg, #050505 0%, #0a0a0a 30%, #000000 50%, #0a0a0a 70%, #050505 100%)`,
                    boxShadow: `
                      inset 0 10px 30px rgba(0,0,0,0.9),
                      inset 0 -2px 6px rgba(255,255,255,0.05),
                      inset 0 0 20px rgba(0,0,0,0.5),
                      0 2px 4px rgba(0,0,0,0.3)
                    `,
                    border: '2px solid #000',
                    zIndex: 1,
                  }}
                >
                  {Array.from({ length: reelCount }, (_, reelIdx) => (
                    <div key={reelIdx} className="relative rounded-lg overflow-hidden" style={{
                      width: reelW,
                      height: windowH,
                      background: 'linear-gradient(135deg, #0a0a0a 0%, #000000 50%, #0a0a0a 100%)',
                      boxShadow: `
                        inset 0 0 15px rgba(0,0,0,0.95),
                        inset 0 2px 4px rgba(255,255,255,0.03),
                        0 2px 6px rgba(0,0,0,0.4)
                      `,
                      border: '1px solid rgba(255,255,255,0.05)',
                    }}>
                      {/* Premium Win-line highlight with glow */}
                      {visRows >= 1 && (
                        <div
                          className="absolute inset-x-0 z-10 pointer-events-none"
                          style={{
                            top: Math.floor(visRows / 2) * rowH,
                            height: rowH,
                            border: `3px solid ${winLineColor}`,
                            borderRadius: 4,
                            boxShadow: `
                              0 0 20px ${winLineColor}ff,
                              0 0 40px ${winLineColor}aa,
                              inset 0 0 10px ${winLineColor}55,
                              0 0 60px ${winLineColor}44
                            `,
                            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
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
              </div>
            </div>

            {/* Premium Mechanical Lever */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
              paddingTop: '20px',
              position: 'relative',
            }}>
              {/* Lever mount bracket */}
              <div style={{
                width: '28px',
                height: '8px',
                background: 'linear-gradient(90deg, #606060, #808080)',
                borderRadius: '4px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.2)',
                border: '1px solid #404040',
              }} />

              {/* Lever shaft - Premium chrome */}
              <div style={{
                width: '10px',
                height: '45px',
                background: 'linear-gradient(90deg, #A9A9A9 0%, #E0E0E0 50%, #A9A9A9 100%)',
                borderRadius: '5px',
                boxShadow: `
                  0 6px 16px rgba(0,0,0,0.5),
                  inset -1px 0 2px rgba(0,0,0,0.3),
                  inset 1px 0 2px rgba(255,255,255,0.4)
                `,
              }} />

              {/* Premium Lever handle button */}
              <button
                onClick={handleSpin}
                disabled={phase === 'spinning'}
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: `radial-gradient(circle at 35% 35%, #FF6B35, #DC143C, #8B0000)`,
                  border: '4px solid #5A0000',
                  boxShadow: `
                    0 8px 20px rgba(0,0,0,0.7),
                    inset -3px -3px 8px rgba(0,0,0,0.4),
                    inset 3px 3px 8px rgba(255,255,255,0.15),
                    0 0 30px rgba(220,20,60,0.3)
                  `,
                  cursor: phase === 'spinning' ? 'not-allowed' : 'pointer',
                  transition: 'all 0.1s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: phase === 'spinning' ? 'translateY(6px) scale(0.95)' : 'translateY(0)',
                  opacity: phase === 'spinning' ? 0.75 : 1,
                }}
                title="Pull the lever to spin!"
              >
                <span style={{ fontSize: '28px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>🎰</span>
              </button>
            </div>
          </div>

          {/* Premium Bottom JACKPOT text with glow effects */}
          <div style={{
            marginTop: '16px',
            textAlign: 'center',
            padding: '14px 12px',
            background: `linear-gradient(165deg, #2a2a2a 0%, #1a1a1a 50%, #0a0a0a 100%)`,
            borderRadius: '10px',
            border: '3px solid #FFD700',
            boxShadow: `
              0 0 25px rgba(255,215,0,0.5),
              inset 0 1px 0 rgba(255,255,255,0.1),
              inset 0 -1px 2px rgba(0,0,0,0.3)
            `,
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Animated glow background */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(circle at 50% 50%, rgba(255,215,0,0.1) 0%, transparent 70%)`,
              pointerEvents: 'none',
              animation: 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }} />
            <p style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#FFD700',
              textShadow: `
                0 3px 6px rgba(0,0,0,0.9),
                0 0 20px rgba(255,215,0,0.5),
                -1px -1px 0 rgba(255,255,255,0.1)
              `,
              margin: 0,
              letterSpacing: '3px',
              position: 'relative',
              zIndex: 1,
            }}>
              🎰 JACKPOT 🎰
            </p>
          </div>
        </div>
      </div>

      {/* Status text */}
      <p style={{
        fontSize: '12px',
        color: '#999',
        marginTop: '8px',
      }}>
        {phase === 'spinning' ? '🔄 Spinning...' : '👉 Pull the lever to spin!'}
      </p>
    </div>
  );
}
