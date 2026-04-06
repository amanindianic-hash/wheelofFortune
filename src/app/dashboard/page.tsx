'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BarChart2, Disc3, Trophy, Users,
  ArrowRight, Plus, Zap, TrendingUp,
  ChevronRight, Activity,
} from 'lucide-react';
import { api } from '@/lib/api-client';
import { useAuth } from '@/components/providers/auth-provider';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface AnalyticsSummary {
  total_spins: number;
  total_winners: number;
  unique_leads: number;
}

const STATUS_CONFIG: Record<string, { dot: string; label: string; badge: string }> = {
  active:   { dot: 'bg-emerald-500', label: 'Active',   badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20' },
  draft:    { dot: 'bg-slate-400',   label: 'Draft',    badge: 'bg-slate-500/10 text-slate-500 dark:text-slate-400 ring-1 ring-slate-500/20' },
  paused:   { dot: 'bg-amber-400',   label: 'Paused',   badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20' },
  archived: { dot: 'bg-rose-400',    label: 'Archived', badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/20' },
};

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  iconClass: string;
  sub: string;
  topBarClass: string;
}

function StatCard({ label, value, icon, iconClass, sub, topBarClass }: StatCardProps) {
  return (
    <Card className="relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5">
      <div className={`absolute inset-x-0 top-0 h-[2px] ${topBarClass}`} />
      <CardContent className="p-5 pt-6">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconClass} mb-4`}>
          {icon}
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground mb-1.5">{label}</p>
        <p className="text-[36px] font-bold tabular-nums tracking-[-0.04em] leading-none text-foreground">
          {value.toLocaleString()}
        </p>
        <p className="text-[11px] text-muted-foreground mt-2">{sub}</p>
      </CardContent>
    </Card>
  );
}

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
  const firstName = user?.full_name?.split(' ')[0] ?? 'there';

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
              {client?.name} — {activeWheels > 0
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
            sub="Last 30 days"
          />
          <StatCard
            label="Prize Winners"
            value={summary?.total_winners ?? 0}
            icon={<Trophy className="h-4 w-4 text-amber-600 dark:text-amber-400" />}
            iconClass="bg-amber-500/10"
            topBarClass="bg-gradient-to-r from-amber-500 to-yellow-400"
            sub="Last 30 days"
          />
          <StatCard
            label="Leads Captured"
            value={summary?.unique_leads ?? 0}
            icon={<Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
            iconClass="bg-blue-500/10"
            topBarClass="bg-gradient-to-r from-blue-600 to-blue-400"
            sub="Last 30 days"
          />
          <StatCard
            label="Active Wheels"
            value={activeWheels}
            icon={<Disc3 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
            iconClass="bg-emerald-500/10"
            topBarClass="bg-gradient-to-r from-emerald-600 to-emerald-400"
            sub="Running now"
          />
        </div>

        {/* ── Quota + Wheels two-column ────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Monthly Quota */}
          {client && (
            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
              {/* Top bar */}
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
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/10">
                    <Activity className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground leading-none">Monthly Usage</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 capitalize">{client.plan} plan</p>
                  </div>
                </div>

                <div>
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="text-[28px] font-bold tabular-nums tracking-[-0.03em] leading-none text-foreground">
                      {client.spins_used_this_month.toLocaleString()}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      of {client.plan_spin_limit.toLocaleString()}
                    </span>
                  </div>
                  {/* Progress track */}
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${usedPct}%`,
                        background: usedPct >= 90
                          ? 'linear-gradient(90deg,#ef4444,#f87171)'
                          : usedPct >= 70
                          ? 'linear-gradient(90deg,#f59e0b,#fcd34d)'
                          : 'linear-gradient(90deg,#7c3aed,#a78bfa)',
                      }}
                    />
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <span className="text-[11px] text-muted-foreground">
                      {(client.plan_spin_limit - client.spins_used_this_month).toLocaleString()} remaining
                    </span>
                    <span className={`text-[11px] font-semibold tabular-nums ${
                      usedPct >= 90 ? 'text-rose-500' : usedPct >= 70 ? 'text-amber-500' : 'text-muted-foreground'
                    }`}>
                      {usedPct.toFixed(0)}%
                    </span>
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

          {/* Wheels list */}
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
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted group-hover:bg-violet-500/10 transition-colors duration-150">
                            <Disc3 className="h-3.5 w-3.5 text-muted-foreground group-hover:text-violet-500 transition-colors duration-150" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate leading-none">{w.name}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5 tabular-nums">
                              {w.total_spins.toLocaleString()} spins
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium ${s.badge}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
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

        {/* ── Recent Activity (if spins exist) ─────────────────── */}
        {(summary?.total_spins ?? 0) > 0 && (
          <div className="rounded-xl border border-border bg-card shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">Performance Summary</h2>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                {
                  label: 'Win Rate',
                  value: summary && summary.total_spins > 0
                    ? `${((summary.total_winners / summary.total_spins) * 100).toFixed(1)}%`
                    : '—',
                  color: 'text-emerald-600 dark:text-emerald-400',
                },
                {
                  label: 'Lead Rate',
                  value: summary && summary.total_spins > 0
                    ? `${((summary.unique_leads / summary.total_spins) * 100).toFixed(1)}%`
                    : '—',
                  color: 'text-blue-600 dark:text-blue-400',
                },
                {
                  label: 'Avg / Wheel',
                  value: wheels.length > 0
                    ? Math.round((summary?.total_spins ?? 0) / wheels.length).toLocaleString()
                    : '—',
                  color: 'text-violet-600 dark:text-violet-400',
                },
              ].map((m) => (
                <div key={m.label} className="text-center">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground mb-1">{m.label}</p>
                  <p className={`text-[28px] font-bold tabular-nums tracking-[-0.03em] leading-none ${m.color}`}>{m.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
