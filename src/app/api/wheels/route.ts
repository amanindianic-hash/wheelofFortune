import { NextRequest } from 'next/server';
import { randomBytes } from 'crypto';
import { sql } from '@/lib/db';
import { requireAuth, okResponse, errorResponse } from '@/lib/middleware-utils';
import { logAuditAction } from '@/lib/audit';

// GET /api/wheels — list all wheels for the authenticated client
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ('status' in auth) return auth;

  try {
    const wheels = await sql`
      SELECT id, client_id, name, status, config, branding, trigger_rules, frequency_rules,
             active_from, active_until, total_spin_cap, total_spins, embed_token, form_config, created_at
      FROM wheels
      WHERE client_id = ${auth.user.client_id} AND deleted_at IS NULL
      ORDER BY created_at DESC
    `;
    return okResponse({ wheels });
  } catch (err) {
    console.error('List wheels error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch wheels.', 500);
  }
}

// POST /api/wheels — create a new wheel
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if ('status' in auth) return auth;

  if (!['owner', 'admin', 'editor'].includes(auth.user.role)) {
    return errorResponse('FORBIDDEN', 'Insufficient permissions.', 403);
  }

  try {
    const body = await req.json();
    const { name } = body;

    if (!name?.trim()) {
      return errorResponse('VALIDATION_ERROR', 'name is required.', 400);
    }

    const embedToken = randomBytes(32).toString('hex');

    const wheelResults = await sql`
      INSERT INTO wheels (client_id, name, embed_token, config, branding, trigger_rules, frequency_rules, form_config)
      VALUES (
        ${auth.user.client_id},
        ${name.trim()},
        ${embedToken},
        ${JSON.stringify({ spin_duration_ms: 4000, animation_speed: 'medium', pointer_position: 'top', confetti_enabled: true, sound_enabled: false, show_segment_labels: true })},
        ${JSON.stringify({ button_text: 'SPIN NOW!', border_width: 4, background_type: 'solid', background_value: '#FFFFFF', font_family: 'Inter' })},
        ${'{}'},
        ${'{}'},
        ${JSON.stringify({ enabled: false, fields: [], gdpr_enabled: false })}
      )
      RETURNING *
    `;
    const wheel = (wheelResults as any)[0];

    // Insert 6 default segments — all marked is_no_prize=true until the user assigns prizes.
    // The constraint chk_prize_or_no_prize requires either is_no_prize=true or prize_id IS NOT NULL.
    const defaultSegments = [
      { label: '🎁 Prize 1',   color: '#E74C3C', isNoPrize: true },
      { label: 'Try Again',    color: '#3498DB', isNoPrize: true },
      { label: '🎁 Prize 2',   color: '#2ECC71', isNoPrize: true },
      { label: 'Try Again',    color: '#F39C12', isNoPrize: true },
      { label: '🎁 Prize 3',   color: '#9B59B6', isNoPrize: true },
      { label: 'Try Again',    color: '#1ABC9C', isNoPrize: true },
    ];
    for (let i = 0; i < defaultSegments.length; i++) {
      const seg = defaultSegments[i];
      await sql`
        INSERT INTO segments (wheel_id, position, label, bg_color, text_color, weight, is_no_prize)
        VALUES (${wheel.id}, ${i}, ${seg.label}, ${seg.color}, '#FFFFFF', 1.0, ${seg.isNoPrize})
      `;
    }

    await logAuditAction({
      req,
      userId: auth.user.id,
      clientId: auth.user.client_id,
      action: 'wheel_created',
      resourceType: 'wheel',
      resourceId: wheel.id,
      changes: { name: wheel.name, status: wheel.status }
    });

    return okResponse({ wheel }, 201);
  } catch (err) {
    console.error('Create wheel error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to create wheel.', 500);
  }
}
