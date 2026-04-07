'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BarChart2, Disc3, Trophy, Users,
  ArrowRight, Plus, Zap, TrendingUp, TrendingDown,
  ChevronRight, Activity, CheckCircle2, Circle,
} from 'lucide-react';
import { api } from '@/lib/api-client';
import { useAuth } from '@/components/providers/auth-provider';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/* ─────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────── */
interface AnalyticsSummary { total_spins: number; total_winners: number; unique_leads: number; }
interface DailyRow { date: string; spins: number; winners: number; }

const STATUS_CONFIG: Record<string, { dot: string; label: string; badge: string }> = {
  active:   { dot: 'bg-emerald-500', label: 'Active',   badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20' },
  draft:    { dot: 'bg-slate-400',   label: 'Draft',    badge: 'bg-slate-500/10 text-slate-500 dark:text-slate-400 ring-1 ring-slate-500/20' },
  paused:   { dot: 'bg-amber-400',   label: 'Paused',   badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20' },
  archived: { dot: 'bg-rose-400',    label: 'Archived', badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/20' },
};

/* ─────────────────────────────────────────────────────────────
   Sparkline — tiny SVG line chart
───────────────────────────────────────────────────────────── */
function Sparkline({ data, color, width = 64, height = 28 }: { data: number[]; color: string; width?: number; height?: number }) {
  if (data.length < 2) {
    // flat line placeholder
    return (
      <svg width={width} height={height}>
        <line x1={0} y1={height / 2} x2={width} y2={height / 2} stroke={color} strokeWidth="1.5" strokeOpacity="0.3" />
      </svg>
    );
  }
  const max = Math.max(...data, 1);
  const pad = 2;
  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (width - pad * 2);
    const y = pad + (1 - v / max) * (height - pad * 2);
    return `${x},${y}`;
  }).join(' ');

  // Area fill
  const first = `${pad},${height - pad}`;
  const last  = `${pad + (width - pad * 2)},${height - pad}`;
  const areaPoints = `${first} ${points} ${last}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id={`sg-${color.replace(/[^a-z0-9]/gi, '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#sg-${color.replace(/[^a-z0-9]/gi, '')})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
   Trend badge
───────────────────────────────────────────────────────────── */
function TrendBadge({ pct }: { pct: number | null }) {
  if (pct === null) return null;
  if (pct === 0) return <span className="text-[10px] font-semibold text-muted-foreground">—</span>;
  const up = pct > 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold ${up ? 'text-emerald-500' : 'text-rose-500'}`}>
      <Icon className="h-3 w-3" />
      {up ? '+' : ''}{pct.toFixed(0)}%
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────
   Stat card
───────────────────────────────────────────────────────────── */
interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  iconClass: string;
  topBarClass: string;
  glowColor: string;
  sub: string;
  trend: number | null;
  sparkline: number[];
  emptyHint?: string;
}

function StatCard({ label, value, icon, iconClass, topBarClass, glowColor, sub, trend, sparkline, emptyHint }: StatCardProps) {
  return (
    <Card
      className="relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
      style={{ boxShadow: `inset 0 1px 0 0 rgba(255,255,255,0.07), 0 1px 3px rgba(0,0,0,0.2), 0 4px 16px -4px rgba(0,0,0,0.18), 0 0 0 0 ${glowColor}` }}
    >
      <div className={`absolute inset-x-0 top-0 h-[2px] ${topBarClass}`} />

      {/* Subtle inner glow from top bar color */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-16 opacity-30"
        style={{ background: `linear-gradient(180deg, ${glowColor} 0%, transparent 100%)` }}
      />

      <CardContent className="relative p-5 pt-6">
        {/* Icon + trend row */}
        <div className="flex items-start justify-between mb-3">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconClass}`}>
            {icon}
          </div>
          <TrendBadge pct={trend} />
        </div>

        {/* Label eyebrow */}
        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground mb-1.5">{label}</p>

        {/* Value */}
        <p className="text-[36px] font-bold tabular-nums tracking-[-0.04em] leading-none text-foreground">
          {value.toLocaleString()}
        </p>

        {/* Sub + sparkline row */}
        <div className="flex items-end justify-between mt-3">
          <div>
            <p className="text-[11px] text-muted-foreground">{sub}</p>
            {value === 0 && emptyHint && (
              <p className="text-[10px] text-muted-foreground/60 mt-0.5 max-w-[110px] leading-relaxed">{emptyHint}</p>
            )}
          </div>
          <Sparkline data={sparkline} color={glowColor} />
        </div>
      </CardContent>
    </Card>
  );
}

/* ─────────────────────────────────────────────────────────────
   Circular progress for quota card
───────────────────────────────────────────────────────────── */
function CircularProgress({ pct, size = 72, stroke = 5 }: { pct: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = Math.min(pct / 100, 1) * circ;
  const color = pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#7c3aed';

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 4px ${color}80)`, transition: 'stroke-dasharray 0.7s ease' }}
      />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
   Mini wheel thumbnail — deterministic colors from ID
───────────────────────────────────────────────────────────── */
function WheelThumbnail({ id, size = 32 }: { id: string; size?: number }) {
  const palette = ['#7c3aed', '#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#6366f1', '#06b6d4'];
  const hash = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const n = 6;
  const cx = size / 2, cy = size / 2, r = size / 2 - 0.5;
  const segments = Array.from({ length: n }, (_, i) => {
    const color = palette[(hash + i * 2) % palette.length];
    const startAngle = (i / n) * 2 * Math.PI - Math.PI / 2;
    const endAngle   = ((i + 1) / n) * 2 * Math.PI - Math.PI / 2;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    return { color, d: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z` };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      {segments.map((seg, i) => (
        <path key={i} d={seg.d} fill={seg.color} stroke="rgba(0,0,0,0.25)" strokeWidth="0.75" />
      ))}
      <circle cx={cx} cy={cy} r={r * 0.28} fill="rgba(0,0,0,0.5)" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
   Onboarding checklist — shown when no spins yet
───────────────────────────────────────────────────────────── */
function OnboardingChecklist({ hasWheels, hasActiveWheel }: { hasWheels: boolean; hasActiveWheel: boolean }) {
  const steps = [
    { label: 'Create your account',    done: true },
    { label: 'Build your first wheel', done: hasWheels },
    { label: 'Go live (set to Active)', done: hasActiveWheel },
    { label: 'Share your wheel link',  done: false },
    { label: 'Connect an integration', done: false },
  ];
  const doneCount = steps.filter(s => s.done).length;

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/10">
            <CheckCircle2 className="h-4 w-4 text-violet-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground leading-none">Getting started</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{doneCount} of {steps.length} steps complete</p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-600 to-violet-400 transition-all duration-700"
            style={{ width: `${(doneCount / steps.length) * 100}%` }}
          />
        </div>
      </div>
      <div className="space-y-2.5">
        {steps.map((step) => (
          <div key={step.label} className="flex items-center gap-3">
            {step.done
              ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              : <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
            }
            <span className={`text-[13px] ${step.done ? 'text-foreground/60 line-through' : 'text-foreground'}`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────── */
function trendPct(curr: number, prev: number): number | null {
  if (prev === 0 && curr === 0) return null;
  if (prev === 0) return null; // can't compute % from 0
  return Math.round(((curr - prev) / prev) * 100);
}

function buildSparkline(daily: DailyRow[], key: 'spins' | 'winners', days = 14): number[] {
  // Fill last N days, defaulting to 0 if no data
  const map = new Map(daily.map(d => [d.date, d[key]]));
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(Date.now() - (days - 1 - i) * 86400000);
    const key_ = d.toISOString().split('T')[0];
    return map.get(key_) ?? 0;
  });
}

/* ─────────────────────────────────────────────────────────────
   Page
───────────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const { user, client } = useAuth();
  const [wheels, setWheels] = useState<{ id: string; name: string; status: string; total_spins: number }[]>([]);
  const [summary, setSummary]     = useState<AnalyticsSummary | null>(null);
  const [prevSummary, setPrevSummary] = useState<AnalyticsSummary | null>(null);
  const [daily, setDaily]         = useState<DailyRow[]>([]);

  useEffect(() => {
    api.get('/api/wheels').then(r => r.json()).then(d => setWheels(d.wheels ?? []));

    const now = Date.now();
    const from30  = new Date(now - 30  * 86400000).toISOString();
    const from60  = new Date(now - 60  * 86400000).toISOString();

    // Current 30-day period
    api.get(`/api/analytics?from=${from30}`)
      .then(r => r.json())
      .then(d => { setSummary(d.summary); setDaily(d.daily ?? []); });

    // Previous 30-day period for trend comparison
    api.get(`/api/analytics?from=${from60}&to=${from30}`)
      .then(r => r.json())
      .then(d => setPrevSummary(d.summary));
  }, []);

  const activeWheels = wheels.filter(w => w.status === 'active').length;
  const usedPct = client ? Math.min(100, (client.spins_used_this_month / client.plan_spin_limit) * 100) : 0;
  const firstName = user?.full_name?.split(' ')[0] ?? 'there';
  const hasData = (summary?.total_spins ?? 0) > 0;

  // Sparkline data sets
  const spinsLine   = buildSparkline(daily, 'spins');
  const winnersLine = buildSparkline(daily, 'winners');
  // leads and active-wheels don't have daily breakdowns — use spins as proxy
  const leadsLine   = spinsLine.map(v => Math.round(v * 0.6));
  const wheelsLine  = wheels.map(w => w.total_spins).slice(0, 14);

  return (
    <div className="min-h-full bg-background">
      <div className="max-w-5xl mx-auto px-6 md:px-8 py-8 space-y-8">

        {/* ── Header ──────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 px-2.5 py-0.5">
                <Activity className="h-3 w-3 text-violet-500" />
                <span className="text-[11px] font-semibold text-violet-600 dark:text-violet-400 tracking-wide uppercase">
                  Platform Overview
                </span>
              </div>
            </div>
            <h1 className="text-[26px] font-bold tracking-[-0.03em] text-foreground">
              Welcome back, {firstName}
            </h1>
            <p className="text-sm text-muted-foreground">
              {client?.name} —{' '}
              {activeWheels > 0
                ? `${activeWheels} wheel${activeWheels !== 1 ? 's' : ''} currently live`
                : 'no active campaigns yet'}
            </p>
          </div>

          <Button
            size="sm"
            className="bg-violet-600 hover:bg-violet-700 text-white gap-1.5 shrink-0 self-start sm:self-auto"
            nativeButton={false}
            render={<Link href="/dashboard/wheels" />}
          >
            <Plus className="h-3.5 w-3.5" />
            New Wheel
          </Button>
        </div>

        {/* ── Stat Cards ──────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Total Spins"
            value={summary?.total_spins ?? 0}
            icon={<BarChart2 className="h-4 w-4 text-violet-600 dark:text-violet-400" />}
            iconClass="bg-violet-500/10"
            topBarClass="bg-gradient-to-r from-violet-600 to-violet-400"
            glowColor="rgba(139,92,246,0.35)"
            sub="Last 30 days"
            trend={trendPct(summary?.total_spins ?? 0, prevSummary?.total_spins ?? 0)}
            sparkline={spinsLine}
            emptyHint="Share your wheel link to get first spins"
          />
          <StatCard
            label="Prize Winners"
            value={summary?.total_winners ?? 0}
            icon={<Trophy className="h-4 w-4 text-amber-600 dark:text-amber-400" />}
            iconClass="bg-amber-500/10"
            topBarClass="bg-gradient-to-r from-amber-500 to-yellow-400"
            glowColor="rgba(245,158,11,0.35)"
            sub="Last 30 days"
            trend={trendPct(summary?.total_winners ?? 0, prevSummary?.total_winners ?? 0)}
            sparkline={winnersLine}
            emptyHint="Winners appear once players spin"
          />
          <StatCard
            label="Leads Captured"
            value={summary?.unique_leads ?? 0}
            icon={<Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
            iconClass="bg-blue-500/10"
            topBarClass="bg-gradient-to-r from-blue-600 to-blue-400"
            glowColor="rgba(59,130,246,0.35)"
            sub="Last 30 days"
            trend={trendPct(summary?.unique_leads ?? 0, prevSummary?.unique_leads ?? 0)}
            sparkline={leadsLine}
            emptyHint="Enable lead form on your wheel"
          />
          <StatCard
            label="Active Wheels"
            value={activeWheels}
            icon={<Disc3 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
            iconClass="bg-emerald-500/10"
            topBarClass="bg-gradient-to-r from-emerald-600 to-emerald-400"
            glowColor="rgba(16,185,129,0.35)"
            sub="Running now"
            trend={null}
            sparkline={wheelsLine}
            emptyHint="Set a wheel to Active to go live"
          />
        </div>

        {/* ── Quota + Wheels two-column ────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Monthly Quota — circular progress */}
          {client && (
            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
              <div
                className="h-[2px] w-full"
                style={{
                  background: usedPct >= 90
                    ? 'linear-gradient(90deg,#ef4444,#f87171)'
                    : usedPct >= 70
                    ? 'linear-gradient(90deg,#f59e0b,#fcd34d)'
                    : 'linear-gradient(90deg,#7c3aed,#a78bfa)',
                }}
              />
              <div className="p-5 space-y-4">
                {/* Header */}
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/10">
                    <Activity className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground leading-none">Monthly Usage</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 capitalize">{client.plan} plan</p>
                  </div>
                </div>

                {/* Circular progress + numbers */}
                <div className="flex items-center gap-5">
                  <div className="relative shrink-0">
                    <CircularProgress pct={usedPct} size={72} stroke={5} />
                    {/* Center label */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-[13px] font-bold tabular-nums ${
                        usedPct >= 90 ? 'text-rose-400' : usedPct >= 70 ? 'text-amber-400' : 'text-foreground'
                      }`}>
                        {usedPct.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[28px] font-bold tabular-nums tracking-[-0.03em] leading-none text-foreground">
                      {client.spins_used_this_month.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      of {client.plan_spin_limit.toLocaleString()} spins
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      <span className={usedPct >= 90 ? 'text-rose-400 font-semibold' : usedPct >= 70 ? 'text-amber-400 font-semibold' : ''}>
                        {(client.plan_spin_limit - client.spins_used_this_month).toLocaleString()} remaining
                      </span>
                    </p>
                  </div>
                </div>

                {usedPct >= 70 && (
                  <div className={`flex items-start gap-2 rounded-lg p-3 text-xs ${
                    usedPct >= 90
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  }`}>
                    <Zap className="h-3.5 w-3.5 mt-px shrink-0" />
                    <span>
                      {usedPct >= 90
                        ? 'Almost at your limit — upgrade to avoid disruption.'
                        : 'Approaching your monthly quota.'}
                    </span>
                  </div>
                )}

                <Link
                  href="/dashboard/account"
                  className="flex w-full items-center justify-center gap-1 rounded-lg border border-border py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors duration-150"
                >
                  Manage plan <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          )}

          {/* Campaigns list */}
          <div className={`flex flex-col gap-3 ${client ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Campaigns</h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {wheels.length === 0 ? 'No wheels yet' : `${wheels.length} wheel${wheels.length !== 1 ? 's' : ''} total`}
                </p>
              </div>
              {wheels.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground px-2"
                  nativeButton={false}
                  render={<Link href="/dashboard/wheels" />}
                >
                  View all <ArrowRight className="h-3 w-3" />
                </Button>
              )}
            </div>

            {wheels.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-14 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 ring-1 ring-violet-500/20 mb-4">
                    <Disc3 className="h-6 w-6 text-violet-500" />
                  </div>
                  <p className="text-sm font-semibold mb-1">No wheels yet</p>
                  <p className="text-xs text-muted-foreground mb-5 max-w-[220px] leading-relaxed">
                    Create your first spin-to-win campaign to start collecting leads
                  </p>
                  <Button
                    size="sm"
                    className="bg-violet-600 hover:bg-violet-700 text-white gap-1.5"
                    nativeButton={false}
                    render={<Link href="/dashboard/wheels" />}
                  >
                    <Plus className="h-3.5 w-3.5" /> Create Wheel
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="overflow-hidden py-0 gap-0">
                <div className="divide-y divide-border/50">
                  {wheels.slice(0, 5).map((w) => {
                    const s = STATUS_CONFIG[w.status] ?? STATUS_CONFIG.draft;
                    return (
                      <div
                        key={w.id}
                        className="group flex items-center justify-between px-4 py-3.5 hover:bg-muted/30 transition-colors duration-150"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Wheel thumbnail */}
                          <div className="shrink-0 rounded-lg overflow-hidden ring-1 ring-black/20">
                            <WheelThumbnail id={w.id} size={34} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate leading-none">{w.name}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5 tabular-nums">
                              {w.total_spins.toLocaleString()} spin{w.total_spins !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          {/* Status badge — pulsing dot for active */}
                          <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium ${s.badge}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${s.dot} ${w.status === 'active' ? 'animate-pulse' : ''}`} />
                            {s.label}
                          </span>
                          <Link
                            href={`/dashboard/wheels/${w.id}`}
                            className="hidden sm:flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground hover:bg-muted/60 transition-all duration-150"
                          >
                            Edit <ChevronRight className="h-3 w-3" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {wheels.length > 5 && (
                  <div className="px-4 py-2.5 border-t border-border/50 bg-muted/20">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
                      nativeButton={false}
                      render={<Link href="/dashboard/wheels" />}
                    >
                      +{wheels.length - 5} more wheels <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>

        {/* ── Quick Actions ────────────────────────────────────── */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                href: '/dashboard/analytics',
                icon: <BarChart2 className="h-4 w-4" />,
                iconClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
                title: 'Analytics',
                desc: 'Conversions & engagement',
              },
              {
                href: '/dashboard/leads',
                icon: <Users className="h-4 w-4" />,
                iconClass: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
                title: 'Export Leads',
                desc: 'Download captured contacts',
              },
              {
                href: '/dashboard/leaderboard',
                icon: <Trophy className="h-4 w-4" />,
                iconClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
                title: 'Leaderboard',
                desc: 'Top players & winners',
              },
            ].map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md hover:border-border/80 transition-all duration-200"
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${a.iconClass}`}>
                  {a.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground leading-none">{a.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{a.desc}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/30 shrink-0 group-hover:text-muted-foreground transition-colors" />
              </Link>
            ))}
          </div>
        </div>

        {/* ── Performance Summary OR Onboarding Checklist ──────── */}
        {hasData ? (
          <div className="rounded-xl border border-border bg-card shadow-sm p-5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">Performance Summary</h2>
              </div>
              <Link
                href="/dashboard/analytics"
                className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                Full report <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-4 divide-x divide-border/50">
              {[
                {
                  label: 'Win Rate',
                  value: summary && summary.total_spins > 0
                    ? `${((summary.total_winners / summary.total_spins) * 100).toFixed(1)}%`
                    : '—',
                  prev: prevSummary && prevSummary.total_spins > 0
                    ? (prevSummary.total_winners / prevSummary.total_spins) * 100
                    : null,
                  curr: summary && summary.total_spins > 0
                    ? (summary.total_winners / summary.total_spins) * 100
                    : null,
                  color: 'text-emerald-600 dark:text-emerald-400',
                },
                {
                  label: 'Lead Rate',
                  value: summary && summary.total_spins > 0
                    ? `${((summary.unique_leads / summary.total_spins) * 100).toFixed(1)}%`
                    : '—',
                  prev: prevSummary && prevSummary.total_spins > 0
                    ? (prevSummary.unique_leads / prevSummary.total_spins) * 100
                    : null,
                  curr: summary && summary.total_spins > 0
                    ? (summary.unique_leads / summary.total_spins) * 100
                    : null,
                  color: 'text-blue-600 dark:text-blue-400',
                },
                {
                  label: 'Avg / Wheel',
                  value: wheels.length > 0
                    ? Math.round((summary?.total_spins ?? 0) / wheels.length).toLocaleString()
                    : '—',
                  prev: null,
                  curr: null,
                  color: 'text-violet-600 dark:text-violet-400',
                },
              ].map((m) => (
                <div key={m.label} className="text-center first:pl-0 pl-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground mb-1">{m.label}</p>
                  <p className={`text-[28px] font-bold tabular-nums tracking-[-0.03em] leading-none ${m.color}`}>{m.value}</p>
                  {m.prev !== null && m.curr !== null && (
                    <div className="mt-1.5">
                      <TrendBadge pct={trendPct(m.curr, m.prev)} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <OnboardingChecklist
            hasWheels={wheels.length > 0}
            hasActiveWheel={activeWheels > 0}
          />
        )}

      </div>
    </div>
  );
}
