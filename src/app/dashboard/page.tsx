'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart2, Disc3, Trophy, Users, ArrowRight, Plus } from 'lucide-react';
import { api } from '@/lib/api-client';
import { useAuth } from '@/components/providers/auth-provider';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface AnalyticsSummary { total_spins: number; total_winners: number; unique_leads: number; }

const STATUS_MAP: Record<string, { dot: string; label: string }> = {
  active:   { dot: 'bg-emerald-500', label: 'Active' },
  draft:    { dot: 'bg-slate-400',   label: 'Draft' },
  paused:   { dot: 'bg-amber-400',   label: 'Paused' },
  archived: { dot: 'bg-rose-400',    label: 'Archived' },
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

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">

      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          Good to see you, {user?.full_name?.split(' ')[0]}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">{client?.name} — platform overview</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Total Spins"
          value={summary?.total_spins ?? 0}
          icon={<BarChart2 className="h-4 w-4" />}
          iconBg="bg-violet-500/10 text-violet-600"
          sub="Last 30 days"
        />
        <StatCard
          label="Prize Winners"
          value={summary?.total_winners ?? 0}
          icon={<Trophy className="h-4 w-4" />}
          iconBg="bg-amber-500/10 text-amber-600"
          sub="Last 30 days"
        />
        <StatCard
          label="Leads Captured"
          value={summary?.unique_leads ?? 0}
          icon={<Users className="h-4 w-4" />}
          iconBg="bg-blue-500/10 text-blue-600"
          sub="Last 30 days"
        />
        <StatCard
          label="Active Wheels"
          value={activeWheels}
          icon={<Disc3 className="h-4 w-4" />}
          iconBg="bg-emerald-500/10 text-emerald-600"
          sub="Running now"
        />
      </div>

      {/* Monthly quota */}
      {client && (
        <Card>
          <CardContent className="py-5 px-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium">Monthly spin quota</p>
                <p className="text-xs text-muted-foreground mt-0.5 capitalize">{client.plan} plan</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold tabular-nums">
                  {client.spins_used_this_month.toLocaleString()}
                  <span className="text-muted-foreground font-normal"> / {client.plan_spin_limit.toLocaleString()}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{usedPct.toFixed(0)}% used</p>
              </div>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  usedPct >= 90 ? 'bg-rose-500' : usedPct >= 70 ? 'bg-amber-400' : 'bg-violet-600'
                }`}
                style={{ width: `${usedPct}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Wheels list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Your Wheels</h2>
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
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-14 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted mb-4">
                <Disc3 className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium mb-1">No wheels yet</p>
              <p className="text-xs text-muted-foreground mb-5">Create your first spin-to-win campaign to start collecting leads</p>
              <Button
                size="sm"
                className="bg-violet-600 hover:bg-violet-700 gap-1.5"
                nativeButton={false}
                render={<Link href="/dashboard/wheels" />}
              >
                <Plus className="h-3.5 w-3.5" /> Create Wheel
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <div className="divide-y">
              {wheels.slice(0, 5).map((w) => {
                const s = STATUS_MAP[w.status] ?? STATUS_MAP.draft;
                return (
                  <div key={w.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/40 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted shrink-0">
                        <Disc3 className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{w.name}</p>
                        <p className="text-xs text-muted-foreground tabular-nums">{w.total_spins.toLocaleString()} spins</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                        <span className="text-xs text-muted-foreground">{s.label}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
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
          </Card>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label, value, icon, iconBg, sub,
}: {
  label: string; value: number; icon: React.ReactNode; iconBg: string; sub: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${iconBg}`}>
            {icon}
          </div>
        </div>
        <p className="text-2xl font-semibold tabular-nums tracking-tight">{value.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground mt-1">{sub}</p>
      </CardContent>
    </Card>
  );
}
