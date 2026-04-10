// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('@/lib/db', () => ({ sql: vi.fn() }));
vi.mock('@/lib/audit', () => ({ logAuditAction: vi.fn() }));
vi.mock('@/lib/middleware-utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/middleware-utils')>();
  return { ...actual, requireAuth: vi.fn() };
});

import { GET, PUT } from '@/app/api/wheels/[id]/segments/route';
import { sql } from '@/lib/db';
import { requireAuth } from '@/lib/middleware-utils';

const mockSql = vi.mocked(sql as unknown as (...args: unknown[]) => Promise<unknown[]>);
const mockRequireAuth = vi.mocked(requireAuth);

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const MOCK_USER   = { id: 'user-1', client_id: 'client-1', role: 'owner' };
const MOCK_EDITOR = { id: 'user-2', client_id: 'client-1', role: 'editor' };
const MOCK_VIEWER = { id: 'user-3', client_id: 'client-1', role: 'viewer' };

const WHEEL_ROW = { id: 'wheel-1', active_segment_count: 2 };

const SEG_ROWS = [
  { id: 'seg-1', wheel_id: 'wheel-1', position: 0, label: 'Win',      bg_color: '#ff0000', text_color: '#fff', weight: 1 },
  { id: 'seg-2', wheel_id: 'wheel-1', position: 1, label: 'Try Again', bg_color: '#00ff00', text_color: '#000', weight: 1 },
];

const VALID_SEGMENTS = [
  { label: 'Win',       bg_color: '#ff0000', text_color: '#ffffff', weight: 1 },
  { label: 'Try Again', bg_color: '#00ff00', text_color: '#000000', weight: 1 },
];

const PARAMS = Promise.resolve({ id: 'wheel-1' });

function makeGetRequest() {
  return new NextRequest('http://localhost/api/wheels/wheel-1/segments', { method: 'GET' });
}

function makePutRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/wheels/wheel-1/segments', {
    method: 'PUT',
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

// ─── GET /api/wheels/[id]/segments ────────────────────────────────────────────

describe('GET /api/wheels/[id]/segments', () => {
  beforeEach(() => { vi.resetAllMocks(); vi.spyOn(console, 'error').mockImplementation(() => {}); });

  it('returns 401 when not authenticated', async () => {
    authUnauthorized();
    const res = await GET(makeGetRequest(), { params: PARAMS });
    expect(res.status).toBe(401);
  });

  it('returns 404 when wheel not found', async () => {
    authAs(MOCK_USER);
    mockSql.mockResolvedValueOnce([]); // wheel SELECT returns empty
    const res = await GET(makeGetRequest(), { params: PARAMS });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('returns segments list on success', async () => {
    authAs(MOCK_USER);
    mockSql.mockResolvedValueOnce([WHEEL_ROW]); // wheel found
    mockSql.mockResolvedValueOnce(SEG_ROWS);    // segments with LEFT JOIN prizes
    const res = await GET(makeGetRequest(), { params: PARAMS });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.segments).toHaveLength(2);
    expect(body.segments[0].label).toBe('Win');
  });

  it('returns empty segments array for new wheel', async () => {
    authAs(MOCK_USER);
    mockSql.mockResolvedValueOnce([WHEEL_ROW]);
    mockSql.mockResolvedValueOnce([]);
    const res = await GET(makeGetRequest(), { params: PARAMS });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.segments).toEqual([]);
  });

  it('returns 500 on DB error', async () => {
    authAs(MOCK_USER);
    mockSql.mockRejectedValueOnce(new Error('DB error'));
    const res = await GET(makeGetRequest(), { params: PARAMS });
    expect(res.status).toBe(500);
  });
});

// ─── PUT /api/wheels/[id]/segments ────────────────────────────────────────────

