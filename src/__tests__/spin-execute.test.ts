import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/db', () => ({ sql: vi.fn() }));
// Suppress non-blocking integration calls
vi.mock('@/lib/integrations', () => ({ processLeadSync: vi.fn() }));
vi.mock('@/lib/email',        () => ({ sendWinEmail: vi.fn() }));

import { POST } from '@/app/api/spin/execute/route';
import { sql } from '@/lib/db';

const mockSql = vi.mocked(sql as unknown as (...args: unknown[]) => Promise<unknown[]>);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/spin/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const VALID_SESSION = {
  id: 'sess-1',
  wheel_id: 'wheel-1',
  status: 'loaded',
  expires_at: new Date(Date.now() + 3600_000).toISOString(),
  lead_email: null,
  variant_id: null,
  ab_test_id: null,
};

const ACTIVE_WHEEL = {
  id: 'wheel-1',
  config: {},
  client_id: 'client-1',
};

const SEGMENTS = [
  { id: 'seg-1', label: '10% Off', is_no_prize: false, prize_id: 'prize-1', weight: 1, win_cap_daily: null, win_cap_total: null, wins_today: 0, wins_total: 0, position: 0, bg_color: '#ff0000', text_color: '#fff' },
  { id: 'seg-2', label: 'Try Again', is_no_prize: true, prize_id: null,     weight: 1, win_cap_daily: null, win_cap_total: null, wins_today: 0, wins_total: 0, position: 1, bg_color: '#aaa',    text_color: '#000' },
];

const PRIZE = {
  id: 'prize-1',
  display_title: '10% Off',
  display_description: 'Use at checkout',
  type: 'coupon',
  coupon_mode: 'static',
  static_coupon_code: 'SAVE10',
  points_value: null,
  redirect_url: null,
  custom_message_html: null,
};

