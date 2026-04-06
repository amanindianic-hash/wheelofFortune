import { NextRequest } from 'next/server';
import { randomBytes } from 'crypto';
import { sql } from '@/lib/db';
import { okResponse, errorResponse } from '@/lib/middleware-utils';
import { selectSegment, generateCouponCode } from '@/lib/prize-engine';
import type { Segment } from '@/lib/types';

// POST /api/spin/execute — execute a spin (public, authenticated by session_id)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { session_id, idempotency_key, lead_data, client_seed, turnstile_token } = body;

    if (!session_id || !idempotency_key) {
      return errorResponse('VALIDATION_ERROR', 'session_id and idempotency_key are required.', 400);
    }

    // Check idempotency — return existing result if key already used
    const existingResults = await sql`
      SELECT sr.id, sr.segment_id, sr.prize_id, sr.created_at,
             s.label as segment_label, p.display_title, p.type as prize_type,
             p.custom_message_html, p.redirect_url, p.points_value,
             cc.code as coupon_code
      FROM spin_results sr
      JOIN segments s ON s.id = sr.segment_id
      LEFT JOIN prizes p ON p.id = sr.prize_id
      LEFT JOIN coupon_codes cc ON cc.id = sr.coupon_code_id
      WHERE sr.idempotency_key = ${idempotency_key}
      LIMIT 1
    `;
    const existing = (existingResults as any)[0];
    if (existing) {
      return okResponse({
        result: {
          spin_result_id: existing.id,
          segment: { id: existing.segment_id, label: existing.segment_label },
          is_winner: existing.prize_id != null,
          prize: existing.display_title
            ? {
                display_title: existing.display_title,
                type: existing.prize_type,
                custom_message_html: existing.custom_message_html ?? null,
                redirect_url: existing.redirect_url ?? null,
              }
            : null,
          coupon_code: existing.coupon_code ?? null,
          consolation_message: null,
        },
      }, 200);
    }

    // Fetch and validate session
    const sessionResults = await sql`
      SELECT id, wheel_id, status, expires_at, lead_email, variant_id, ab_test_id
      FROM spin_sessions WHERE id = ${session_id} LIMIT 1
    `;
    const session = (sessionResults as any)[0];
    if (!session) return errorResponse('NOT_FOUND', 'Session not found.', 404);

    // Enforce Turnstile when configured (required in production)
    if (process.env.TURNSTILE_SECRET_KEY) {
      if (!turnstile_token) {
        return errorResponse('CAPTCHA_REQUIRED', 'Anti-abuse verification token is required.', 403);
      }
      const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: process.env.TURNSTILE_SECRET_KEY,
          response: turnstile_token,
        }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyData.success) {
        return errorResponse('INVALID_CAPTCHA', 'Anti-abuse verification failed.', 403);
      }
    }

    if (session.status === 'spun') return errorResponse('ALREADY_SPUN', 'This session has already been spun.', 409);
    if (session.status === 'expired' || new Date(session.expires_at) < new Date()) {
      return errorResponse('SESSION_EXPIRED', 'Spin session has expired.', 410);
    }

    // Handle lead form submission
    if (lead_data) {
      await sql`
        UPDATE spin_sessions SET
          lead_email          = ${lead_data.email ?? null},
          lead_name           = ${lead_data.name ?? null},
          lead_phone          = ${lead_data.phone ?? null},
          lead_custom_fields  = ${JSON.stringify(lead_data.custom_fields ?? {})}::jsonb,
          gdpr_consent        = ${lead_data.gdpr_consent ?? false},
          gdpr_consent_at     = ${lead_data.gdpr_consent ? 'NOW()' : null},
          status              = 'form_submitted'
        WHERE id = ${session_id}
      `;
    }

    // Fetch wheel config for guaranteed win logic (use variant if assigned)
    const effectiveWheelId = session.variant_id || session.wheel_id;
    const wheelResults = await sql`
      SELECT id, config, client_id FROM wheels WHERE id = ${effectiveWheelId} LIMIT 1
    `;
    const wheel = (wheelResults as any)[0];

    // Fetch segments with current caps
    const segmentRows = await sql`
      SELECT * FROM segments WHERE wheel_id = ${effectiveWheelId} ORDER BY position ASC
    `;
    const segments = segmentRows as Segment[];

    // Check guaranteed win override
    let winningSegment: Segment;
    let serverSeed: string;
    const config = wheel.config as { guaranteed_win_every_n?: number; guaranteed_win_segment_id?: string };

    if (config.guaranteed_win_every_n && config.guaranteed_win_segment_id) {
      const wheelRowResults = await sql`SELECT total_spins FROM wheels WHERE id = ${wheel.id}`;
      const wheelRow = (wheelRowResults as any)[0];
      if ((wheelRow.total_spins + 1) % config.guaranteed_win_every_n === 0) {
        const forced = segments.find((s) => s.id === config.guaranteed_win_segment_id);
        if (forced) {
          winningSegment = forced;
          serverSeed = randomBytes(32).toString('hex');
        } else {
          ({ segment: winningSegment, serverSeed } = selectSegment(segments));
        }
      } else {
        ({ segment: winningSegment, serverSeed } = selectSegment(segments));
      }
    } else {
      ({ segment: winningSegment, serverSeed } = selectSegment(segments));
    }

    // Handle coupon code assignment
    let couponCodeId: string | null = null;
    let couponCode: string | null = null;

    if (winningSegment.prize_id && !winningSegment.is_no_prize) {
      const prizeResults = await sql`SELECT * FROM prizes WHERE id = ${winningSegment.prize_id} LIMIT 1`;
      const prize = (prizeResults as any)[0];

      if (prize?.type === 'coupon') {
        if (prize.coupon_mode === 'static') {
          couponCode = prize.static_coupon_code;
        } else if (prize.coupon_mode === 'unique_pool') {
          // Atomically claim one available code
          const claimedResults = await sql`
            UPDATE coupon_codes
            SET status = 'issued', issued_at = NOW()
            WHERE id = (
              SELECT id FROM coupon_codes
              WHERE prize_id = ${prize.id} AND status = 'available'
              LIMIT 1
              FOR UPDATE SKIP LOCKED
            )
            RETURNING id, code
          `;
          const claimed = (claimedResults as any)[0];
          if (claimed) {
            couponCodeId = claimed.id;
            couponCode = claimed.code;
          }
        } else if (prize.coupon_mode === 'auto_generate') {
          const code = generateCouponCode(prize.auto_gen_prefix ?? 'SPIN', prize.auto_gen_length ?? 8);
          const expiresAt = prize.coupon_expiry_days
            ? new Date(Date.now() + prize.coupon_expiry_days * 86400000).toISOString()
            : null;
          const newCodeResults = await sql`
            INSERT INTO coupon_codes (prize_id, code, status, issued_at, expires_at)
            VALUES (${prize.id}, ${code}, 'issued', NOW(), ${expiresAt})
            RETURNING id, code
          `;
          const newCode = (newCodeResults as any)[0];
          couponCodeId = newCode.id;
          couponCode = newCode.code;
        }
      }
    }

    // Insert spin result
    const resultRows = await sql`
      INSERT INTO spin_results (session_id, wheel_id, segment_id, prize_id, coupon_code_id, idempotency_key, server_seed, client_seed)
      VALUES (
        ${session_id}, ${session.wheel_id}, ${winningSegment.id},
        ${winningSegment.prize_id ?? null}, ${couponCodeId},
        ${idempotency_key}, ${serverSeed}, ${client_seed ?? null}
      )
      RETURNING id, created_at
    `;
    const result = (resultRows as any)[0];

    // Link coupon to spin result
    if (couponCodeId) {
      await sql`UPDATE coupon_codes SET issued_to_spin_id = ${result.id} WHERE id = ${couponCodeId}`;
    }

    // Update counters atomically
    await sql`UPDATE spin_sessions SET status = 'spun' WHERE id = ${session_id}`;
    await sql`UPDATE segments SET wins_today = wins_today + 1, wins_total = wins_total + 1 WHERE id = ${winningSegment.id}`;
    await sql`UPDATE wheels SET total_spins = total_spins + 1 WHERE id = ${effectiveWheelId}`;
    await sql`UPDATE clients SET spins_used_this_month = spins_used_this_month + 1 WHERE id = ${wheel.client_id}`;

    // Fetch prize details for response
    let prizeDetails = null;
    if (winningSegment.prize_id) {
      const prizeDetailResults = await sql`SELECT display_title, display_description, type, custom_message_html, redirect_url, points_value FROM prizes WHERE id = ${winningSegment.prize_id} LIMIT 1`;
      const p = (prizeDetailResults as any)[0];
      prizeDetails = p;
    }

    // Trigger Handlers (Non-blocking)
    if (session.lead_email) {
      const { processLeadSync } = require('@/lib/integrations');
      const { sendWinEmail } = require('@/lib/email');
      
      processLeadSync(wheel.client_id, session.lead_email, lead_data || {}, prizeDetails, session_id);
      
      if (prizeDetails && prizeDetails.type !== 'try_again') {
        const promoCode = typeof couponCode === 'string' ? couponCode : null;
        sendWinEmail(session.lead_email, prizeDetails.display_title, promoCode);
      }
    }

    return okResponse({
      result: {
        spin_result_id: result.id,
        segment: {
          id: winningSegment.id,
          label: winningSegment.label,
          position: winningSegment.position,
        },
        is_winner: !winningSegment.is_no_prize,
        prize: prizeDetails,
        coupon_code: couponCode,
        consolation_message: winningSegment.is_no_prize ? winningSegment.consolation_message : null,
      },
    });
  } catch (err) {
    console.error('Execute spin error:', err);
    return errorResponse('INTERNAL_ERROR', 'Spin execution failed.', 500);
  }
}
