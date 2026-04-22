# Feature Documentation

**Last Updated:** 2026-04-22

---

## 1. Game Types

### Wheel of Fortune
- Classic spinning wheel rendered on HTML5 Canvas
- Configurable number of segments (min 2, typically 6–12)
- Weighted probability per segment (higher weight = higher chance)
- Smooth deceleration animation with configurable spin duration
- Optional confetti burst on win
- Sound effects (spin whirr, win fanfare)

### Scratch Card
- Reveal mechanic — player scratches to uncover prize
- Configurable grid layouts (3×3, 2×4, etc.)
- Canvas-based scratch mask with touch/mouse support
- Auto-reveal after threshold % is scratched

### Slot Machine
- 3 or 5 reel configuration
- Symbol-based reels with animation
- Win line detection (horizontal, diagonal)
- Cascading reel stop animation

### Roulette
- Classic roulette wheel with ball physics simulation
- Number/color segment system
- Server-side outcome selection (same prize engine as wheel)

---

## 2. Prize System

### Prize Types

| Type | Description |
|---|---|
| `coupon` | Coupon code (static, pool, or auto-generated) |
| `points` | Loyalty points value |
| `gift_card` | Gift card reference |
| `message` | Custom HTML message |
| `redirect` | Redirect player to a URL |

### Coupon Modes

| Mode | How It Works |
|---|---|
| `static` | All winners get the same code (e.g. SAVE10) |
| `pool` | Each winner gets a unique code from an uploaded CSV pool |
| `auto_generated` | System generates a unique code per winner |

### Win Caps
- **Daily cap**: Max number of this segment that can win per day (reset by midnight cron)
- **Total cap**: Max ever — once reached, segment becomes "no prize" automatically

### Prize Display
After a spin, players see:
- Prize name and display title
- Coupon code (copyable)
- QR code / barcode for in-store redemption
- Expiry date
- Option to save to Apple or Google Wallet
- Share button

---

## 3. Lead Capture

### Form Builder
Configurable from the dashboard per wheel:

| Field Type | Description |
|---|---|
| `email` | Email address (always recommended) |
| `text` | Generic text input |
| `tel` | Phone number with country picker |
| `checkbox` | Yes/no checkbox (e.g. marketing opt-in) |

### GDPR Compliance
- Optional GDPR consent checkbox per wheel
- Consent flag stored with each spin session
- Privacy Policy and Terms of Service link fields
- Audit trail of all consent captures

### Lead Data Stored
- Email, name, phone, all custom fields
- GDPR consent value
- Wheel name, prize won, coupon code
- Spin timestamp and IP address

### Lead Export
Export leads to CSV from `/dashboard/leads` with filters:
- Date range
- Wheel filter
- Winner/all filter

---

## 4. Wheel Customization

### Theme System
- **Color Palette**: Primary color, accent, background, text color, segment text
- **Fonts**: Google Fonts integration, font weight/size controls
- **Backgrounds**: Solid color, gradient (up to 3 stops), custom image upload
- **Overlay**: Custom wheel face image (PNG with transparency)
- **Stand**: Optional decorative stand image below wheel

### Preset Themes
Built-in theme presets:
- Classic (black/gold)
- Luxury Gold
- Ocean Blue
- Neon Party
- Minimal White
- Forest Green
- Sunset Orange
- Valentine Red

### Segment Customization
Per-segment options:
- Label text
- Background color
- Text color
- Font size scale
- Label position offsets (X/Y in pixels)
- Label rotation angle
- Icon image URL
- Icon position (outer / inner / overlay)
- Relative offset (0–1 scale for responsive adjustment)

---

## 5. Trigger & Frequency Rules

### Display Triggers (when to show the wheel)

| Trigger | Description |
|---|---|
| Immediate | Show on page load |
| Time on page | Show after N seconds |
| Scroll depth | Show after scrolling N% down the page |
| Exit intent | Show when cursor moves toward browser chrome |

### Frequency Rules (how often to show per visitor)

| Rule | Description |
|---|---|
| Once per session | Show once per browser session |
| Once per day | Show once per 24 hours |
| Once per X days | Configurable cooldown period |
| Always | Show every page load (kiosk mode) |

### Geo Restrictions
- Allow list: Only show in specific countries
- Block list: Never show in specific countries
- Uses IP geolocation

---

## 6. Integrations

