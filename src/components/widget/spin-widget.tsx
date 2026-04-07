'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { drawWheel, preloadSegmentImages, type WheelSegment, type WheelConfig, type WheelBranding, type ImageCache, easeOutQuart } from '@/lib/utils/wheel-renderer';

interface FormConfig { enabled?: boolean; fields?: Array<{ key: string; label: string; type: string; required?: boolean }>; gdpr_enabled?: boolean; gdpr_text?: string; privacy_policy_url?: string | null; }
interface SpinResult { is_winner: boolean; segment: { label: string }; prize?: { display_title: string; display_description?: string; type: string; custom_message_html?: string; redirect_url?: string } | null; coupon_code?: string | null; consolation_message?: string | null; }

type Phase = 'loading' | 'form' | 'ready' | 'spinning' | 'result' | 'error';

export function SpinWidget({ embedToken, isPreview = false }: { embedToken: string; isPreview?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [sessionId, setSessionId] = useState('');
  const [segments, setSegments] = useState<WheelSegment[]>([]);
  const [config, setConfig] = useState<WheelConfig>({});
  const [branding, setBranding] = useState<WheelBranding>({});
  const [formConfig, setFormConfig] = useState<FormConfig>({});
  const [spinResult, setSpinResult] = useState<SpinResult | null>(null);
  const [rotation, setRotation] = useState(0);
  const [leadData, setLeadData] = useState<Record<string, string>>({ email: '', name: '', phone: '' });
  const [gdprConsent, setGdprConsent] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const spinningRef = useRef(false);
  const currentRotRef = useRef(0);
  const imageCacheRef = useRef<ImageCache>(new Map());

  // Load session on mount
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
        setConfig(data.wheel?.config ?? {});
        setBranding(data.wheel?.branding ?? {});
        setFormConfig(data.wheel?.form_config ?? {});
        setPhase(data.wheel?.form_config?.enabled ? 'form' : 'ready');
      } catch {
        setErrorMsg('Failed to load wheel. Please try again.'); setPhase('error');
      }
    }
    init();
  }, [embedToken]);

  // Draw wheel on canvas — also depends on `phase` so it fires when canvas first mounts
  useEffect(() => {
    async function draw() {
      if (segments.length === 0 || !canvasRef.current) return;
      await preloadSegmentImages(segments, config, imageCacheRef.current);
      drawWheel(canvasRef.current, segments, rotation, config, branding, imageCacheRef.current);
    }
    draw();
  }, [segments, rotation, config, branding, phase]);

  async function handleSpin() {
    if (spinningRef.current) return;
    spinningRef.current = true;
    setPhase('spinning');

    // Play sound if configured
    if (config.sound_enabled && config.sound_url) {
      try { new Audio(config.sound_url).play(); } catch { /* ignore */ }
    }

    const idempotencyKey = crypto.randomUUID();
    const duration = Math.max(config.spin_duration_ms ?? 4000, 1000);

    // Pick a random segment weighted by weight
    const total = segments.reduce((s, seg) => s + seg.weight, 0);
    const rand = Math.random() * total;
    let cumul = 0;
    let targetIdx = 0;
    for (let i = 0; i < segments.length; i++) {
      cumul += segments[i].weight;
      if (rand <= cumul) { targetIdx = i; break; }
    }

    const segAngle = (2 * Math.PI) / segments.length;
    const targetAngle = segAngle * targetIdx + segAngle / 2;
    const extraSpins = 5 * 2 * Math.PI;
    const finalRotation = extraSpins + (2 * Math.PI - targetAngle);

    // Animate
    const startTime = performance.now();
    const startRot = currentRotRef.current;
    const endRot = startRot + finalRotation;

    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = easeOutQuart(progress);
      const currentRot = startRot + (endRot - startRot) * ease;
      currentRotRef.current = currentRot;
      setRotation(currentRot);
      if (progress < 1) { requestAnimationFrame(animate); }
      else { finalizeSpin(idempotencyKey); }
    }
    requestAnimationFrame(animate);
  }

  async function finalizeSpin(idempotencyKey: string) {
    try {
      const res = await fetch('/api/spin/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          idempotency_key: idempotencyKey,
          lead_data: formConfig.enabled ? { ...leadData, gdpr_consent: gdprConsent } : undefined,
          client_seed: Math.random().toString(36).slice(2),
        }),
      });
      const data = await res.json();
      if (res.ok) { setSpinResult(data.result); setPhase('result'); }
      else { toast.error(data.error?.message ?? 'Spin failed'); setPhase('ready'); }
    } finally {
      spinningRef.current = false;
    }
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (formConfig.gdpr_enabled && !gdprConsent) { toast.error('Please accept the consent checkbox'); return; }
    setPhase('ready');
  }

  const buttonColor = branding.primary_color ?? '#7C3AED';
  const buttonText = branding.button_text ?? 'SPIN NOW!';
  const fontFamily = branding.font_family ?? 'Inter, sans-serif';
  const bgColor = branding.background_value ?? '#FFFFFF';

  if (phase === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: bgColor, fontFamily }}>
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500">Loading wheel…</p>
        </div>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: bgColor, fontFamily }}>
        <div className="text-center space-y-3 p-8">
          <p className="text-5xl">😕</p>
          <p className="text-lg font-semibold">Wheel Unavailable</p>
          <p className="text-sm text-gray-500">{errorMsg}</p>
        </div>
      </div>
    );
  }

  if (phase === 'form') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: bgColor, fontFamily }}>
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8 space-y-5">
          <div className="text-center">
            <p className="text-3xl mb-2">🎡</p>
            <h2 className="text-xl font-bold">Spin to Win!</h2>
            <p className="text-sm text-gray-500">Enter your details to spin the wheel</p>
          </div>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {(formConfig.fields ?? [{ key: 'email', label: 'Email', type: 'email', required: true }, { key: 'name', label: 'Name', type: 'text', required: false }]).map((field) => (
              <div key={field.key} className="space-y-1.5">
                <Label htmlFor={field.key}>{field.label}{field.required && ' *'}</Label>
                <Input
                  id={field.key}
                  type={field.type}
                  required={field.required}
                  value={leadData[field.key] ?? ''}
                  onChange={(e) => setLeadData({ ...leadData, [field.key]: e.target.value })}
                />
              </div>
            ))}
            {formConfig.gdpr_enabled && (
              <div className="flex items-start gap-2">
                <input type="checkbox" id="gdpr" checked={gdprConsent} onChange={(e) => setGdprConsent(e.target.checked)}
                  className="mt-1 rounded" required />
                <label htmlFor="gdpr" className="text-xs text-gray-500">
                  {formConfig.gdpr_text ?? 'I agree to receive marketing communications.'}{' '}
                  {formConfig.privacy_policy_url && (
                    <a href={formConfig.privacy_policy_url} target="_blank" rel="noreferrer" className="underline">Privacy Policy</a>
                  )}
                </label>
              </div>
            )}
            <Button type="submit" className="w-full font-bold" style={{ backgroundColor: buttonColor }}>
              Continue to Spin
            </Button>
          </form>
        </div>
      </div>
    );
  }

  if (phase === 'result' && spinResult) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: bgColor, fontFamily }}>
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8 space-y-5 text-center">
          {spinResult.is_winner ? (
            <>
              <p className="text-5xl">🎉</p>
              <h2 className="text-2xl font-bold text-green-600">You Won!</h2>
              <p className="text-xl font-semibold">{spinResult.prize?.display_title}</p>
              {spinResult.prize?.display_description && (
                <p className="text-sm text-gray-500">{spinResult.prize.display_description}</p>
              )}
              {spinResult.coupon_code && (
                <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Your Code</p>
                  <p className="text-2xl font-bold font-mono tracking-wider">{spinResult.coupon_code}</p>
                  <button
                    className="text-xs text-violet-600 mt-2 hover:underline"
                    onClick={() => { navigator.clipboard.writeText(spinResult.coupon_code!); toast.success('Code copied!'); }}
                  >
                    Copy code
                  </button>
                </div>
              )}
              {spinResult.prize?.type === 'message' && spinResult.prize.custom_message_html && (
                <div className="text-sm" dangerouslySetInnerHTML={{ __html: spinResult.prize.custom_message_html }} />
              )}
              {spinResult.prize?.type === 'url_redirect' && spinResult.prize.redirect_url && (
                <Button className="w-full" style={{ backgroundColor: buttonColor }}
                  onClick={() => window.open(spinResult.prize!.redirect_url!, '_blank')}>
                  Claim Prize
                </Button>
              )}
            </>
          ) : (
            <>
              <p className="text-5xl">😢</p>
              <h2 className="text-2xl font-bold">Better luck next time!</h2>
              <p className="text-sm text-gray-500">{spinResult.consolation_message ?? "You didn't win this time. Try again soon!"}</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-4"
      style={{ backgroundColor: bgColor, fontFamily }}>
      {/* Wheel canvas */}
      <div className="relative isolate pt-4">
        {/* Premium 3D Pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
          {/* Base Mount */}
          <div className="w-8 h-4 bg-gradient-to-b from-[#f8f9fa] to-[#d1d5db] rounded-t-md shadow-sm border border-b-0 border-black/10 relative z-10" />
          {/* Arrow */}
          <div className="relative -mt-0.5 drop-shadow-xl filter">
            <svg width="28" height="38" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 38L2 14V2C2 2 12 4 16 4C20 4 30 2 30 2V14L16 38Z" fill={buttonColor} stroke="rgba(255,255,255,0.6)" strokeWidth="2" />
              <path d="M16 34L4 15V5C7 6.5 11 7.5 16 7.5C21 7.5 25 6.5 28 5V15L16 34Z" fill="url(#arrow-grad-widget)" />
              <defs>
                <linearGradient id="arrow-grad-widget" x1="16" y1="5" x2="16" y2="34" gradientUnits="userSpaceOnUse">
                  <stop stopColor="white" stopOpacity="0.3" />
                  <stop offset="1" stopColor="black" stopOpacity="0.25" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
        <canvas
          ref={canvasRef}
          width={680} // 2x internally for crisp rendering
          height={680}
          className="rounded-full shadow-2xl bg-white w-[340px] h-[340px]"
        />
      </div>

      <Button
        className="w-48 h-12 text-lg font-bold rounded-full shadow-lg transition-transform active:scale-95"
        style={{ backgroundColor: buttonColor }}
        onClick={handleSpin}
        disabled={phase === 'spinning'}
      >
        {phase === 'spinning' ? '…' : buttonText}
      </Button>
    </div>
  );
}

