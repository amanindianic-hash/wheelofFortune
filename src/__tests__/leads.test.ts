// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('@/lib/db', () => ({ sql: vi.fn() }));
vi.mock('@/lib/middleware-utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/middleware-utils')>();
  return { ...actual, requireAuth: vi.fn() };
});

import { GET } from '@/app/api/leads/route';
import { sql } from '@/lib/db';
import { requireAuth } from '@/lib/middleware-utils';

const mockSql = vi.mocked(sql as unknown as (...args: unknown[]) => Promise<unknown[]>);
const mockRequireAuth = vi.mocked(requireAuth);

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const MOCK_USER = { id: 'user-1', client_id: 'client-1', role: 'owner' };

const LEAD_ROW = {
  session_id: 'sess-1',
  lead_name: 'Alice',
  lead_email: 'alice@example.com',
  lead_phone: null,
  gdpr_consent: true,
  created_at: new Date().toISOString(),
  wheel_id: 'wheel-1',
  wheel_name: 'Test Wheel',
  prize_id: 'prize-1',
  prize_won: '10% Off',
  coupon_code: 'SAVE10',
};

const WHEEL_ROW = { id: 'wheel-1' };

function authAs(user: typeof MOCK_USER) {
  mockRequireAuth.mockResolvedValue({ user } as any);
}

function authUnauthorized() {
  mockRequireAuth.mockResolvedValue(
    new NextResponse(JSON.stringify({ error: { code: 'UNAUTHORIZED' } }), { status: 401 })
  );
}

function makeGetRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/leads');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return new NextRequest(url.toString(), { method: 'GET' });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('GET /api/leads', () => {
  beforeEach(() => vi.resetAllMocks());

  it('returns 401 when not authenticated', async () => {
    authUnauthorized();
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(401);
  });

  /**
   * Leads route builds sql fragments before the main queries:
   *   No wheel_id, no search: #1 wheelFilter frag, #2 searchFilter frag, #3 rows, #4 count
   *   No wheel_id, search:    #1 wheelFilter frag, #2 searchFilter frag, #3 rows, #4 count
   *   With wheel_id:          #1 ownership check, #2 wheelFilter frag, #3 searchFilter frag, #4 rows, #5 count
   */

  it('returns empty list when no leads exist', async () => {
    authAs(MOCK_USER);
    mockSql
      .mockResolvedValueOnce([])               // #1 wheelFilter fragment
      .mockResolvedValueOnce([])               // #2 searchFilter fragment (empty, no search param)
      .mockResolvedValueOnce([])               // #3 rows query
      .mockResolvedValueOnce([{ total: 0 }]); // #4 count query

    const res = await GET(makeGetRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.leads).toEqual([]);
    expect(body.total).toBe(0);
  });

  it('returns paginated leads for authenticated user', async () => {
    authAs(MOCK_USER);
    mockSql
      .mockResolvedValueOnce([])               // #1 wheelFilter fragment
      .mockResolvedValueOnce([])               // #2 searchFilter fragment
      .mockResolvedValueOnce([LEAD_ROW])       // #3 rows query
      .mockResolvedValueOnce([{ total: 1 }]); // #4 count query

    const res = await GET(makeGetRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.leads).toHaveLength(1);
    expect(body.leads[0].lead_email).toBe('alice@example.com');
    expect(body.total).toBe(1);
    expect(body.page).toBe(1);
  });

  it('filters by wheel_id when provided', async () => {
    authAs(MOCK_USER);
    mockSql
      .mockResolvedValueOnce([WHEEL_ROW])      // #1 wheel ownership check (awaited directly)
      .mockResolvedValueOnce([])               // #2 wheelFilter fragment
      .mockResolvedValueOnce([])               // #3 searchFilter fragment
      .mockResolvedValueOnce([LEAD_ROW])       // #4 rows query
      .mockResolvedValueOnce([{ total: 1 }]); // #5 count query

    const res = await GET(makeGetRequest({ wheel_id: 'wheel-1' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.leads).toHaveLength(1);
  });

  it('returns 404 when wheel_id belongs to another client', async () => {
    authAs(MOCK_USER);
    mockSql.mockResolvedValueOnce([]); // #1 ownership check → empty → 404

    const res = await GET(makeGetRequest({ wheel_id: 'other-wheel' }));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('respects page and limit query params', async () => {
    authAs(MOCK_USER);
    mockSql
      .mockResolvedValueOnce([])               // #1 wheelFilter fragment
      .mockResolvedValueOnce([])               // #2 searchFilter fragment
      .mockResolvedValueOnce([LEAD_ROW, LEAD_ROW]) // #3 rows query
      .mockResolvedValueOnce([{ total: 10 }]); // #4 count query

    const res = await GET(makeGetRequest({ page: '2', limit: '2' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.page).toBe(2);
    expect(body.limit).toBe(2);
  });

  it('caps limit at 100', async () => {
    authAs(MOCK_USER);
    mockSql
      .mockResolvedValueOnce([])               // #1 wheelFilter fragment
      .mockResolvedValueOnce([])               // #2 searchFilter fragment
      .mockResolvedValueOnce([])               // #3 rows query
      .mockResolvedValueOnce([{ total: 0 }]); // #4 count query

    const res = await GET(makeGetRequest({ limit: '500' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.limit).toBe(100);
  });

  it('supports search query parameter', async () => {
    authAs(MOCK_USER);
    mockSql
      .mockResolvedValueOnce([])               // #1 wheelFilter fragment
      .mockResolvedValueOnce([])               // #2 searchFilter fragment (search present)
      .mockResolvedValueOnce([LEAD_ROW])       // #3 rows query
      .mockResolvedValueOnce([{ total: 1 }]); // #4 count query

    const res = await GET(makeGetRequest({ search: 'alice' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.leads[0].lead_email).toBe('alice@example.com');
  });

  it('returns leads with prize information', async () => {
    authAs(MOCK_USER);
    mockSql
      .mockResolvedValueOnce([])               // #1 wheelFilter fragment
      .mockResolvedValueOnce([])               // #2 searchFilter fragment
      .mockResolvedValueOnce([LEAD_ROW])       // #3 rows query
      .mockResolvedValueOnce([{ total: 1 }]); // #4 count query

    const res = await GET(makeGetRequest());
    const body = await res.json();
    expect(body.leads[0].prize_won).toBe('10% Off');
    expect(body.leads[0].coupon_code).toBe('SAVE10');
  });
});