### CRM / Email Marketing

| Integration | What Gets Synced |
|---|---|
| Mailchimp | Email, first name, last name → list subscriber |
| Klaviyo | Email, event `Wheel Spin`, event properties |
| HubSpot | Contact: email, name, phone, custom properties |
| Salesforce | Lead object: email, name, phone, source |

Sync happens non-blocking (after spin response is sent to player).

### Spreadsheets & Automation

| Integration | What Happens |
|---|---|
| Google Sheets | New row appended per spin/win |
| Zapier | POST webhook trigger with full lead payload |
| Custom Webhook | HMAC-signed POST to any HTTPS endpoint |

### E-commerce

**Shopify Integration:**
- Connects to a Shopify store via API key
- When a player wins a coupon-type prize, system auto-creates a discount code in Shopify Price Rules
- Code is unique per winner, linked to specific products or collections
- Coupon code returned to player immediately

### Messaging

| Channel | When Triggered |
|---|---|
| WhatsApp (Twilio) | On win — sends prize code via WhatsApp |
| Telegram | On win — sends prize via Telegram bot |
| Push Notifications | Scheduled reminders, re-engagement campaigns |

---

## 7. Analytics & Reporting

### Dashboard Summary
- Total spins (all time + this month)
- Total winners
- Conversion rate (winners / total spins)
- Current month spin usage vs plan limit
- Sparkline trends for last 7/14/30 days

### Per-Wheel Analytics
- Daily spin and winner counts
- Per-segment win distribution
- Lead conversion funnel (views → form submit → spin → win)
- Time-of-day spin heatmap

### Leaderboard
- Top winners ranked by wins or points
- Configurable time window (daily, weekly, all-time)
- Publicly embeddable leaderboard widget

### Export
- Full lead CSV export with all form fields
- Analytics data export
- Date range filtering

---

## 8. Kiosk Mode

Enable via wheel config. In kiosk mode:
- No frequency caps (each spin session is independent)
- Auto-reset after result display (configurable delay)
- Ideal for trade shows, retail locations, in-store tablets
- Optional PIN to access settings from kiosk display

---

## 9. A/B Testing

Create variants of a wheel with different configurations:
- Different themes, colors, or text
- Different prize distributions
- Different form fields
- Configurable traffic split (e.g. 50/50)

System assigns visitors to variants randomly. Dashboard shows:
- Impressions per variant
- Conversions per variant
- Statistical comparison

---

## 10. Digital Wallet Passes

Winners can save their prize to:

**Apple Wallet:**
- Generates `.pkpass` file via `passkit-generator`
- Includes prize name, coupon code, expiry, barcode
- Downloadable from the result screen

**Google Wallet:**
- Generates a JWT-signed "Save to Google Wallet" link
- Opens Google Wallet pass creation in mobile browser
- Same prize data as Apple pass

---

## 11. Web Push Notifications

- Players can opt-in to push notifications during the spin flow
- Browser subscription stored with the client's account
- Dashboard allows sending manual push campaigns:
  - Title, body, target URL, icon
- Scheduled reminder campaigns via Vercel cron (10am daily)
- Delivery logs and stats available in dashboard

---

## 12. Embeddable Widget

### Embed Modes

| Mode | Description |
|---|---|
| Inline | Renders directly in a page container |
| Popup | Appears as a centered modal overlay |
| Floating button | Small floating button, expands to modal on click |

### Integration

```html
<!-- Add to your website -->
<script src="https://app.example.com/widget.js" 
        data-token="YOUR_EMBED_TOKEN"
        data-mode="popup">
</script>
```

### Widget Script Features
- Shadow DOM isolation (prevents CSS conflicts with host page)
- PostMessage API for resize/close communication
- Respects trigger rules (time-on-page, scroll, exit-intent) from the site context
- Works on any website — no framework dependency
- Mobile responsive

---

## 13. Referral System

- Unique referral links per user/client
- Click tracking on referral link visits
- Credit/bonus system for successful referrals
- Dashboard shows referral stats

---

## 14. Audit Log

Every dashboard action is logged:
- Who did it (user ID + name)
- What they did (action type)
- What resource was affected (wheel, prize, segment, etc.)
- Before/after changes (diff)
- When (timestamp)
- From where (IP address)

Accessible from `/dashboard/audit`. Filterable by date, user, action type.
