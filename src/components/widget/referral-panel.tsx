'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface ReferralPanelProps {
  embedToken: string;
  sessionId: string;
  refCode: string;       // first 12 chars of player's fingerprint hash
  playUrl: string;
  primaryColor: string;
  onClaimSpin: () => void;  // callback when player redeems a free spin
}

const LS_KEY = (embedToken: string, refCode: string) => `wf_ref_${embedToken}_${refCode}`;

export function ReferralPanel({
  embedToken, sessionId, refCode, playUrl, primaryColor, onClaimSpin,
}: ReferralPanelProps) {
  const [creditsEarned, setCreditsEarned] = useState(0);
  const [creditsUsed,   setCreditsUsed]   = useState(0);
  const [copied,        setCopied]         = useState(false);

  const refLink = `${playUrl}?ref=${refCode}`;

  // Load credits_used from localStorage
  useEffect(() => {
    const stored = parseInt(localStorage.getItem(LS_KEY(embedToken, refCode)) ?? '0');
    setCreditsUsed(stored);
  }, [embedToken, refCode]);

  // Fetch credits earned from server
  useEffect(() => {
    fetch(`/api/referral/credits?embed_token=${encodeURIComponent(embedToken)}&ref_code=${encodeURIComponent(refCode)}`)
      .then(r => r.json())
      .then(d => setCreditsEarned(d.credits_earned ?? 0))
      .catch(() => {});
  }, [embedToken, refCode]);

  const creditsAvailable = Math.max(0, creditsEarned - creditsUsed);

  function copyLink() {
    navigator.clipboard.writeText(refLink);
    setCopied(true);
    toast.success('Referral link copied!');
    setTimeout(() => setCopied(false), 2000);
  }

  function shareWhatsApp() {
    const text = `🎡 Try this spin wheel and win prizes! ${refLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  }

  function claimSpin() {
    const next = creditsUsed + 1;
    localStorage.setItem(LS_KEY(embedToken, refCode), String(next));
    setCreditsUsed(next);
    toast.success('Free spin unlocked! 🎉');
    onClaimSpin();
  }

  return (
    <div
      className="w-full max-w-sm mx-auto rounded-2xl overflow-hidden border"
      style={{ borderColor: primaryColor + '30' }}
    >
      {/* Header */}
      <div
        className="px-5 py-3 flex items-center justify-between"
        style={{ background: `linear-gradient(135deg, ${primaryColor}18, ${primaryColor}08)` }}
      >
        <div>
          <p className="text-sm font-bold" style={{ color: primaryColor }}>🔗 Share &amp; Earn Spins</p>
          <p className="text-xs text-gray-500">Invite friends — each spin they do earns you +1 free spin</p>
        </div>
        {creditsAvailable > 0 && (
          <span
            className="text-xs font-bold px-2 py-1 rounded-full text-white"
            style={{ backgroundColor: primaryColor }}
          >
            +{creditsAvailable} ready
          </span>
        )}
      </div>

      <div className="px-5 py-4 space-y-3 bg-white dark:bg-gray-900">
        {/* Credit counter */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Friends spun via your link</span>
          <span className="font-bold tabular-nums" style={{ color: primaryColor }}>
            {creditsEarned} 🎉
          </span>
        </div>

        {/* Referral link row */}
        <div className="flex gap-2">
          <input
            readOnly
            value={refLink}
            className="flex-1 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 truncate font-mono"
          />
          <button
            onClick={copyLink}
            className="shrink-0 text-xs font-semibold px-3 py-2 rounded-lg text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: primaryColor }}
          >
            {copied ? '✓' : 'Copy'}
          </button>
        </div>

        {/* Share buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={shareWhatsApp}
            className="py-2 rounded-xl text-xs font-medium text-white text-center"
            style={{ backgroundColor: '#25D366' }}
          >
            💬 WhatsApp
          </button>
          <button
            onClick={copyLink}
            className="py-2 rounded-xl text-xs font-medium border text-center transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
            style={{ borderColor: primaryColor + '60', color: primaryColor }}
          >
            🔗 Copy Link
          </button>
        </div>

        {/* Claim free spin */}
        {creditsAvailable > 0 && (
          <button
            onClick={claimSpin}
            className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-transform active:scale-95"
            style={{ backgroundColor: primaryColor }}
          >
            🎁 Claim Free Spin ({creditsAvailable} available)
          </button>
        )}
      </div>
    </div>
  );
}
