// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('@/lib/db', () => ({ sql: vi.fn() }));
vi.mock('@/lib/middleware-utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/middleware-utils')>();
  return { ...actual, requireAuth: vi.fn() };
});

import { PATCH, DELETE } from '@/app/api/themes/[id]/route';
import { sql } from '@/lib/db';
import { requireAuth } from '@/lib/middleware-utils';

const mockSql = vi.mocked(sql as unknown as (...args: unknown[]) => Promise<unknown[]>);
const mockRequireAuth = vi.mocked(requireAuth);

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const MOCK_USER   = { id: 'user-1', client_id: 'client-1', role: 'owner' };
const MOCK_EDITOR = { id: 'user-2', client_id: 'client-1', role: 'editor' };
const MOCK_VIEWER = { id: 'user-3', client_id: 'client-1', role: 'viewer' };

const THEME_ROW = {
  id: 'theme-1',
  client_id: 'client-1',
  name: 'My Theme',
  emoji: '🎨',
  description: 'Custom look',
  branding: {},
  config: {},
  segment_palette: [],
};

const PARAMS = Promise.resolve({ id: 'theme-1' });
const MISSING_PARAMS = Promise.resolve({ id: 'nonexistent' });

function makePatchRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/themes/theme-1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function makeDeleteRequest() {
  return new NextRequest('http://localhost/api/themes/theme-1', { method: 'DELETE' });
}

function authAs(user: typeof MOCK_USER) {
  mockRequireAuth.mockResolvedValue({ user } as any);
}

function authUnauthorized() {
  mockRequireAuth.mockResolvedValue(
    new NextResponse(JSON.stringify({ error: { code: 'UNAUTHORIZED' } }), { status: 401 })
  );
}

// ─── PATCH /api/themes/[id] ───────────────────────────────────────────────────

describe('PATCH /api/themes/[id]', () => {
  beforeEach(() => { vi.resetAllMocks(); vi.spyOn(console, 'error').mockImplementation(() => {}); });

  it('returns 401 when not authenticated', async () => {
    authUnauthorized();
    const res = await PATCH(makePatchRequest({ name: 'Updated' }), { params: PARAMS });
    expect(res.status).toBe(401);
  });

  it('returns 403 for viewer role', async () => {
    authAs(MOCK_VIEWER);
    const res = await PATCH(makePatchRequest({ name: 'Updated' }), { params: PARAMS });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('returns 404 when theme not found', async () => {
    authAs(MOCK_USER);
    mockSql.mockResolvedValueOnce([]); // SELECT returns empty
    const res = await PATCH(makePatchRequest({ name: 'Updated' }), { params: MISSING_PARAMS });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('returns 400 when name becomes blank', async () => {
    authAs(MOCK_USER);
    mockSql.mockResolvedValueOnce([THEME_ROW]); // theme found
    const res = await PATCH(makePatchRequest({ name: '   ' }), { params: PARAMS });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('updates theme name for editor', async () => {
    authAs(MOCK_EDITOR);
    mockSql.mockResolvedValueOnce([THEME_ROW]);                          // getTheme SELECT
    const updated = { ...THEME_ROW, name: 'Renamed Theme' };
    mockSql.mockResolvedValueOnce([updated]);                             // UPDATE RETURNING *
    const res = await PATCH(makePatchRequest({ name: 'Renamed Theme' }), { params: PARAMS });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.theme.name).toBe('Renamed Theme');
  });

  it('updates theme config and palette for owner', async () => {
    authAs(MOCK_USER);
    mockSql.mockResolvedValueOnce([THEME_ROW]);
    const updated = { ...THEME_ROW, config: { bg: '#000' }, segment_palette: ['#f00', '#0f0'] };
    mockSql.mockResolvedValueOnce([updated]);
    const res = await PATCH(makePatchRequest({
      name: 'My Theme',
      config: { bg: '#000' },
      segment_palette: ['#f00', '#0f0'],
    }), { params: PARAMS });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.theme.config).toEqual({ bg: '#000' });
  });

  it('returns 500 on DB error', async () => {
    authAs(MOCK_USER);
    mockSql.mockRejectedValueOnce(new Error('DB down'));
    const res = await PATCH(makePatchRequest({ name: 'x' }), { params: PARAMS });
    expect(res.status).toBe(500);
  });
});

// ─── DELETE /api/themes/[id] ──────────────────────────────────────────────────

describe('DELETE /api/themes/[id]', () => {
  beforeEach(() => { vi.resetAllMocks(); vi.spyOn(console, 'error').mockImplementation(() => {}); });

  it('returns 401 when not authenticated', async () => {
    authUnauthorized();
    const res = await DELETE(makeDeleteRequest(), { params: PARAMS });
    expect(res.status).toBe(401);
  });

  it('returns 403 for viewer role', async () => {
    authAs(MOCK_VIEWER);
    const res = await DELETE(makeDeleteRequest(), { params: PARAMS });
    expect(res.status).toBe(403);
  });

  it('returns 404 when theme not found', async () => {
    authAs(MOCK_USER);
    mockSql.mockResolvedValueOnce([]); // getTheme SELECT — not found
    const res = await DELETE(makeDeleteRequest(), { params: MISSING_PARAMS });
    expect(res.status).toBe(404);
  });

  it('deletes theme for owner', async () => {
    authAs(MOCK_USER);
    mockSql.mockResolvedValueOnce([THEME_ROW]); // getTheme found
    mockSql.mockResolvedValueOnce([]);           // DELETE
    const res = await DELETE(makeDeleteRequest(), { params: PARAMS });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
  });

  it('deletes theme for editor', async () => {
    authAs(MOCK_EDITOR);
    mockSql.mockResolvedValueOnce([THEME_ROW]);
    mockSql.mockResolvedValueOnce([]);
    const res = await DELETE(makeDeleteRequest(), { params: PARAMS });
    expect(res.status).toBe(200);
  });

  it('returns 500 on DB error', async () => {
    authAs(MOCK_USER);
    mockSql.mockRejectedValueOnce(new Error('DB down'));
    const res = await DELETE(makeDeleteRequest(), { params: PARAMS });
    expect(res.status).toBe(500);
  });
});
