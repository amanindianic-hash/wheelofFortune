import { NextRequest } from 'next/server';
import { createHash } from 'crypto';
import { sql } from '@/lib/db';
import { okResponse, errorResponse } from '@/lib/middleware-utils';
import { normalizeSegmentForResponse, assertSegments } from '@/lib/utils/segment-normalizer';

// POST /api/spin/session — create a spin session (public, authenticated by embed_token)
export async function POST(req: NextRequest) {
  // ★★★ VERSION CHECK — if you see this log the new code is running ★★★
  console.log('[SpinSession] route.ts loaded — v2 (with positioning columns)');
  try {
    const body = await req.json();
    const { embed_token, fingerprint_data, page_url, referrer_url, preview, variant_id, ab_test_id } = body;

    if (!embed_token) {
      return errorResponse('VALIDATION_ERROR', 'embed_token is required.', 400);
    }

    // Look up wheel by embed token
    const wheelResults = await sql`
      SELECT w.id, w.status, w.config, w.branding, w.form_config, w.trigger_rules,
             w.active_from, w.active_until, w.total_spin_cap, w.total_spins,
             c.is_active as client_active, c.plan_spin_limit, c.spins_used_this_month
      FROM wheels w
      JOIN clients c ON w.client_id = c.id
      WHERE w.embed_token = ${embed_token}
        AND w.deleted_at IS NULL
        AND c.deleted_at IS NULL
      LIMIT 1
    `;
    const wheel = (wheelResults as any)[0];

    if (!wheel) return errorResponse('NOT_FOUND', 'Wheel not found.', 404);

    // Preview mode: skip all status/quota checks (dashboard preview only)
    if (!preview) {
      // Geo-fence check using Vercel / CDN country header
      const geoFence = wheel.trigger_rules?.geo_fence;
      if (geoFence && Array.isArray(geoFence.countries) && geoFence.countries.length > 0) {
        const visitorCountry = (
          req.headers.get('x-vercel-ip-country') ??
          req.headers.get('cf-ipcountry') ??         // Cloudflare fallback
          req.headers.get('x-country-code') ??        // generic CDN fallback
          ''
        ).toUpperCase();
        const inList = geoFence.countries
          .map((c: string) => c.toUpperCase())
          .includes(visitorCountry);
        const blocked = geoFence.mode === 'allow' ? !inList : inList;
        if (blocked) {
          return errorResponse('GEO_BLOCKED', 'This offer is not available in your region.', 403);
        }
      }

      if (!wheel.client_active) return errorResponse('UNAVAILABLE', 'This wheel is currently unavailable.', 503);
      if (wheel.status !== 'active') return errorResponse('UNAVAILABLE', 'This wheel is not active.', 503);
      if (wheel.total_spin_cap && wheel.total_spins >= wheel.total_spin_cap) {
        return errorResponse('QUOTA_EXCEEDED', 'This wheel has reached its total spin limit.', 429);
      }
      if (wheel.spins_used_this_month >= wheel.plan_spin_limit) {
        return errorResponse('QUOTA_EXCEEDED', 'Monthly spin quota exceeded.', 429);
      }
      const now = new Date();
      if (wheel.active_from && new Date(wheel.active_from) > now) {
        return errorResponse('UNAVAILABLE', 'This wheel is not active yet.', 503);
      }
      if (wheel.active_until && new Date(wheel.active_until) < now) {
        return errorResponse('UNAVAILABLE', 'This wheel campaign has ended.', 503);
      }
    }

    // 2. Handle A/B Testing split
    let assignedVariantId = variant_id || null;
    let assignedAbTestId = ab_test_id || null;

    if (!preview && !assignedVariantId) {
      const abTestResults = await sql`
        SELECT id, variant_a_id, variant_b_id, traffic_split_percent
        FROM ab_tests
        WHERE wheel_id = ${wheel.id} AND status = 'active'
        LIMIT 1
      `;
      const abTest = (abTestResults as any[])[0];
      if (abTest) {
        assignedAbTestId = abTest.id;
        const rand = Math.floor(Math.random() * 100);
        assignedVariantId = rand < abTest.traffic_split_percent ? abTest.variant_a_id : abTest.variant_b_id;
      }
    }

    // 3. Load variant data if assigned
    let effectiveWheel = wheel;
    if (assignedVariantId && assignedVariantId !== wheel.id) {
      const variantResults = await sql`SELECT id, config, branding, form_config, trigger_rules FROM wheels WHERE id = ${assignedVariantId}`;
      const variant = (variantResults as any[])[0];
      if (variant) effectiveWheel = { ...wheel, ...variant };
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '0.0.0.0';
    const userAgent = req.headers.get('user-agent') ?? '';

    // Detect device type and OS from user-agent
    const ua = userAgent.toLowerCase();
    const deviceType = /ipad|tablet|(android(?!.*mobile))/i.test(ua)
      ? 'tablet'
      : /mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)
        ? 'mobile'
        : 'desktop';
    const os = /iphone|ipad|ipod/.test(ua) ? 'iOS'
      : /android/.test(ua) ? 'Android'
      : /windows/.test(ua) ? 'Windows'
      : /macintosh|mac os/.test(ua) ? 'macOS'
      : /linux/.test(ua) ? 'Linux'
      : 'Other';

    // Compute fingerprint
    const fpInput = fingerprint_data ?? `${userAgent}${ip}`;
    const fingerprint = createHash('sha256').update(fpInput).digest('hex');

    // Ensure device columns exist (idempotent)
    await sql`ALTER TABLE spin_sessions ADD COLUMN IF NOT EXISTS device_type VARCHAR(20)`;
    await sql`ALTER TABLE spin_sessions ADD COLUMN IF NOT EXISTS os VARCHAR(30)`;

    const sessionResults = await sql`
      INSERT INTO spin_sessions (wheel_id, fingerprint, ip_address, user_agent, page_url, referrer_url, variant_id, ab_test_id, device_type, os)
      VALUES (${wheel.id}, ${fingerprint}, ${ip}::inet, ${userAgent}, ${page_url ?? null}, ${referrer_url ?? null}, ${assignedVariantId}, ${assignedAbTestId}, ${deviceType}, ${os})
      RETURNING id, wheel_id, status, expires_at, created_at
    `;
    const session = (sessionResults as any)[0];

    // ── Auto-migrate: ensure all positioning columns exist (idempotent) ─────────
    // Safe to run on every request — IF NOT EXISTS makes it a no-op when columns
    // already exist. This guarantees the schema is always in sync with the code.
    await sql`ALTER TABLE segments ADD COLUMN IF NOT EXISTS label_radial_offset     FLOAT`;
    await sql`ALTER TABLE segments ADD COLUMN IF NOT EXISTS label_tangential_offset  FLOAT`;
    await sql`ALTER TABLE segments ADD COLUMN IF NOT EXISTS label_rotation_angle     FLOAT`;
    await sql`ALTER TABLE segments ADD COLUMN IF NOT EXISTS label_font_scale         FLOAT`;
    await sql`ALTER TABLE segments ADD COLUMN IF NOT EXISTS label_offset_x           FLOAT`;
    await sql`ALTER TABLE segments ADD COLUMN IF NOT EXISTS label_offset_y           FLOAT`;
    await sql`ALTER TABLE segments ADD COLUMN IF NOT EXISTS icon_radial_offset       FLOAT`;
    await sql`ALTER TABLE segments ADD COLUMN IF NOT EXISTS icon_tangential_offset   FLOAT`;
    await sql`ALTER TABLE segments ADD COLUMN IF NOT EXISTS icon_rotation_angle      FLOAT`;
    await sql`ALTER TABLE segments ADD COLUMN IF NOT EXISTS icon_offset_x            FLOAT`;
    await sql`ALTER TABLE segments ADD COLUMN IF NOT EXISTS icon_offset_y            FLOAT`;
    console.log('[SpinSession] DB column migration check complete.');

    // Fetch segments for the widget (use variant wheel if assigned)
    // Get all segments but filter to active_segment_count
    // IMPORTANT: segment_image_url MUST be included — it powers background image rendering in the widget.
    const allSegments = await sql`
      SELECT
        id, position, label, bg_color, text_color, icon_url, segment_image_url, weight, is_no_prize,
        label_offset_x, label_offset_y, icon_offset_x, icon_offset_y,
        label_rotation_angle, icon_rotation_angle,
        label_radial_offset, label_tangential_offset,
        icon_radial_offset,  icon_tangential_offset,
        label_font_scale
      FROM segments WHERE wheel_id = ${effectiveWheel.id} ORDER BY position ASC
    ` as any[];

    // Get active_segment_count from wheels table to filter orphaned segments
    const wheelCountResults = await sql`
      SELECT active_segment_count FROM wheels WHERE id = ${effectiveWheel.id} LIMIT 1
    ` as any[];
    const activeCount = (wheelCountResults[0]?.active_segment_count ?? allSegments.length) as number;

    // ── Normalize + assert via shared data-contract utility ──────────────────
    // This replaces the inline normalization block and guarantees the same
    // segment shape whether called from the widget or the dashboard editor.
    const rawSegments = allSegments.slice(0, activeCount);
    const segments = rawSegments.map((s: any, i: number) => normalizeSegmentForResponse(s, i));
    assertSegments(segments, 'POST /api/spin/session');

    // Dev-only snapshot log — diff this when something looks wrong
    if (process.env.NODE_ENV === 'development') {
      console.log('[SpinSession] FINAL RENDER SNAPSHOT', JSON.stringify(segments.map(s => ({
        id: s.id, label: s.label, bg: s.bg_color, weight: s.weight, weight_type: typeof s.weight,
        label_radial_offset: s.label_radial_offset, label_font_scale: s.label_font_scale,
      })), null, 2));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TASK 2 — API SEGMENTS RESPONSE (full dump for comparison with frontend)
    // ═══════════════════════════════════════════════════════════════════════════
    console.log('API SEGMENTS RESPONSE:', JSON.stringify(segments, null, 2));

    // TASK 4 — PER-SEGMENT FIELD VALIDATION
    segments.forEach((s: any) => {
      console.log('CHECK SEGMENT:', {
        id:               s.id,
        label:            s.label,
        // Background
        hasBackground:    !!(s.background?.imageUrl),
        background_imageUrl: s.background?.imageUrl ?? '(null)',
        // Icon
        hasIcon:          !!(s.icon_url),
        icon_url:         s.icon_url ?? '(null)',
        // Label positioning
        labelOffsets: [
          `label_radial_offset    = ${s.label_radial_offset    ?? '(null)'}`, 
          `label_tangential_offset= ${s.label_tangential_offset ?? '(null)'}`,
          `label_rotation_angle   = ${s.label_rotation_angle   ?? '(null)'}`,
          `label_font_scale       = ${s.label_font_scale       ?? '(null)'}`,
          `label_offset_x         = ${s.label_offset_x         ?? '(null)'}`,
          `label_offset_y         = ${s.label_offset_y         ?? '(null)'}`,
        ],
        // Icon positioning
        iconOffsets: [
          `icon_radial_offset     = ${s.icon_radial_offset     ?? '(null)'}`,
          `icon_tangential_offset = ${s.icon_tangential_offset ?? '(null)'}`,
          `icon_rotation_angle    = ${s.icon_rotation_angle    ?? '(null)'}`,
        ],
        // Field presence summary
        allLabelFieldsPresent: [
          'label_radial_offset', 'label_tangential_offset', 'label_rotation_angle',
          'label_font_scale', 'label_offset_x', 'label_offset_y',
        ].every(k => k in s),
        allIconFieldsPresent: [
          'icon_radial_offset', 'icon_tangential_offset', 'icon_rotation_angle',
        ].every(k => k in s),
      });
    });

    // ── Dev-only: warn if background image URL and icon URL are the same ───────
    if (process.env.NODE_ENV === 'development') {
      segments.forEach((s: any) => {
        if (s.background.imageUrl && s.icon_url && s.background.imageUrl === s.icon_url) {
          console.warn('⚠️ POSSIBLE FIELD MIX: background == icon for segment', s.id);
        }
      });
    }

    // ── Flatten wheel config/branding ──────────────────────────────────────────
    // Guard against double-nesting: if the JSONB column was accidentally saved
    // as { config: { spin_duration_ms: ... } } unwrap it to the inner object.
    const rawConfig   = effectiveWheel.config   ?? {};
    const rawBranding = effectiveWheel.branding ?? {};
    const flatConfig   = (rawConfig.config   && typeof rawConfig.config   === 'object') ? rawConfig.config   : rawConfig;
    const flatBranding = (rawBranding.branding && typeof rawBranding.branding === 'object') ? rawBranding.branding : rawBranding;

    // ── CENTER LOGO DEBUG — trace the exact value reaching the widget ─────────
    console.log('🖼️  [SpinSession] CENTER IMAGE DEBUG:', {
      rawConfig_center_image_url:  rawConfig.center_image_url  ?? '(none in rawConfig)',
      flatConfig_center_image_url: flatConfig.center_image_url ?? '(none in flatConfig)',
      premium_face_url:            flatBranding.premium_face_url ?? '(none)',
      rawBranding_premium_face_url:rawBranding.premium_face_url ?? '(none in rawBranding)',
    });

    // SAFE PASSTHROUGH: ensure center_image_url is never dropped by the flatten heuristic.
    // If rawConfig has it at top-level but flatConfig (unwrapped inner) doesn't, restore it.
    if (rawConfig.center_image_url && !flatConfig.center_image_url) {
      (flatConfig as any).center_image_url = rawConfig.center_image_url;
      console.warn('[SpinSession] center_image_url was in rawConfig but missing from flatConfig — restored.');
    }

    // ── STEP 4: API RESPONSE ──────────────────────────────────────────────
    console.log('STEP 4 API RESPONSE (Spin Session):', {
      sessionId: session.id,
      wheel: {
        id: effectiveWheel.id,
        branding: {
          primary: flatBranding.primary_color,
          outer_ring: flatBranding.outer_ring_color,
          outer_ring_width: flatBranding.outer_ring_width,
          face_url: flatBranding.premium_face_url
        }
      },
      segments: segments.slice(0, 3).map(s => ({
        label: s.label,
        lro: s.label_radial_offset,
        bg: s.bg_color,
        icon: s.icon_url
      }))
    });

    return okResponse({
      session_id: session.id,
      expires_at: session.expires_at,
      variant_id: assignedVariantId,
      ab_test_id: assignedAbTestId,
      wheel: {
        config:       flatConfig,
        branding:     flatBranding,
        form_config:  effectiveWheel.form_config  ?? {},
        trigger_rules: effectiveWheel.trigger_rules ?? {},
      },
      segments,
    }, 201);
  } catch (err) {
    console.error('Create session error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to create spin session.', 500);
  }
}
