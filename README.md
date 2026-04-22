# Wheel of Fortune Platform (Stabilized Build)

A high-performance, enterprise-grade gamification engine built with **Next.js 15+**, **TypeScript**, and **Neon PostgreSQL**. This platform allows marketing teams to build, customize, and embed interactive spin-to-win campaigns on any website.

## 🚀 Recently Stabilized (v2.0)

This version includes the **Stabilization & Modular Re-architecture** (April 2026):
- **Modular Editor**: Tabs for Aesthetics, Canvas (Segments), Distribution, and Mechanics.
- **Improved UX**: Sticky live monitor for real-time visual feedback while scrolling.
- **Restored Features**: Full Embed Widget Protocol support and synchronized rendering pipelines.
- **Bug Fixes**: Resolved segment color reactivity, "undefined" URL routing, and runtime crashes.

## 📁 Repository Structure

- `src/app`: App Router, API routes, and page layouts.
- `src/components`: UI components, including the modular campaign editor.
- `src/lib`: Core logic, theme normalization, and utility functions.
- `public`: Static assets including `widget.js` for external embedding.
- `Documents`: Comprehensive technical documentation, architecture guides, and API specs.

## 📚 Documentation & Handover

For detailed instructions on setup and deployment, please refer to:
- **[Deployment Handover Guide](./DEPLOYMENT_HANDOVER.md)**: Mandatory setup for Neon DB and Vercel.
- **[Documentation Index](./Documents/README.md)**: Full API, Schema, and Engine deeply explained.
- **[Theme Presets Guide](./THEME_PRESETS_GUIDE.md)**: How to manage and extend visual themes.

## 🛠️ Getting Started

1.  **Install Dependencies**:
    ```bash
    npm install
    ```
2.  **Environment Variables**:
    Copy `.env.example` to `.env.local` and configure your Neon `DATABASE_URL`.
3.  **Database Migrations**:
    Run the SQL scripts in `Documents/migrations/` in order.
4.  **Dev Server**:
    ```bash
    npm run dev
    ```

---

*This branch (`stabilized-build-v2`) contains the finalized optimizations and should be merged into `main` after review.*
