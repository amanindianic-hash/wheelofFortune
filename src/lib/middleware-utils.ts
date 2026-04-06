import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from './auth';
import type { AuthUser } from './types';

export async function requireAuth(req: NextRequest): Promise<{ user: AuthUser } | NextResponse> {
  const authHeader = req.headers.get('Authorization');
  const cookieToken = req.cookies.get('access_token')?.value;

  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : cookieToken;

  if (!token) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } },
      { status: 401 }
    );
  }

  const user = await verifyAccessToken(token);
  if (!user) {
    return NextResponse.json(
      { error: { code: 'TOKEN_EXPIRED', message: 'Access token expired or invalid.' } },
      { status: 401 }
    );
  }

  return { user };
}

export function errorResponse(code: string, message: string, status: number, details?: Record<string, unknown>) {
  return NextResponse.json(
    { error: { code, message, ...(details && { details }) } },
    { status }
  );
}

export function okResponse(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}
