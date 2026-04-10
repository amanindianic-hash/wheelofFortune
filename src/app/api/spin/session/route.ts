import { NextRequest } from 'next/server';
import { createHash } from 'crypto';
import { sql } from '@/lib/db';
import { okResponse, errorResponse } from '@/lib/middleware-utils';

// POST /api/spin/session — create a spin session (public, authenticated by embed_token)
export async function POST(req: NextRequest) {
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

    // Fetch segments for the widget (use variant wheel if assigned)
    // Get all segments but filter to active_segment_count
    const allSegments = await sql`
      SELECT id, position, label, bg_color, text_color, icon_url, weight, is_no_prize
      FROM segments WHERE wheel_id = ${effectiveWheel.id} ORDER BY position ASC
    ` as any[];

    // Get active_segment_count from wheels table to filter orphaned segments
    const wheelCountResults = await sql`
      SELECT active_segment_count FROM wheels WHERE id = ${effectiveWheel.id} LIMIT 1
    ` as any[];
    const activeCount = (wheelCountResults[0]?.active_segment_count ?? allSegments.length) as number;

    // Return only active segments
    const segments = allSegments.slice(0, activeCount);

    return okResponse({
      session_id: session.id,
      expires_at: session.expires_at,
      variant_id: assignedVariantId,
      ab_test_id: assignedAbTestId,
      wheel: {
        config: effectiveWheel.config,
        branding: effectiveWheel.branding,
        form_config: effectiveWheel.form_config,
        trigger_rules: effectiveWheel.trigger_rules,
      },
      segments,
    }, 201);
  } catch (err) {
    console.error('Create session error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to create spin session.', 500);
  }
}
