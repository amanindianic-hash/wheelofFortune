# Deployment Handover Guide: Wheel Fortune Platform

This guide outlines the critical steps required to deploy the stabilized **Wheel Fortune Platform** to production.

## 1. Environment Variables (Vercel)

For a successful deployment on Vercel, the following environment variables MUST be configured in the **Project Settings > Environment Variables** section. Use `.env.example` as a template.

### Required Core Variables
- **`DATABASE_URL`**: Your Neon PostgreSQL connection string.
- **`JWT_SECRET`**: A cryptographically strong secret (min 32 chars) for session security.
- **`NEXT_PUBLIC_APP_URL`**: The live URL of your deployment (e.g., `https://your-campaign.vercel.app`).

### Integration Variables (Optional)
- **Stripe**: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` and Price IDs for paid plans.
- **Web Push**: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` for browser notifications.
- **Messaging**: `TWILIO_ACCOUNT_SID`, `TELEGRAM_BOT_TOKEN`.
- **Wallets**: `GOOGLE_WALLET_ISSUER_ID`, `APPLE_PASS_TYPE_ID`.

---

## 2. Database Setup (Neon)

The application uses **Neon PostgreSQL**. Follow these steps to prepare the production database:

1.  **Initialize Primary Schema**: Use the initial schema file located in `Documents/archive/WheelOfFortune_Schema_v1.1_fixed.sql` to create the base tables.
2.  **Apply Migration Sequence**: There are 10 critical updates required for the new Wheel Editor features. Run the SQL scripts in `Documents/migrations/` in chronological order:
    - `V20260406__add_password_reset_tokens.sql`
    - `V20260407__add_wheel_themes.sql`
    - ... through to ...
    - `V20260416__segments_relative_offsets.sql`
3.  **Seed Theme Presets**: Execute `V20260410c__add_gaming_theme_presets.sql` to populate the "Internal Themes" library.

---

## 3. Build & Deployment

The modern build pipeline is optimized for Next.js 15.

- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Region**: Recommend `iad1` (US East) for closest proximity to Neon's default clusters.

---

## 4. Technical Support

The stabilized code is available on branch: **`stabilized-build-v2`**.

> [!IMPORTANT]
> The database migration sequence is mandatory. Skipping migrations will cause the Wheel Editor to crash when attempting to save segment offsets or custom colors.
