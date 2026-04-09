// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('@/lib/db', () => ({ sql: vi.fn() }));
vi.mock('@/lib/audit', () => ({ logAuditAction: vi.fn() }));
vi.mock('@/lib/middleware-utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/middleware-utils')>();
  return { ...actual, requireAuth: vi.fn() };
});

import { GET, POST } from '@/app/api/prizes/route';
import { sql } from '@/lib/db';
import { requireAuth } from '@/lib/middleware-utils';

const mockSql = vi.mocked(sql as unknown as (...args: unknown[]) => Promise<unknown[]>);
const mockRequireAuth = vi.mocked(requireAuth);

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const MOCK_USER   = { id: 'user-1', client_id: 'client-1', role: 'owner' };
const MOCK_EDITOR = { id: 'user-2', client_id: 'client-1', role: 'editor' };
const MOCK_VIEWER = { id: 'user-3', client_id: 'client-1', role: 'viewer' };

const PRIZE_ROW = {
  id: 'prize-1',
  client_id: 'client-1',
  name: 'Summer Deal',
  type: 'coupon',
  display_title: '10% Off',
  display_description: 'Use at checkout',
  coupon_mode: 'static',
  static_coupon_code: 'SAVE10',
  created_at: new Date().toISOString(),
};

function makeGetRequest() {
  return new NextRequest('http://localhost/api/prizes', { method: 'GET' });
}

function makePostRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/prizes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function authAs(user: typeof MOCK_USER) {
  mockRequireAuth.mockResolvedValue({ user } as any);
}

function authUnauthorized() {
  mockRequireAuth.mockResolvedValue(
    new NextResponse(JSON.stringify({ error: { code: 'UNAUTHORIZED' } }), { status: 401 })
  );
}

// ─── GET /api/prizes ──────────────────────────────────────────────────────────

describe('GET /api/prizes', () => {
  beforeEach(() => vi.resetAllMocks());

  it('returns 401 when not authenticated', async () => {
    authUnauthorized();
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(401);
  });

  it('returns empty list when no prizes exist', async () => {
    authAs(MOCK_USER);
    mockSql.mockResolvedValueOnce([]);
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.prizes).toEqual([]);
  });

  it('returns prizes for authenticated client', async () => {
    authAs(MOCK_USER);
    mockSql.mockResolvedValueOnce([PRIZE_ROW]);
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.prizes).toHaveLength(1);
    expect(body.prizes[0].name).toBe('Summer Deal');
  });

  it('returns 500 on DB error', async () => {
    authAs(MOCK_USER);
    mockSql.mockRejectedValueOnce(new Error('DB down'));
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});

// ─── POST /api/prizes ─────────────────────────────────────────────────────────

describe('POST /api/prizes', () => {
  beforeEach(() => vi.resetAllMocks());

  it('returns 401 when not authenticated', async () => {
    authUnauthorized();
    const res = await POST(makePostRequest({ name: 'x', type: 'coupon', display_title: 'x' }));
    expect(res.status).toBe(401);
  });

  it('returns 403 for viewer role', async () => {
    authAs(MOCK_VIEWER);
    const res = await POST(makePostRequest({ name: 'x', type: 'coupon', display_title: 'x' }));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('returns 400 when name is missing', async () => {
    authAs(MOCK_USER);
    const res = await POST(makePostRequest({ type: 'coupon', display_title: 'x' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when type is missing', async () => {
    authAs(MOCK_USER);
    const res = await POST(makePostRequest({ name: 'x', display_title: 'x' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when display_title is missing', async () => {
    authAs(MOCK_USER);
    const res = await POST(makePostRequest({ name: 'x', type: 'coupon' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid prize type', async () => {
    authAs(MOCK_USER);
    const res = await POST(makePostRequest({ name: 'x', type: 'unknown_type', display_title: 'x' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for coupon type without coupon_mode', async () => {
    authAs(MOCK_USER);
    const res = await POST(makePostRequest({ name: 'x', type: 'coupon', display_title: 'x' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.message).toContain('coupon_mode');
  });

  it('returns 400 for points type without points_value', async () => {
    authAs(MOCK_USER);
    const res = await POST(makePostRequest({ name: 'x', type: 'points', display_title: 'x' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.message).toContain('points_value');
  });

  it('returns 400 for url_redirect type without redirect_url', async () => {
    authAs(MOCK_USER);
    const res = await POST(makePostRequest({ name: 'x', type: 'url_redirect', display_title: 'x' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.message).toContain('redirect_url');
  });

  it('creates a coupon prize for owner', async () => {
    authAs(MOCK_USER);
    mockSql.mockResolvedValueOnce([PRIZE_ROW]);
    const res = await POST(makePostRequest({
      name: 'Summer Deal', type: 'coupon', display_title: '10% Off', coupon_mode: 'static',
    }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.prize.type).toBe('coupon');
  });

  it('creates a message prize (no extra conditionals required)', async () => {
    authAs(MOCK_EDITOR);
    const messagePrize = { ...PRIZE_ROW, type: 'message', coupon_mode: null };
    mockSql.mockResolvedValueOnce([messagePrize]);
    const res = await POST(makePostRequest({
      name: 'Nice Try', type: 'message', display_title: 'Better luck next time',
    }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.prize.type).toBe('message');
  });

  it('creates a try_again prize', async () => {
    authAs(MOCK_USER);
    const tryAgainPrize = { ...PRIZE_ROW, type: 'try_again', coupon_mode: null };
    mockSql.mockResolvedValueOnce([tryAgainPrize]);
    const res = await POST(makePostRequest({
      name: 'Retry', type: 'try_again', display_title: 'Try Again',
    }));
    expect(res.status).toBe(201);
  });

  it('returns 500 on DB error', async () => {
    authAs(MOCK_USER);
    mockSql.mockRejectedValueOnce(new Error('DB down'));
    const res = await POST(makePostRequest({
      name: 'Crash', type: 'coupon', display_title: 'X', coupon_mode: 'static',
    }));
    expect(res.status).toBe(500);
  });
});
