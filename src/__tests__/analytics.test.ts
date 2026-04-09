// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('@/lib/db', () => ({ sql: vi.fn() }));
vi.mock('@/lib/middleware-utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/middleware-utils')>();
  return { ...actual, requireAuth: vi.fn() };
});

import { GET } from '@/app/api/analytics/route';
import { sql } from '@/lib/db';
import { requireAuth } from '@/lib/middleware-utils';

const mockSql = vi.mocked(sql as unknown as (...args: unknown[]) => Promise<unknown[]>);
const mockRequireAuth = vi.mocked(requireAuth);

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const MOCK_USER = { id: 'user-1', client_id: 'client-1', role: 'owner' };

const SUMMARY_ROW = { total_spins: 42, total_winners: 10, unique_leads: 8 };
const WHEEL_ROW   = { id: 'wheel-1' };

function authAs(user: typeof MOCK_USER) {
  mockRequireAuth.mockResolvedValue({ user } as any);
}

function authUnauthorized() {
  mockRequireAuth.mockResolvedValue(
    new NextResponse(JSON.stringify({ error: { code: 'UNAUTHORIZED' } }), { status: 401 })
  );
}

/**
 * Mock all 9 sql calls for analytics (no wheel_id).
 * The route builds sql fragments that also consume mock calls:
 *   #1  wheelFilter = sql`AND w.client_id = ...`          (fragment)
 *   #2  summary query
 *   #3  daily query
 *   #4  prize breakdown query
 *   #5  segment breakdown query
 *   #6  device inline fragment: sql`AND w.client_id = ...`
 *   #7  device breakdown query
 *   #8  os inline fragment:     sql`AND w.client_id = ...`
 *   #9  os breakdown query
 */
function mockFullAnalytics(overrides: { summary?: unknown; daily?: unknown; device?: unknown; os?: unknown } = {}) {
  mockSql
    .mockResolvedValueOnce([])                          // #1 wheelFilter fragment
    .mockResolvedValueOnce([overrides.summary ?? SUMMARY_ROW]) // #2 summary
    .mockResolvedValueOnce([overrides.daily ?? { date: '2024-01-01', spins: 5, winners: 2 }]) // #3 daily
    .mockResolvedValueOnce([])                          // #4 prize_breakdown
    .mockResolvedValueOnce([])                          // #5 segment_breakdown
    .mockResolvedValueOnce([])                          // #6 device inline fragment
    .mockResolvedValueOnce([overrides.device ?? { device_type: 'desktop', count: 30 }]) // #7 device
    .mockResolvedValueOnce([])                          // #8 os inline fragment
    .mockResolvedValueOnce([overrides.os ?? { os: 'macOS', count: 20 }]); // #9 os
}

/**
 * Mock all 10 sql calls for analytics (with wheel_id).
 *   #1  wheel ownership check (awaited)
 *   #2  wheelFilter fragment
 *   #3  summary query
 *   #4  daily query
 *   #5  prize breakdown query
 *   #6  segment breakdown query
 *   #7  device inline fragment: sql`AND ss.wheel_id = ...`
 *   #8  device breakdown query
 *   #9  os inline fragment:     sql`AND ss.wheel_id = ...`
 *   #10 os breakdown query
 */
function mockFullAnalyticsWithWheelCheck() {
  mockSql
    .mockResolvedValueOnce([WHEEL_ROW])  // #1 wheel ownership check
    .mockResolvedValueOnce([])           // #2 wheelFilter fragment
    .mockResolvedValueOnce([SUMMARY_ROW]) // #3 summary
    .mockResolvedValueOnce([])           // #4 daily
    .mockResolvedValueOnce([])           // #5 prize_breakdown
    .mockResolvedValueOnce([])           // #6 segment_breakdown
    .mockResolvedValueOnce([])           // #7 device inline fragment
    .mockResolvedValueOnce([])           // #8 device
    .mockResolvedValueOnce([])           // #9 os inline fragment
    .mockResolvedValueOnce([]);          // #10 os
}

function makeGetRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/analytics');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return new NextRequest(url.toString(), { method: 'GET' });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('GET /api/analytics', () => {
  beforeEach(() => { vi.resetAllMocks(); vi.spyOn(console, 'error').mockImplementation(() => {}); });

  it('returns 401 when not authenticated', async () => {
    authUnauthorized();
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(401);
  });

  it('returns analytics summary for client (no wheel filter)', async () => {
    authAs(MOCK_USER);
    mockFullAnalytics();

    const res = await GET(makeGetRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.summary.total_spins).toBe(42);
    expect(body.summary.total_winners).toBe(10);
    expect(Array.isArray(body.daily)).toBe(true);
    expect(body.device_breakdown[0].device_type).toBe('desktop');
    expect(body.os_breakdown[0].os).toBe('macOS');
  });

  it('returns analytics for a specific wheel', async () => {
    authAs(MOCK_USER);
    mockFullAnalyticsWithWheelCheck();

    const res = await GET(makeGetRequest({ wheel_id: 'wheel-1' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.summary.total_spins).toBe(42);
    expect(Array.isArray(body.daily)).toBe(true);
  });

  it('returns 404 when wheel_id belongs to another client', async () => {
    authAs(MOCK_USER);
    mockSql.mockResolvedValueOnce([]); // wheel not found for client

    const res = await GET(makeGetRequest({ wheel_id: 'other-wheel' }));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('returns empty arrays when no spins exist', async () => {
    authAs(MOCK_USER);
    // 9 calls: wheelFilter frag + summary + daily + prize + segment + device-frag + device + os-frag + os
    mockFullAnalytics({ summary: { total_spins: 0, total_winners: 0, unique_leads: 0 }, daily: null, device: null, os: null });
    // Override daily/device/os to empty using the overrides param doesn't work cleanly,
    // so let's just set them directly:
    vi.resetAllMocks();
    authAs(MOCK_USER);
    mockSql
      .mockResolvedValueOnce([])                                               // #1 wheelFilter fragment
      .mockResolvedValueOnce([{ total_spins: 0, total_winners: 0, unique_leads: 0 }]) // #2 summary
      .mockResolvedValueOnce([])                                               // #3 daily
      .mockResolvedValueOnce([])                                               // #4 prize_breakdown
      .mockResolvedValueOnce([])                                               // #5 segment_breakdown
      .mockResolvedValueOnce([])                                               // #6 device inline fragment
      .mockResolvedValueOnce([])                                               // #7 device breakdown
      .mockResolvedValueOnce([])                                               // #8 os inline fragment
      .mockResolvedValueOnce([]);                                              // #9 os breakdown

    const res = await GET(makeGetRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.summary.total_spins).toBe(0);
    expect(body.daily).toHaveLength(0);
    expect(body.prize_breakdown).toHaveLength(0);
  });

  it('returns 500 on DB error', async () => {
    authAs(MOCK_USER);
    // Let wheelFilter fragment succeed, then fail on the first awaited query (summary)
    mockSql
      .mockResolvedValueOnce([])                          // #1 wheelFilter fragment
      .mockRejectedValueOnce(new Error('DB down'));       // #2 summary → caught → 500

    const res = await GET(makeGetRequest());
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });

  it('accepts date range params (from / to)', async () => {
    authAs(MOCK_USER);
    mockFullAnalytics();

    const res = await GET(makeGetRequest({ from: '2024-01-01', to: '2024-01-31' }));
    expect(res.status).toBe(200);
  });

  it('returns prize_breakdown and segment_breakdown arrays', async () => {
    authAs(MOCK_USER);
    mockSql
      .mockResolvedValueOnce([])          // #1 wheelFilter fragment
      .mockResolvedValueOnce([SUMMARY_ROW]) // #2 summary
      .mockResolvedValueOnce([])          // #3 daily
      .mockResolvedValueOnce([{ display_title: '10% Off', type: 'coupon', win_count: 5 }]) // #4 prize
      .mockResolvedValueOnce([{ label: 'Win', position: 0, spin_count: 3 }]) // #5 segment
      .mockResolvedValueOnce([])          // #6 device inline fragment
      .mockResolvedValueOnce([])          // #7 device
      .mockResolvedValueOnce([])          // #8 os inline fragment
      .mockResolvedValueOnce([]);         // #9 os

    const res = await GET(makeGetRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.prize_breakdown[0].display_title).toBe('10% Off');
    expect(body.segment_breakdown[0].label).toBe('Win');
  });
});
