'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart2, Disc3, Trophy, Users, ArrowRight, Plus, TrendingUp, Sparkles } from 'lucide-react';
import { api } from '@/lib/api-client';
import { useAuth } from '@/components/providers/auth-provider';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface AnalyticsSummary { total_spins: number; total_winners: number; unique_leads: number; }

const STATUS_MAP: Record<string, { dot: string; badge: string; label: string }> = {
  active:   { dot: 'bg-emerald-400', badge: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20', label: 'Active' },
  draft:    { dot: 'bg-slate-500',   badge: 'bg-slate-500/10 text-slate-400 ring-slate-500/20',       label: 'Draft' },
  paused:   { dot: 'bg-amber-400',   badge: 'bg-amber-500/10 text-amber-400 ring-amber-500/20',       label: 'Paused' },
  archived: { dot: 'bg-rose-400',    badge: 'bg-rose-500/10 text-rose-400 ring-rose-500/20',          label: 'Archived' },
};

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

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">

      {/* ── Page Header ─────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          {/* Hero greeting */}
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4 text-violet-400" />
            <span className="text-xs font-medium text-violet-400 uppercase tracking-widest">Dashboard</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Welcome back, {firstName} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {client?.name} — here&apos;s what&apos;s happening with your campaigns
          </p>
        </div>
        <Button
          size="sm"
          className="bg-violet-600 hover:bg-violet-700 gap-1.5 shadow-[0_0_16px_0_rgb(124_58_237/0.35)] hover:shadow-[0_0_24px_0_rgb(124_58_237/0.45)] hidden md:inline-flex"
          nativeButton={false}
          render={<Link href="/dashboard/wheels" />}
        >
          <Plus className="h-3.5 w-3.5" />
          New Wheel
        </Button>
      </div>

      {/* ── Stat Cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Spins"
          value={summary?.total_spins ?? 0}
          icon={<BarChart2 className="h-4 w-4" />}
          iconClass="bg-violet-500/10 text-violet-400"
          glowColor="rgb(139 92 246)"
          sub="Last 30 days"
          trend={null}
        />
        <StatCard
          label="Prize Winners"
          value={summary?.total_winners ?? 0}
          icon={<Trophy className="h-4 w-4" />}
          iconClass="bg-amber-500/10 text-amber-400"
          glowColor="rgb(245 158 11)"
          sub="Last 30 days"
          trend={null}
        />
        <StatCard
          label="Leads Captured"
          value={summary?.unique_leads ?? 0}
          icon={<Users className="h-4 w-4" />}
          iconClass="bg-blue-500/10 text-blue-400"
          glowColor="rgb(59 130 246)"
          sub="Last 30 days"
          trend={null}
        />
        <StatCard
          label="Active Wheels"
          value={activeWheels}
          icon={<Disc3 className="h-4 w-4" />}
          iconClass="bg-emerald-500/10 text-emerald-400"
          glowColor="rgb(16 185 129)"
          sub="Running now"
          trend={null}
        />
      </div>

      {/* ── Monthly Quota Card ───────────────────────────────── */}
      {client && (
        <Card className="overflow-hidden">
          {/* Gradient accent bar at top */}
          <div
            className="h-[2px] w-full"
            style={{
              background: usedPct >= 90
                ? 'linear-gradient(90deg, #f43f5e, #fb7185)'
                : usedPct >= 70
                  ? 'linear-gradient(90deg, #f59e0b, #fcd34d)'
                  : 'linear-gradient(90deg, #7c3aed, #a78bfa)',
            }}
          />
          <CardContent className="py-5 px-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-semibold tracking-tight">Monthly Spin Quota</p>
                <p className="text-xs text-muted-foreground mt-0.5 capitalize">{client.plan} plan</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold tabular-nums text-foreground">
                  {client.spins_used_this_month.toLocaleString()}
                  <span className="text-muted-foreground font-normal"> / {client.plan_spin_limit.toLocaleString()}</span>
                </p>
                <p className={`text-xs mt-0.5 font-medium ${usedPct >= 90 ? 'text-rose-400' : usedPct >= 70 ? 'text-amber-400' : 'text-muted-foreground'}`}>
                  {usedPct.toFixed(0)}% used
                </p>
              </div>
            </div>
            {/* Progress track */}
            <div className="h-2 w-full rounded-full overflow-hidden bg-muted/60">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${
                  usedPct >= 90 ? 'bg-gradient-to-r from-rose-500 to-pink-500'
                  : usedPct >= 70 ? 'bg-gradient-to-r from-amber-400 to-yellow-300'
                  : 'bg-gradient-to-r from-violet-600 to-violet-400'
                }`}
                style={{ width: `${usedPct}%` }}
              />
            </div>
            {usedPct >= 80 && (
              <p className="text-xs text-amber-400 mt-3 flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5" />
                Approaching your monthly limit. Consider upgrading your plan.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Wheels List ─────────────────────────────────────── */}
      <div className="space-y-3">
        {/* Section header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold tracking-tight">Your Wheels</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{wheels.length} campaign{wheels.length !== 1 ? 's' : ''} total</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
            nativeButton={false}
            render={<Link href="/dashboard/wheels" />}
          >
            View all <ArrowRight className="h-3 w-3" />
          </Button>
        </div>

        {wheels.length === 0 ? (
          /* ── Empty State ────────────────────────────────── */
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              {/* Icon backdrop */}
              <div className="relative mb-5">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 ring-1 ring-violet-500/20">
                  <Disc3 className="h-7 w-7 text-violet-400" />
                </div>
                <div className="absolute -inset-1 rounded-2xl bg-violet-500/5 blur-sm" />
              </div>
              <p className="text-sm font-semibold mb-1 tracking-tight">No wheels yet</p>
              <p className="text-xs text-muted-foreground mb-6 max-w-xs leading-relaxed">
                Create your first spin-to-win campaign and start collecting leads and rewarding customers.
              </p>
              <Button
                size="sm"
                className="bg-violet-600 hover:bg-violet-700 gap-1.5 shadow-[0_0_16px_0_rgb(124_58_237/0.3)]"
                nativeButton={false}
                render={<Link href="/dashboard/wheels" />}
              >
                <Plus className="h-3.5 w-3.5" />
                Create your first wheel
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* ── Wheels Table ────────────────────────────────── */
          <Card className="overflow-hidden p-0 py-0 gap-0">
            <div className="divide-y divide-border/60">
              {wheels.slice(0, 5).map((w, i) => {
                const s = STATUS_MAP[w.status] ?? STATUS_MAP.draft;
                return (
                  <div
                    key={w.id}
                    className="flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors duration-150 group"
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    {/* Left — icon + name */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/60 ring-1 ring-border/50 shrink-0 group-hover:ring-violet-500/30 transition-all duration-150">
                        <Disc3 className="h-4 w-4 text-muted-foreground group-hover:text-violet-400 transition-colors duration-150" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate leading-none tracking-tight">{w.name}</p>
                        <p className="text-xs text-muted-foreground tabular-nums mt-1">
                          {w.total_spins.toLocaleString()} spins
                        </p>
                      </div>
                    </div>

                    {/* Right — status + edit */}
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ${s.badge}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                        {s.label}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                        nativeButton={false}
                        render={<Link href={`/dashboard/wheels/${w.id}`} />}
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer link if more than 5 */}
            {wheels.length > 5 && (
              <div className="px-5 py-3 border-t border-border/60 bg-muted/20">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground w-full justify-center"
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
  );
}

/* ── StatCard Component ──────────────────────────────────────────── */

function StatCard({
  label, value, icon, iconClass, glowColor, sub,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  iconClass: string;
  glowColor: string;
  sub: string;
  trend: null;
}) {
  return (
    <Card className="transition-all duration-200 hover:ring-foreground/[0.12] hover:-translate-y-0.5">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <p className="text-xs font-medium text-muted-foreground tracking-wide uppercase">{label}</p>
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-lg ring-1 ring-inset ${iconClass}`}
            style={{ boxShadow: `0 0 12px 0 ${glowColor}22` }}
          >
            {icon}
          </div>
        </div>
        <p className="text-2xl font-bold tabular-nums tracking-tight text-foreground">
          {value.toLocaleString()}
        </p>
        <p className="text-xs text-muted-foreground mt-1.5">{sub}</p>
      </CardContent>
    </Card>
  );
}
