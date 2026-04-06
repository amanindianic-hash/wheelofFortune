'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { useAuth } from '@/components/providers/auth-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AnalyticsSummary { total_spins: number; total_winners: number; unique_leads: number; }

export default function DashboardPage() {
  const { user, client } = useAuth();
  const [wheels, setWheels] = useState<{ id: string; name: string; status: string; total_spins: number }[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);

  useEffect(() => {
    api.get('/api/wheels').then((r) => r.json()).then((d) => setWheels(d.wheels ?? []));
    api.get('/api/analytics').then((r) => r.json()).then((d) => setSummary(d.summary));
  }, []);

  const activeWheels = wheels.filter((w) => w.status === 'active').length;

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {user?.full_name?.split(' ')[0]} 👋</h1>
        <p className="text-muted-foreground">{client?.name} — here&apos;s your platform overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Spins (30d)" value={summary?.total_spins ?? 0} icon="🎰" />
        <StatCard title="Prize Winners (30d)" value={summary?.total_winners ?? 0} icon="🏆" />
        <StatCard title="Leads Captured (30d)" value={summary?.unique_leads ?? 0} icon="📧" />
        <StatCard title="Active Wheels" value={activeWheels} icon="🎡" />
      </div>

      {/* Spin quota */}
      {client && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Spin Quota</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-bold">{client.spins_used_this_month.toLocaleString()}</span>
              <span className="text-sm text-muted-foreground">of {client.plan_spin_limit.toLocaleString()}</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-violet-600 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(100, (client.spins_used_this_month / client.plan_spin_limit) * 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent wheels */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your Wheels</h2>
          <Button size="sm" className="bg-violet-600 hover:bg-violet-700" nativeButton={false} render={<Link href="/dashboard/wheels" />}>
            View All
          </Button>
        </div>
        {wheels.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <p className="text-4xl mb-3">🎡</p>
              <p className="font-medium">No wheels yet</p>
              <p className="text-sm text-muted-foreground mb-4">Create your first spin-to-win campaign</p>
              <Button className="bg-violet-600 hover:bg-violet-700" nativeButton={false} render={<Link href="/dashboard/wheels" />}>
                Create Wheel
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {wheels.slice(0, 5).map((w) => (
              <Card key={w.id} className="hover:shadow-md transition-shadow">
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🎡</span>
                    <div>
                      <p className="font-medium">{w.name}</p>
                      <p className="text-xs text-muted-foreground">{w.total_spins.toLocaleString()} spins total</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={w.status} />
                    <Button variant="outline" size="sm" nativeButton={false} render={<Link href={`/dashboard/wheels/${w.id}`} />}>
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: number; icon: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-5">
        <span className="text-3xl">{icon}</span>
        <div>
          <p className="text-2xl font-bold">{value.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">{title}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    draft: 'bg-gray-100 text-gray-600',
    paused: 'bg-yellow-100 text-yellow-700',
    archived: 'bg-red-100 text-red-600',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${map[status] ?? 'bg-gray-100'}`}>
      {status}
    </span>
  );
}
