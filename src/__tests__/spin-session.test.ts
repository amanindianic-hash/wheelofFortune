// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ─── Mock @/lib/db before any import that touches it ─────────────────────────
vi.mock('@/lib/db', () => ({ sql: vi.fn() }));

import { POST } from '@/app/api/spin/session/route';
import { sql } from '@/lib/db';

const mockSql = vi.mocked(sql as unknown as (...args: unknown[]) => Promise<unknown[]>);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(body: Record<string, unknown>, headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost/api/spin/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

const ACTIVE_WHEEL = {
  id: 'wheel-1',
  status: 'active',
  config: { game_type: 'wheel' },
  branding: { primary_color: '#7C3AED' },
  form_config: { enabled: false },
  trigger_rules: {},
  active_from: null,
  active_until: null,
  total_spin_cap: null,
  total_spins: 0,
  client_active: true,
  plan_spin_limit: 10000,
  spins_used_this_month: 0,
};

const SESSION_ROW = {
  id: 'sess-1',
  wheel_id: 'wheel-1',
  status: 'loaded',
  expires_at: new Date(Date.now() + 3600_000).toISOString(),
  created_at: new Date().toISOString(),
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/spin/session', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when embed_token is missing', async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 404 when wheel not found', async () => {
    mockSql.mockResolvedValueOnce([]); // wheel lookup → empty
    const res = await POST(makeRequest({ embed_token: 'bad-token' }));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('returns 503 when wheel status is not active', async () => {
    mockSql.mockResolvedValueOnce([{ ...ACTIVE_WHEEL, status: 'draft' }]);
    const res = await POST(makeRequest({ embed_token: 'tok' }));
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error.code).toBe('UNAVAILABLE');
  });

  it('returns 503 when client is inactive', async () => {
    mockSql.mockResolvedValueOnce([{ ...ACTIVE_WHEEL, client_active: false }]);
    const res = await POST(makeRequest({ embed_token: 'tok' }));
    expect(res.status).toBe(503);
  });

  it('returns 429 when monthly quota is exceeded', async () => {
    mockSql.mockResolvedValueOnce([{
      ...ACTIVE_WHEEL,
      plan_spin_limit: 100,
      spins_used_this_month: 100,
    }]);
    const res = await POST(makeRequest({ embed_token: 'tok' }));
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error.code).toBe('QUOTA_EXCEEDED');
  });

  it('returns 429 when total_spin_cap is reached', async () => {
    mockSql.mockResolvedValueOnce([{
      ...ACTIVE_WHEEL,
      total_spin_cap: 500,
      total_spins: 500,
    }]);
    const res = await POST(makeRequest({ embed_token: 'tok' }));
    expect(res.status).toBe(429);
  });

  it('returns 403 when geo-fence blocks visitor', async () => {
    mockSql.mockResolvedValueOnce([{
      ...ACTIVE_WHEEL,
      trigger_rules: { geo_fence: { mode: 'allow', countries: ['US'] } },
    }]);
    // Visitor is from India — not in allow-list
    const res = await POST(makeRequest({ embed_token: 'tok' }, { 'x-vercel-ip-country': 'IN' }));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe('GEO_BLOCKED');
  });

  it('allows visitor that is in geo-fence allow-list', async () => {
    mockSql
      .mockResolvedValueOnce([{
        ...ACTIVE_WHEEL,
        trigger_rules: { geo_fence: { mode: 'allow', countries: ['US', 'IN'] } },
      }])
      .mockResolvedValueOnce([]) // ab_tests
      .mockResolvedValueOnce([SESSION_ROW]) // INSERT session
      .mockResolvedValueOnce([]) // segments
      .mockResolvedValueOnce([{ active_segment_count: 0 }]); // active_segment_count

    const res = await POST(makeRequest({ embed_token: 'tok' }, { 'x-vercel-ip-country': 'IN' }));
    expect(res.status).toBe(201);
  });

  it('returns 503 when wheel has not started yet (active_from in future)', async () => {
    const future = new Date(Date.now() + 86400_000).toISOString();
    mockSql.mockResolvedValueOnce([{ ...ACTIVE_WHEEL, active_from: future }]);
    const res = await POST(makeRequest({ embed_token: 'tok' }));
    expect(res.status).toBe(503);
  });

  it('returns 503 when wheel campaign has ended (active_until in past)', async () => {
    const past = new Date(Date.now() - 86400_000).toISOString();
    mockSql.mockResolvedValueOnce([{ ...ACTIVE_WHEEL, active_until: past }]);
    const res = await POST(makeRequest({ embed_token: 'tok' }));
    expect(res.status).toBe(503);
  });

  it('creates session and returns 201 with correct shape in preview mode', async () => {
    mockSql
      .mockResolvedValueOnce([ACTIVE_WHEEL])   // wheel lookup (preview skips ab_tests check)
      .mockResolvedValueOnce([SESSION_ROW])    // INSERT session
      .mockResolvedValueOnce([                 // segments
        { id: 'seg-1', label: '10% Off', bg_color: '#ff0000', text_color: '#fff', weight: 1, is_no_prize: false, position: 0 },
      ])
      .mockResolvedValueOnce([{ active_segment_count: 1 }]); // active_segment_count

    const res = await POST(makeRequest({ embed_token: 'tok', preview: true }));
    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body.session_id).toBe('sess-1');
    expect(Array.isArray(body.segments)).toBe(true);
    expect(body.wheel.config).toBeDefined();
  });
});
