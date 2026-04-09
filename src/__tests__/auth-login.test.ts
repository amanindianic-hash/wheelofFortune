// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/db', () => ({ sql: vi.fn() }));
vi.mock('bcryptjs', () => ({ default: { compare: vi.fn() } }));
vi.mock('@/lib/auth', () => ({
  signAccessToken: vi.fn(),
  signRefreshToken: vi.fn(),
}));

import { POST } from '@/app/api/auth/login/route';
import { sql } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { signAccessToken, signRefreshToken } from '@/lib/auth';

const mockSql = vi.mocked(sql as unknown as (...args: unknown[]) => Promise<unknown[]>);
const mockBcryptCompare = vi.mocked(bcrypt.compare);
const mockSignAccess = vi.mocked(signAccessToken);
const mockSignRefresh = vi.mocked(signRefreshToken);

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const USER_ROW = {
  id: 'user-1',
  client_id: 'client-1',
  email: 'admin@example.com',
  password_hash: '$2a$10$hashedpassword',
  full_name: 'Admin User',
  role: 'owner',
  email_verified: true,
  deleted_at: null,
};

const CLIENT_ROW = {
  id: 'client-1',
  name: 'Acme Corp',
  slug: 'acme',
  plan: 'pro',
  plan_spin_limit: 10000,
  spins_used_this_month: 0,
  timezone: 'UTC',
  is_active: true,
};

function makePostRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockSignAccess.mockResolvedValue('access-token');
    mockSignRefresh.mockResolvedValue('refresh-token');
  });

  it('returns 400 when email is missing', async () => {
    const res = await POST(makePostRequest({ password: 'pass123' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when password is missing', async () => {
    const res = await POST(makePostRequest({ email: 'test@example.com' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 401 when user not found', async () => {
    mockSql.mockResolvedValueOnce([]); // no user
    const res = await POST(makePostRequest({ email: 'noone@example.com', password: 'pass' }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('returns 401 when password is wrong', async () => {
    mockSql.mockResolvedValueOnce([USER_ROW]);
    mockBcryptCompare.mockResolvedValue(false as never);

    const res = await POST(makePostRequest({ email: 'admin@example.com', password: 'wrong' }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('returns 401 for deleted user', async () => {
    mockSql.mockResolvedValueOnce([{ ...USER_ROW, deleted_at: new Date().toISOString() }]);

    const res = await POST(makePostRequest({ email: 'admin@example.com', password: 'pass' }));
    expect(res.status).toBe(401);
  });

  it('returns 200 with user + client on valid credentials', async () => {
    mockSql
      .mockResolvedValueOnce([USER_ROW])    // user lookup
      .mockResolvedValueOnce([])             // UPDATE last_login_at
      .mockResolvedValueOnce([CLIENT_ROW]); // client lookup
    mockBcryptCompare.mockResolvedValue(true as never);

    const res = await POST(makePostRequest({ email: 'admin@example.com', password: 'correct' }));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.user.email).toBe('admin@example.com');
    expect(body.user.role).toBe('owner');
    expect(body.client.slug).toBe('acme');
  });

  it('sets access_token and refresh_token cookies on success', async () => {
    mockSql
      .mockResolvedValueOnce([USER_ROW])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([CLIENT_ROW]);
    mockBcryptCompare.mockResolvedValue(true as never);

    const res = await POST(makePostRequest({ email: 'admin@example.com', password: 'correct' }));
    expect(res.status).toBe(200);

    const setCookie = res.headers.getSetCookie?.() ?? [];
    const cookieStr = Array.isArray(setCookie) ? setCookie.join('; ') : '';
    expect(cookieStr).toContain('access_token');
    expect(cookieStr).toContain('refresh_token');
  });

  it('does not expose password_hash in response', async () => {
    mockSql
      .mockResolvedValueOnce([USER_ROW])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([CLIENT_ROW]);
    mockBcryptCompare.mockResolvedValue(true as never);

    const res = await POST(makePostRequest({ email: 'admin@example.com', password: 'correct' }));
    const body = await res.json();
    expect(JSON.stringify(body)).not.toContain('password_hash');
  });

  it('returns 500 on unexpected DB error', async () => {
    mockSql.mockRejectedValueOnce(new Error('DB down'));

    const res = await POST(makePostRequest({ email: 'admin@example.com', password: 'pass' }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});
