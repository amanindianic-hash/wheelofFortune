'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import QRCode from 'qrcode';

export interface WinResult {
  is_winner: boolean;
  prize?: {
    display_title: string;
    display_description?: string | null;
    type: string;
    custom_message_html?: string | null;
    redirect_url?: string | null;
  } | null;
  coupon_code?: string | null;
  consolation_message?: string | null;
}

interface WinQRCardProps {
  result: WinResult;
  primaryColor?: string;
  shopifyStoreUrl?: string | null;
  spinResultId?: string | null;
  streak?: number;
  onPlayAgain?: () => void;
}

type QRTab = 'prize' | 'whatsapp';

/** Builds the prize QR payload (coupon_code → redirect_url → display_title) */
function buildPrizePayload(result: WinResult): string {
  if (result.coupon_code) return result.coupon_code;
  if (result.prize?.redirect_url) return result.prize.redirect_url;
  if (result.prize?.display_title) return result.prize.display_title;
  return 'Prize won!';
}

/** Builds the WhatsApp deep-link so scanning opens a pre-filled WhatsApp chat */
function buildWhatsAppUrl(result: WinResult): string {
  const prizeName = result.prize?.display_title ?? 'a prize';
  let text: string;
  if (result.coupon_code) {
    text = `🎉 I just won! Use code *${result.coupon_code}* to claim *${prizeName}*. Hurry — limited time!`;
  } else if (result.prize?.redirect_url) {
    text = `🎉 I just won *${prizeName}*! Claim here: ${result.prize.redirect_url}`;
  } else {
    text = `🎉 I just won *${prizeName}*! Try your luck too 🤞`;
  }
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

async function generateQR(payload: string, dark: string): Promise<string> {
  return QRCode.toDataURL(payload, {
    width: 200,
    margin: 2,
    color: { dark, light: '#ffffff' },
    errorCorrectionLevel: 'M',
  });
}

export function WinQRCard({ result, primaryColor = '#7C3AED', shopifyStoreUrl, spinResultId, streak, onPlayAgain }: WinQRCardProps) {
  const [prizeQr, setPrizeQr]       = useState<string | null>(null);
  const [waQr, setWaQr]             = useState<string | null>(null);
  const [activeTab, setActiveTab]   = useState<QRTab>('prize');
  const [googleWalletUrl, setGoogleWalletUrl] = useState<string | null>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (!result.is_winner) return;
    generateQR(buildPrizePayload(result), '#1a1a2e').then(setPrizeQr).catch(() => {});
    generateQR(buildWhatsAppUrl(result), '#075E54').then(setWaQr).catch(() => {});
    // Detect iOS for Apple Wallet button
    if (typeof navigator !== 'undefined') {
      setIsIOS(/iphone|ipad|ipod/i.test(navigator.userAgent));
    }
    // Preload Google Wallet URL
    if (spinResultId) {
      fetch(`/api/wallet/google?spin_result_id=${spinResultId}`)
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d?.data?.url) setGoogleWalletUrl(d.data.url); })
        .catch(() => {});
    }
  }, [result, spinResultId]);

  function copyCode() {
    if (result.coupon_code) {
      navigator.clipboard.writeText(result.coupon_code);
      toast.success('Code copied!');
    }
  }

  function downloadQR() {
    const url = activeTab === 'whatsapp' ? waQr : prizeQr;
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab}-qr-${Date.now()}.png`;
    a.click();
    toast.success('QR saved!');
  }

  function openWhatsApp() {
    window.open(buildWhatsAppUrl(result), '_blank');
  }

  if (!result.is_winner) {
    return (
      <div className="w-full max-w-sm mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 space-y-4 text-center">
        <p className="text-5xl">😢</p>
        <h2 className="text-2xl font-bold">Better luck next time!</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {result.consolation_message ?? "You didn't win this time. Try again soon!"}
        </p>
        {onPlayAgain && (
          <button
            onClick={onPlayAgain}
            className="w-full py-2.5 rounded-xl border-2 text-sm font-semibold transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
            style={{ borderColor: primaryColor, color: primaryColor }}
          >
            Try Again
          </button>
        )}
      </div>
    );
  }

  const activeQr = activeTab === 'whatsapp' ? waQr : prizeQr;

  return (
    <div className="w-full max-w-sm mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden">
      {/* Win banner */}
      <div className="py-5 px-6 text-center text-white" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)` }}>
        <p className="text-4xl mb-1">🎉</p>
        <h2 className="text-xl font-bold">You Won!</h2>
        <p className="text-sm opacity-90 mt-0.5">{result.prize?.display_title}</p>
        {streak != null && streak > 1 && (
          <p className="text-xs opacity-80 mt-1.5 font-semibold tracking-wide">🔥 {streak}-day win streak!</p>
        )}
      </div>

      <div className="p-6 space-y-5">
        {/* Description */}
        {result.prize?.display_description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">{result.prize.display_description}</p>
        )}

        {/* Coupon code */}
        {result.coupon_code && (
          <div className="rounded-xl border-2 border-dashed p-4 text-center" style={{ borderColor: primaryColor + '60' }}>
            <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider">Your Code</p>
            <p className="text-2xl font-bold font-mono tracking-widest" style={{ color: primaryColor }}>
              {result.coupon_code}
            </p>
            <button
              onClick={copyCode}
              className="mt-2 text-xs font-medium hover:underline"
              style={{ color: primaryColor }}
            >
              📋 Copy code
            </button>
          </div>
        )}

        {/* Custom message */}
        {result.prize?.type === 'message' && result.prize.custom_message_html && (
          <div
            className="text-sm text-center text-gray-600 dark:text-gray-300"
            dangerouslySetInnerHTML={{ __html: result.prize.custom_message_html }}
          />
        )}

        {/* QR tab switcher */}
        <div className="space-y-3">
          {/* Tab pills */}
          <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: primaryColor + '30' }}>
            <button
              onClick={() => setActiveTab('prize')}
              className="flex-1 py-2 text-xs font-semibold transition-colors"
              style={
                activeTab === 'prize'
                  ? { backgroundColor: primaryColor, color: '#fff' }
                  : { color: '#6b7280' }
              }
            >
              🏆 Prize QR
            </button>
            <button
              onClick={() => setActiveTab('whatsapp')}
              className="flex-1 py-2 text-xs font-semibold transition-colors"
              style={
                activeTab === 'whatsapp'
                  ? { backgroundColor: '#25D366', color: '#fff' }
                  : { color: '#6b7280' }
              }
            >
              💬 WhatsApp QR
            </button>
          </div>

          {/* QR display */}
          <div className="flex flex-col items-center gap-2">
            {activeQr ? (
              <img
                src={activeQr}
                alt={activeTab === 'whatsapp' ? 'WhatsApp QR' : 'Prize QR'}
                className="rounded-xl border-4"
                style={{
                  borderColor: activeTab === 'whatsapp' ? '#25D36630' : primaryColor + '30',
                  width: 160,
                  height: 160,
                }}
              />
            ) : (
              <div className="w-40 h-40 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
            )}
            <p className="text-[10px] text-gray-400 text-center">
              {activeTab === 'whatsapp'
                ? 'Scan to open WhatsApp with prize details'
                : result.coupon_code
                  ? 'Scan to save your code'
                  : 'Scan to claim your prize'}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2">
          {activeQr && (
            <button
              onClick={downloadQR}
              className="py-2.5 rounded-xl border text-sm font-medium text-center transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              ⬇ Save QR
            </button>
          )}
          <button
            onClick={openWhatsApp}
            className="py-2.5 rounded-xl text-sm font-medium text-white text-center"
            style={{ backgroundColor: '#25D366' }}
          >
            💬 Open WhatsApp
          </button>
          {result.prize?.type === 'url_redirect' && result.prize.redirect_url && (
            <button
              onClick={() => window.open(result.prize!.redirect_url!, '_blank')}
              className="py-2.5 rounded-xl text-sm font-medium text-white col-span-2"
              style={{ backgroundColor: primaryColor }}
            >
              Claim Prize →
            </button>
          )}
          {/* Shopify: auto-apply coupon code */}
          {result.prize?.type === 'coupon' && result.coupon_code && shopifyStoreUrl && (
            <a
              href={`${shopifyStoreUrl.replace(/\/$/, '')}/discount/${result.coupon_code}?redirect=/collections/all`}
              target="_blank"
              rel="noreferrer"
              className="py-2.5 rounded-xl text-sm font-medium text-white col-span-2 text-center block"
              style={{ backgroundColor: '#96BF48' }}
            >
              🛍 Shop Now — Code Auto-Applied
            </a>
          )}
          {/* Telegram share */}
          <a
            href={`https://t.me/share/url?url=${encodeURIComponent(buildPrizePayload(result))}&text=${encodeURIComponent(`🎉 I just won ${result.prize?.display_title ?? 'a prize'}!`)}`}
            target="_blank"
            rel="noreferrer"
            className="py-2.5 rounded-xl text-sm font-medium text-white text-center"
            style={{ backgroundColor: '#229ED9' }}
          >
            ✈️ Telegram
          </a>
        </div>

        {/* Wallet buttons */}
        {spinResultId && (isIOS || googleWalletUrl) && (
          <div className="flex gap-2">
            {isIOS && (
              <a
                href={`/api/wallet/apple?spin_result_id=${spinResultId}`}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium text-white text-center"
                style={{ backgroundColor: '#000000' }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                Apple Wallet
              </a>
            )}
            {!isIOS && googleWalletUrl && (
              <a
                href={googleWalletUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium text-white text-center"
                style={{ backgroundColor: '#1a73e8' }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.5 14h-9v-2h9v2zm0-4h-9V10h9v2z"/>
                </svg>
                Google Wallet
              </a>
            )}
          </div>
        )}

        {onPlayAgain && (
          <button
            onClick={onPlayAgain}
            className="w-full py-2 rounded-xl border text-sm font-medium text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Play Again
          </button>
        )}
      </div>
    </div>
  );
}
