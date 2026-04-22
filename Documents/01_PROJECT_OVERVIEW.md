# Wheel of Fortune — Project Overview

**Last Updated:** 2026-04-22  
**Version:** Next.js 16.2.2 / React 19.2.4  
**Live URL:** https://wheelof-fortune-test-2usuvgo7k-amanqureshi-8795s-projects.vercel.app

---

## What Is This?

A full-stack SaaS platform for creating and embedding gamified marketing promotions. Brands embed a customizable wheel (or scratch card, slot machine, roulette) on their website to capture leads and distribute prize coupons. Operators manage wheels, prizes, analytics, and CRM integrations from a dashboard.

---

## Core Concepts

| Concept | Description |
|---|---|
| **Wheel** | A game configuration owned by a client workspace. Has segments, branding, trigger rules, and a unique embed token. |
| **Segment** | One slice of a wheel. Has a label, color, weight (probability), and an optional prize. |
| **Prize** | An award attached to a segment — coupon code, points, gift card, custom message, or URL redirect. |
| **Spin Session** | One player's attempt. Tracks fingerprint, IP, lead form data, GDPR consent, and result. |
| **Client** | A workspace/account (company). Has a plan, spin quota, team members, and integrations. |
| **Embed Token** | A public UUID that identifies a wheel. Used in the widget iframe URL. No auth required. |

---

## Game Types

1. **Wheel of Fortune** — Classic spinning wheel with weighted segments
2. **Scratch Card** — Reveal mechanic with configurable grid (3×3, 2×4, etc.)
3. **Slot Machine** — 3 or 5 reel slots with symbol animations and win lines
4. **Roulette** — Classic roulette table with ball physics simulation

---

## User Roles

| Role | Permissions |
|---|---|
| `owner` | Full account access, billing, team management |
| `admin` | Manage team members, all wheel/prize operations |
| `editor` | Create/edit wheels and prizes |
| `viewer` | Read-only access to analytics and leads |

---

## Subscription Plans

| Plan | Spin Limit | Key Features |
|---|---|---|
| Free | 500/mo | 1 wheel, basic themes |
| Starter | 5,000/mo | 3 wheels, email integrations |
| Growth | 25,000/mo | Unlimited wheels, full CRM suite |
| Pro | 100,000/mo | A/B testing, white-label, priority support |
| Enterprise | Unlimited | Custom domain, SLA, dedicated support |

---

## High-Level Architecture

```
Browser / Embed Site
        │
        ▼
   Vercel Edge (CDN)
        │
   ┌────┴────┐
   │  Next.js │  (App Router, React 19)
   │  Server  │
   └────┬────┘
        │
   ┌────┴────────────────────────┐
   │  API Routes (/api/*)        │
   │  - Auth (JWT + cookies)     │
   │  - Wheels CRUD              │
   │  - Spin execution engine    │
   │  - Integrations dispatcher  │
   │  - Cron jobs (5 scheduled)  │
   └────┬────────────────────────┘
        │
   ┌────┴────┐     ┌──────────────┐
   │  Neon   │     │  Vercel Blob │
   │  Postgres│    │  (file storage)│
   └─────────┘     └──────────────┘
        │
   External Services
   ├── Stripe (billing)
   ├── Resend (email)
   ├── Twilio (WhatsApp)
   ├── Telegram Bot API
   ├── Mailchimp / Klaviyo / HubSpot / Salesforce
   ├── Google Sheets / Zapier / Webhooks
   └── Apple Wallet / Google Wallet
```

---

## Repository Structure

```
/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # 50+ REST endpoints
│   │   ├── dashboard/          # Admin dashboard pages
│   │   ├── auth/               # Login / register / reset pages
│   │   ├── widget/[token]/     # Public embed widget page
│   │   └── play/[token]/       # Full-page play experience
│   ├── components/
│   │   ├── ui/                 # Shadcn primitives
│   │   ├── widget/             # Game widgets (spin, scratch, slot, roulette)
│   │   ├── dashboard/          # Dashboard-specific components
│   │   ├── shared/             # UniversalWheelRenderer, etc.
│   │   └── providers/          # AuthProvider, ThemeProvider
│   └── lib/
│       ├── db.ts               # Neon DB client
│       ├── auth.ts             # JWT helpers
│       ├── stripe.ts           # Stripe client
│       ├── prize-engine.ts     # Weighted random selection (CSPRNG)
│       ├── audit.ts            # Audit logging
│       ├── integrations/       # CRM adapters
│       ├── wallet/             # Apple & Google Wallet pass gen
│       └── utils/              # Theme, wheel renderer, slot, segment utilities
├── public/
│   └── widget.js               # Embeddable script for external sites
├── Documents/                  # This documentation folder
├── vercel.json                 # Deployment + cron schedule
├── package.json
├── tsconfig.json
└── playwright.config.ts
```

---

## Key Design Decisions

- **No ORM**: Raw SQL via Neon tagged templates for full query control
- **No global state library**: React hooks + AuthContext only
- **Non-blocking integrations**: Lead sync uses `Promise.allSettled()` so spin response is instant
- **Server-side prize resolution**: CSPRNG ensures fair, tamper-proof odds
- **Idempotency**: Spin execution protected by idempotency keys to prevent duplicate awards
- **Canvas rendering**: All game visuals drawn on `<canvas>` for pixel-perfect, cross-browser consistency
- **Single spin system**: All 4 game types share session/spin/prize infrastructure