describe('PUT /api/wheels/[id]/segments', () => {
  beforeEach(() => { vi.resetAllMocks(); vi.spyOn(console, 'error').mockImplementation(() => {}); });

  it('returns 401 when not authenticated', async () => {
    authUnauthorized();
    const res = await PUT(makePutRequest({ segments: VALID_SEGMENTS }), { params: PARAMS });
    expect(res.status).toBe(401);
  });

  it('returns 403 for viewer role', async () => {
    authAs(MOCK_VIEWER);
    const res = await PUT(makePutRequest({ segments: VALID_SEGMENTS }), { params: PARAMS });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('returns 400 when segments is not an array', async () => {
    authAs(MOCK_USER);
    mockSql.mockResolvedValueOnce([WHEEL_ROW]);
    const res = await PUT(makePutRequest({ segments: 'bad' }), { params: PARAMS });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when fewer than 2 segments', async () => {
    authAs(MOCK_USER);
    mockSql.mockResolvedValueOnce([WHEEL_ROW]);
    const res = await PUT(makePutRequest({ segments: [VALID_SEGMENTS[0]] }), { params: PARAMS });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when more than 24 segments', async () => {
    authAs(MOCK_USER);
    mockSql.mockResolvedValueOnce([WHEEL_ROW]);
    const tooMany = Array.from({ length: 25 }, (_, i) => ({
      label: `Seg ${i}`, bg_color: '#ff0000', text_color: '#ffffff',
    }));
    const res = await PUT(makePutRequest({ segments: tooMany }), { params: PARAMS });
    expect(res.status).toBe(400);
  });

  it('returns 400 when bg_color is invalid', async () => {
    authAs(MOCK_USER);
    mockSql.mockResolvedValueOnce([WHEEL_ROW]); // wheel SELECT
    const segs = [
      { label: 'A', bg_color: 'red', text_color: '#fff' },
      { label: 'B', bg_color: '#00ff00', text_color: '#000' },
    ];
    const res = await PUT(makePutRequest({ segments: segs }), { params: PARAMS });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.message).toContain('bg_color');
  });

  it('returns 400 when text_color is invalid', async () => {
    authAs(MOCK_USER);
    mockSql.mockResolvedValueOnce([WHEEL_ROW]); // wheel SELECT
    const segs = [
      { label: 'A', bg_color: '#ff0000', text_color: 'white' },
      { label: 'B', bg_color: '#00ff00', text_color: '#000' },
    ];
    const res = await PUT(makePutRequest({ segments: segs }), { params: PARAMS });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.message).toContain('text_color');
  });

  it('accepts "transparent" as a valid color', async () => {
    authAs(MOCK_USER);
    mockSql.mockResolvedValueOnce([WHEEL_ROW]);        // SELECT wheel
    mockSql.mockResolvedValueOnce([]);                 // existing segments
    mockSql.mockResolvedValueOnce([]);                 // referenced check
    mockSql.mockResolvedValueOnce([]);                 // INSERT seg 1
    mockSql.mockResolvedValueOnce([]);                 // INSERT seg 2
    mockSql.mockResolvedValueOnce([]);                 // UPDATE wheels set active_segment_count
    mockSql.mockResolvedValueOnce(VALID_SEGMENTS);     // final SELECT
    const segs = [
      { label: 'A', bg_color: 'transparent', text_color: '#fff' },
      { label: 'B', bg_color: '#00ff00',     text_color: 'transparent' },
    ];
    const res = await PUT(makePutRequest({ segments: segs }), { params: PARAMS });
    expect(res.status).toBe(200);
  });

  it('returns 404 when wheel not found', async () => {
    authAs(MOCK_USER);
    mockSql.mockResolvedValueOnce([]); // wheel SELECT — not found
    const res = await PUT(makePutRequest({ segments: VALID_SEGMENTS }), { params: PARAMS });
    expect(res.status).toBe(404);
  });

  it('updates existing segments in place (same count)', async () => {
    authAs(MOCK_USER);
    mockSql.mockResolvedValueOnce([WHEEL_ROW]);   // wheel found
    mockSql.mockResolvedValueOnce(SEG_ROWS);      // existing 2 segments
    mockSql.mockResolvedValueOnce([]);            // referenced spin_results check
    mockSql.mockResolvedValueOnce([]);            // UPDATE seg-1
    mockSql.mockResolvedValueOnce([]);            // UPDATE seg-2
    mockSql.mockResolvedValueOnce([]);            // UPDATE wheels set active_segment_count
    mockSql.mockResolvedValueOnce(SEG_ROWS);      // final SELECT
    const res = await PUT(makePutRequest({ segments: VALID_SEGMENTS }), { params: PARAMS });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.segments).toHaveLength(2);
  });

  it('inserts new segments when count increases', async () => {
    authAs(MOCK_USER);
    const newSeg = { label: 'Bonus', bg_color: '#0000ff', text_color: '#fff', weight: 1 };
    mockSql.mockResolvedValueOnce([WHEEL_ROW]);                              // wheel
    mockSql.mockResolvedValueOnce([SEG_ROWS[0]]);                            // existing 1
    mockSql.mockResolvedValueOnce([]);                                       // referenced check
    mockSql.mockResolvedValueOnce([]);                                       // UPDATE seg-1
    mockSql.mockResolvedValueOnce([]);                                       // INSERT new seg
    mockSql.mockResolvedValueOnce([]);                                       // UPDATE wheels set active_segment_count
    const updatedSegs = [...SEG_ROWS, { ...newSeg, id: 'seg-3', position: 2, wheel_id: 'wheel-1' }];
    mockSql.mockResolvedValueOnce(updatedSegs);                              // final SELECT
    const res = await PUT(makePutRequest({ segments: [VALID_SEGMENTS[0], newSeg] }), { params: PARAMS });
    expect(res.status).toBe(200);
  });

  it('skips deleting segments referenced by spin_results', async () => {
    authAs(MOCK_USER);
    // 3 existing, incoming only 2 — seg-3 is referenced (kept in DB, filtered by active_segment_count)
    const existingThree = [...SEG_ROWS, { id: 'seg-3', position: 2, label: 'Old' }];
    mockSql.mockResolvedValueOnce([WHEEL_ROW]);
    mockSql.mockResolvedValueOnce(existingThree);                 // existing 3
    mockSql.mockResolvedValueOnce([{ segment_id: 'seg-3' }]);    // seg-3 is referenced
    mockSql.mockResolvedValueOnce([]);                            // UPDATE seg-1
    mockSql.mockResolvedValueOnce([]);                            // UPDATE seg-2
    mockSql.mockResolvedValueOnce([]);                            // UPDATE wheels set active_segment_count = 2
    mockSql.mockResolvedValueOnce(existingThree);                 // final SELECT (all 3, but filtered to 2)
    const res = await PUT(makePutRequest({ segments: VALID_SEGMENTS }), { params: PARAMS });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.segments).toHaveLength(2);  // Should only return active 2, not all 3
  });

  it('returns 500 on DB error', async () => {
    authAs(MOCK_USER);
    mockSql.mockRejectedValueOnce(new Error('DB down'));
    const res = await PUT(makePutRequest({ segments: VALID_SEGMENTS }), { params: PARAMS });
    expect(res.status).toBe(500);
  });

  it('accepts #RRGGBBAA 8-digit hex as valid color', async () => {
    authAs(MOCK_USER);
    mockSql.mockResolvedValueOnce([WHEEL_ROW]);
    mockSql.mockResolvedValueOnce([]);                    // existing segments
    mockSql.mockResolvedValueOnce([]);                    // referenced check
    mockSql.mockResolvedValueOnce([]);                    // INSERT seg-1
    mockSql.mockResolvedValueOnce([]);                    // INSERT seg-2
    mockSql.mockResolvedValueOnce([]);                    // UPDATE wheels set active_segment_count
    mockSql.mockResolvedValueOnce(VALID_SEGMENTS);        // final SELECT
    const segs = [
      { label: 'A', bg_color: '#ff000080', text_color: '#ffffff' },
      { label: 'B', bg_color: '#00ff00ff', text_color: '#000000' },
    ];
    const res = await PUT(makePutRequest({ segments: segs }), { params: PARAMS });
    expect(res.status).toBe(200);
  });
});