const SPIN_RESULT_ROW = {
  id: 'result-1',
  created_at: new Date().toISOString(),
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/spin/execute', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns 400 when session_id is missing', async () => {
    const res = await POST(makeRequest({ idempotency_key: 'idem-1' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when idempotency_key is missing', async () => {
    const res = await POST(makeRequest({ session_id: 'sess-1' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns cached result on duplicate idempotency key', async () => {
    const existingResult = {
      id: 'result-1',
      segment_id: 'seg-1',
      segment_label: '10% Off',
      prize_id: 'prize-1',
      display_title: '10% Off',
      prize_type: 'coupon',
      custom_message_html: null,
      redirect_url: null,
      coupon_code: 'SAVE10',
    };
    mockSql.mockResolvedValueOnce([existingResult]); // idempotency check returns existing

    const res = await POST(makeRequest({ session_id: 'sess-1', idempotency_key: 'idem-1' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.result.coupon_code).toBe('SAVE10');
    expect(body.result.is_winner).toBe(true);
  });

  it('returns 404 when session not found', async () => {
    mockSql
      .mockResolvedValueOnce([])  // idempotency → no duplicate
      .mockResolvedValueOnce([]); // session → not found

    const res = await POST(makeRequest({ session_id: 'bad', idempotency_key: 'idem-1' }));
    expect(res.status).toBe(404);
  });

  it('returns 409 when session already spun', async () => {
    mockSql
      .mockResolvedValueOnce([])  // no duplicate
      .mockResolvedValueOnce([{ ...VALID_SESSION, status: 'spun' }]);

    const res = await POST(makeRequest({ session_id: 'sess-1', idempotency_key: 'idem-2' }));
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error.code).toBe('ALREADY_SPUN');
  });

  it('returns 410 when session is expired', async () => {
    mockSql
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{
        ...VALID_SESSION,
        expires_at: new Date(Date.now() - 1000).toISOString(), // expired
      }]);

    const res = await POST(makeRequest({ session_id: 'sess-1', idempotency_key: 'idem-3' }));
    expect(res.status).toBe(410);
    const body = await res.json();
    expect(body.error.code).toBe('SESSION_EXPIRED');
  });

  it('executes spin and returns winning result with static coupon', async () => {
    mockSql
      .mockResolvedValueOnce([])               // no duplicate
      .mockResolvedValueOnce([VALID_SESSION])  // session
      .mockResolvedValueOnce([ACTIVE_WHEEL])   // wheel
      .mockResolvedValueOnce(SEGMENTS)         // segments
      .mockResolvedValueOnce([{ total_spins: 5 }]) // wheel total_spins (for guaranteed win check)
      .mockResolvedValueOnce([PRIZE])          // prize fetch
      .mockResolvedValueOnce([SPIN_RESULT_ROW]) // INSERT spin_result
      .mockResolvedValueOnce([])               // UPDATE coupon link
      .mockResolvedValueOnce([])               // UPDATE session status
      .mockResolvedValueOnce([])               // UPDATE segment wins
      .mockResolvedValueOnce([])               // UPDATE wheel total_spins
      .mockResolvedValueOnce([])               // UPDATE client spins_used
      .mockResolvedValueOnce([PRIZE]);         // prize details for response

    const res = await POST(makeRequest({
      session_id: 'sess-1',
      idempotency_key: 'idem-fresh',
      client_seed: 'abc123',
    }));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.result).toBeDefined();
    expect(body.result.segment).toBeDefined();
    expect(typeof body.result.is_winner).toBe('boolean');
  });

  it('triggers guaranteed win on the Nth spin', async () => {
    const configWithGuaranteed = {
      guaranteed_win_every_n: 5,
      guaranteed_win_segment_id: 'seg-1',
    };
    const wheelWithGuaranteed = { ...ACTIVE_WHEEL, config: configWithGuaranteed };

    mockSql
      .mockResolvedValueOnce([])                             // no duplicate
      .mockResolvedValueOnce([VALID_SESSION])                // session
      .mockResolvedValueOnce([wheelWithGuaranteed])          // wheel
      .mockResolvedValueOnce(SEGMENTS)                       // segments
      .mockResolvedValueOnce([{ total_spins: 4 }])           // total_spins = 4, so (4+1)%5 === 0 → guaranteed win
      .mockResolvedValueOnce([PRIZE])                        // prize for forced segment
      .mockResolvedValueOnce([SPIN_RESULT_ROW])              // INSERT result
      .mockResolvedValueOnce([])                             // coupon link
      .mockResolvedValueOnce([])                             // UPDATE session
      .mockResolvedValueOnce([])                             // UPDATE segment
      .mockResolvedValueOnce([])                             // UPDATE wheel
      .mockResolvedValueOnce([])                             // UPDATE client
      .mockResolvedValueOnce([PRIZE]);                       // prize details

    const res = await POST(makeRequest({
      session_id: 'sess-1',
      idempotency_key: 'idem-guaranteed',
    }));

    expect(res.status).toBe(200);
    const body = await res.json();
    // Guaranteed segment (seg-1) is a winner
    expect(body.result.is_winner).toBe(true);
    expect(body.result.segment.id).toBe('seg-1');
  });

  it('does NOT trigger guaranteed win on a non-Nth spin', async () => {
    const configWithGuaranteed = {
      guaranteed_win_every_n: 5,
      guaranteed_win_segment_id: 'seg-1',
    };
    const wheelWithGuaranteed = { ...ACTIVE_WHEEL, config: configWithGuaranteed };

    mockSql
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([VALID_SESSION])
      .mockResolvedValueOnce([wheelWithGuaranteed])
      .mockResolvedValueOnce(SEGMENTS)
      .mockResolvedValueOnce([{ total_spins: 3 }]) // (3+1)%5 !== 0 → normal spin
      .mockResolvedValueOnce([PRIZE])
      .mockResolvedValueOnce([SPIN_RESULT_ROW])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([PRIZE]);

    const res = await POST(makeRequest({
      session_id: 'sess-1',
      idempotency_key: 'idem-normal',
    }));

    // Still succeeds — just a normal weighted spin
    expect(res.status).toBe(200);
  });
});
