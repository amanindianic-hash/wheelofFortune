'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UniversalWheelRenderer } from '@/components/shared/universal-wheel-renderer';
import { getFinalVisualConfig } from '@/lib/utils/theme-utils';
import { WHEEL_TEMPLATES } from '@/lib/wheel-templates';
import { type WheelSegment, type WheelConfig, type WheelBranding, easeOutQuart } from '@/lib/utils/wheel-renderer';

interface FormConfig { enabled?: boolean; fields?: Array<{ key: string; label: string; type: string; required?: boolean }>; gdpr_enabled?: boolean; gdpr_text?: string; privacy_policy_url?: string | null; }
interface SpinResult { is_winner: boolean; segment: { id: string; label: string }; prize?: { display_title: string; display_description?: string; type: string; custom_message_html?: string; redirect_url?: string } | null; coupon_code?: string | null; consolation_message?: string | null; }

type Phase = 'loading' | 'form' | 'ready' | 'spinning' | 'result' | 'error';

export function SpinWidget({ embedToken, isPreview = false }: { embedToken: string; isPreview?: boolean }) {
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
        const receivedSegments: WheelSegment[] = data.segments ?? [];

        // ═══════════════════════════════════════════════════════════════════════
        // TASK 1 — LIVE WIDGET: full segment dump (compare with API SEGMENTS RESPONSE)
        // ═══════════════════════════════════════════════════════════════════════
        console.log('LIVE WIDGET SEGMENTS:', JSON.stringify(receivedSegments, null, 2));

        // TASK 4 — PER-SEGMENT FIELD VALIDATION (frontend mirror of API check)
        receivedSegments.forEach((s: any) => {
          console.log('CHECK SEGMENT:', {
            id:    s.id,
            label: s.label,
            // Background
            hasBackground:       !!(s.background?.imageUrl),
            background_imageUrl: s.background?.imageUrl ?? '(null)',
            // Icon
            hasIcon:  !!(s.icon_url),
            icon_url: s.icon_url ?? '(null)',
            // Label positioning
            labelOffsets: [
              `label_radial_offset     = ${s.label_radial_offset     ?? '(null)'}`,
              `label_tangential_offset = ${s.label_tangential_offset ?? '(null)'}`,
              `label_rotation_angle    = ${s.label_rotation_angle    ?? '(null)'}`,
              `label_font_scale        = ${s.label_font_scale        ?? '(null)'}`,
              `label_offset_x          = ${s.label_offset_x          ?? '(null)'}`,
              `label_offset_y          = ${s.label_offset_y          ?? '(null)'}`,
            ],
            // Icon positioning
            iconOffsets: [
              `icon_radial_offset      = ${s.icon_radial_offset      ?? '(null)'}`,
              `icon_tangential_offset  = ${s.icon_tangential_offset  ?? '(null)'}`,
              `icon_rotation_angle     = ${s.icon_rotation_angle     ?? '(null)'}`,
            ],
            // Key field presence (true = key exists in object, even if value is null)
            allLabelFieldsPresent: [
              'label_radial_offset','label_tangential_offset','label_rotation_angle',
              'label_font_scale','label_offset_x','label_offset_y',
            ].every(k => k in s),
            allIconFieldsPresent: [
              'icon_radial_offset','icon_tangential_offset','icon_rotation_angle',
            ].every(k => k in s),
          });
        });

        // ── UNIFIED DATA PIPELINE: RESOLVE VISUALS ──────────────────────────────
        // Resolve the active template so getFinalVisualConfig can use the palette
        // as the authoritative segment count — theme is the COMPLETE visual snapshot.
        const wheelConfig = data.wheel?.config ?? {};
        const appliedThemeId = wheelConfig.applied_theme_id as string | undefined;
        const activeTemplate = appliedThemeId
          ? (WHEEL_TEMPLATES.find((t: any) => t.id === appliedThemeId) ?? null)
          : null;

        const {
          branding: resolvedBranding,
          config: resolvedConfig,
          segments: resolvedSegments
        } = getFinalVisualConfig(
          { ...data.wheel, segments: receivedSegments },
          activeTemplate
        );

        console.log('SEGMENTS BEFORE RENDER', resolvedSegments.length);
        console.log('CENTER LOGO STATUS (Widget):', {
          centerLogo: (resolvedBranding as any).centerLogo,
          center_logo: (resolvedBranding as any).center_logo
        });

        setBranding(resolvedBranding);
        setConfig(resolvedConfig);
        setSegments(resolvedSegments as unknown as WheelSegment[]);
        
        setFormConfig(data.wheel?.form_config ?? {});
        setPhase(data.wheel?.form_config?.enabled ? 'form' : 'ready');

        // ── STEP 5: FRONTEND STATE ──────────────────────────────────────────
        console.log('STEP 5 FRONTEND STATE (Spin Widget):', {
          sessionId: data.session_id,
          branding: {
            primary: data.wheel?.branding?.primary_color,
            outer_ring: data.wheel?.branding?.outer_ring_color,
            face_url: data.wheel?.branding?.premium_face_url
          },
          segmentCount: receivedSegments.length,
          sampleSegment: receivedSegments[0] ? {
            label: receivedSegments[0].label,
            lro: (receivedSegments[0] as any).label_radial_offset,
            bg: (receivedSegments[0] as any).bg_color
          } : null
        });

        // CENTER LOGO DEBUG — confirm widget receives center_image_url
      } catch {
        setErrorMsg('Failed to load wheel. Please try again.'); setPhase('error');
      }
    }
    init();
  }, [embedToken]);


  async function handleSpin() {
    if (spinningRef.current) return;
    spinningRef.current = true;
    setPhase('spinning');

    // 1. Fetch result from server securely BEFORE visually spinning
    const idempotencyKey = crypto.randomUUID();
    let resultData: SpinResult | null = null;
    
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
      
      if (res.ok) {
        resultData = data.result;
      } else {
        toast.error(data.error?.message ?? 'Spin failed');
        setPhase('ready');
        spinningRef.current = false;
        return;
      }
    } catch {
      toast.error('Spin execution failed. Please check connection and try again.');
      setPhase('ready');
      spinningRef.current = false;
      return;
    }

    // Play sound if configured
    if (config.sound_enabled && config.sound_url) {
      try { new Audio(config.sound_url).play(); } catch { /* ignore */ }
    }

    const duration = Math.max(config.spin_duration_ms ?? 4000, 1000);

    // 2. Find target segment index matching the verified server result
    const targetSegId = resultData?.segment.id;
    let targetIdx = segments.findIndex(s => s.id === targetSegId);
    if (targetIdx === -1) targetIdx = 0; // fallback

    const segAngle = (2 * Math.PI) / segments.length;
    // Add slightly randomized offset within the winning segment for realism
    const randomOffset = (Math.random() * 0.8 + 0.1) * segAngle; // 10% to 90% across the slice
    const targetAngle = segAngle * targetIdx + randomOffset;
    
    const extraSpins = 5 * 2 * Math.PI;
    const finalRotation = extraSpins + (2 * Math.PI - targetAngle);

    // 3. Animate the wheel
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
      
      if (progress < 1) { 
        requestAnimationFrame(animate); 
      } else { 
        // 4. Reveal result
        setSpinResult(resultData); 
        setPhase('result');
        spinningRef.current = false;
      }
    }
    requestAnimationFrame(animate);
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (formConfig.gdpr_enabled && !gdprConsent) { toast.error('Please accept the consent checkbox'); return; }
    setPhase('ready');
  }

  const buttonColor = branding.primary_color ?? '#7C3AED';
  const buttonText = branding.button_text ?? 'SPIN NOW!';
  const fontFamily = branding.font_family ?? 'Inter, sans-serif';
  const bgColor = branding.background_value ?? '#F3E8FF';

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
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-8 space-y-5 text-gray-900 border border-gray-100">
          <div className="text-center">
            <p className="text-4xl mb-3 drop-shadow-md">🎡</p>
            <h2 className="text-2xl font-bold text-gray-900">Spin to Win!</h2>
            <p className="text-sm text-gray-500 mt-1">Enter your details to spin the wheel</p>
          </div>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {(formConfig.fields ?? [{ key: 'email', label: 'Email', type: 'email', required: true }, { key: 'name', label: 'Name', type: 'text', required: false }]).map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key} className="text-sm font-semibold text-gray-700">{field.label}{field.required && ' *'}</Label>
                <Input
                  id={field.key}
                  type={field.type}
                  required={field.required}
                  value={leadData[field.key] ?? ''}
                  onChange={(e) => setLeadData({ ...leadData, [field.key]: e.target.value })}
                  className="bg-gray-50 border-gray-200 text-gray-900 focus-visible:ring-gray-300"
                />
              </div>
            ))}
            {formConfig.gdpr_enabled && (
              <div className="flex items-start gap-3 mt-6 bg-gray-50 p-3 rounded-lg border border-gray-100">
                <input type="checkbox" id="gdpr" checked={gdprConsent} onChange={(e) => setGdprConsent(e.target.checked)}
                  className="mt-1 rounded border-gray-300 text-violet-600 focus:ring-violet-500" required />
                <label htmlFor="gdpr" className="text-xs text-gray-600 leading-relaxed">
                  {formConfig.gdpr_text ?? 'I agree to receive marketing communications.'}{' '}
                  {formConfig.privacy_policy_url && (
                    <a href={formConfig.privacy_policy_url} target="_blank" rel="noreferrer" className="underline font-medium text-gray-900">Privacy Policy</a>
                  )}
                </label>
              </div>
            )}
            <Button type="submit" className="w-full font-bold h-12 mt-2 shadow-md hover:shadow-lg transition-all" style={{ backgroundColor: buttonColor, color: '#fff' }}>
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
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-8 space-y-5 text-center text-gray-900 border border-gray-100">
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
              <p className="text-5xl drop-shadow-sm">😢</p>
              <h2 className="text-2xl font-bold text-gray-900">Better luck next time!</h2>
              <p className="text-sm text-gray-600">{spinResult.consolation_message ?? "You didn't win this time. Try again soon!"}</p>
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
        <UniversalWheelRenderer
          segments={segments}
          config={config}
          branding={branding}
          rotation={rotation}
          size={340}
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

