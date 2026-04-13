'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { drawRoulette, computeFinalBallAngle } from '@/lib/utils/roulette-renderer';
import type { RouletteSegment, RouletteBranding } from '@/lib/utils/roulette-renderer';
// RouletteSegment already includes icon_url from the renderer interface
import { WinQRCard } from './win-qr-card';
import { easeOutQuart } from '@/lib/utils/wheel-renderer';

interface FormConfig { enabled?: boolean; fields?: Array<{ key: string; label: string; type: string; required?: boolean }>; gdpr_enabled?: boolean; gdpr_text?: string; privacy_policy_url?: string | null; }
interface SpinResult { is_winner: boolean; segment: { id: string; label: string }; prize?: { display_title: string; display_description?: string; type: string; custom_message_html?: string; redirect_url?: string } | null; coupon_code?: string | null; consolation_message?: string | null; }
interface TriggerRules { time_on_page?: number; scroll_depth?: number; exit_intent?: boolean; }
interface RouletteConfig { roulette_spin_duration_ms?: number; roulette_pocket_style?: 'classic' | 'modern' | 'neon'; sound_enabled?: boolean; sound_url?: string | null; }

type Phase = 'loading' | 'form' | 'ready' | 'spinning' | 'result' | 'error';

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3); }
function easeInQuad(t: number): number { return t * t; }

