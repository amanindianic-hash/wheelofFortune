# Authentication & Authorization

**Last Updated:** 2026-04-22

---

## Overview

The app uses **JWT (JSON Web Tokens)** stored in **httpOnly cookies**. This prevents JavaScript access to tokens, protecting against XSS attacks. CSRF is mitigated with `SameSite=Lax` cookie policy.

---

## Token Types

| Token | Cookie Name | Expiry | Path |
|---|---|---|---|
| Access Token | `access_token` | 15 minutes | `/` |
| Refresh Token | `refresh_token` | 7 days | `/api/auth/refresh` |

Both tokens are signed with **HS256** using the `JWT_SECRET` environment variable.

---

## Auth Flow

### Email / Password Login

```
1. Client POST /api/auth/login { email, password }
2. Server: verify email exists, bcrypt.compare(password, hash)
3. Server: signAccessToken({ id, client_id, email, role })
4. Server: signRefreshToken({ id })
5. Server: Set-Cookie: access_token=...; refresh_token=...
6. Client: auth cookies stored, redirect to /dashboard
```

### Token Refresh

```
1. API request returns 401 (access token expired)
2. Client POST /api/auth/refresh (sends refresh cookie automatically)
3. Server: verify refresh token, issue new access token
4. Server: Set-Cookie: access_token=... (new 15-min token)
5. Client: retry original request
```

### Google OAuth

```
1. Client GET /api/auth/google → redirect to Google
2. User consents on Google consent screen
3. Google GET /api/auth/google/callback?code=...
4. Server: exchange code for Google profile
5. Server: find or create user by google_id / email
6. Server: issue JWT cookies, redirect to /dashboard
```

---

## JWT Payload

```json
{
  "id": "user-uuid",
  "client_id": "client-uuid",
  "email": "user@example.com",
  "role": "owner",
  "iat": 1713744000,
  "exp": 1713744900
}
```

---

## Middleware: `requireAuth()`

Located at `src/lib/middleware-utils.ts`.

```typescript
requireAuth(request, { roles: ['owner', 'admin'] })
```

- Reads `access_token` cookie from request
- Verifies JWT signature and expiry
- Returns `{ user }` payload if valid
- Throws `401` if missing or expired
- Throws `403` if role is not in the allowed list

### Usage in API Routes

```typescript
export async function PUT(req: Request, { params }) {
  const { user } = await requireAuth(req, { roles: ['owner', 'admin', 'editor'] });
  // user.id, user.client_id, user.role are now available
}
```

---

## Role Permissions Matrix

| Action | owner | admin | editor | viewer |
|---|---|---|---|---|
| View dashboard | ✅ | ✅ | ✅ | ✅ |
| View analytics | ✅ | ✅ | ✅ | ✅ |
| View leads | ✅ | ✅ | ✅ | ✅ |
| Create/edit wheels | ✅ | ✅ | ✅ | ❌ |
| Create/edit prizes | ✅ | ✅ | ✅ | ❌ |
| Upload coupons | ✅ | ✅ | ✅ | ❌ |
| Manage integrations | ✅ | ✅ | ❌ | ❌ |
| Manage team members | ✅ | ✅ | ❌ | ❌ |
| Billing / plan changes | ✅ | ❌ | ❌ | ❌ |
| Delete account | ✅ | ❌ | ❌ | ❌ |

---

## Public Endpoints (No Auth Required)

These endpoints use the wheel's `embed_token` for identification instead of JWT:

| Endpoint | Auth Method |
|---|---|
| `POST /api/spin/session` | `embed_token` in body |
| `POST /api/spin/execute` | `session_id` in body (validated server-side) |
| `GET /api/spin/game-type` | `token` query param |
| `GET /widget/[token]` | URL param |
| `GET /play/[token]` | URL param |
| `GET /api/wallet/apple` | `spin_id` query param |
| `GET /api/wallet/google` | `spin_id` query param |

---

## Password Security

- Passwords hashed with **bcrypt** (cost factor 10)
- Minimum length enforced at registration
- Password reset uses a short-lived signed JWT sent via email (Resend)
- Reset tokens are single-use (verified by expiry only — no DB revocation list)

---

## Cookie Security Settings

```
httpOnly: true          // No JavaScript access
secure: true            // HTTPS only in production
sameSite: 'lax'         // CSRF protection
path: '/'               // Sent on all requests
maxAge: 900             // Access token: 15 minutes
maxAge: 604800          // Refresh token: 7 days
```

---

## Audit Logging

Every authentication event (login, logout, password change, failed login) is written to the `audit_logs` table with:
- User ID
- IP address
- User agent
- Timestamp
- Action type

This enables compliance review from `/dashboard/audit`.
