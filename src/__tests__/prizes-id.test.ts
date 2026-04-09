// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('@/lib/db', () => ({ sql: vi.fn() }));
vi.mock('@/lib/audit', () => ({ logAuditAction: vi.fn() }));
vi.mock('@/lib/middleware-utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/middleware-utils')>();
  return { ...actual, requireAuth: vi.fn() };
});

import { GET, PUT, DELETE } from '@/app/api/prizes/[id]/route';
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
  coupon_mode: 'static',
  static_coupon_code: 'SAVE10',
};

const PARAMS = Promise.resolve({ id: 'prize-1' });
const MISSING_PARAMS = Promise.resolve({ id: 'nonexistent' });

function makeGetRequest() {
  return new NextRequest('http://localhost/api/prizes/prize-1', { method: 'GET' });
}

function makePutRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/prizes/prize-1', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function makeDeleteRequest() {
  return new NextRequest('http://localhost/api/prizes/prize-1', { method: 'DELETE' });
}

function authAs(user: typeof MOCK_USER) {
  mockRequireAuth.mockResolvedValue({ user } as any);
}

function authUnauthorized() {
  mockRequireAuth.mockResolvedValue(
    new NextResponse(JSON.stringify({ error: { code: 'UNAUTHORIZED' } }), { status: 401 })
  );
}

// ─── GET /api/prizes/[id] ─────────────────────────────────────────────────────

describe('GET /api/prizes/[id]', () => {
  beforeEach(() => vi.resetAllMocks());

  it('returns 401 when not authenticated', async () => {
    authUnauthorized();
    const res = await GET(makeGetRequest(), { params: PARAMS });
    expect(res.status).toBe(401);
  });

  it('returns 404 when prize not found', async () => {
    authAs(MOCK_USER);
    mockSql.mockResolvedValueOnce([]);
    const res = await GET(makeGetRequest(), { params: MISSING_PARAMS });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('returns 404 for cross-tenant access', async () => {
    authAs({ ...MOCK_USER, client_id: 'client-99' });
    mockSql.mockResolvedValueOnce([]);
    const res = await GET(makeGetRequest(), { params: PARAMS });
    expect(res.status).toBe(404);
  });

  it('returns prize on success', async () => {
    authAs(MOCK_USER);
    mockSql.mockResolvedValueOnce([PRIZE_ROW]);
    const res = await GET(makeGetRequest(), { params: PARAMS });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.prize.id).toBe('prize-1');
    expect(body.prize.type).toBe('coupon');
  });

  it('returns 500 on DB error', async () => {
    authAs(MOCK_USER);
    mockSql.mockRejectedValueOnce(new Error('DB down'));
    const res = await GET(makeGetRequest(), { params: PARAMS });
    expect(res.status).toBe(500);
  });
});

// ─── PUT /api/prizes/[id] ─────────────────────────────────────────────────────

describe('PUT /api/prizes/[id]', () => {
  beforeEach(() => vi.resetAllMocks());

  it('returns 401 when not authenticated', async () => {
    authUnauthorized();
    const res = await PUT(makePutRequest({ name: 'New Name' }), { params: PARAMS });
    expect(res.status).toBe(401);
  });

  it('returns 403 for viewer role', async () => {
    authAs(MOCK_VIEWER);
    const res = await PUT(makePutRequest({ name: 'New Name' }), { params: PARAMS });
    expect(res.status).toBe(403);
  });

  it('returns 404 when prize not found', async () => {
    authAs(MOCK_USER);
    mockSql.mockResolvedValueOnce([]);
    const res = await PUT(makePutRequest({ name: 'New Name' }), { params: MISSING_PARAMS });
    expect(res.status).toBe(404);
  });

  it('updates prize name for editor', async () => {
    authAs(MOCK_EDITOR);
    mockSql.mockResolvedValueOnce([{ id: 'prize-1' }]);   // SELECT
    const updated = { ...PRIZE_ROW, name: 'Winter Sale', display_title: '20% Off' };
    mockSql.mockResolvedValueOnce([updated]);              // UPDATE RETURNING *
    const res = await PUT(makePutRequest({ name: 'Winter Sale', display_title: '20% Off' }), { params: PARAMS });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.prize.name).toBe('Winter Sale');
  });

  it('returns 500 on DB error', async () => {
    authAs(MOCK_USER);
    mockSql.mockRejectedValueOnce(new Error('DB down'));
    const res = await PUT(makePutRequest({ name: 'x' }), { params: PARAMS });
    expect(res.status).toBe(500);
  });
});

// ─── DELETE /api/prizes/[id] ──────────────────────────────────────────────────

describe('DELETE /api/prizes/[id]', () => {
  beforeEach(() => vi.resetAllMocks());

  it('returns 401 when not authenticated', async () => {
    authUnauthorized();
    const res = await DELETE(makeDeleteRequest(), { params: PARAMS });
    expect(res.status).toBe(401);
  });

  it('returns 403 for editor role', async () => {
    authAs(MOCK_EDITOR);
    const res = await DELETE(makeDeleteRequest(), { params: PARAMS });
    expect(res.status).toBe(403);
  });

  it('returns 403 for viewer role', async () => {
    authAs(MOCK_VIEWER);
    const res = await DELETE(makeDeleteRequest(), { params: PARAMS });
    expect(res.status).toBe(403);
  });

  it('returns 404 when prize not found', async () => {
    authAs(MOCK_USER);
    mockSql.mockResolvedValueOnce([]);
    const res = await DELETE(makeDeleteRequest(), { params: MISSING_PARAMS });
    expect(res.status).toBe(404);
  });

  it('returns 409 when prize is used by active segment', async () => {
    authAs(MOCK_USER);
    mockSql.mockResolvedValueOnce([{ id: 'prize-1' }]); // SELECT prize
    mockSql.mockResolvedValueOnce([{ id: 'seg-1' }]);   // in-use check returns a row
    const res = await DELETE(makeDeleteRequest(), { params: PARAMS });
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error.code).toBe('CONFLICT');
  });

  it('deletes prize when not in use', async () => {
    authAs(MOCK_USER);
    mockSql.mockResolvedValueOnce([{ id: 'prize-1' }]); // SELECT prize
    mockSql.mockResolvedValueOnce([]);                   // in-use check — none
    mockSql.mockResolvedValueOnce([]);                   // DELETE
    const res = await DELETE(makeDeleteRequest(), { params: PARAMS });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it('returns 500 on DB error', async () => {
    authAs(MOCK_USER);
    mockSql.mockRejectedValueOnce(new Error('DB down'));
    const res = await DELETE(makeDeleteRequest(), { params: PARAMS });
    expect(res.status).toBe(500);
  });
});
