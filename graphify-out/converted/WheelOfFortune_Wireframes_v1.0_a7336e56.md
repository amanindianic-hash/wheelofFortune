<!-- converted from WheelOfFortune_Wireframes_v1.0.docx -->



This document provides annotated ASCII wireframe layouts for all major screens. Each wireframe shows structural layout, key components, and interaction notes. Exact visual styling (colours, fonts, spacing) follows the branding config defined in TRD §2.3.2.

WF-01 — Dashboard Home


WF-02 — Wheel Builder — Config Tab


WF-03 — Wheel Builder — Segments Tab


WF-04 — Wheel Builder — Form Tab


WF-05 — Wheel Builder — Embed Tab


WF-06 — Widget: Loading State

WF-07 — Widget: Lead Form State

WF-08 — Widget: Spinning State

WF-09 — Widget: Result State (Win)

WF-10 — Widget: Result State (No Prize)


WF-11 — Analytics Dashboard


WF-12 — Team Management


WF-13 — Integrations Page


— END OF UI/UX WIREFRAMES —
| WHEEL OF FORTUNE PLATFORM
UI/UX Wireframes — Document #7 |
| --- |
| Document Type | UI/UX Wireframes |
| --- | --- |
| Version | v1.0 |
| Date | March 2026 |
| Status | APPROVED FOR DEVELOPMENT |
| Related Documents | TRD v1.1 | SOP v1.0 | User Flows v1.0 |
| Audience | Frontend Developers, UI/UX Designers, QA |
| ┌─────────────────────────────────────────────────────────────────────────┐
│  🎡 SpinPlatform          [Wheels] [Prizes] [Analytics] [Settings]  [👤 John ▾] │
├──────────────┬──────────────────────────────────────────────────────────┤
│  NAVIGATION  │  Dashboard                                  [+ New Wheel] │
│              │ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│  ▸ Wheels    │ │ 12,450   │ │    3     │ │  1,892   │ │  15.2%   │     │
│  ▸ Prizes    │ │Tot Spins │ │Act Wheels│ │  Leads   │ │Conv.Rate │     │
│  ▸ Analytics │ └──────────┘ └──────────┘ └──────────┘ └──────────┘     │
│  ▸ Integrat. │                                                           │
│  ▸ Settings  │  My Wheels                                                │
│              │ ┌────────────────┬──────────┬────────┬──────────┬───────┐ │
│  PLAN        │ │ Name           │ Status   │ Spins  │ Leads    │       │ │
│  [Starter ▾] │ ├────────────────┼──────────┼────────┼──────────┼───────┤ │
│  500 spins/mo│ │ Summer Sale    │ ●ACTIVE  │ 8,231  │   923    │ [···] │ │
│  480 used    │ │ Black Friday   │ ○ DRAFT  │   0    │     0    │ [···] │ │
│  [Upgrade]   │ │ Flash Promo    │ ⏸ PAUSED │ 4,219  │   969    │ [···] │ │
│              │ └────────────────┴──────────┴────────┴──────────┴───────┘ │
└──────────────┴──────────────────────────────────────────────────────────┘ |
| --- |
| Element | Component | Interaction | API Call |
| --- | --- | --- | --- |
| Top nav | Logo + primary navigation links + user avatar dropdown | Click nav items to route to sections | — |
| Plan badge | Shows current plan + spins used/quota | Click [Upgrade] → Plan Upgrade Flow | GET /account |
| Stat cards | 4 KPI cards (Total Spins, Active Wheels, Leads, Conversion) | Read-only display | GET /analytics/summary |
| [+ New Wheel] | Primary CTA button | Opens "Create Wheel" modal → enter name → POST /wheels | POST /wheels |
| Wheel list table | Shows all client wheels with status badge, spins, leads | Row click → open Wheel Builder | GET /wheels |
| Status badge | ●ACTIVE (green), ○DRAFT (grey), ⏸PAUSED (orange), 🗃ARCHIVED (grey) | Read-only | — |
| [···] menu | Per-row action menu: Edit / Duplicate / Archive | Inline actions | PATCH /wheels/{id}/status |
| ┌──────────────────────────────────────────────────────────────────────────┐
│  ← Back   Summer Sale Wheel   [Draft]   [Config] [Segments] [Form] [Embed]│
├─────────────────────────┬────────────────────────────────────────────────┤
│   WHEEL PREVIEW          │  CONFIGURATION                                  │
│                          │                                                  │
│   ┌────────────────┐     │  Wheel Name  [Summer Sale Wheel              ]  │
│   │                │     │                                                  │
│   │   (Canvas      │     │  ── Behaviour ────────────────────────────────  │
│   │    Preview)    │     │  Spin Duration    [====●========] 4000ms        │
│   │                │     │  Animation Speed  [Medium        ▾]             │
│   │    360×360px   │     │  Pointer Position ● Top  ○ Right ○ Bottom ○Left │
│   └────────────────┘     │  Confetti         [● ON ]   Sound [○ OFF]       │
│                          │  Show Labels      [● ON ]                       │
│   Live preview updates   │                                                  │
│   as config changes      │  ── Branding ──────────────────────────────────  │
│                          │  Primary Color    [████] #1E3A5F  [Pick]        │
│                          │  Secondary Color  [████] #2E86C1  [Pick]        │
│                          │  Button Color     [████] #2E86C1  [Pick]        │
│                          │  Button Text      [SPIN NOW!                 ]  │
│                          │  Font Family      [Inter               ▾]       │
│                          │  Border Width     [====●====] 4px               │
│                          │                                                  │
│                          │              [Cancel]  [Save Changes]           │
└─────────────────────────┴────────────────────────────────────────────────┘ |
| --- |
| Element | Type | Validation | API Field |
| --- | --- | --- | --- |
| Wheel Name | Text input, max 255 chars | Required | wheels.name |
| Spin Duration | Range slider 2000–10000ms, step 500 | Min 2000, Max 10000 | config.spin_duration_ms |
| Animation Speed | Dropdown: slow/medium/fast/custom | Required | config.animation_speed |
| Pointer Position | Radio group: top/right/bottom/left | Required | config.pointer_position |
| Confetti / Sound | Toggle switches (ON/OFF) | — | config.confetti_enabled / sound_enabled |
| Color pickers | Hex color input + native color picker | Must match #RRGGBB | branding.primary_color etc. |
| Button Text | Text input, max 30 chars | Required | branding.button_text |
| Font Family | Dropdown of Google Fonts + "custom" option | — | branding.font_family |
| [Save Changes] | Primary button | Calls PATCH /wheels/{id} | PATCH /wheels/{id} |
| ┌──────────────────────────────────────────────────────────────────────────┐
│  ← Back   Summer Sale Wheel   [Draft]   [Config] [Segments] [Form] [Embed]│
├──────────────────────────────────────────────────────────────────────────┤
│  Segments  (6 of 24 max)                          [+ Add Segment]         │
│                                                                            │
│  ⠿ #0 │ ████ │ 20% OFF          │ wt: 2.0 │ Prize: 20%Coupon ▾ │ ×      │
│       │      │                  │         │ Daily cap: [--]  Total:[--]  │
│  ⠿ #1 │ ████ │ Free Shipping    │ wt: 1.5 │ Prize: FreeShip  ▾ │ ×      │
│  ⠿ #2 │ ████ │ Try Again        │ wt: 3.0 │ [✓ No Prize]       │ ×      │
│       │      │ consolation msg: [Better luck next time!      ]          │
│  ⠿ #3 │ ████ │ 10% OFF          │ wt: 2.0 │ Prize: 10%Coupon ▾ │ ×      │
│  ⠿ #4 │ ████ │ Gift Card $50    │ wt: 0.5 │ Prize: GiftCard50▾ │ ×      │
│  ⠿ #5 │ ████ │ Try Again        │ wt: 3.0 │ [✓ No Prize]       │ ×      │
│                                                                            │
│  Weight Distribution:                                                      │
│  ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  20%OFF(16.7%) FreeShip(12.5%) TryAgain(25%) 10%OFF(16.7%) Gift(4.2%)   │
│                                                                            │
│  ⚠ At least 1 prize segment required to activate.                        │
│                              [Cancel]  [Save Segments]                    │
└──────────────────────────────────────────────────────────────────────────┘ |
| --- |
| Element | Behaviour | Validation | API |
| --- | --- | --- | --- |
| Drag handle (⠿) | Drag to reorder segments. Positions auto-renumbered on drop. | — | PUT /wheels/{id}/segments (full replace) |
| Color swatch | Click to open color picker for bg_color and text_color | Must be #RRGGBB | segments[].bg_color |
| Label field | Text input, max 60 chars | Required | segments[].label |
| Weight input | Decimal number input | Min 0.0001, Max 99999.9999 | segments[].weight |
| Prize dropdown | Shows all prizes for this client. Disabled when is_no_prize checked. | Required unless no-prize | segments[].prize_id |
| [✓ No Prize] checkbox | Toggles is_no_prize. Hides prize dropdown. Shows consolation message field. | — | segments[].is_no_prize |
| Daily/Total cap fields | Optional integer inputs for win limits | NULL = unlimited | segments[].win_cap_daily/total |
| Weight distribution bar | Visual % breakdown of all segment weights. Updates live. | Read-only | Computed client-side |
| [Save Segments] | Calls PUT — replaces ALL segments atomically | Min 2 segments | PUT /wheels/{id}/segments |
| ┌──────────────────────────────────────────────────────────────────────────┐
│  ← Back   Summer Sale Wheel   [Draft]   [Config] [Segments] [Form] [Embed]│
├─────────────────────────┬────────────────────────────────────────────────┤
│  FORM FIELDS              │  PREVIEW                                       │
│                           │                                                │
│  Enable Lead Form [● ON ] │  ┌──────────────────────────────────────┐     │
│                           │  │  🎡 Spin to Win!                     │     │
│  Fields:                  │  │                                      │     │
│  [✓] Email  [Required ✓]  │  │  Email Address  *                    │     │
│  [✓] Name   [Required ○]  │  │  [                               ]   │     │
│  [✓] Phone  [Required ○]  │  │                                      │     │
│  [○] Custom [Required ○]  │  │  Full Name                           │     │
│      key: [          ]    │  │  [                               ]   │     │
│      label:[          ]   │  │                                      │     │
│  [+ Add Custom Field]     │  │  [✓] I agree to receive marketing   │     │
│                           │  │      emails. Privacy Policy          │     │
│  GDPR Settings            │  │                                      │     │
│  GDPR Consent [● ON ]     │  │  [     Submit & Spin!     ]          │     │
│  Text: [I agree to receive│  └──────────────────────────────────────┘     │
│   marketing emails.      ]│                                                │
│  Privacy URL: [https://  ]│                                                │
│  Terms URL:   [https://  ]│                                                │
│                           │               [Cancel] [Save Form Config]     │
└─────────────────────────┴────────────────────────────────────────────────┘ |
| --- |
| Element | Behaviour | API Field |
| --- | --- | --- |
| Enable Lead Form toggle | When OFF: form_config.enabled=false. Widget skips form, goes straight to spin. | form_config.enabled |
| Field checkboxes | Email/Name/Phone always available. Toggle to include/exclude from form. | form_config.fields[] |
| [Required] toggle per field | Makes field mandatory for form submission. | form_config.fields[].required |
| [+ Add Custom Field] | Adds a custom field with key + label. type defaults to "text". | form_config.fields[] (custom key) |
| GDPR Consent toggle | When ON: shows consent checkbox. User must check before spinning. | form_config.gdpr_enabled |
| GDPR Text input | The exact consent text shown next to checkbox. | form_config.gdpr_text |
| Privacy/Terms URL | Clickable links in the consent text. | form_config.privacy_policy_url / terms_url |
| Live Preview | Right panel updates live. Shows exactly what the form looks like. | Read-only preview |
| ┌──────────────────────────────────────────────────────────────────────────┐
│  ← Back   Summer Sale Wheel   [ACTIVE]  [Config] [Segments] [Form] [Embed]│
├──────────────────────────────────────────────────────────────────────────┤
│  Embed Code                                                                │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │ <div id="spin-widget" data-token="a3f9c2e1b8d74506..."></div>        │ │
│  │ <script src="https://cdn.spinplatform.io/widget/v1/wheel.min.js"    │ │
│  │   async></script>                                                    │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│  [📋 Copy Code]    [🔗 Test Widget]                                        │
│                                                                            │
│  ℹ The embed_token is NOT a secret. Safe to include in page source.       │
│                                                                            │
│  ── Custom Domain ──────────────────────────────────────────────────────  │
│  Domain: [spin.yourbrand.com                          ]                   │
│  Status: ⏳ SSL Pending (up to 24h) / ✅ Active                           │
│  [Save Domain]                                                             │
│                                                                            │
│  ── Widget Preview ─────────────────────────────────────────────────────  │
│  [Open Live Preview →]  (opens widget in new tab using embed_token)       │
└──────────────────────────────────────────────────────────────────────────┘ |
| --- |
| ┌─────────────────────────┐
│                         │
│        🎡               │
│   ╔═══════════╗         │
│   ║           ║         │
│   ║   ( ◌ )  ║  ← spinning loader   │
│   ║           ║         │
│   ╚═══════════╝         │
│                         │
│   Loading your spin...  │
│                         │
└─────────────────────────┘
Widget: <80KB gzipped. Shadow DOM isolates from host page CSS. |
| --- |
| ┌─────────────────────────┐
│  🎡 Spin to Win!         │
│  ─────────────────────  │
│  Email Address *         │
│  [                    ]  │
│                          │
│  Full Name               │
│  [                    ]  │
│                          │
│  [✓] I agree to receive  │
│      marketing emails.   │
│      Privacy Policy      │
│                          │
│  [   Submit & Spin!   ]  │
│                          │
└──────────────────────────┘
Shown only when form_config.enabled = true. GDPR checkbox only when gdpr_enabled = true. |
| --- |
| ┌─────────────────────────┐
│                         │
│   ╔═══════════╗         │
│   ║ ≋≋≋≋≋≋≋  ║         │
│   ║ ≋WHEEL≋  ║ ← rotating canvas (easeOutCubic)   │
│   ║ ≋≋≋≋≋≋≋  ║         │
│   ╚═══════════╝         │
│                         │
│  [   SPINNING...   ]    │ ← button disabled (greyed)   │
│                         │
└─────────────────────────┘
Animation: 3-7 full rotations. POST /spin/execute called AFTER animation completes. |
| --- |
| ┌─────────────────────────┐
│  🎉 You Won!   🎊        │
│  ─────────────────────  │
│  ┌───────────────────┐  │
│  │   20% OFF         │  │
│  │                   │  │
│  │  Code:            │  │
│  │  SPIN-ABCD1234    │  │
│  │  [📋 Copy Code]   │  │
│  │                   │  │
│  │  Expires: 30 Apr  │  │
│  └───────────────────┘  │
│                          │
│  [       Done       ]   │
└──────────────────────────┘
Confetti burst on win (if config.confetti_enabled = true). Prize data from POST /spin/execute response. |
| --- |
| ┌─────────────────────────┐
│                         │
│        😔               │
│                         │
│   Better luck next      │
│   time!                 │
│                         │
│   (consolation_message  │
│    from segment config) │
│                         │
│  [       Close      ]   │
│                         │
└─────────────────────────┘
is_no_prize = true. No coupon issued. Spin still counted toward quota. |
| --- |
| ┌──────────────────────────────────────────────────────────────────────────┐
│  Analytics                                                                 │
│                                                                            │
│  Wheel: [Summer Sale ▾]   Date: [Mar 1 2026] → [Mar 31 2026]  [Apply]    │
│                                                                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                    │
│  │  12,450  │ │  1,892   │ │  15.2%   │ │   823    │                    │
│  │Tot Spins │ │  Leads   │ │Conv.Rate │ │CouponsIss│                    │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘                    │
│                                                                            │
│  Spins Over Time                  │  Prize Distribution                   │
│  ┌─────────────────────────────┐  │  ┌──────────────────────┐            │
│  │     /\    /\                │  │  │   ████ 20%OFF  33.3% │            │
│  │    /  \  /  \    /\         │  │  │   ███  Ship    25.0% │            │
│  │   /    \/    \  /  \        │  │  │   ██   10%OFF  16.7% │            │
│  │  /            \/    \___    │  │  │   █    GiftC    4.2% │            │
│  └─────────────────────────────┘  │  └──────────────────────┘            │
│  [Day ● Week ○ Month ○]           │                                       │
│                                                                            │
│  Leads                                    [Export CSV ↓]                  │
│  ┌────────────────┬─────────────────┬──────────────────────────┐         │
│  │ Email          │ Prize Won       │ Timestamp                │         │
│  ├────────────────┼─────────────────┼──────────────────────────┤         │
│  │ john@acme.com  │ 20% OFF Coupon  │ 2026-03-15 14:23:01 UTC  │         │
│  │ jane@corp.io   │ Free Shipping   │ 2026-03-15 14:19:44 UTC  │         │
│  └────────────────┴─────────────────┴──────────────────────────┘         │
└──────────────────────────────────────────────────────────────────────────┘ |
| --- |
| ┌──────────────────────────────────────────────────────────────────────────┐
│  Settings → Team                                      [+ Invite Member]   │
│                                                                            │
│  ┌────────────────┬───────────────────┬───────────┬─────────────┬───────┐ │
│  │ Name           │ Email             │ Role      │ Last Login  │       │ │
│  ├────────────────┼───────────────────┼───────────┼─────────────┼───────┤ │
│  │ Jane Doe       │ jane@acme.com     │ [Owner  ] │ Just now    │  —    │ │
│  │ Bob Smith      │ bob@acme.com      │ [Admin ▾] │ 2h ago      │ [···] │ │
│  │ Carol Lee      │ carol@acme.com    │ [Editor▾] │ Yesterday   │ [···] │ │
│  │ Dave Wilson    │ dave@acme.com     │ [Viewer▾] │ 5 days ago  │ [···] │ │
│  └────────────────┴───────────────────┴───────────┴─────────────┴───────┘ │
│                                                                            │
│  ┌── Invite Member ────────────────────────────────────────────────────┐  │
│  │  Email: [                              ]  Role: [Editor ▾]         │  │
│  │                                   [Cancel]  [Send Invitation]      │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘ |
| --- |
| ┌──────────────────────────────────────────────────────────────────────────┐
│  Wheel: Summer Sale → Integrations                                         │
│                                                                            │
│  ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐     │
│  │  📧 Mailchimp     │  │  📧 Klaviyo        │  │  🏢 HubSpot       │     │
│  │                   │  │                   │  │                   │     │
│  │  Status: ✅ Active│  │  Status: ○ Idle   │  │  Status: ✅ Active│     │
│  │  [● Enabled  ]    │  │  [● Enabled  ]    │  │  [○ Disabled ]    │     │
│  │  [Configure] [Test]│  │  [Configure] [Test]│  │  [Configure]     │     │
│  └───────────────────┘  └───────────────────┘  └───────────────────┘     │
│                                                                            │
│  ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐     │
│  │  ⚡ Zapier        │  │  🔗 Webhook        │  │  📊 Google Sheets │     │
│  │                   │  │                   │  │                   │     │
│  │  Status: ○ Not set│  │  Status: ⚠ Failed │  │  Status: ○ Not set│     │
│  │  [○ Disabled ]    │  │  [● Enabled  ]    │  │  [○ Disabled ]    │     │
│  │  [Configure]      │  │  [Configure] [Test]│  │  [Configure]     │     │
│  └───────────────────┘  └───────────────────┘  └───────────────────┘     │
└──────────────────────────────────────────────────────────────────────────┘ |
| --- |
| Status Indicator | Meaning |
| --- | --- |
| ✅ Active (green) | Last dispatch succeeded. last_triggered_at is recent. |
| ○ Idle (grey) | Enabled but no spins yet to trigger dispatch. |
| ⚠ Failed (orange) | Last webhook attempt failed. last_error populated. Check and re-test. |
| ○ Not set (grey) | Integration not yet configured. Click [Configure] to set up. |