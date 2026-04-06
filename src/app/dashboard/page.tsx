'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart2, Disc3, Trophy, Users, ArrowRight, Plus, TrendingUp, Activity } from 'lucide-react';
import { api } from '@/lib/api-client';
import { useAuth } from '@/components/providers/auth-provider';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AnalyticsSummary { total_spins: number; total_winners: number; unique_leads: number; }

const STATUS_MAP: Record<string, { dot: string; label: string; cls: string }> = {
  active:   { dot: 'bg-emerald-400', label: 'Active',   cls: 'text-emerald-400 bg-emerald-500/8 ring-emerald-500/15' },
  draft:    { dot: 'bg-zinc-500',    label: 'Draft',    cls: 'text-zinc-400 bg-zinc-500/8 ring-zinc-500/15' },
  paused:   { dot: 'bg-amber-400',   label: 'Paused',   cls: 'text-amber-400 bg-amber-500/8 ring-amber-500/15' },
  archived: { dot: 'bg-rose-400',    label: 'Archived', cls: 'text-rose-400 bg-rose-500/8 ring-rose-500/15' },
};

/* ── Stat config ─────────────────────────────────────────────────── */
const STATS = (summary: AnalyticsSummary | null, activeWheels: number) => [
  {
    key: 'spins',
    label: 'Total Spins',
    value: summary?.total_spins ?? 0,
    sub: 'Last 30 days',
    icon: BarChart2,
    accent: { fg: 'text-violet-400', bg: 'bg-violet-500/10', ring: 'ring-violet-500/15', glow: 'icon-glow-violet', bar: 'from-violet-600 to-violet-400' },
  },
  {
    key: 'winners',
    label: 'Prize Winners',
    value: summary?.total_winners ?? 0,
    sub: 'Last 30 days',
    icon: Trophy,
    accent: { fg: 'text-amber-400', bg: 'bg-amber-500/10', ring: 'ring-amber-500/15', glow: 'icon-glow-amber', bar: 'from-amber-500 to-yellow-400' },
  },
  {
    key: 'leads',
    label: 'Leads Captured',
    value: summary?.unique_leads ?? 0,
    sub: 'Last 30 days',
    icon: Users,
    accent: { fg: 'text-blue-400', bg: 'bg-blue-500/10', ring: 'ring-blue-500/15', glow: 'icon-glow-blue', bar: 'from-blue-600 to-blue-400' },
  },
  {
    key: 'active',
    label: 'Active Wheels',
    value: activeWheels,
    sub: 'Running now',
    icon: Disc3,
    accent: { fg: 'text-emerald-400', bg: 'bg-emerald-500/10', ring: 'ring-emerald-500/15', glow: 'icon-glow-green', bar: 'from-emerald-600 to-emerald-400' },
  },
] as const;

