# SpinPlatform Design System - Complete Export

## Pages Inventory (22 total)

### Public Pages
1. `/` - Marketing Landing Page
2. `/login` - Auth Portal
3. `/forgot-password` - Password Recovery
4. `/reset-password` - Password Reset
5. `/register` - Signup
6. `/register/onboarding` - Onboarding Flow

### Dashboard Pages
7. `/dashboard` - Overview (Telemetry)
8. `/dashboard/wheels` - Campaign List
9. `/dashboard/wheels/[id]` - Wheel Editor
10. `/dashboard/prizes` - Prize Inventory
11. `/dashboard/analytics` - Engagement Charts
12. `/dashboard/leads` - Captured Data
13. `/dashboard/leaderboard` - Leaderboard
14. `/dashboard/ab-tests` - A/B Tests
15. `/dashboard/push` - Push Alerts
16. `/dashboard/audit` - Activity Logs
17. `/dashboard/account` - Settings
18. `/dashboard/theme-tester` - Theme Tester
19. `/dashboard/integrations` - Integrations

### Player Pages
20. `/play/[token]` - Fullscreen Player
21. `/widget/[token]` - Embed Container

---

## Design System Tokens

### Color Palette (Studio Black Dark Mode)

```
Primary:        #7c3aed (violet-600) / #d2bbff (violet-300)
Secondary:      #4f319c (violet-900) / #cebdff (lavender)
Tertiary:       #4edea3 (emerald)
Error:          #ffb4ab (rose-200)
Background:     #13131b (near black)
Surface Layers:
  - lowest:     #0d0d16
  - low:        #1b1b23
  - base:       #1f1f28
  - high:       #292932
  - highest:    #34343d
On Surface:     #e4e1ed
Outline:        #958da1
```

### Typography

```
Headlines:      Space Grotesk (Google Fonts)
Body:           Inter (Google Fonts)
Labels:         Inter (uppercase tracking)
```

### Utility Classes

```
.glass-card      - Frosted glass with blur(16px)
.glass-panel     - Deep glassmorphism (60% surface + 24px blur)
.btn-glow-violet - Neon glow button effect
.neon-glow       - Violet outer glow
.neon-glow-lg    - Large violet glow
.neon-glow-emerald - Emerald success glow
.text-gradient-violet - Gradient text violet-lavender
.text-stat       - Tabular nums for statistics
.font-editorial  - Space Grotesk with tight tracking
.label-caps      - ALL CAPS with 0.08em letter-spacing
.bg-dot-pattern  - 24px radial dot grid background
.ambient-shadow  - Large soft lift shadow
.ambient-light-leak - Radial glow overlay
.ghost-border    - Transparent borders for continuous feel
```

---

## Component Inventory

### Navigation
- Sidebar: 216px fixed, 1px violet active indicator
- Mobile drawer with overlay
- NAV_GROUPS: Platform, System, Tools sections

### Cards
- glass-panel styling with inner top highlight
- Rounded corners (1.5rem - 2rem)
- Hover lift animation

### Buttons
- Primary: Gradient violet (#7c3aed → #a78bfa) with shadow glow
- Secondary: Ghost style with ghost-border
- Sizes: xs, sm, default, lg, xl, icon variants

### Forms
- Dark background (#0d0d16)
- Focus: violet border with outer glow
- 8px border radius

### Status Badges
- Active: Emerald with pulse animation
- Paused: Amber
- Draft: Slate
- Archived: Rose

---

## Page-Specific Designs

### Landing Page (`/`)
- Hero with radial glow background
- Browser mockup with wheel preview
- Features bento grid (2-3 columns)
- Pricing cards with highlight state
- Footer with link columns

### Dashboard (`/dashboard`)
- Neural Header with KPI pills
- Bento grid: 8-col chart + 4-col donut chart
- Metric modules row (3 cards)
- Active Deployments list with glass cards
- Technical footer

### Wheels List (`/dashboard/wheels`)
- Header with title + New Campaign CTA
- Campaign cards with:
  - Visual marker (Disc3 icon)
  - Status pill (Active/Paused/Draft)
  - Spins count
  - Embed token display
  - Edit + More menu actions
- Empty state with CTA
- Create dialog with glass-panel styling

### Wheel Editor (`/dashboard/wheels/[id]`)
- Tabbed interface: Design, Segments, Distribution, Settings, Templates, Form
- Live preview panel
- QR code generation
- Share dialog
- Save as theme dialog

### Analytics (`/dashboard/analytics`)
- Filter bar (wheel selector, date range, export)
- 4-column stat cards with top accent bar
- Daily spins bar chart
- Breakdown cards: Prize, Segment, Device, OS

---

## Export Notes

All CSS and components use:
- Tailwind CSS 4.0 with OKLCH color space
- Radix UI primitives (Dialog, DropdownMenu, etc.)
- Lucide icons
- CSS custom properties for design tokens