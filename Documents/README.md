# Wheel of Fortune — Documentation Index

**Last Updated:** 2026-04-22  
**Project:** WheelOfFortune SaaS Platform  
**Stack:** Next.js 16.2.2 · React 19 · Neon PostgreSQL · Vercel  
**Live URL:** https://wheelof-fortune-test-2usuvgo7k-amanqureshi-8795s-projects.vercel.app

---

## Documents

| # | Document | Description |
|---|---|---|
| 01 | [Project Overview](./01_PROJECT_OVERVIEW.md) | What the app does, core concepts, high-level architecture, repo structure, design decisions |
| 02 | [Tech Stack](./02_TECH_STACK.md) | All frameworks, libraries, services, environment variables, dev scripts |
| 03 | [Database Schema](./03_DATABASE_SCHEMA.md) | All tables, columns, types, constraints, relationships, conventions |
| 04 | [API Reference](./04_API_REFERENCE.md) | All 50+ endpoints — method, path, request body, response shape, auth requirements |
| 05 | [Authentication](./05_AUTHENTICATION.md) | JWT flow, cookie settings, role permissions matrix, middleware usage, OAuth |
| 06 | [Features](./06_FEATURES.md) | Game types, prize system, lead capture, customization, triggers, integrations, analytics |
| 07 | [Deployment](./07_DEPLOYMENT.md) | Local setup, Vercel deployment, cron jobs, Stripe webhooks, Telegram bot, Apple/Google Wallet |
| 08 | [Integrations Guide](./08_INTEGRATIONS_GUIDE.md) | Per-integration setup (Mailchimp, Klaviyo, HubSpot, Salesforce, Google Sheets, Shopify, etc.) |
| 09 | [Widget Embed Guide](./09_WIDGET_EMBED.md) | Script tag embed, modes, JS API, events, PostMessage, CSP, Shopify, troubleshooting |
| 10 | [Spin Engine](./10_SPIN_ENGINE.md) | Prize resolution algorithm, idempotency, win caps, kiosk mode, A/B testing, cron resets |

---

## Folder Structure

```
Documents/
├── README.md                        ← this file
├── 01_PROJECT_OVERVIEW.md
├── 02_TECH_STACK.md
├── 03_DATABASE_SCHEMA.md
├── 04_API_REFERENCE.md
├── 05_AUTHENTICATION.md
├── 06_FEATURES.md
├── 07_DEPLOYMENT.md
├── 08_INTEGRATIONS_GUIDE.md
├── 09_WIDGET_EMBED.md
├── 10_SPIN_ENGINE.md
├── archive/                         ← original legacy documents (March 31)
│   ├── WheelOfFortune_API_Spec_v1.1_fixed.yaml
│   ├── WheelOfFortune_BusinessLogic_v1.0.docx
│   ├── WheelOfFortune_DevOps_v1.0.docx
│   ├── WheelOfFortune_EdgeCases_v1.0.docx
│   ├── WheelOfFortune_Schema_v1.1_fixed.sql
│   ├── WheelOfFortune_SOP_v1.0.docx
│   ├── WheelOfFortune_TRD_v1.1_fixed.docx
│   ├── WheelOfFortune_UserFlows_v1.0.docx
│   └── WheelOfFortune_Wireframes_v1.0.docx
└── migrations/                      ← applied DB migration SQL files
    ├── V20260406__add_password_reset_tokens.sql
    ├── V20260407__add_wheel_themes.sql
    ├── V20260408__extend_segment_colors.sql
    ├── V20260408b__segments_color_text.sql
    ├── V20260408c__segments_offsets.sql
    ├── V20260410__segments_rotation_angles.sql
    ├── V20260410c__add_gaming_theme_presets.sql
    ├── V20260414__add_segment_images.sql
    ├── V20260416__segments_relative_offsets.sql
    └── V20260416_2__increase_limits.sql
```

---

## Quick Reference

### Key File Locations

| What | Where |
|---|---|
| DB client | `src/lib/db.ts` |
| JWT helpers | `src/lib/auth.ts` |
| Prize engine | `src/lib/prize-engine.ts` |
| Audit logging | `src/lib/audit.ts` |
| Stripe client | `src/lib/stripe.ts` |
| Email (Resend) | `src/lib/email.ts` |
| All integrations | `src/lib/integrations/` |
| Wallet passes | `src/lib/wallet/` |
| Auth middleware | `src/lib/middleware-utils.ts` |
| Wheel renderer | `src/lib/utils/wheel-renderer.ts` |
| All API routes | `src/app/api/` |
| Dashboard pages | `src/app/dashboard/` |
| Widget pages | `src/app/widget/[token]/` |
| Play page | `src/app/play/[token]/` |
| Game components | `src/components/widget/` |
| Embed script | `public/widget.js` |
| Vercel config | `vercel.json` |

### Key Concepts in 30 Seconds

- A **Wheel** has **Segments**. Each Segment has a **weight** (probability) and optionally a **Prize**.
- Players get an **embed_token** URL → fill form → get **session_id** → spin → server picks winner → coupon issued.
- All dashboard access needs a **JWT access_token** cookie. Spins need only the **embed_token** (public).
- **Win caps** per segment: daily (reset at midnight) and total (permanent). Capped segments excluded from draws.
- **Integrations** fire after spin response is sent — never block the player experience.
- **Idempotency keys** prevent duplicate prizes on network retry.