export default function DashboardPage() {
  const { user, client } = useAuth();
  const [wheels, setWheels] = useState<{ id: string; name: string; status: string; total_spins: number }[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);

  useEffect(() => {
    api.get('/api/wheels').then((r) => r.json()).then((d) => setWheels(d.wheels ?? []));
    api.get('/api/analytics').then((r) => r.json()).then((d) => setSummary(d.summary));
  }, []);

  const activeWheels = wheels.filter((w) => w.status === 'active').length;
  const usedPct = client ? Math.min(100, (client.spins_used_this_month / client.plan_spin_limit) * 100) : 0;
  const firstName = user?.full_name?.split(' ')[0];
  const stats = STATS(summary, activeWheels);

  return (
    <div className="min-h-full">
      {/* ── Page top gradient wash ─────────────────────────── */}
      <div
        className="absolute inset-x-0 top-0 h-72 pointer-events-none -z-10"
        style={{
          background: 'radial-gradient(ellipse 80% 40% at 50% -10%, oklch(0.62 0.21 264 / 12%) 0%, transparent 70%)',
        }}
      />

      <div className="p-6 md:p-8 lg:p-10 max-w-5xl mx-auto space-y-10">

        {/* ── Header ──────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-6">
          <div className="space-y-1.5">
            {/* Eyebrow */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-full border border-violet-500/20 bg-violet-500/8 px-2.5 py-1">
                <Activity className="h-3 w-3 text-violet-400" />
                <span className="text-[11px] font-semibold text-violet-400 uppercase tracking-[0.06em]">Overview</span>
              </div>
            </div>
            {/* Hero title */}
            <h1 className="text-[26px] font-bold tracking-[-0.025em] leading-tight text-foreground">
              Good to see you, {firstName}.
            </h1>
            <p className="text-[14px] text-muted-foreground leading-relaxed">
              {client?.name} — here&apos;s what&apos;s happening with your campaigns.
            </p>
          </div>

          {/* CTA */}
          <Button
            size="sm"
            className="btn-glow-violet hidden md:inline-flex shrink-0 gap-1.5 bg-gradient-to-b from-violet-500 to-violet-700 text-white border-0 hover:from-violet-400 hover:to-violet-600"
            nativeButton={false}
            render={<Link href="/dashboard/wheels" />}
          >
            <Plus className="h-3.5 w-3.5" />
            New Wheel
          </Button>
        </div>

        {/* ── Stat Cards ──────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <Card
                key={s.key}
                className="group relative overflow-visible transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[inset_0_1px_0_0_rgb(255_255_255/0.09),0_4px_24px_-4px_rgb(0_0_0/0.28)]"
              >
                {/* Subtle gradient top accent — Vercel-style */}
                <div
                  className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${s.accent.bar} opacity-60 rounded-t-xl`}
                />
                <CardContent className="p-5">
                  {/* Icon */}
                  <div
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-lg ring-1 mb-4',
                      s.accent.bg, s.accent.ring,
                    )}
                  >
                    <Icon className={cn('h-[15px] w-[15px]', s.accent.fg, s.accent.glow)} />
                  </div>
                  {/* Value */}
                  <p className={cn('text-[28px] font-bold leading-none text-stat text-foreground')}>
                    {s.value.toLocaleString()}
                  </p>
                  {/* Label + sub */}
                  <p className="text-[12px] font-semibold text-foreground/70 mt-2.5 tracking-[-0.005em]">{s.label}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{s.sub}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* ── Monthly Quota ───────────────────────────────── */}
        {client && (
          <Card className="overflow-hidden">
            {/* Top gradient accent bar */}
            <div
              className="h-[2px] w-full"
              style={{
                background: usedPct >= 90
                  ? 'linear-gradient(90deg, oklch(0.62 0.22 20), oklch(0.72 0.18 0))'
                  : usedPct >= 70
                    ? 'linear-gradient(90deg, oklch(0.78 0.18 55), oklch(0.82 0.16 70))'
                    : 'linear-gradient(90deg, oklch(0.55 0.22 264), oklch(0.70 0.18 280))',
              }}
            />
            <CardContent className="py-5 px-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-[14px] font-semibold tracking-[-0.01em]">Monthly Spin Quota</p>
                  <p className="text-[12px] text-muted-foreground mt-0.5 capitalize">{client.plan} plan</p>
                </div>
                <div className="text-right">
                  <p className="text-[15px] font-bold tabular-nums tracking-[-0.02em] text-foreground">
                    {client.spins_used_this_month.toLocaleString()}
                    <span className="text-muted-foreground/60 font-normal text-[13px]"> / {client.plan_spin_limit.toLocaleString()}</span>
                  </p>
                  <p className={cn(
                    'text-[12px] mt-0.5 font-medium tabular-nums',
                    usedPct >= 90 ? 'text-rose-400' : usedPct >= 70 ? 'text-amber-400' : 'text-muted-foreground',
                  )}>
                    {usedPct.toFixed(1)}% used
                  </p>
                </div>
              </div>

              {/* Track */}
              <div className="h-[5px] w-full rounded-full overflow-hidden" style={{ background: 'oklch(1 0 0 / 5%)' }}>
                {/* Segmented effect — background fill */}
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r',
                    usedPct >= 90 ? 'from-rose-500 to-pink-400'
                    : usedPct >= 70 ? 'from-amber-500 to-yellow-400'
                    : 'from-violet-600 to-violet-400',
                  )}
                  style={{ width: `${usedPct}%` }}
                />
              </div>

              {usedPct >= 80 && (
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-amber-500/8 border border-amber-500/15 px-3.5 py-2.5">
                  <TrendingUp className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  <p className="text-[12px] text-amber-400/90">
                    You&apos;re approaching your monthly limit. Consider upgrading your plan.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Wheels ──────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Section header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-semibold tracking-[-0.01em]">Campaigns</h2>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                {wheels.length === 0 ? 'No campaigns yet' : `${wheels.length} wheel${wheels.length !== 1 ? 's' : ''} total`}
              </p>
            </div>
            {wheels.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
                nativeButton={false}
                render={<Link href="/dashboard/wheels" />}
              >
                Manage all <ArrowRight className="h-3 w-3" />
              </Button>
            )}
          </div>

          {wheels.length === 0 ? (
            /* ── Empty State ─────────────────────────────── */
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                {/* Layered glow icon */}
                <div className="relative mb-6">
                  <div className="absolute -inset-3 rounded-3xl bg-violet-500/6 blur-xl" />
                  <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 ring-1 ring-violet-500/20">
                    <Disc3 className="h-7 w-7 text-violet-400 icon-glow-violet" />
                  </div>
                </div>
                <p className="text-[15px] font-semibold tracking-[-0.01em] mb-2">No wheels yet</p>
                <p className="text-[13px] text-muted-foreground mb-7 max-w-[280px] leading-relaxed">
                  Create your first spin-to-win campaign to start collecting leads and rewarding customers.
                </p>
                <Button
                  size="sm"
                  className="btn-glow-violet gap-1.5 bg-gradient-to-b from-violet-500 to-violet-700 text-white border-0 hover:from-violet-400 hover:to-violet-600"
                  nativeButton={false}
                  render={<Link href="/dashboard/wheels" />}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Create your first wheel
                </Button>
              </CardContent>
            </Card>
          ) : (
            /* ── Wheels Table ────────────────────────────── */
            <Card className="overflow-hidden py-0 gap-0">
              <div className="divide-y" style={{ '--tw-divide-opacity': '0.5' } as React.CSSProperties}>
                {wheels.slice(0, 5).map((w) => {
                  const s = STATUS_MAP[w.status] ?? STATUS_MAP.draft;
                  return (
                    <div
                      key={w.id}
                      className="group flex items-center justify-between px-5 py-[14px] hover:bg-white/[0.025] transition-colors duration-100"
                    >
                      {/* Left: icon + info */}
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] ring-1 ring-white/[0.07] group-hover:ring-violet-500/25 group-hover:bg-violet-500/6 transition-all duration-150">
                          <Disc3 className="h-4 w-4 text-muted-foreground/60 group-hover:text-violet-400 transition-colors duration-150" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold truncate leading-snug tracking-[-0.01em] text-foreground/90">
                            {w.name}
                          </p>
                          <p className="text-[11.5px] text-muted-foreground/70 tabular-nums mt-0.5">
                            {w.total_spins.toLocaleString()} spins
                          </p>
                        </div>
                      </div>

                      {/* Right: status + action */}
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={cn(
                          'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium ring-1',
                          s.cls,
                        )}>
                          <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', s.dot)} />
                          {s.label}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-150"
                          nativeButton={false}
                          render={<Link href={`/dashboard/wheels/${w.id}`} />}
                        >
                          Edit →
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              {wheels.length > 5 && (
                <div
                  className="px-5 py-3 flex items-center justify-center"
                  style={{ borderTop: '1px solid oklch(1 0 0 / 5%)', background: 'oklch(1 0 0 / 1.5%)' }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
                    nativeButton={false}
                    render={<Link href="/dashboard/wheels" />}
                  >
                    View {wheels.length - 5} more wheels <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </Card>
          )}
        </div>

      </div>
    </div>
  );
}
