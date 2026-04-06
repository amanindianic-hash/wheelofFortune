import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { AuthUser } from './types';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-change-in-production'
);

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

export async function signAccessToken(user: AuthUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(JWT_SECRET);
}

export async function signRefreshToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .sign(JWT_SECRET);
}

export async function verifyAccessToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as AuthUser;
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(token: string): Promise<{ sub: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.type !== 'refresh') return null;
    return payload as { sub: string };
  } catch {
    return null;
  }
}

export async function getAuthUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  if (!token) return null;
  return verifyAccessToken(token);
}

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
  const secureFlag = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.headers.append(
    'Set-Cookie',
    `access_token=${accessToken}; HttpOnly${secureFlag}; SameSite=Lax; Path=/; Max-Age=900`
  );
  res.headers.append(
    'Set-Cookie',
    `refresh_token=${refreshToken}; HttpOnly${secureFlag}; SameSite=Lax; Path=/api/auth/refresh; Max-Age=604800`
  );
}

export function clearAuthCookies(res: Response): void {
  const secureFlag = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.headers.append('Set-Cookie', `access_token=; HttpOnly${secureFlag}; SameSite=Lax; Path=/; Max-Age=0`);
  res.headers.append('Set-Cookie', `refresh_token=; HttpOnly${secureFlag}; SameSite=Lax; Path=/api/auth/refresh; Max-Age=0`);
}