export function RouletteWidget({ embedToken, isPreview = false }: { embedToken: string; isPreview?: boolean }) {
  const canvasRef     = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase]           = useState<Phase>('loading');
  const [sessionId, setSessionId]   = useState('');
  const [segments, setSegments]     = useState<RouletteSegment[]>([]);
  const [branding, setBranding]     = useState<RouletteBranding & { button_text?: string; background_value?: string; font_family?: string }>({});
  const [rConfig, setRConfig]       = useState<RouletteConfig>({});
  const [formConfig, setFormConfig] = useState<FormConfig>({});
  const [triggerRules, setTriggerRules] = useState<TriggerRules>({});
  const [isTriggered, setIsTriggered]   = useState(false);
  const [spinResult, setSpinResult]     = useState<SpinResult | null>(null);
  const [leadData, setLeadData]         = useState<Record<string, string>>({ email: '', name: '', phone: '' });
  const [gdprConsent, setGdprConsent]   = useState(false);
  const [errorMsg, setErrorMsg]         = useState('');
  const [streak, setStreak]             = useState<number>(0);
  const [imageCache, setImageCache]     = useState<Record<string, HTMLImageElement>>({});

  // Animation state tracked in refs to avoid stale closures
  const wheelRotRef  = useRef(0);
  const ballAngleRef = useRef(-Math.PI / 2); // start at top
  const ballDepthRef = useRef(0);
  const spinningRef  = useRef(false);

  // React state for re-renders (drives canvas redraws)
  const [wheelRot,  setWheelRot]   = useState(0);
  const [ballAngle, setBallAngle]  = useState(-Math.PI / 2);
  const [ballDepth, setBallDepth]  = useState(0);

  // Load session
  useEffect(() => {
    async function init() {
      try {
        const fp = `${navigator.userAgent}${screen.width}${screen.height}${Intl.DateTimeFormat().resolvedOptions().timeZone}${navigator.language}`;
        const res = await fetch('/api/spin/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            embed_token: embedToken,
            fingerprint_data: fp,
            page_url: window.location.href,
            referrer_url: document.referrer || null,
            preview: isPreview || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) { setErrorMsg(data.error?.message ?? 'Wheel unavailable'); setPhase('error'); return; }

        setSessionId(data.session_id);
        setSegments(data.segments ?? []);
        setBranding(data.wheel?.branding ?? {});
        setRConfig(data.wheel?.config ?? {});
        setFormConfig(data.wheel?.form_config ?? {});
        setTriggerRules(data.wheel?.trigger_rules ?? {});
        setPhase(data.wheel?.form_config?.enabled ? 'form' : 'ready');

        const rules = data.wheel?.trigger_rules || {};
        if (!rules.time_on_page && !rules.scroll_depth && !rules.exit_intent) setIsTriggered(true);
      } catch {
        setErrorMsg('Failed to load wheel.'); setPhase('error');
      }
    }
    init();
  }, [embedToken]);

  // Trigger monitoring
  useEffect(() => {
    if (isTriggered || phase === 'loading' || phase === 'error') return;
    const handlers: (() => void)[] = [];
    if (triggerRules.time_on_page) {
      const t = setTimeout(() => setIsTriggered(true), triggerRules.time_on_page * 1000);
      handlers.push(() => clearTimeout(t));
    }
    if (triggerRules.scroll_depth) {
      const onScroll = () => {
        const pct = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
        if (pct >= (triggerRules.scroll_depth ?? 0)) setIsTriggered(true);
      };
      window.addEventListener('scroll', onScroll);
      handlers.push(() => window.removeEventListener('scroll', onScroll));
    }
    if (triggerRules.exit_intent) {
      const onLeave = (e: MouseEvent) => { if (e.clientY <= 10) setIsTriggered(true); };
      document.addEventListener('mouseleave', onLeave);
      handlers.push(() => document.removeEventListener('mouseleave', onLeave));
    }
    return () => handlers.forEach(h => h());
  }, [isTriggered, triggerRules, phase]);

  // Preload segment icons when segments arrive
  useEffect(() => {
    const urls = segments.map(s => s.icon_url).filter(Boolean) as string[];
    if (urls.length === 0) return;
    const cache: Record<string, HTMLImageElement> = {};
    let loaded = 0;
    for (const url of urls) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        cache[url] = img;
        loaded++;
        if (loaded === urls.length) setImageCache({ ...cache });
      };
      img.onerror = () => { loaded++; if (loaded === urls.length) setImageCache({ ...cache }); };
      img.src = url;
    }
  }, [segments]);

  // Redraw canvas when animation state changes
  useEffect(() => {
    if (!canvasRef.current || segments.length === 0) return;
    drawRoulette(canvasRef.current, segments, wheelRot, ballAngle, ballDepth, branding, imageCache);
  }, [segments, wheelRot, ballAngle, ballDepth, branding, imageCache]);

  async function handleSpin() {
    if (spinningRef.current || segments.length === 0) return;
    spinningRef.current = true;
    setPhase('spinning');

    // Play sound if configured
    if (rConfig.sound_enabled && rConfig.sound_url) {
      try { new Audio(rConfig.sound_url).play(); } catch { /* ignore */ }
    }

    const idempotencyKey = crypto.randomUUID();
    let result: SpinResult | null = null;

    // Ask server who wins first
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
      if (!res.ok) {
        toast.error(data.error?.message ?? 'Spin failed');
        spinningRef.current = false;
        setPhase('ready');
        return;
      }
      result = data.result as SpinResult;
      // Fetch streak (non-blocking)
      fetch(`/api/spin/streak?session_id=${sessionId}`)
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d?.streak != null) setStreak(d.streak); })
        .catch(() => {});
    } catch {
      toast.error('Network error. Please try again.');
      spinningRef.current = false;
      setPhase('ready');
      return;
    }

    // Calculate targets
    const duration    = rConfig.roulette_spin_duration_ms ?? 5000;
    const winIdx      = Math.max(0, segments.findIndex(s => s.id === result!.segment.id));
    const n           = segments.length;
    const segAngle    = (2 * Math.PI) / n;

    // Wheel: same formula as SpinWidget
    const targetAngle   = segAngle * winIdx + segAngle / 2;
    const extraSpins    = 4 * 2 * Math.PI;
    const totalWheelTravel = extraSpins + (2 * Math.PI - targetAngle);

    const startWheelRot  = wheelRotRef.current;
    const startBallAngle = ballAngleRef.current;
    const finalBallAngle = computeFinalBallAngle(startBallAngle, totalWheelTravel, startWheelRot, winIdx, n);

    const startTime = performance.now();

    function animate(now: number) {
      const elapsed  = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Wheel eases out (same as spin wheel)
      const wEase = easeOutQuart(progress);
      const currentWheelRot = startWheelRot + totalWheelTravel * wEase;

      // Ball eases out slower (more inertia feel)
      const bEase = easeOutCubic(progress);
      const currentBallAngle = startBallAngle + (finalBallAngle - startBallAngle) * bEase;

      // Ball falls into pocket in final 22% of animation
      const currentBallDepth = progress < 0.78 ? 0 : easeInQuad((progress - 0.78) / 0.22);

      wheelRotRef.current  = currentWheelRot;
      ballAngleRef.current = currentBallAngle;
      ballDepthRef.current = currentBallDepth;

      setWheelRot(currentWheelRot);
      setBallAngle(currentBallAngle);
      setBallDepth(currentBallDepth);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        spinningRef.current = false;
        setSpinResult(result);
        setPhase('result');
      }
    }
    requestAnimationFrame(animate);
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (formConfig.gdpr_enabled && !gdprConsent) { toast.error('Please accept the consent checkbox'); return; }
    setIsTriggered(true);
    setPhase('ready');
  }

  const primaryColor = branding.primary_color ?? '#7C3AED';
  const buttonText   = (branding as { button_text?: string }).button_text ?? 'SPIN!';
  const fontFamily   = (branding as { font_family?: string }).font_family ?? 'Inter, sans-serif';
  const bgColor      = (branding as { background_value?: string }).background_value ?? '#F3E8FF';
  const pocketStyle  = rConfig.roulette_pocket_style ?? 'classic';

  const tableGreen   = pocketStyle === 'neon' ? '#0A0A14' : '#065c20';

  if (phase === 'error') return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: bgColor, fontFamily }}>
      <div className="text-center space-y-3 p-8">
        <p className="text-5xl">😕</p>
        <p className="text-lg font-semibold text-white">Wheel Unavailable</p>
        <p className="text-sm text-white/60">{errorMsg}</p>
      </div>
    </div>
  );

  if (!isTriggered && !isPreview) return null;

  if (phase === 'loading') return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: bgColor, fontFamily }}>
      <div className="text-center space-y-3">
        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-white/70">Loading roulette…</p>
      </div>
    </div>
  );

  if (phase === 'form') return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: bgColor, fontFamily }}>
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-8 space-y-5 text-gray-900 border border-gray-100">
        <div className="text-center">
          <p className="text-4xl mb-3 drop-shadow-md">🎰</p>
          <h2 className="text-2xl font-bold text-gray-900">Spin the Roulette!</h2>
          <p className="text-sm text-gray-500 mt-1">Enter your details to spin</p>
        </div>
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {(formConfig.fields ?? [{ key: 'email', label: 'Email', type: 'email', required: true }, { key: 'name', label: 'Name', type: 'text', required: false }]).map((field) => (
            <div key={field.key} className="space-y-1.5">
              <Label htmlFor={field.key}>{field.label}{field.required && ' *'}</Label>
              <Input id={field.key} type={field.type} required={field.required}
                value={leadData[field.key] ?? ''}
                onChange={(e) => setLeadData({ ...leadData, [field.key]: e.target.value })} />
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
          <Button type="submit" className="w-full font-bold" style={{ backgroundColor: primaryColor }}>Continue to Spin</Button>
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
        onPlayAgain={() => { setSpinResult(null); setBallDepth(0); setStreak(0); setPhase('ready'); }}
      />
    </div>
  );

  // Ready / spinning
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-6 p-4"
      style={{ backgroundColor: bgColor, fontFamily }}
    >
      {/* Table felt area */}
      <div
        className="rounded-3xl p-8 flex flex-col items-center gap-8 shadow-2xl"
        style={{
          backgroundColor: tableGreen,
          border: pocketStyle === 'neon' ? `3px solid ${primaryColor}` : '3px solid #C8A050',
          boxShadow: pocketStyle === 'neon'
            ? `0 0 30px ${primaryColor}aa, 0 0 80px ${primaryColor}55, inset 0 0 30px rgba(0,0,0,0.8), 0 20px 60px rgba(0,0,0,0.6)`
            : '0 20px 60px rgba(0,0,0,0.6), inset 0 0 30px rgba(0,0,0,0.4), 0 0 0 1px rgba(200,160,80,0.3)',
        }}
      >
        <div className="text-center">
          <h2 className="text-white font-bold text-2xl tracking-wide">🎰 Roulette</h2>
          <p className="text-white/70 text-sm mt-1">Place your bet and spin!</p>
        </div>

        {/* Pointer triangle at top */}
        <div className="relative">
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-10 drop-shadow-xl">
            <div
              className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[24px] border-l-transparent border-r-transparent"
              style={{
                borderTopColor: pocketStyle === 'neon' ? primaryColor : '#F4D03F',
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))',
              }}
            />
          </div>
          <canvas
            ref={canvasRef}
            width={400}
            height={400}
            className="rounded-full shadow-2xl"
            style={{
              border: pocketStyle === 'neon' ? `4px solid ${primaryColor}` : '4px solid #C8A050',
              boxShadow: pocketStyle === 'neon'
                ? `0 0 20px ${primaryColor}88, inset 0 0 15px rgba(0,0,0,0.4)`
                : 'inset 0 0 15px rgba(0,0,0,0.4), 0 8px 20px rgba(0,0,0,0.5)',
            }}
          />
        </div>

        <Button
          className="w-48 h-14 text-lg font-bold rounded-full shadow-lg transition-all active:scale-95 duration-200"
          style={{
            backgroundColor: primaryColor,
            boxShadow: `0 8px 20px ${primaryColor}44, inset 0 2px 4px rgba(255,255,255,0.2)`,
            border: `2px solid ${primaryColor}`,
          }}
          onClick={handleSpin}
          disabled={phase === 'spinning'}
        >
          {phase === 'spinning' ? (
            <span className="flex items-center gap-2">
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Rolling…
            </span>
          ) : (
            <span className="flex items-center gap-2">
              🎯 {buttonText}
            </span>
          )}
        </Button>
      </div>

      <p className="text-white/40 text-xs">{segments.length} pocket{segments.length !== 1 ? 's' : ''}</p>
    </div>
  );
}
