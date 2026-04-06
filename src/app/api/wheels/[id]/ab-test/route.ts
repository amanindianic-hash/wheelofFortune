import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { logAuditAction } from '@/lib/audit';
import { okResponse, errorResponse } from '@/lib/middleware-utils';

/**
 * GET /api/wheels/[id]/ab-test
 * Returns all A/B tests for a wheel with live performance metrics.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return errorResponse('UNAUTHORIZED', 'Authentication required.', 401);

  const { id } = await params;

  const wheelRows = await sql`
    SELECT id FROM wheels WHERE id = ${id} AND client_id = ${user.client_id} AND deleted_at IS NULL
  `;
  if (!wheelRows || (wheelRows as any[]).length === 0) {
    return errorResponse('NOT_FOUND', 'Wheel not found.', 404);
  }

  const tests = await sql`
    SELECT
      t.*,
      (SELECT COUNT(*)::int FROM spin_sessions WHERE wheel_id = t.variant_a_id) AS variant_a_spins,
      (SELECT COUNT(*)::int FROM spin_results sr
         JOIN segments seg ON seg.id = sr.segment_id
         WHERE sr.wheel_id = t.variant_a_id AND seg.is_no_prize = false
      ) AS variant_a_wins,
      (SELECT COUNT(*)::int FROM spin_sessions WHERE wheel_id = t.variant_b_id) AS variant_b_spins,
      (SELECT COUNT(*)::int FROM spin_results sr
         JOIN segments seg ON seg.id = sr.segment_id
         WHERE sr.wheel_id = t.variant_b_id AND seg.is_no_prize = false
      ) AS variant_b_wins,
      wa.name AS variant_a_name,
      wb.name AS variant_b_name
    FROM ab_tests t
    JOIN wheels wa ON wa.id = t.variant_a_id
    JOIN wheels wb ON wb.id = t.variant_b_id
    WHERE t.wheel_id = ${id}
    ORDER BY t.created_at DESC
  `;

  return okResponse({ tests: tests as any[] });
}

/**
 * POST /api/wheels/[id]/ab-test
 * Create a new A/B test. The control wheel (id) is always Variant A.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return errorResponse('UNAUTHORIZED', 'Authentication required.', 401);

  const { id } = await params;
  const body = await req.json();
  const { name, variant_b_id, traffic_split_percent = 50 } = body;

  if (!name || !variant_b_id) {
    return errorResponse('VALIDATION_ERROR', 'name and variant_b_id are required.', 400);
  }

  // Verify both wheels belong to this account
  const wheels = await sql`
    SELECT id FROM wheels WHERE id IN (${id}, ${variant_b_id}) AND client_id = ${user.client_id} AND deleted_at IS NULL
  `;
  if ((wheels as any[]).length < 2) {
    return errorResponse('VALIDATION_ERROR', 'Invalid wheel IDs.', 400);
  }

  // Pause any conflicting active tests
  await sql`
    UPDATE ab_tests SET status = 'paused', updated_at = NOW()
    WHERE wheel_id = ${id} AND status = 'active'
  `;

  const testRows = await sql`
    INSERT INTO ab_tests (wheel_id, name, variant_a_id, variant_b_id, traffic_split_percent)
    VALUES (${id}, ${name}, ${id}, ${variant_b_id}, ${traffic_split_percent})
    RETURNING *
  `;
  const test = (testRows as any[])[0];

  await logAuditAction({
    req,
    userId: user.id,
    clientId: user.client_id,
    action: 'ab_test_created',
    resourceType: 'ab_test',
    resourceId: test.id,
    changes: { wheel_id: id, name },
  });

  return okResponse({ test }, 201);
}

/**
 * PUT /api/wheels/[id]/ab-test
 * Update status or traffic split.
 * Body: { test_id, status?, traffic_split_percent? }
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return errorResponse('UNAUTHORIZED', 'Authentication required.', 401);

  const { id } = await params;

  // Verify wheel ownership before updating
  const wheelRows = await sql`
    SELECT id FROM wheels WHERE id = ${id} AND client_id = ${user.client_id} AND deleted_at IS NULL
  `;
  if ((wheelRows as any[]).length === 0) {
    return errorResponse('NOT_FOUND', 'Wheel not found.', 404);
  }

  const { test_id, status, traffic_split_percent } = await req.json();

  if (!test_id) return errorResponse('VALIDATION_ERROR', 'test_id is required.', 400);

  const updated = await sql`
    UPDATE ab_tests SET
      status = COALESCE(${status ?? null}::text, status),
      traffic_split_percent = COALESCE(${traffic_split_percent ?? null}::int, traffic_split_percent),
      updated_at = NOW()
    WHERE id = ${test_id} AND wheel_id = ${id}
    RETURNING *
  `;

  if ((updated as any[]).length === 0) {
    return errorResponse('NOT_FOUND', 'A/B test not found.', 404);
  }

  await logAuditAction({
    req,
    userId: user.id,
    clientId: user.client_id,
    action: 'ab_test_updated',
    resourceType: 'ab_test',
    resourceId: test_id,
    changes: { status, traffic_split_percent },
  });

  return okResponse({ test: (updated as any[])[0] });
}

/**
 * DELETE /api/wheels/[id]/ab-test?test_id=...
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return errorResponse('UNAUTHORIZED', 'Authentication required.', 401);

  const { id } = await params;

  // Verify wheel ownership before deleting
  const wheelRows = await sql`
    SELECT id FROM wheels WHERE id = ${id} AND client_id = ${user.client_id} AND deleted_at IS NULL
  `;
  if ((wheelRows as any[]).length === 0) {
    return errorResponse('NOT_FOUND', 'Wheel not found.', 404);
  }

  const { searchParams } = new URL(req.url);
  const test_id = searchParams.get('test_id');

  if (!test_id) return errorResponse('VALIDATION_ERROR', 'test_id is required.', 400);

  await sql`DELETE FROM ab_tests WHERE id = ${test_id} AND wheel_id = ${id}`;

  await logAuditAction({
    req,
    userId: user.id,
    clientId: user.client_id,
    action: 'ab_test_deleted',
    resourceType: 'ab_test',
    resourceId: test_id,
    changes: {},
  });

  return okResponse({ success: true });
}
