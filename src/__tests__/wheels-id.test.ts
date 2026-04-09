// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('@/lib/db', () => ({ sql: vi.fn() }));
vi.mock('@/lib/audit', () => ({ logAuditAction: vi.fn() }));
vi.mock('@/lib/middleware-utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/middleware-utils')>();
  return { ...actual, requireAuth: vi.fn() };
});

import { GET, PUT, DELETE } from '@/app/api/wheels/[id]/route';
import { sql } from '@/lib/db';
import { requireAuth } from '@/lib/middleware-utils';

const mockSql = vi.mocked(sql as unknown as (...args: unknown[]) => Promise<unknown[]>);
const mockRequireAuth = vi.mocked(requireAuth);

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const MOCK_USER  = { id: 'user-1', client_id: 'client-1', role: 'owner' };
const MOCK_EDITOR = { id: 'user-2', client_id: 'client-1', role: 'editor' };
const MOCK_VIEWER = { id: 'user-3', client_id: 'client-1', role: 'viewer' };

const WHEEL_ROW = {
  id: 'wheel-1',
  client_id: 'client-1',
  name: 'Test Wheel',
  status: 'draft',
  config: {},
  created_at: new Date().toISOString(),
};

const SEGMENT_ROWS = [
  { id: 'seg-1', wheel_id: 'wheel-1', position: 0, label: 'Seg 1', bg_color: '#ff0000', text_color: '#fff' },
  { id: 'seg-2', wheel_id: 'wheel-1', position: 1, label: 'Seg 2', bg_color: '#00ff00', text_color: '#000' },
];

const PARAMS = Promise.resolve({ id: 'wheel-1' });
const MISSING_PARAMS = Promise.resolve({ id: 'nonexistent' });

function makeGetRequest() {
  return new NextRequest('http://localhost/api/wheels/wheel-1', { method: 'GET' });
}

function makePutRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/wheels/wheel-1', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function makeDeleteRequest() {
  return new NextRequest('http://localhost/api/wheels/wheel-1', { method: 'DELETE' });
}

function authAs(user: typeof MOCK_USER) {
  mockRequireAuth.mockResolvedValue({ user } as any);
}

function authUnauthorized() {
  mockRequireAuth.mockResolvedValue(
    new NextResponse(JSON.stringify({ error: { code: 'UNAUTHORIZED' } }), { status: 401 })
  );
}

// ─── GET /api/wheels/[id] ─────────────────────────────────────────────────────

describe('GET /api/wheels/[id]', () => {
  beforeEach(() => vi.resetAllMocks());

  it('returns 401 when not authenticated', async () => {
    authUnauthorized();
    const res = await GET(makeGetRequest(), { params: PARAMS });
    expect(res.status).toBe(401);
  });

  it('returns 404 when wheel does not exist', async () => {
    authAs(MOCK_USER);
    mockSql.mockResolvedValueOnce([]); // wheel not found
    const res = await GET(makeGetRequest(), { params: MISSING_PARAMS });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('returns 404 when wheel belongs to different client (cross-tenant)', async () => {
    authAs({ ...MOCK_USER, client_id: 'client-99' });
    mockSql.mockResolvedValueOnce([]); // SQL WHERE filters by client_id, returns nothing
    const res = await GET(makeGetRequest(), { params: PARAMS });
    expect(res.status).toBe(404);
  });

  it('returns wheel with segments on success', async () => {
    authAs(MOCK_USER);
    mockSql.mockResolvedValueOnce([WHEEL_ROW]); // SELECT wheel
    mockSql.mockResolvedValueOnce(SEGMENT_ROWS); // SELECT segments with JOIN
    const res = await GET(makeGetRequest(), { params: PARAMS });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.wheel.id).toBe('wheel-1');
    expect(body.segments).toHaveLength(2);
  });

  it('returns 500 on DB error', async () => {
    authAs(MOCK_USER);
    mockSql.mockRejectedValueOnce(new Error('DB down'));
    const res = await GET(makeGetRequest(), { params: PARAMS });
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});

// ─── PUT /api/wheels/[id] ─────────────────────────────────────────────────────

describe('PUT /api/wheels/[id]', () => {
  beforeEach(() => vi.resetAllMocks());

  it('returns 401 when not authenticated', async () => {
    authUnauthorized();
    const res = await PUT(makePutRequest({ name: 'Updated' }), { params: PARAMS });
    expect(res.status).toBe(401);
  });

  it('returns 403 for viewer role', async () => {
    authAs(MOCK_VIEWER);
    const res = await PUT(makePutRequest({ name: 'Updated' }), { params: PARAMS });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('returns 404 when wheel not found', async () => {
    authAs(MOCK_USER);
    mockSql.mockResolvedValueOnce([]); // SELECT wheel — not found
    const res = await PUT(makePutRequest({ name: 'Updated' }), { params: MISSING_PARAMS });
    expect(res.status).toBe(404);
  });

  it('updates wheel name for editor', async () => {
    authAs(MOCK_EDITOR);
    const updatedWheel = { ...WHEEL_ROW, name: 'Updated Wheel' };
    mockSql
      .mockResolvedValueOnce([WHEEL_ROW])    // SELECT wheel (ownership check)
      .mockResolvedValueOnce([])             // UPDATE main fields
      .mockResolvedValueOnce([updatedWheel]);// SELECT * to return updated row
    const res = await PUT(makePutRequest({ name: 'Updated Wheel' }), { params: PARAMS });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.wheel.name).toBe('Updated Wheel');
  });

  it('updates wheel status for owner', async () => {
    authAs(MOCK_USER);
    const updatedWheel = { ...WHEEL_ROW, status: 'active' };
    mockSql
      .mockResolvedValueOnce([WHEEL_ROW])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([updatedWheel]);
    const res = await PUT(makePutRequest({ status: 'active' }), { params: PARAMS });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.wheel.status).toBe('active');
  });

  it('returns 500 on DB error', async () => {
    authAs(MOCK_USER);
    mockSql.mockRejectedValueOnce(new Error('DB down'));
    const res = await PUT(makePutRequest({ name: 'x' }), { params: PARAMS });
    expect(res.status).toBe(500);
  });
});

// ─── DELETE /api/wheels/[id] ──────────────────────────────────────────────────

describe('DELETE /api/wheels/[id]', () => {
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
    const body = await res.json();
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('returns 403 for viewer role', async () => {
    authAs(MOCK_VIEWER);
    const res = await DELETE(makeDeleteRequest(), { params: PARAMS });
    expect(res.status).toBe(403);
  });

  it('returns 404 when wheel not found', async () => {
    authAs(MOCK_USER);
    mockSql.mockResolvedValueOnce([]); // SELECT — not found
    const res = await DELETE(makeDeleteRequest(), { params: MISSING_PARAMS });
    expect(res.status).toBe(404);
  });

  it('soft-deletes the wheel for owner', async () => {
    authAs(MOCK_USER);
    mockSql.mockResolvedValueOnce([WHEEL_ROW]); // SELECT
    mockSql.mockResolvedValueOnce([]);           // UPDATE soft-delete
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
