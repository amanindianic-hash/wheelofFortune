// SpinPlatform Service Worker v1
const CACHE = 'spinplatform-v1';
const STATIC = ['/login', '/icon-192.png', '/icon-512.png'];

// Install — pre-cache shell
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC)).then(() => self.skipWaiting())
  );
});

// Activate — clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch — network-first for API, cache-first for static assets
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Skip service worker for critical API endpoints (widget + auth)
  const criticalApiPaths = [
    '/api/spin/session', '/api/spin/execute', '/api/spin/streak', '/api/spin/game-type',
    '/api/auth/me', '/api/auth/login', '/api/auth/logout', '/api/auth/refresh'
  ];
  if (criticalApiPaths.some(path => url.pathname === path)) {
    // Let browser handle the request directly without service worker interception
    e.respondWith(fetch(e.request));
    return;
  }

  if (url.pathname.startsWith('/api/')) {
    // Network-first for other API routes
    e.respondWith(
      fetch(e.request).catch(() => new Response(JSON.stringify({ error: { code: 'OFFLINE', message: 'You are offline.' } }), {
        status: 503, headers: { 'Content-Type': 'application/json' }
      }))
    );
  } else {
    // Cache-first for everything else
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request).then(resp => {
        if (resp.ok && e.request.method === 'GET') {
          const cloned = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, cloned));
        }
        return resp;
      }))
    );
  }
});

// Push notifications
self.addEventListener('push', e => {
  let data = { title: 'SpinPlatform', body: 'You have a new spin waiting!', url: '/', token: null };
  try { data = { ...data, ...e.data.json() }; } catch { /* ignore */ }

  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'spinplatform-push',
      renotify: true,
      data: { url: data.token ? `/play/${data.token}` : (data.url || '/') },
      actions: [
        { action: 'spin', title: '🎡 Spin Now' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    })
  );
});

// Notification click
self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'dismiss') return;
  const url = e.notification.data?.url || '/';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const existing = list.find(c => c.url.includes(url));
      if (existing) return existing.focus();
      return clients.openWindow(url);
    })
  );
});
