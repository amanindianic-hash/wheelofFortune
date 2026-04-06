/**
 * SpinPlatform Embed Script v2
 *
 * Usage:
 *   <div data-spin-wheel data-token="YOUR_TOKEN"></div>
 *   <script src="https://yourdomain.com/widget.js" async></script>
 *
 * Attributes:
 *   data-token      (required) — wheel embed token
 *   data-mode       inline | popup | floating   (default: inline)
 *   data-width      CSS width  (default: 100%)        [inline only]
 *   data-height     CSS height (default: 620px)       [inline only]
 *   data-trigger    auto | click | scroll:{depth%} | exit  (default: auto) [popup/floating only]
 *   data-z-index    z-index for overlay  (default: 999999)
 */
(function () {
  'use strict';

  // ── 1. Determine base URL from script src ──────────────────────────────────
  function getBaseUrl() {
    var scripts = document.querySelectorAll('script[src]');
    for (var i = 0; i < scripts.length; i++) {
      var src = scripts[i].getAttribute('src') || '';
      if (src.indexOf('widget.js') !== -1) {
        try {
          var u = new URL(src, window.location.href);
          return u.origin;
        } catch (_) {}
      }
    }
    // Fallback: same origin as current page
    return window.location.origin;
  }

  var BASE_URL = getBaseUrl();

  // ── 2. Iframe factory ──────────────────────────────────────────────────────
  function makeIframe(token) {
    var iframe = document.createElement('iframe');
    iframe.src = BASE_URL + '/widget/' + encodeURIComponent(token);
    iframe.setAttribute('allow', 'clipboard-write');
    iframe.setAttribute('scrolling', 'no');
    iframe.setAttribute('loading', 'lazy');
    iframe.setAttribute('title', 'Spin to Win');
    iframe.setAttribute('frameborder', '0');
    iframe.style.border = 'none';
    iframe.style.display = 'block';
    return iframe;
  }

  // ── 3. Listen for resize/close messages from widget ───────────────────────
  window.addEventListener('message', function (e) {
    if (!e.data || typeof e.data !== 'object') return;
    if (e.data.source !== 'spinplatform-widget') return;

    // Dynamic height resize (inline mode)
    if (e.data.type === 'resize' && e.data.token) {
      var frames = document.querySelectorAll('iframe[data-wf-token="' + e.data.token + '"]');
      frames.forEach(function (f) {
        if (e.data.height) f.style.height = e.data.height + 'px';
      });
    }

    // Widget requested close (popup mode)
    if (e.data.type === 'close' && e.data.token) {
      var overlays = document.querySelectorAll('[data-wf-overlay="' + e.data.token + '"]');
      overlays.forEach(function (o) { o.remove(); });
    }
  });

  // ── 4. Build inline widget ─────────────────────────────────────────────────
  function buildInline(el, token, width, height) {
    var host = document.createElement('div');
    host.style.display = 'block';
    host.style.width = width;

    var shadow = host.attachShadow({ mode: 'open' });

    // Scoped reset inside shadow — prevents host-page styles leaking in
    var style = document.createElement('style');
    style.textContent = ':host { all: initial; display: block; }';
    shadow.appendChild(style);

    var iframe = makeIframe(token);
    iframe.setAttribute('data-wf-token', token);
    iframe.style.width = '100%';
    iframe.style.height = height;
    iframe.style.borderRadius = '12px';
    shadow.appendChild(iframe);

    el.parentNode.replaceChild(host, el);
  }

  // ── 5. Build popup overlay ─────────────────────────────────────────────────
  function buildOverlay(token, zIndex) {
    // Mount on document body using Shadow DOM so overlay styles are isolated
    var host = document.createElement('div');
    host.setAttribute('data-wf-overlay', token);
    document.body.appendChild(host);

    var shadow = host.attachShadow({ mode: 'open' });

    var style = document.createElement('style');
    style.textContent = [
      ':host { all: initial; }',
      '.backdrop {',
      '  position: fixed; inset: 0;',
      '  z-index: ' + zIndex + ';',
      '  background: rgba(0,0,0,0.55);',
      '  backdrop-filter: blur(6px);',
      '  display: flex; align-items: center; justify-content: center;',
      '  padding: 16px;',
      '}',
      '.card {',
      '  position: relative;',
      '  width: min(96vw, 480px);',
      '  height: min(92vh, 700px);',
      '  border-radius: 20px;',
      '  overflow: hidden;',
      '  box-shadow: 0 32px 80px rgba(0,0,0,0.45);',
      '}',
      '.close {',
      '  position: absolute; top: 10px; right: 10px; z-index: 1;',
      '  width: 30px; height: 30px;',
      '  background: rgba(0,0,0,0.35); color: #fff;',
      '  border: none; border-radius: 50%;',
      '  font-size: 15px; line-height: 1; cursor: pointer;',
      '  display: flex; align-items: center; justify-content: center;',
      '  transition: background 0.15s;',
      '}',
      '.close:hover { background: rgba(0,0,0,0.55); }',
    ].join('\n');
    shadow.appendChild(style);

    var backdrop = document.createElement('div');
    backdrop.className = 'backdrop';

    // Close on backdrop click
    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) host.remove();
    });

    var card = document.createElement('div');
    card.className = 'card';

    var closeBtn = document.createElement('button');
    closeBtn.className = 'close';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('click', function () { host.remove(); });

    var iframe = makeIframe(token);
    iframe.setAttribute('data-wf-token', token);
    iframe.style.width = '100%';
    iframe.style.height = '100%';

    card.appendChild(iframe);
    card.appendChild(closeBtn);
    backdrop.appendChild(card);
    shadow.appendChild(backdrop);

    return host;
  }

  // ── 6. Trigger logic for popup/floating ───────────────────────────────────
  function setupTrigger(trigger, token, zIndex, el) {
    if (trigger === 'auto' || !trigger) {
      buildOverlay(token, zIndex);
      return;
    }
    if (trigger === 'click') {
      el.style.cursor = 'pointer';
      el.addEventListener('click', function () { buildOverlay(token, zIndex); });
      return;
    }
    if (trigger === 'exit') {
      var fired = false;
      document.addEventListener('mouseleave', function (e) {
        if (!fired && e.clientY <= 5) {
          fired = true;
          buildOverlay(token, zIndex);
        }
      });
      return;
    }
    if (trigger.indexOf('scroll:') === 0) {
      var depth = parseInt(trigger.split(':')[1], 10) || 50;
      var scrollFired = false;
      window.addEventListener('scroll', function () {
        if (scrollFired) return;
        var scrolled = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
        if (scrolled >= depth) {
          scrollFired = true;
          buildOverlay(token, zIndex);
        }
      }, { passive: true });
      return;
    }
    if (trigger === 'time:') {
      var delay = parseInt(trigger.split(':')[1], 10) || 5;
      setTimeout(function () { buildOverlay(token, zIndex); }, delay * 1000);
      return;
    }
    // Fallback
    buildOverlay(token, zIndex);
  }

  // ── 7. Bootstrap all widgets on the page ──────────────────────────────────
  function init() {
    var els = document.querySelectorAll('[data-spin-wheel]');
    for (var i = 0; i < els.length; i++) {
      var el      = els[i];
      var token   = el.getAttribute('data-token');
      if (!token) continue;

      var mode    = el.getAttribute('data-mode')    || 'inline';
      var width   = el.getAttribute('data-width')   || '100%';
      var height  = el.getAttribute('data-height')  || '620px';
      var trigger = el.getAttribute('data-trigger') || 'auto';
      var zIndex  = parseInt(el.getAttribute('data-z-index') || '999999', 10);

      if (mode === 'inline') {
        buildInline(el, token, width, height);
      } else {
        // popup / floating — replace el with an invisible marker, open overlay
        var marker = document.createElement('span');
        marker.setAttribute('data-wf-marker', token);
        el.parentNode.replaceChild(marker, el);
        setupTrigger(trigger, token, zIndex, marker);
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
