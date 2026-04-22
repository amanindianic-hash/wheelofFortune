'use client';

import React from 'react';
import { 
  QrCode, Download, Camera, Share2, Monitor, Link, Code 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import type { Wheel } from '@/lib/types';

interface DistributionTabProps {
  wheel: Wheel;
  playPageUrl: string;
  qrSize: number;
  qrDataUrl: string | null;
  setQrSize: (size: number) => void;
  generateQR: (url: string, size: number) => void;
}

export function DistributionTab({
  wheel,
  playPageUrl,
  qrSize,
  qrDataUrl,
  setQrSize,
  generateQR
}: DistributionTabProps) {
  return (
    <div className="space-y-8">
      {/* Primary Link Engine */}
      <div className="glass-panel p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-violet-600/20 flex items-center justify-center text-violet-400">
            <Share2 className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Direct Access Protocol</h3>
            <p className="text-xs text-muted-foreground">A branded, full-screen environment for social media or direct customer engagement.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Input readOnly value={playPageUrl} className="bg-black/30 border-white/5 text-xs font-mono h-11 focus:ring-0" />
          <div className="flex gap-2">
            <Button variant="outline" className="h-11 px-4 border-white/10 bg-white/5 hover:bg-white/10 text-xs font-bold shrink-0" onClick={() => { navigator.clipboard.writeText(playPageUrl); toast.success('Link copied'); }}>
              Copy URI
            </Button>
            <Button 
              className="h-11 px-6 bg-violet-600 hover:bg-violet-500 text-white font-bold shrink-0 shadow-[0_0_20px_rgba(124,58,237,0.3)]" 
              onClick={() => window.open(`${playPageUrl}?_=${Date.now()}`, '_blank')}
              style={{ backgroundColor: wheel.branding.primary_color ?? '#7C3AED' }}
            >
              Initialize ↗
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <p className="text-[10px] font-black text-violet-400/60 uppercase tracking-[0.2em] shrink-0">Neural Distribution Channels</p>
            <div className="flex-1 h-px bg-white/5" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { name: 'WhatsApp', icon: '💬', color: '#25D366', url: `https://wa.me/?text=${encodeURIComponent(`🎡 ${wheel.name} — Spin to win! ${playPageUrl}`)}` },
              { name: 'Telegram', icon: '✈️', color: '#229ED9', url: `https://t.me/share/url?url=${encodeURIComponent(playPageUrl)}&text=${encodeURIComponent(`🎡 ${wheel.name} — Spin to win!`)}` },
              { name: 'E-Mail',    icon: '📧', color: '#EA4335', url: `mailto:?subject=${encodeURIComponent(`Spin to Win — ${wheel.name}`)}&body=${encodeURIComponent(`Try your luck! Click to spin: ${playPageUrl}`)}` },
              { name: 'SMS',       icon: '📱', color: '#34C759', url: `sms:?body=${encodeURIComponent(`🎡 Spin to win! ${playPageUrl}`)}` },
              { name: 'Facebook',  icon: '📘', color: '#1877F2', url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(playPageUrl)}` },
              { name: 'Instagram', icon: '📸', color: '#C13584', url: '#' },
            ].map((ch) => (
              <a key={ch.name} href={ch.url} target={ch.url !== '#' ? "_blank" : undefined} rel="noreferrer"
                className="flex flex-col items-center justify-center gap-2.5 p-4 rounded-2xl border border-white/5 hover:border-violet-500/40 hover:bg-violet-600/5 transition-all duration-300 group shadow-lg hover:shadow-violet-600/10">
                <span className="text-2xl group-hover:scale-125 transition-transform duration-500 filter drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]">{ch.icon}</span>
                <span className="text-[9px] font-black text-muted-foreground group-hover:text-white uppercase tracking-widest transition-colors">{ch.name}</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* QR Code */}
        <div className="glass-panel p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <QrCode className="h-4 w-4 text-violet-400" />
                Spatial Key (QR)
              </h3>
              <p className="text-xs text-muted-foreground">Physical access point for retail environments.</p>
            </div>
            <div className="flex gap-1 bg-black/30 p-1 rounded-lg">
              {[128, 256, 512].map(s => (
                <button key={s} onClick={() => setQrSize(s)}
                  className={`w-7 h-7 flex items-center justify-center text-[9px] font-bold rounded-md transition-all ${qrSize === s ? 'bg-violet-600 text-white shadow-lg' : 'text-muted-foreground hover:text-white hover:bg-white/5'}`}>
                  {s === 128 ? 'S' : s === 256 ? 'M' : 'L'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className="h-40 w-40 shrink-0 p-3 bg-white rounded-3xl shadow-[0_0_50px_rgba(255,255,255,0.15)] ring-1 ring-white/20 relative group/qr">
              {qrDataUrl && (
                <img src={qrDataUrl} alt="QR Code" className="w-full h-full object-contain relative z-10" />
              )}
              <div className="absolute inset-0 rounded-3xl bg-violet-600/20 blur-2xl opacity-0 group-hover/qr:opacity-100 transition-opacity duration-700" />
            </div>
            <div className="space-y-4 flex-1 text-center sm:text-left">
              <div className="flex flex-wrap justify-center sm:justify-start gap-3">
                {qrDataUrl && (
                  <a href={qrDataUrl} download={`${wheel.name}-qr.png`}
                    className="inline-flex items-center gap-2.5 px-6 py-2.5 rounded-2xl bg-violet-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-violet-500 transition-all shadow-[0_0_20px_rgba(124,58,237,0.3)]">
                    <Download className="w-4 h-4" />
                    Download PNX
                  </a>
                )}
                <Button variant="outline" size="sm" className="h-10 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/20" onClick={() => generateQR(playPageUrl, qrSize)}>
                  Regenerate
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground/60 leading-relaxed font-medium">
                High-fidelity vector source logic. Deployment format **L (512px)** is recommended.
              </p>
            </div>
          </div>
        </div>

        {/* Instagram Synthesis */}
        <div className="glass-panel p-6 space-y-6 flex flex-col justify-between border-pink-500/10 bg-pink-500/[0.01]">
          <div className="space-y-1">
            <h3 className="text-sm font-black text-white uppercase tracking-[0.05em] flex items-center gap-2">
              <Camera className="h-4 w-4 text-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.4)]" />
              Social Media Synthesis
            </h3>
            <p className="text-[10px] text-muted-foreground/60 font-medium leading-relaxed">Generate 1080×1080 high-fidelity layouts for Instagram stories.</p>
          </div>
          
          <div className="space-y-5">
            <div className="relative group/ig overflow-hidden rounded-2xl border border-white/5 bg-black/40 p-6 flex flex-col items-center justify-center gap-4">
               <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-transparent to-violet-500/10 opacity-50" />
               <div className="relative z-10 text-[10px] font-black text-white/40 uppercase tracking-[0.2em] italic">
                 Architecture Preview (1:1)
               </div>
               <div className="relative h-16 w-16 opacity-20 filter grayscale">
                 <QrCode className="w-full h-full text-white" />
               </div>
            </div>
            <Button
              variant="outline"
              className="w-full h-12 border-pink-500/20 bg-pink-500/5 hover:bg-pink-500 text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(236,72,153,0.15)] gap-3 rounded-2xl overflow-hidden relative group"
              onClick={async () => {
                if (!qrDataUrl) return;
                const canvas = document.createElement('canvas');
                canvas.width = 1080; canvas.height = 1080;
                const ctx = canvas.getContext('2d')!;
                const primary = wheel.branding.primary_color ?? '#7C3AED';
                const grad = ctx.createLinearGradient(0, 0, 1080, 1080);
                grad.addColorStop(0, primary + 'ee'); grad.addColorStop(1, primary + '88');
                ctx.fillStyle = grad; ctx.fillRect(0, 0, 1080, 1080);
                ctx.fillStyle = '#ffffff'; ctx.beginPath(); (ctx as any).roundRect(190, 190, 700, 700, 40); ctx.fill();
                const img = new Image(); img.src = qrDataUrl;
                await new Promise(r => { img.onload = r; });
                ctx.drawImage(img, 290, 240, 500, 500);
                ctx.fillStyle = primary; ctx.font = 'bold 52px system-ui, sans-serif'; ctx.textAlign = 'center';
                ctx.fillText(wheel.name, 540, 800);
                ctx.font = '36px system-ui, sans-serif'; ctx.fillStyle = '#6b7280'; ctx.fillText('Scan to Spin & Win! 🎡', 540, 860);
                const a = document.createElement('a'); a.href = canvas.toDataURL('image/png');
                a.download = `${wheel.name.replace(/\s+/g, '-').toLowerCase()}-instagram.png`; a.click();
                toast.success('Generated Post Frame');
              }}
              disabled={!qrDataUrl}
            >
              <Download className="w-4 h-4 group-hover:scale-110 transition-transform" />
              Finalize Instagram Asset
            </Button>
          </div>
        </div>
      </div>

      {/* Extra channels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-24">
        <div className="glass-panel p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-emerald-600/20 flex items-center justify-center text-emerald-400">
              <Monitor className="h-4 w-4" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-white uppercase tracking-widest">Kiosk Protocol</h4>
              <p className="text-[10px] text-muted-foreground">Optimized for in-store physical displays.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Input readOnly value={`${playPageUrl}?kiosk=1`} className="bg-black/30 border-white/5 text-[10px] font-mono h-9 focus:ring-0" />
            <Button size="sm" className="bg-emerald-600/80 hover:bg-emerald-600 text-[10px] font-bold h-9 px-4" onClick={() => window.open(`${playPageUrl}?kiosk=1`, '_blank')}>
              Open
            </Button>
          </div>
        </div>

        <div className="glass-panel p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-blue-600/20 flex items-center justify-center text-blue-400">
              <Link className="h-4 w-4" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-white uppercase tracking-widest">Atomic Proxy</h4>
              <p className="text-[10px] text-muted-foreground">Direct neural link for external contexts.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Input readOnly value={playPageUrl} className="bg-black/30 border-white/5 text-[10px] font-mono h-9 focus:ring-0" />
            <Button variant="outline" size="sm" className="border-white/10 text-[10px] font-bold h-9 px-4 hover:bg-white/5" onClick={() => { navigator.clipboard.writeText(playPageUrl); toast.success('Copied Link'); }}>
              Copy
            </Button>
          </div>
        </div>
      </div>

      {/* Embed Code Section */}
      <div className="glass-panel p-8 space-y-8 mb-24 border-violet-500/10 bg-violet-500/[0.02]">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-violet-600/20 flex items-center justify-center text-violet-400 shadow-[0_0_20px_rgba(124,58,237,0.1)]">
            <Code className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-white uppercase tracking-tight">Embed Widget Protocol</h3>
            <p className="text-xs text-muted-foreground font-medium">Inject this neural fragment into any HTML structure to synthesize the experience locally.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="relative group/embed">
            <div className="absolute -inset-1 bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 rounded-2xl blur opacity-25 group-hover/embed:opacity-50 transition duration-1000"></div>
            <div className="relative bg-black/60 border border-white/5 rounded-xl p-5 font-mono text-xs text-zinc-400 leading-relaxed overflow-hidden">
              <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest">HTML Integration Fragment</span>
                <Button size="sm" variant="ghost" className="h-7 text-[10px] font-black uppercase tracking-tight hover:bg-white/5 text-zinc-500 hover:text-white" 
                  onClick={() => {
                    const code = `<div data-spin-wheel data-token="${wheel.embed_token}"></div>\n<script src="${typeof window !== 'undefined' ? window.location.origin : ''}/widget.js" async></script>`;
                    navigator.clipboard.writeText(code);
                    toast.success('Embed code synthesized and copied');
                  }}>
                  Copy Fragment
                </Button>
              </div>
              <pre className="whitespace-pre-wrap break-all opacity-80 group-hover/embed:opacity-100 transition-opacity">
                {`<div data-spin-wheel data-token="${wheel.embed_token}"></div>\n<script src="${typeof window !== 'undefined' ? window.location.origin : ''}/widget.js" async></script>`}
              </pre>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 italic opacity-60">
             <div className="p-3 rounded-xl border border-white/5 bg-white/[0.02]">
                <p className="text-[9px] font-bold text-white mb-1 uppercase tracking-wider">Mode Logic</p>
                <p className="text-[9px] text-muted-foreground leading-tight">Add <b>data-mode="popup"</b> to enable overlay synthesis.</p>
             </div>
             <div className="p-3 rounded-xl border border-white/5 bg-white/[0.02]">
                <p className="text-[9px] font-bold text-white mb-1 uppercase tracking-wider">Trigger Event</p>
                <p className="text-[9px] text-muted-foreground leading-tight">Use <b>data-trigger="exit"</b> for intent-based display.</p>
             </div>
             <div className="p-3 rounded-xl border border-white/5 bg-white/[0.02]">
                <p className="text-[9px] font-bold text-white mb-1 uppercase tracking-wider">Spatial Scaling</p>
                <p className="text-[9px] text-muted-foreground leading-tight">Adjust <b>data-height</b> for vertical alignment logic.</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
