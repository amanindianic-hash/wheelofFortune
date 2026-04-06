'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { FlaskConical, TrendingUp, Pause, Play, CheckCheck, Trash2 } from 'lucide-react';

interface Wheel { id: string; name: string; status: string; }

interface AbTest {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'completed';
  wheel_id: string;
  variant_a_id: string;
  variant_b_id: string;
  variant_a_name: string;
  variant_b_name: string;
  traffic_split_percent: number;
  variant_a_spins: number;
  variant_b_spins: number;
  variant_a_wins: number;
  variant_b_wins: number;
  created_at: string;
}

const STATUS_BADGE: Record<string, string> = {
  active:    'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-500/20',
  paused:    'bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-1 ring-amber-500/20',
  completed: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 ring-1 ring-slate-500/20',
};

function winRate(wins: number, spins: number) {
  if (!spins) return '—';
  return `${((wins / spins) * 100).toFixed(1)}%`;
}

export default function ABTestsPage() {
  const [wheels, setWheels]     = useState<Wheel[]>([]);
  const [allTests, setAllTests] = useState<AbTest[]>([]);
  const [loading, setLoading]   = useState(true);
  const [form, setForm] = useState({ wheel_id: '', name: '', variant_b_id: '', traffic_split_percent: 50 });
  const [creating, setCreating] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const wheelsRes  = await api.get('/api/wheels');
      const wheelsJson = await wheelsRes.json();
      const wData: Wheel[] = wheelsJson.wheels || [];
      setWheels(wData);
      const testResults = await Promise.all(
        wData.map((w) =>
          api.get(`/api/wheels/${w.id}/ab-test`)
            .then((r) => r.json())
            .then((j) => (j.tests || []) as AbTest[])
            .catch(() => [] as AbTest[])
        )
      );
      setAllTests(testResults.flat());
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadData(); }, []);

  async function createTest() {
    if (!form.wheel_id || !form.name || !form.variant_b_id) { toast.error('Fill in all required fields'); return; }
    if (form.wheel_id === form.variant_b_id) { toast.error('Variant A and Variant B must be different wheels'); return; }
    setCreating(true);
    try {
      const res = await api.post(`/api/wheels/${form.wheel_id}/ab-test`, {
        name: form.name, variant_b_id: form.variant_b_id, traffic_split_percent: form.traffic_split_percent,
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      toast.success('A/B Test created!');
      setForm({ wheel_id: '', name: '', variant_b_id: '', traffic_split_percent: 50 });
      await loadData();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to create test');
    } finally { setCreating(false); }
  }

  async function updateStatus(test: AbTest, status: string) {
    try {
      const res = await api.put(`/api/wheels/${test.wheel_id}/ab-test`, { test_id: test.id, status });
      if (!res.ok) throw new Error('Failed');
      toast.success(`Test ${status}`);
      await loadData();
    } catch { toast.error('Failed to update test'); }
  }

  async function deleteTest(test: AbTest) {
    if (!confirm('Delete this A/B test permanently?')) return;
    try {
      const res = await api.del(`/api/wheels/${test.wheel_id}/ab-test?test_id=${test.id}`);
      if (!res.ok) throw new Error('Failed');
      toast.success('Test deleted');
      await loadData();
    } catch { toast.error('Failed to delete test'); }
  }

  const activeCount = allTests.filter((t) => t.status === 'active').length;

  return (
    <div className="min-h-full bg-background">
      <div className="max-w-5xl mx-auto px-6 md:px-8 py-8 space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[26px] font-bold tracking-[-0.03em]">A/B Testing</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Split traffic between two wheel variants and compare conversion rates in real time.
            </p>
          </div>
          {activeCount > 0 && (
            <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-500/20 shrink-0">
              {activeCount} active
            </Badge>
          )}
        </div>

        {/* Create form */}
        <Card>
          <CardHeader className="pb-3 pt-5 px-5">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-muted-foreground" />
              Create New A/B Test
            </CardTitle>
            <CardDescription className="text-xs">
              Choose two wheels to compare. Variant A is the control; Variant B is the challenger.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Test Name *</Label>
                <Input
                  placeholder="e.g. Summer vs Default Wheel"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Variant A — Control *</Label>
                <Select value={form.wheel_id} onValueChange={(v) => setForm({ ...form, wheel_id: v || '' })}>
                  <SelectTrigger><SelectValue placeholder="Select wheel…" /></SelectTrigger>
                  <SelectContent>
                    {wheels.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Variant B — Challenger *</Label>
                <Select value={form.variant_b_id} onValueChange={(v) => setForm({ ...form, variant_b_id: v || '' })}>
                  <SelectTrigger><SelectValue placeholder="Select wheel…" /></SelectTrigger>
                  <SelectContent>
                    {wheels.filter((w) => w.id !== form.wheel_id).map((w) => (
                      <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">
                  Traffic Split — A: {form.traffic_split_percent}% / B: {100 - form.traffic_split_percent}%
                </Label>
                <div className="relative">
                  <div className="flex h-6 rounded-full overflow-hidden border border-border bg-muted mb-1">
                    <div className="h-full bg-violet-600 transition-all duration-150" style={{ width: `${form.traffic_split_percent}%` }} />
                    <div className="h-full flex-1 bg-orange-400 opacity-60" />
                  </div>
                  <input
                    type="range"
                    min={10} max={90} step={5}
                    value={form.traffic_split_percent}
                    onChange={(e) => setForm({ ...form, traffic_split_percent: Number(e.target.value) })}
                    className="w-full accent-violet-600 h-1"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                className="bg-violet-600 hover:bg-violet-700 text-white gap-1.5"
                onClick={createTest}
                disabled={creating}
              >
                <FlaskConical className="h-3.5 w-3.5" />
                {creating ? 'Creating…' : 'Launch A/B Test'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 rounded-full border-2 border-violet-600 border-t-transparent animate-spin" />
          </div>
        ) : allTests.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-14 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 ring-1 ring-violet-500/20 mb-4">
                <FlaskConical className="h-6 w-6 text-violet-500" />
              </div>
              <p className="text-sm font-semibold mb-1">No A/B tests yet</p>
              <p className="text-xs text-muted-foreground">Create one above to start comparing wheel variants.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {allTests.map((test) => {
              const aRate = test.variant_a_spins ? (test.variant_a_wins / test.variant_a_spins) : 0;
              const bRate = test.variant_b_spins ? (test.variant_b_wins / test.variant_b_spins) : 0;
              const winner: 'a' | 'b' | null = aRate > bRate ? 'a' : bRate > aRate ? 'b' : null;

              return (
                <Card key={test.id} className="overflow-hidden">
                  {/* Card header */}
                  <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border/50">
                    <div>
                      <h3 className="text-sm font-semibold">{test.name}</h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Started {new Date(test.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium capitalize ${STATUS_BADGE[test.status]}`}>
                        {test.status}
                      </span>
                      {test.status === 'active' && (
                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => updateStatus(test, 'paused')}>
                          <Pause className="h-3 w-3" /> Pause
                        </Button>
                      )}
                      {test.status === 'paused' && (
                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => updateStatus(test, 'active')}>
                          <Play className="h-3 w-3" /> Resume
                        </Button>
                      )}
                      {test.status !== 'completed' && (
                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => updateStatus(test, 'completed')}>
                          <CheckCheck className="h-3 w-3" /> Conclude
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10" onClick={() => deleteTest(test)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Traffic split bar */}
                  <div className="px-5 py-3">
                    <div className="flex h-1.5 rounded-full overflow-hidden">
                      <div className="bg-violet-600 transition-all" style={{ width: `${test.traffic_split_percent}%` }} />
                      <div className="flex-1 bg-orange-400 opacity-60" />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-[11px] text-violet-600 dark:text-violet-400 font-medium">A: {test.traffic_split_percent}%</span>
                      <span className="text-[11px] text-orange-500 font-medium">B: {100 - test.traffic_split_percent}%</span>
                    </div>
                  </div>

                  {/* Variant comparison */}
                  <div className="grid grid-cols-2 divide-x divide-border/50 border-t border-border/50">
                    {[
                      { label: 'A', name: test.variant_a_name, spins: test.variant_a_spins, wins: test.variant_a_wins, isWinner: winner === 'a', accentBg: 'bg-violet-600', accentText: 'text-violet-600 dark:text-violet-400', badge: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300' },
                      { label: 'B', name: test.variant_b_name, spins: test.variant_b_spins, wins: test.variant_b_wins, isWinner: winner === 'b', accentBg: 'bg-orange-400', accentText: 'text-orange-500', badge: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300' },
                    ].map((v) => (
                      <div key={v.label} className={`p-4 ${v.isWinner ? 'bg-emerald-500/5' : ''}`}>
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md ${v.badge}`}>{v.label}</span>
                          <span className="text-xs font-semibold text-foreground truncate">{v.name}</span>
                          {v.isWinner && (
                            <span className="flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 ml-auto">
                              <TrendingUp className="h-3 w-3" /> Leading
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-1 text-center">
                          {[
                            { val: v.spins,                                    label: 'Spins' },
                            { val: v.wins,                                     label: 'Wins'  },
                            { val: winRate(v.wins, v.spins), label: 'Win %', accent: true },
                          ].map((m) => (
                            <div key={m.label}>
                              <p className={`text-base font-bold ${m.accent ? v.accentText : 'text-foreground'} tabular-nums`}>
                                {m.val}
                              </p>
                              <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">{m.label}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
