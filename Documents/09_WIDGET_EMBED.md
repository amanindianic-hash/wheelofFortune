# Widget Embed Guide

**Last Updated:** 2026-04-22

---

## Overview

The Wheel of Fortune widget can be embedded on any website using a single `<script>` tag. The widget is served from the platform's domain inside an isolated iframe with Shadow DOM, preventing CSS conflicts with the host page.

---

## Quick Start

```html
<script 
  src="https://your-app-domain.com/widget.js"
  data-token="YOUR_WHEEL_EMBED_TOKEN"
  data-mode="popup">
</script>
```

Replace `YOUR_WHEEL_EMBED_TOKEN` with the token from your wheel's Embed tab in the dashboard.

---

## Embed Modes

### `popup` (default)
Renders as a centered modal overlay when triggered.

```html
<script src="https://your-domain.com/widget.js"
        data-token="abc123"
        data-mode="popup">
</script>
```

### `inline`
Renders directly in a specific container element on your page.

```html
<div id="wheel-container" style="width:500px;height:600px;"></div>
<script src="https://your-domain.com/widget.js"
        data-token="abc123"
        data-mode="inline"
        data-target="#wheel-container">
</script>
```

### `float`
Shows a small floating button at the edge of the screen. Expands to a popup when clicked.

```html
<script src="https://your-domain.com/widget.js"
        data-token="abc123"
        data-mode="float"
        data-position="bottom-right">
</script>
```

**Float positions:** `bottom-right` (default), `bottom-left`, `top-right`, `top-left`

---

## Configuration Attributes

| Attribute | Default | Description |
|---|---|---|
| `data-token` | — | **Required.** Your wheel's embed token from the dashboard |
| `data-mode` | `popup` | Display mode: `popup`, `inline`, `float` |
| `data-target` | — | CSS selector for inline container (required when `mode=inline`) |
| `data-position` | `bottom-right` | Float button position |
| `data-trigger` | `immediate` | When to show: `immediate`, `delay`, `scroll`, `exit` |
| `data-delay` | `3000` | Milliseconds to wait (when `trigger=delay`) |
| `data-scroll` | `50` | Scroll percentage to trigger (when `trigger=scroll`) |

---

## Trigger Overrides

Trigger settings from the dashboard are applied by default. You can override them per-embed with data attributes:

```html
<!-- Show after 5 seconds -->
<script src="..." data-token="abc" data-trigger="delay" data-delay="5000"></script>

<!-- Show after scrolling 60% down the page -->
<script src="..." data-token="abc" data-trigger="scroll" data-scroll="60"></script>

<!-- Show on exit intent -->
<script src="..." data-token="abc" data-trigger="exit"></script>
```

---

## JavaScript API

The widget script exposes a global `WheelWidget` object for programmatic control:

```javascript
// Open the widget manually
WheelWidget.open();

// Close the widget
WheelWidget.close();

// Check if widget is open
WheelWidget.isOpen();

// Reset the widget (clears session, returns to form)
WheelWidget.reset();
```

### Open on button click

```html
<button onclick="WheelWidget.open()">Spin to Win!</button>
<script src="..." data-token="abc" data-trigger="manual"></script>
```

---

## Event Listeners

Listen for widget events via `window.addEventListener`:

```javascript
window.addEventListener('wheel:opened', function() {
  console.log('Widget opened');
});

window.addEventListener('wheel:closed', function() {
  console.log('Widget closed');
});

window.addEventListener('wheel:spin', function(e) {
  console.log('Player spun:', e.detail);
  // e.detail = { session_id, wheel_name }
});

window.addEventListener('wheel:win', function(e) {
  console.log('Player won:', e.detail);
  // e.detail = { prize_name, coupon_code, type }
});

window.addEventListener('wheel:lead', function(e) {
  console.log('Lead captured:', e.detail);
  // e.detail = { email, name, phone, form_data }
});
```

---

## PostMessage API

The widget iframe communicates with the parent page via `postMessage`. Useful for custom iframe embeds:

```javascript
window.addEventListener('message', function(event) {
  if (event.origin !== 'https://your-app-domain.com') return;
  
  switch (event.data.type) {
    case 'WHEEL_RESIZE':
      // event.data.height — update your iframe height
      break;
    case 'WHEEL_WIN':
      // event.data.prize — prize details
      break;
    case 'WHEEL_CLOSE':
      // player dismissed the widget
      break;
  }
});
```

---

## Direct iframe Embed

For maximum control, embed the iframe directly:

```html
<iframe 
  src="https://your-app-domain.com/widget/YOUR_EMBED_TOKEN"
  width="500" 
  height="600"
  frameborder="0"
  allow="clipboard-write"
  style="border: none; border-radius: 12px;">
</iframe>
```

Or use the full-page play URL for a dedicated landing page:

```
https://your-app-domain.com/play/YOUR_EMBED_TOKEN
```

---

## Shadow DOM Isolation

The widget script uses Shadow DOM to prevent CSS from the host page from affecting widget styles:

```
Host page DOM
└── <div id="wheel-widget-root">
    └── Shadow Root (closed)
        └── <iframe src="/widget/token" />
```

This means:
- Host page CSS cannot reach inside the widget
- Widget CSS cannot leak to the host page
- No class name conflicts

---

## Content Security Policy (CSP)

If your site uses a strict CSP, add these directives:

```
frame-src https://your-app-domain.com;
script-src https://your-app-domain.com;
```

---

## Frequency Caps in Embeds

Frequency caps (once per day, once per session, etc.) are enforced via:
1. Browser `localStorage` (client-side gate — fast, prevents unnecessary iframe loads)
2. Server-side fingerprint check (prevents bypassing by clearing localStorage)

If a player has already seen the wheel within the cap window, the widget script will not load the iframe.

---

## Shopify Integration

For Shopify stores, a specific integration allows auto-creating discount codes. See the Integrations Guide for setup. The widget embed code for Shopify is the same standard snippet.

---

## Troubleshooting

| Issue | Fix |
|---|---|
| Widget not appearing | Check browser console for JS errors. Verify `data-token` is correct. |
| Widget appears but doesn't spin | Check API connectivity. Open DevTools Network tab and look for `/api/spin/*` errors. |
| Widget hidden behind other elements | The widget uses `z-index: 999999`. If something is higher, override via the host page CSS on `#wheel-widget-root`. |
| CSP blocking widget | Add the widget domain to `frame-src` and `script-src` in your CSP header. |
| Frequency cap not resetting | Clear `localStorage` key `wheel_shown_{token}` in DevTools. |
| Mobile: widget too large | The widget is responsive by default. Check if a parent container has `overflow: hidden`. |
