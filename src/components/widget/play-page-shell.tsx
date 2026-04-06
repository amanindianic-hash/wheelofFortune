'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import QRCode from 'qrcode';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

const GAME_ICONS: Record<string, string> = {
  wheel: '🎡',
  scratch_card: '🎴',
  slot_machine: '🎰',
};

interface PlayPageShellProps {
  wheelName: string;
  gameType: string;
  primaryColor: string;
  playUrl: string;
  children: React.ReactNode;
}

export function PlayPageShell({ wheelName, gameType, primaryColor, playUrl, children }: PlayPageShellProps) {
  const [showShare, setShowShare] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushBannerDismissed, setPushBannerDismissed] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);

  // Generate QR on mount
  useEffect(() => {
    QRCode.toDataURL(playUrl, {
      width: 240,
      margin: 2,
      color: { dark: '#1a1a2e', light: '#ffffff' },
    }).then(setQrDataUrl).catch(() => {});
  }, [playUrl]);

  // Check push support + subscription state
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator) || !VAPID_PUBLIC_KEY) return;
    setPushSupported(true);
    const dismissed = localStorage.getItem('wf_push_dismissed') === '1';
    if (dismissed) setPushBannerDismissed(true);
    navigator.serviceWorker.ready.then((reg) =>
      reg.pushManager.getSubscription().then((sub) => setPushSubscribed(!!sub))
    ).catch(() => {});
  }, []);

  async function subscribePush() {
    if (!VAPID_PUBLIC_KEY) {
      toast.error('Push notifications are not configured.');
      return;
    }
    setPushLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        toast.error('Notification permission denied');
        return;
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
      });
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });
      setPushSubscribed(true);
      setPushBannerDismissed(true);
      toast.success('You\'ll be notified about new prizes! 🎉');
    } catch {
      toast.error('Failed to enable notifications');
    } finally {
      setPushLoading(false);
    }
  }

  function dismissPushBanner() {
    localStorage.setItem('wf_push_dismissed', '1');
    setPushBannerDismissed(true);
  }

  async function copyLink() {
    await navigator.clipboard.writeText(playUrl);
    toast.success('Link copied!');
  }

  async function nativeShare() {
    if (navigator.share) {
      await navigator.share({ title: wheelName, url: playUrl });
    } else {
      copyLink();
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: `linear-gradient(135deg, ${primaryColor}18 0%, #f5f3ff 100%)` }}>
      {/* Header */}
      <header
        className="sticky top-0 z-40 backdrop-blur-md border-b border-white/20"
        style={{ background: `${primaryColor}ee` }}
      >
        <div className="max-w-2xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{GAME_ICONS[gameType] ?? '🎡'}</span>
            <div>
              <h1 className="text-white font-bold text-base leading-tight">{wheelName}</h1>
              <p className="text-white/70 text-xs capitalize">{gameType.replace('_', ' ')}</p>
            </div>
          </div>
          <button
            onClick={() => setShowShare(true)}
            className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-sm font-medium px-3 py-1.5 rounded-full transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share
          </button>
        </div>
      </header>

      {/* Game */}
      <main className="flex-1">
        {children}
      </main>

      {/* Push notification banner */}
      {pushSupported && !pushSubscribed && !pushBannerDismissed && (
        <div className="mx-4 mb-4 rounded-xl border bg-white shadow-md p-4 flex items-start gap-3">
          <span className="text-2xl shrink-0">🔔</span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-gray-800">Get notified about new prizes</p>
            <p className="text-xs text-gray-500 mt-0.5">Enable push notifications so you never miss a spin opportunity.</p>
            <div className="flex gap-2 mt-2.5">
              <button
                onClick={subscribePush}
                disabled={pushLoading}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: primaryColor }}
              >
                {pushLoading ? 'Enabling…' : 'Enable Notifications'}
              </button>
              <button
                onClick={dismissPushBanner}
                className="text-xs font-medium px-3 py-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-gray-400">
        Powered by <span className="font-semibold" style={{ color: primaryColor }}>SpinPlatform</span>
      </footer>

      {/* Share Modal */}
      {showShare && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowShare(false)}>
          <div
            className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Share this wheel</h2>
              <button onClick={() => setShowShare(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center gap-3">
              {qrDataUrl ? (
                <>
                  <img src={qrDataUrl} alt="QR Code" className="w-48 h-48 rounded-xl border-4" style={{ borderColor: primaryColor + '40' }} />
                  <p className="text-xs text-gray-500 text-center">Scan to open on any device</p>
                  <a
                    href={qrDataUrl}
                    download={`${wheelName.replace(/\s+/g, '-').toLowerCase()}-qr.png`}
                    className="text-xs font-medium underline"
                    style={{ color: primaryColor }}
                  >
                    ⬇ Download QR Image
                  </a>
                </>
              ) : (
                <div className="w-48 h-48 rounded-xl bg-gray-100 animate-pulse" />
              )}
            </div>

            {/* URL row */}
            <div className="flex gap-2">
              <input
                readOnly
                value={playUrl}
                className="flex-1 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 truncate"
              />
              <button
                onClick={copyLink}
                className="shrink-0 text-sm font-semibold px-3 py-2 rounded-lg text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: primaryColor }}
              >
                Copy
              </button>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={nativeShare}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-medium transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                style={{ borderColor: primaryColor, color: primaryColor }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share
              </button>
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`🎡 ${wheelName} — Try your luck! ${playUrl}`)}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#25D366' }}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.553 4.116 1.522 5.845L.525 23.06l5.348-.99A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.007-1.372l-.359-.214-3.722.69.7-3.63-.235-.374A9.818 9.818 0 0112 2.182c5.42 0 9.818 4.398 9.818 9.818S17.42 21.818 12 21.818z"/>
                </svg>
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
