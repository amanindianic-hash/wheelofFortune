// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('@/lib/db', () => ({ sql: vi.fn() }));
vi.mock('@/lib/audit', () => ({ logAuditAction: vi.fn() }));
vi.mock('@/lib/middleware-utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/middleware-utils')>();
  return { ...actual, requireAuth: vi.fn() };
});

import { GET, POST } from '@/app/api/wheels/route';
import { sql } from '@/lib/db';
import { requireAuth } from '@/lib/middleware-utils';

const mockSql = vi.mocked(sql as unknown as (...args: unknown[]) => Promise<unknown[]>);
const mockRequireAuth = vi.mocked(requireAuth);

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const MOCK_USER = { id: 'user-1', client_id: 'client-1', role: 'owner' };
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

function makeGetRequest() {
  return new NextRequest('http://localhost/api/wheels', { method: 'GET' });
}

function makePostRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/wheels', {
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

// ─── GET /api/wheels ───────────────────────────────────────────────────────────

describe('GET /api/wheels', () => {
  beforeEach(() => { vi.resetAllMocks(); vi.spyOn(console, 'error').mockImplementation(() => {}); });

  it('returns 401 when not authenticated', async () => {
    authUnauthorized();
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(401);
  });

  it('returns empty array when client has no wheels', async () => {
    authAs(MOCK_USER);
    mockSql.mockResolvedValueOnce([]);
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.wheels).toEqual([]);
  });

  it('returns wheels list for authenticated user', async () => {
    authAs(MOCK_USER);
    mockSql.mockResolvedValueOnce([WHEEL_ROW]);
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.wheels).toHaveLength(1);
    expect(body.wheels[0].id).toBe('wheel-1');
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

// ─── POST /api/wheels ──────────────────────────────────────────────────────────

describe('POST /api/wheels', () => {
  beforeEach(() => { vi.resetAllMocks(); vi.spyOn(console, 'error').mockImplementation(() => {}); });

  it('returns 401 when not authenticated', async () => {
    authUnauthorized();
    const res = await POST(makePostRequest({ name: 'My Wheel' }));
    expect(res.status).toBe(401);
  });

  it('returns 403 when role is viewer', async () => {
    authAs(MOCK_VIEWER);
    const res = await POST(makePostRequest({ name: 'My Wheel' }));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('returns 400 when name is missing', async () => {
    authAs(MOCK_USER);
    const res = await POST(makePostRequest({}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('creates a wheel and default segments for owner', async () => {
    authAs(MOCK_USER);
    // 1 INSERT wheel + 6 INSERT segments + logAuditAction (sql not called for audit)
    mockSql.mockResolvedValueOnce([WHEEL_ROW]); // INSERT wheel RETURNING *
    // 6 segment inserts
    for (let i = 0; i < 6; i++) {
      mockSql.mockResolvedValueOnce([]);
    }
    const res = await POST(makePostRequest({ name: 'My Wheel' }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.wheel.id).toBe('wheel-1');
    expect(body.wheel.name).toBe('Test Wheel');
  });

  it('creates a wheel for editor role', async () => {
    authAs(MOCK_EDITOR);
    mockSql.mockResolvedValueOnce([WHEEL_ROW]);
    for (let i = 0; i < 6; i++) {
      mockSql.mockResolvedValueOnce([]);
    }
    const res = await POST(makePostRequest({ name: 'Editor Wheel' }));
    expect(res.status).toBe(201);
  });

  it('returns 500 on DB error during insert', async () => {
    authAs(MOCK_USER);
    mockSql.mockRejectedValueOnce(new Error('DB down'));
    const res = await POST(makePostRequest({ name: 'Crash Wheel' }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});
