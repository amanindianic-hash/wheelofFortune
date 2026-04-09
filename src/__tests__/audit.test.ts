// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('@/lib/db', () => ({ sql: vi.fn() }));
vi.mock('@/lib/middleware-utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/middleware-utils')>();
  return { ...actual, requireAuth: vi.fn() };
});

import { GET } from '@/app/api/account/audit-logs/route';
import { sql } from '@/lib/db';
import { requireAuth } from '@/lib/middleware-utils';

const mockSql = vi.mocked(sql as unknown as (...args: unknown[]) => Promise<unknown[]>);
const mockRequireAuth = vi.mocked(requireAuth);

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const MOCK_USER   = { id: 'user-1', client_id: 'client-1', role: 'owner' };
const MOCK_VIEWER = { id: 'user-3', client_id: 'client-1', role: 'viewer' };

const LOG_ROW = {
  id: 'log-1',
  user_id: 'user-1',
  action: 'wheel.created',
  resource_type: 'wheel',
  resource_id: 'wheel-1',
  changes: {},
  ip_address: '127.0.0.1',
  user_agent: 'TestAgent/1.0',
  created_at: new Date().toISOString(),
};

function authAs(user: typeof MOCK_USER) {
  mockRequireAuth.mockResolvedValue({ user } as any);
}

function authUnauthorized() {
  mockRequireAuth.mockResolvedValue(
    new NextResponse(JSON.stringify({ error: { code: 'UNAUTHORIZED' } }), { status: 401 })
  );
}

function makeGetRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/account/audit-logs');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return new NextRequest(url.toString(), { method: 'GET' });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('GET /api/account/audit-logs', () => {
  beforeEach(() => { vi.resetAllMocks(); vi.spyOn(console, 'error').mockImplementation(() => {}); });

  it('returns 401 when not authenticated', async () => {
    authUnauthorized();
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(401);
  });

  it('returns empty logs when none exist', async () => {
    authAs(MOCK_USER);
    mockSql.mockResolvedValueOnce([]);

    const res = await GET(makeGetRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.logs).toEqual([]);
  });

  it('returns audit logs for authenticated owner', async () => {
    authAs(MOCK_USER);
    mockSql.mockResolvedValueOnce([LOG_ROW]);

    const res = await GET(makeGetRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.logs).toHaveLength(1);
    expect(body.logs[0].action).toBe('wheel.created');
    expect(body.logs[0].resource_type).toBe('wheel');
  });

  it('returns audit logs for viewer role (read-only endpoint)', async () => {
    authAs(MOCK_VIEWER);
    mockSql.mockResolvedValueOnce([LOG_ROW]);

    const res = await GET(makeGetRequest());
    expect(res.status).toBe(200);
  });

  it('respects limit and offset query params', async () => {
    authAs(MOCK_USER);
    mockSql.mockResolvedValueOnce([LOG_ROW]);

    const res = await GET(makeGetRequest({ limit: '10', offset: '5' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.logs).toHaveLength(1);
  });

  it('caps limit at 100', async () => {
    authAs(MOCK_USER);
    mockSql.mockResolvedValueOnce([]);

    const res = await GET(makeGetRequest({ limit: '999' }));
    expect(res.status).toBe(200);
    // Route caps at 100; still succeeds
  });

  it('returns log entries with expected fields', async () => {
    authAs(MOCK_USER);
    mockSql.mockResolvedValueOnce([LOG_ROW]);

    const res = await GET(makeGetRequest());
    const body = await res.json();
    const log = body.logs[0];
    expect(log).toHaveProperty('id');
    expect(log).toHaveProperty('user_id');
    expect(log).toHaveProperty('action');
    expect(log).toHaveProperty('resource_type');
    expect(log).toHaveProperty('created_at');
  });

  it('returns 500 on DB error', async () => {
    authAs(MOCK_USER);
    mockSql.mockRejectedValueOnce(new Error('DB down'));

    const res = await GET(makeGetRequest());
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error.code).toBe('DB_ERROR');
  });
});
