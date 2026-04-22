'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowRight, BarChart2, Bell, Check, ChevronRight,
  Globe, Layers, Menu, Shield, Users, X, Zap,
} from 'lucide-react';

/* ─── tiny helpers ─────────────────────────────────────────── */
function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-[13px] text-[#888] hover:text-white transition-colors duration-150 font-medium"
    >
      {children}
    </Link>
  );
}

/* ─── page ─────────────────────────────────────────────────── */
export default function HomePage() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-white selection:bg-violet-600/40">

      <div className="pointer-events-none fixed inset-0 z-0 dot-grid opacity-[0.4]" />

      {/* ── hero radial glow ── */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div
          className="absolute -top-40 left-1/2 -translate-x-1/2 h-[700px] w-[700px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(109,40,217,0.18) 0%, transparent 70%)' }}
        />
      </div>

      {/* ═══════════════════════════ NAV ══════════════════════════ */}
      <header className="relative z-50 border-b border-white/[0.06] bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between gap-8">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600 shadow-[0_0_12px_rgba(109,40,217,0.5)]">
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2v10l4 4" />
                <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
              </svg>
            </div>
            <span className="text-[15px] font-bold tracking-[-0.02em]">SpinPlatform</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-7">
            <NavLink href="#features">Features</NavLink>
            <NavLink href="#how-it-works">How it works</NavLink>
            <NavLink href="#integrations">Integrations</NavLink>
            <NavLink href="#pricing">Pricing</NavLink>
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="text-[13px] font-medium text-[#888] hover:text-white transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 rounded-lg bg-white text-[#0a0a10] text-[13px] font-semibold px-4 py-2 hover:bg-white/90 transition-colors"
            >
              Start free <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-1.5 text-[#888] hover:text-white"
            onClick={() => setMobileOpen(v => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-white/[0.06] bg-background px-6 py-4 space-y-4">
            {['#features', '#how-it-works', '#integrations', '#pricing'].map((href) => (
              <Link key={href} href={href} onClick={() => setMobileOpen(false)}
                className="block text-sm text-[#888] hover:text-white transition-colors capitalize">
                {href.replace('#', '').replace(/-/g, ' ')}
              </Link>
            ))}
            <div className="pt-3 border-t border-white/[0.06] flex flex-col gap-2">
              <Link href="/login" className="text-sm font-medium text-[#888] hover:text-white transition-colors">Sign in</Link>
              <Link href="/register" className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-white text-[#0a0a10] text-sm font-semibold px-4 py-2.5">
                Start free <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="relative z-10">

        {/* ═══════════════════════════ HERO ═════════════════════════ */}
        <section className="pt-24 pb-20 px-6 text-center max-w-4xl mx-auto">

          {/* Eyebrow pill */}
          <div className="inline-flex items-center gap-2 rounded-full ghost-border px-3.5 py-1.5 mb-8"
            style={{ background: 'rgba(124,58,237,0.1)' }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
            <span className="label-caps text-violet-300">
              Spin-to-Win Marketing
            </span>
          </div>

          {/* Headline — Space Grotesk editorial */}
          <h1 className="font-editorial text-[clamp(2.8rem,7vw,5.5rem)] font-bold leading-[1.02] tracking-[-0.04em] mb-6">
            <span className="text-white">Turn every visitor</span>
            <br />
            <span className="gradient-text-editorial">
              into a lead.
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-[18px] text-[#888] leading-relaxed max-w-xl mx-auto mb-10">
            Launch beautiful spin wheels in minutes. Capture emails, reward winners,
            and integrate with every tool your team already uses.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl text-white font-semibold text-[15px] px-7 py-3.5 transition-all duration-200"
              style={{
                background: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
                boxShadow: '0 0 0 1px rgba(124,58,237,0.4), 0 8px 28px -4px rgba(109,40,217,0.5)',
              }}
            >
              Start for free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl text-white font-semibold text-[15px] px-7 py-3.5 transition-all duration-200 ghost-border"
              style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(8px)' }}
            >
              View live demo
              <ChevronRight className="h-4 w-4 text-white/50" />
            </Link>
          </div>

          <p className="mt-5 text-[12px] text-[#555] font-medium">No credit card required · Free plan forever</p>

          {/* Hero visual — stylised wheel UI mockup */}
          <div className="mt-16 relative">
            {/* Glow under the card */}
            <div className="absolute inset-x-1/4 top-4 bottom-0 blur-3xl bg-violet-600/20 rounded-3xl" />

            <div
              className="relative rounded-2xl border border-white/[0.07] overflow-hidden glass-panel"
              style={{
                boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.07), 0 4px 40px -8px rgba(0,0,0,0.5)',
              }}
            >
              {/* Mock browser chrome */}
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/[0.06]">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                <div className="ml-3 flex-1 rounded-md bg-white/5 border border-white/[0.06] h-6 flex items-center px-3">
                  <span className="text-[11px] text-[#555]">spinplatform.app/play/summer-sale</span>
                </div>
              </div>

              {/* Content area */}
              <div className="px-8 py-10 flex flex-col lg:flex-row items-center gap-10">

                {/* Wheel SVG */}
                <div className="relative shrink-0">
                  {/* Outer glow ring */}
                  <div className="absolute inset-0 rounded-full blur-2xl bg-violet-500/30 scale-110" />
                  <svg viewBox="0 0 240 240" className="relative h-52 w-52 drop-shadow-[0_0_24px_rgba(139,92,246,0.4)]">
                    {/* Wheel segments */}
                    {[
                      { color: '#7c3aed', start: 0,   end: 60  },
                      { color: '#1e1b4b', start: 60,  end: 120 },
                      { color: '#4c1d95', start: 120, end: 180 },
                      { color: '#1e1b4b', start: 180, end: 240 },
                      { color: '#5b21b6', start: 240, end: 300 },
                      { color: '#1e1b4b', start: 300, end: 360 },
                    ].map((seg, i) => {
                      const startRad = (seg.start - 90) * Math.PI / 180;
                      const endRad   = (seg.end   - 90) * Math.PI / 180;
                      const cx = 120, cy = 120, r = 108;
                      const x1 = (cx + r * Math.cos(startRad)).toFixed(3);
                      const y1 = (cy + r * Math.sin(startRad)).toFixed(3);
                      const x2 = (cx + r * Math.cos(endRad)).toFixed(3);
                      const y2 = (cy + r * Math.sin(endRad)).toFixed(3);
                      const largeArc = seg.end - seg.start > 180 ? 1 : 0;
                      return (
                        <path
                          key={i}
                          d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`}
                          fill={seg.color}
                          stroke="rgba(255,255,255,0.06)"
                          strokeWidth="1"
                        />
                      );
                    })}
                    {/* Center hub */}
                    <circle cx="120" cy="120" r="20" fill="#7c3aed" />
                    <circle cx="120" cy="120" r="14" fill="#4c1d95" />
                    {/* Pointer */}
                    <polygon points="120,8 128,24 112,24" fill="#f5f5ff" />
                    {/* Segment labels */}
                    {['10% OFF', 'FREE SHIP', '$5 OFF', 'SPIN AGAIN', '15% OFF', 'MYSTERY'].map((label, i) => {
                      const angle = (i * 60 + 30 - 90) * Math.PI / 180;
                      const textR = 70;
                      const x = (120 + textR * Math.cos(angle)).toFixed(3);
                      const y = (120 + textR * Math.sin(angle)).toFixed(3);
                      const rot = i * 60 + 30;
                      return (
                        <text
                          key={i}
                          x={x} y={y}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize="7"
                          fontWeight="700"
                          fill="rgba(255,255,255,0.85)"
                          transform={`rotate(${rot}, ${x}, ${y})`}
                          letterSpacing="0.05em"
                        >
                          {label}
                        </text>
                      );
                    })}
                  </svg>
                </div>

                {/* UI panel */}
                <div className="flex-1 space-y-4 text-left w-full max-w-xs">
                  {/* Lead form mock */}
                  <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4 space-y-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#555]">Lead Capture</p>
                    <div className="space-y-2">
                      {['Enter your name…', 'your@email.com'].map((ph) => (
                        <div key={ph} className="h-8 rounded-md border border-white/[0.07] bg-white/[0.04] px-3 flex items-center">
                          <span className="text-[11px] text-[#444]">{ph}</span>
                        </div>
                      ))}
                    </div>
                    <div className="h-8 rounded-md bg-violet-600/70 flex items-center justify-center">
                      <span className="text-[11px] font-bold text-white/80">Spin the wheel</span>
                    </div>
                  </div>

                  {/* Live stats mock */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { n: '2.4k', l: 'Spins today' },
                      { n: '68%',  l: 'Win rate' },
                      { n: '841',  l: 'New leads' },
                    ].map((s) => (
                      <div key={s.l} className="rounded-lg border border-white/[0.06] bg-white/[0.025] p-2.5 text-center">
                        <p className="text-[14px] font-bold tabular-nums tracking-tight">{s.n}</p>
                        <p className="text-[9px] text-[#555] mt-0.5">{s.l}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════ LOGOS STRIP ══════════════════════ */}
        <section className="py-14 border-y border-white/[0.05]">
          <div className="max-w-5xl mx-auto px-6">
            <p className="text-center text-[12px] font-semibold uppercase tracking-[0.1em] text-[#444] mb-8">
              Trusted by fast-growing teams
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
              {['Shopify', 'Mailchimp', 'Klaviyo', 'HubSpot', 'Zapier', 'Salesforce'].map((name) => (
                <span key={name} className="text-[15px] font-bold text-[#333] tracking-tight hover:text-[#555] transition-colors">
                  {name}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════ FEATURES ══════════════════════════ */}
        <section id="features" className="py-24 px-6">
          <div className="max-w-5xl mx-auto">

            {/* Section header */}
            <div className="text-center mb-14">
              <p className="label-caps text-violet-400 mb-3">Features</p>
              <h2 className="font-editorial text-[clamp(2rem,4vw,3rem)] font-bold tracking-[-0.04em]">
                Everything you need to convert
              </h2>
              <p className="mt-3 text-[16px] text-[#666] max-w-lg mx-auto">
                A complete spin-to-win platform — from design to analytics to integrations.
              </p>
            </div>

            {/* Bento grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  icon: Zap,
                  accentColor: '#7c3aed',
                  title: 'Launch in minutes',
                  desc: 'Drag-and-drop wheel builder. Customize colors, segments, prizes, and branding without writing a single line of code.',
                  span: '',
                },
                {
                  icon: Users,
                  accentColor: '#3b82f6',
                  title: 'Lead capture built-in',
                  desc: 'Collect name, email, and phone before every spin. GDPR-compliant with configurable consent flows.',
                  span: '',
                },
                {
                  icon: BarChart2,
                  accentColor: '#10b981',
                  title: 'Real-time analytics',
                  desc: 'Track spins, win rates, lead conversion, and per-segment performance. Export CSV any time.',
                  span: '',
                },
                {
                  icon: Globe,
                  accentColor: '#f59e0b',
                  title: 'Embeddable anywhere',
                  desc: 'Drop a single <script> tag into any website, Shopify store, or landing page.',
                  span: 'md:col-span-2 lg:col-span-1',
                },
                {
                  icon: Shield,
                  accentColor: '#f43f5e',
                  title: 'A/B testing',
                  desc: 'Split traffic between two wheel variants and let the data pick the winner.',
                  span: '',
                },
                {
                  icon: Bell,
                  accentColor: '#06b6d4',
                  title: 'Push notifications',
                  desc: 'Re-engage subscribers with targeted web push campaigns, directly from the dashboard.',
                  span: '',
                },
              ].map((f) => {
                const Icon = f.icon;
                return (
                  <div
                    key={f.title}
                    className={`group relative rounded-2xl ghost-border p-6 overflow-hidden transition-all duration-300 ${f.span}`}
                    style={{
                      background: 'rgba(31,31,40,0.6)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.05)',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(41,41,50,0.75)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(31,31,40,0.6)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    {/* Hover accent glow at top */}
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ background: `linear-gradient(90deg, transparent, ${f.accentColor}60, transparent)` }} />
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl mb-4"
                      style={{ background: `${f.accentColor}18`, color: f.accentColor }}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <h3 className="font-editorial text-[15px] font-semibold tracking-[-0.02em] mb-2">{f.title}</h3>
                    <p className="text-[13px] text-[#666] leading-relaxed">{f.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ══════════════════ HOW IT WORKS ═══════════════════════════ */}
        <section id="how-it-works" className="py-24 px-6 border-t border-white/[0.05]">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <p className="label-caps text-violet-400 mb-3">How it works</p>
              <h2 className="font-editorial text-[clamp(2rem,4vw,3rem)] font-bold tracking-[-0.04em]">
                From zero to live in 3 steps
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
              {/* Connector line */}
              <div className="hidden md:block absolute top-10 left-[16.5%] right-[16.5%] h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />

              {[
                {
                  step: '01',
                  title: 'Design your wheel',
                  desc: 'Set up segments, prizes, colors, and branding. Add a lead capture form.',
                  icon: Layers,
                },
                {
                  step: '02',
                  title: 'Embed anywhere',
                  desc: 'Copy a single script tag and paste it into any website or Shopify store.',
                  icon: Globe,
                },
                {
                  step: '03',
                  title: 'Watch leads roll in',
                  desc: 'Monitor conversions in real time. Sync leads to your CRM or email tool automatically.',
                  icon: BarChart2,
                },
              ].map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.step} className="relative flex flex-col items-center text-center px-4">
                    {/* Step number badge */}
                    <div
                      className="flex h-20 w-20 items-center justify-center rounded-2xl mb-6 relative"
                      style={{
                        background: 'linear-gradient(145deg, rgba(139,92,246,0.15) 0%, rgba(109,40,217,0.08) 100%)',
                        border: '1px solid rgba(139,92,246,0.2)',
                        boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.06)',
                      }}
                    >
                      <Icon className="h-8 w-8 text-violet-400" />
                      <span
                        className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold bg-violet-600 text-white"
                        style={{ boxShadow: '0 0 10px rgba(109,40,217,0.5)' }}
                      >
                        {s.step.replace('0', '')}
                      </span>
                    </div>
                    <h3 className="text-[17px] font-semibold tracking-[-0.02em] mb-2">{s.title}</h3>
                    <p className="text-[13px] text-[#666] leading-relaxed">{s.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ═══════════════════ INTEGRATIONS ═══════════════════════════ */}
        <section id="integrations" className="py-24 px-6 border-t border-white/[0.05]">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <p className="label-caps text-violet-400 mb-3">Integrations</p>
              <h2 className="font-editorial text-[clamp(2rem,4vw,3rem)] font-bold tracking-[-0.04em]">
                Works with your stack
              </h2>
              <p className="mt-3 text-[16px] text-[#666] max-w-md mx-auto">
                Connect to email, CRM, ecommerce, and automation tools — no code required.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { name: 'Mailchimp',    color: 'text-amber-400',   bg: 'bg-amber-500/8' },
                { name: 'Klaviyo',      color: 'text-emerald-400', bg: 'bg-emerald-500/8' },
                { name: 'Shopify',      color: 'text-green-400',   bg: 'bg-green-500/8' },
                { name: 'HubSpot',      color: 'text-orange-400',  bg: 'bg-orange-500/8' },
                { name: 'Zapier',       color: 'text-orange-300',  bg: 'bg-orange-400/8' },
                { name: 'Salesforce',   color: 'text-blue-400',    bg: 'bg-blue-500/8' },
                { name: 'Google Sheets',color: 'text-emerald-300', bg: 'bg-emerald-400/8' },
                { name: 'Webhooks',     color: 'text-violet-400',  bg: 'bg-violet-500/8' },
                { name: 'Slack',        color: 'text-purple-400',  bg: 'bg-purple-500/8' },
                { name: 'Stripe',       color: 'text-violet-300',  bg: 'bg-violet-400/8' },
                { name: 'ActiveCampaign', color: 'text-blue-300',  bg: 'bg-blue-400/8' },
                { name: 'Drip',         color: 'text-indigo-400',  bg: 'bg-indigo-500/8' },
              ].map((int) => (
                <div
                  key={int.name}
                  className={`flex flex-col items-center justify-center gap-2 rounded-xl border border-white/[0.06] p-4 hover:border-white/[0.12] transition-colors duration-200 cursor-default ${int.bg}`}
                >
                  <div className={`h-7 w-7 rounded-lg bg-white/5 flex items-center justify-center`}>
                    <Zap className={`h-3.5 w-3.5 ${int.color}`} />
                  </div>
                  <span className="text-[11px] font-semibold text-[#666] text-center leading-tight">{int.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════ PRICING TEASER ════════════════════════ */}
        <section id="pricing" className="py-24 px-6 border-t border-white/[0.05]">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <p className="label-caps text-violet-400 mb-3">Pricing</p>
              <h2 className="font-editorial text-[clamp(2rem,4vw,3rem)] font-bold tracking-[-0.04em]">
                Start free, scale as you grow
              </h2>
              <p className="mt-3 text-[16px] text-[#666] max-w-md mx-auto">
                No contracts. No hidden fees. Upgrade or downgrade any time.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                {
                  name: 'Free',
                  price: '$0',
                  period: 'forever',
                  desc: 'Perfect for trying it out.',
                  highlight: false,
                  cta: 'Start for free',
                  features: ['500 spins / month', '1 active wheel', 'Lead capture', 'Basic analytics', 'SpinPlatform branding'],
                },
                {
                  name: 'Starter',
                  price: '$29',
                  period: '/month',
                  desc: 'For growing businesses.',
                  highlight: true,
                  cta: 'Start 14-day trial',
                  features: ['10,000 spins / month', '5 active wheels', 'Remove branding', 'A/B testing', 'Email integrations', 'Push notifications'],
                },
                {
                  name: 'Pro',
                  price: '$79',
                  period: '/month',
                  desc: 'Unlimited scale.',
                  highlight: false,
                  cta: 'Get started',
                  features: ['Unlimited spins', 'Unlimited wheels', 'All integrations', 'CRM sync (HubSpot, Salesforce)', 'Priority support', 'Audit logs'],
                },
              ].map((plan) => (
                <div
                  key={plan.name}
                  className="relative rounded-2xl p-6 flex flex-col"
                  style={plan.highlight ? {
                    background: 'rgba(31,31,40,0.85)',
                    backdropFilter: 'blur(24px)',
                    WebkitBackdropFilter: 'blur(24px)',
                    border: '1px solid rgba(124,58,237,0.35)',
                    boxShadow: 'inset 0 1px 0 0 rgba(167,139,250,0.15), 0 0 40px -8px rgba(124,58,237,0.35)',
                  } : {
                    background: 'rgba(27,27,35,0.6)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid rgba(74,68,85,0.2)',
                    boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.04)',
                  }}
                >
                  {plan.highlight && (
                    <div className="absolute -top-px inset-x-0 h-[1px] rounded-t-2xl"
                      style={{ background: 'linear-gradient(90deg, transparent, rgba(167,139,250,0.7), transparent)' }}
                    />
                  )}
                  {plan.highlight && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center rounded-full px-3 py-0.5 text-[11px] font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #7c3aed, #a78bfa)', boxShadow: '0 0 12px rgba(124,58,237,0.5)' }}
                    >
                      Most popular
                    </span>
                  )}
                  <div className="mb-5">
                    <p className="label-caps text-[#888] mb-2">{plan.name}</p>
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="font-editorial text-[42px] font-bold tracking-[-0.04em] leading-none">{plan.price}</span>
                      <span className="text-[14px] text-[#666]">{plan.period}</span>
                    </div>
                    <p className="text-[13px] text-[#555]">{plan.desc}</p>
                  </div>

                  <ul className="space-y-2.5 mb-7 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-[13px] text-[#888]">
                        <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl text-[14px] font-semibold py-2.5 px-5 transition-all duration-200 text-white"
                    style={plan.highlight ? {
                      background: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
                      boxShadow: '0 0 20px rgba(124,58,237,0.4)',
                    } : {
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(74,68,85,0.25)',
                    }}
                  >
                    {plan.cta} <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════ FINAL CTA ═════════════════════════════ */}
        <section className="py-24 px-6 border-t border-white/[0.05]">
          <div className="max-w-2xl mx-auto text-center relative">
            {/* Glow */}
            <div className="pointer-events-none absolute inset-x-0 -top-20 h-80 blur-3xl bg-violet-600/10 rounded-full" />
            <div className="relative">
              <p className="label-caps text-violet-400 mb-4">Get started today</p>
              <h2 className="font-editorial text-[clamp(2.2rem,5vw,3.5rem)] font-bold tracking-[-0.04em] mb-5">
                Your first wheel is free.
                <br />
                <span className="gradient-text-editorial">Forever.</span>
              </h2>
              <p className="text-[16px] text-[#666] mb-10 max-w-md mx-auto">
                Join thousands of marketers using SpinPlatform to turn visitors into leads and customers.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-xl text-white font-semibold text-[15px] px-8 py-3.5 transition-all duration-200"
                  style={{
                    background: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
                    boxShadow: '0 0 0 1px rgba(124,58,237,0.4), 0 8px 32px -4px rgba(109,40,217,0.55)',
                  }}
                >
                  Create your free account
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <p className="mt-4 text-[12px] text-[#444]">No credit card · Free plan · Setup in under 5 minutes</p>
            </div>
          </div>
        </section>

      </main>

      {/* ═══════════════════════════ FOOTER ═══════════════════════════ */}
      <footer className="border-t border-white/[0.05] py-14 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            {/* Brand column */}
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-600">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 2v10l4 4" />
                    <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
                  </svg>
                </div>
                <span className="text-[14px] font-bold tracking-tight">SpinPlatform</span>
              </Link>
              <p className="text-[12px] text-[#444] leading-relaxed max-w-[160px]">
                Spin-to-win marketing for modern businesses.
              </p>
            </div>

            {/* Link columns */}
            {[
              {
                heading: 'Product',
                links: [
                  { label: 'Features', href: '#features' },
                  { label: 'Pricing', href: '#pricing' },
                  { label: 'Integrations', href: '#integrations' },
                  { label: 'Changelog', href: '#' },
                ],
              },
              {
                heading: 'Company',
                links: [
                  { label: 'About', href: '#' },
                  { label: 'Blog', href: '#' },
                  { label: 'Careers', href: '#' },
                  { label: 'Contact', href: '#' },
                ],
              },
              {
                heading: 'Legal',
                links: [
                  { label: 'Privacy Policy', href: '#' },
                  { label: 'Terms of Service', href: '#' },
                  { label: 'Cookie Policy', href: '#' },
                  { label: 'GDPR', href: '#' },
                ],
              },
              {
                heading: 'Dashboard',
                links: [
                  { label: 'Sign in', href: '/login' },
                  { label: 'Register', href: '/register' },
                  { label: 'Analytics', href: '/dashboard/analytics' },
                  { label: 'Integrations', href: '/dashboard/integrations' },
                ],
              },
            ].map((col) => (
              <div key={col.heading}>
                <p className="label-caps text-[#444] mb-3">{col.heading}</p>
                <ul className="space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link href={l.href} className="text-[13px] text-[#555] hover:text-[#999] transition-colors">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-white/[0.05] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[12px] text-[#333]">
              &copy; {new Date().getFullYear()} SpinPlatform. All rights reserved.
            </p>
            <p className="text-[12px] text-[#333]">
              Built for marketers who move fast.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
