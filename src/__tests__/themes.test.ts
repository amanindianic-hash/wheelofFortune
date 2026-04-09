// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('@/lib/db', () => ({ sql: vi.fn() }));
vi.mock('@/lib/middleware-utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/middleware-utils')>();
  return { ...actual, requireAuth: vi.fn() };
});

import { GET, POST } from '@/app/api/themes/route';
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
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

function makeGetRequest() {
  return new NextRequest('http://localhost/api/themes', { method: 'GET' });
}

function makePostRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/themes', {
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

// ─── GET /api/themes ──────────────────────────────────────────────────────────

describe('GET /api/themes', () => {
  beforeEach(() => vi.resetAllMocks());

  it('returns 401 when not authenticated', async () => {
    authUnauthorized();
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(401);
  });

  it('returns empty array when no saved themes', async () => {
    authAs(MOCK_USER);
    mockSql.mockResolvedValueOnce([]);
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.themes).toEqual([]);
  });

  it('returns saved themes for client', async () => {
    authAs(MOCK_USER);
    mockSql.mockResolvedValueOnce([THEME_ROW]);
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.themes).toHaveLength(1);
    expect(body.themes[0].name).toBe('My Theme');
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

// ─── POST /api/themes ─────────────────────────────────────────────────────────

describe('POST /api/themes', () => {
  beforeEach(() => vi.resetAllMocks());

  it('returns 401 when not authenticated', async () => {
    authUnauthorized();
    const res = await POST(makePostRequest({ name: 'My Theme' }));
    expect(res.status).toBe(401);
  });

  it('returns 403 for viewer role', async () => {
    authAs(MOCK_VIEWER);
    const res = await POST(makePostRequest({ name: 'My Theme' }));
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

  it('returns 400 when name is blank whitespace', async () => {
    authAs(MOCK_USER);
    const res = await POST(makePostRequest({ name: '   ' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('creates theme for owner with defaults', async () => {
    authAs(MOCK_USER);
    mockSql.mockResolvedValueOnce([THEME_ROW]);
    const res = await POST(makePostRequest({ name: 'My Theme' }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.theme.name).toBe('My Theme');
  });

  it('creates theme for editor with custom config', async () => {
    authAs(MOCK_EDITOR);
    const customTheme = { ...THEME_ROW, name: 'Brand Kit', config: { primary: '#ff0000' } };
    mockSql.mockResolvedValueOnce([customTheme]);
    const res = await POST(makePostRequest({
      name: 'Brand Kit',
      emoji: '🎯',
      description: 'Company colors',
      branding: { logo_url: 'https://example.com/logo.png' },
      config: { primary: '#ff0000' },
      segment_palette: ['#ff0000', '#00ff00'],
    }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.theme.name).toBe('Brand Kit');
  });

  it('returns 500 on DB error', async () => {
    authAs(MOCK_USER);
    mockSql.mockRejectedValueOnce(new Error('DB down'));
    const res = await POST(makePostRequest({ name: 'Crash Theme' }));
    expect(res.status).toBe(500);
  });
});
