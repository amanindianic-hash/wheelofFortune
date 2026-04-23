'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
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
  active:    'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20',
  paused:    'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20',
  completed: 'bg-slate-500/10 text-slate-400 ring-1 ring-slate-500/20',
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
    <div className="min-h-full bg-[#13131b]">
      <div className="max-w-5xl mx-auto px-6 md:px-8 py-8 space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-violet-400 mb-1">Experiments</p>
            <h1 className="text-[26px] font-bold tracking-[-0.03em] text-white">A/B Testing</h1>
            <p className="text-sm text-white/50 mt-0.5">
              Split traffic between two wheel variants and compare conversion rates in real time.
            </p>
          </div>
          {activeCount > 0 && (
            <span className="inline-flex items-center rounded-full bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20 px-3 py-1 text-xs font-semibold shrink-0">
              {activeCount} active
            </span>
          )}
        </div>

        {/* Create form */}
        <div className="rounded-2xl border border-white/5 bg-[rgba(31,31,40,0.7)] backdrop-blur-xl overflow-hidden">
          <div className="px-6 pt-5 pb-4 border-b border-white/5">
            <div className="flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-white/40" />
              <p className="text-sm font-semibold text-white">Create New A/B Test</p>
            </div>
            <p className="text-xs text-white/40 mt-0.5 ml-6">
              Choose two wheels to compare. Variant A is the control; Variant B is the challenger.
            </p>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/70">Test Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Summer vs Default Wheel"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-white placeholder:text-white/30 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/70">Variant A — Control *</label>
                <Select value={form.wheel_id} onValueChange={(v) => setForm({ ...form, wheel_id: v || '' })}>
                  <SelectTrigger className="border-white/10 bg-white/5 text-white/70 h-10">
                    <SelectValue placeholder="Select wheel…" />
                  </SelectTrigger>
                  <SelectContent>
                    {wheels.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/70">Variant B — Challenger *</label>
                <Select value={form.variant_b_id} onValueChange={(v) => setForm({ ...form, variant_b_id: v || '' })}>
                  <SelectTrigger className="border-white/10 bg-white/5 text-white/70 h-10">
                    <SelectValue placeholder="Select wheel…" />
                  </SelectTrigger>
                  <SelectContent>
                    {wheels.filter((w) => w.id !== form.wheel_id).map((w) => (
                      <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-white/70">
                  Traffic Split — A: {form.traffic_split_percent}% / B: {100 - form.traffic_split_percent}%
                </label>
                <div className="flex h-6 rounded-full overflow-hidden border border-white/10 bg-white/5 mb-1">
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
            <div className="flex justify-end">
              <button
                className="h-9 px-5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold flex items-center gap-1.5 shadow-[0_0_0_1px_rgba(124,58,237,0.4),0_4px_12px_-2px_rgba(124,58,237,0.35)] transition-all disabled:opacity-50"
                onClick={createTest}
                disabled={creating}
              >
                <FlaskConical className="h-3.5 w-3.5" />
                {creating ? 'Creating…' : 'Launch A/B Test'}
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 rounded-full border-2 border-violet-600 border-t-transparent animate-spin" />
          </div>
        ) : allTests.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-[rgba(31,31,40,0.4)] overflow-hidden">
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 ring-1 ring-violet-500/20 mb-4">
                <FlaskConical className="h-6 w-6 text-violet-400" />
              </div>
              <p className="text-sm font-semibold text-white mb-1">No A/B tests yet</p>
              <p className="text-xs text-white/40">Create one above to start comparing wheel variants.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {allTests.map((test) => {
              const aRate = test.variant_a_spins ? (test.variant_a_wins / test.variant_a_spins) : 0;
              const bRate = test.variant_b_spins ? (test.variant_b_wins / test.variant_b_spins) : 0;
              const winner: 'a' | 'b' | null = aRate > bRate ? 'a' : bRate > aRate ? 'b' : null;

              return (
                <div key={test.id} className="rounded-2xl border border-white/5 bg-[rgba(31,31,40,0.7)] backdrop-blur-xl overflow-hidden">
                  {/* Card header */}
                  <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/5">
                    <div>
                      <h3 className="text-sm font-semibold text-white">{test.name}</h3>
                      <p className="text-[11px] text-white/40 mt-0.5">
                        Started {new Date(test.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium capitalize ${STATUS_BADGE[test.status]}`}>
                        {test.status}
                      </span>
                      {test.status === 'active' && (
                        <button
                          className="h-7 px-2.5 rounded-md border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 text-xs flex items-center gap-1 transition-colors"
                          onClick={() => updateStatus(test, 'paused')}
                        >
                          <Pause className="h-3 w-3" /> Pause
                        </button>
                      )}
                      {test.status === 'paused' && (
                        <button
                          className="h-7 px-2.5 rounded-md border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 text-xs flex items-center gap-1 transition-colors"
                          onClick={() => updateStatus(test, 'active')}
                        >
                          <Play className="h-3 w-3" /> Resume
                        </button>
                      )}
                      {test.status !== 'completed' && (
                        <button
                          className="h-7 px-2.5 rounded-md border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 text-xs flex items-center gap-1 transition-colors"
                          onClick={() => updateStatus(test, 'completed')}
                        >
                          <CheckCheck className="h-3 w-3" /> Conclude
                        </button>
                      )}
                      <button
                        className="h-7 w-7 rounded-md flex items-center justify-center text-white/30 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        onClick={() => deleteTest(test)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Traffic split bar */}
                  <div className="px-5 py-3">
                    <div className="flex h-1.5 rounded-full overflow-hidden">
                      <div className="bg-violet-600 transition-all" style={{ width: `${test.traffic_split_percent}%` }} />
                      <div className="flex-1 bg-orange-400 opacity-60" />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-[11px] text-violet-400 font-medium">A: {test.traffic_split_percent}%</span>
                      <span className="text-[11px] text-orange-400 font-medium">B: {100 - test.traffic_split_percent}%</span>
                    </div>
                  </div>

                  {/* Variant comparison */}
                  <div className="grid grid-cols-2 divide-x divide-white/5 border-t border-white/5">
                    {[
                      { label: 'A', name: test.variant_a_name, spins: test.variant_a_spins, wins: test.variant_a_wins, isWinner: winner === 'a', accentText: 'text-violet-400', badge: 'bg-violet-500/15 text-violet-300' },
                      { label: 'B', name: test.variant_b_name, spins: test.variant_b_spins, wins: test.variant_b_wins, isWinner: winner === 'b', accentText: 'text-orange-400',  badge: 'bg-orange-500/15 text-orange-300' },
                    ].map((v) => (
                      <div key={v.label} className={`p-4 ${v.isWinner ? 'bg-emerald-500/5' : ''}`}>
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md ${v.badge}`}>{v.label}</span>
                          <span className="text-xs font-semibold text-white truncate">{v.name}</span>
                          {v.isWinner && (
                            <span className="flex items-center gap-0.5 text-[10px] font-semibold text-emerald-400 ml-auto">
                              <TrendingUp className="h-3 w-3" /> Leading
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-1 text-center">
                          {[
                            { val: v.spins,                  label: 'Spins' },
                            { val: v.wins,                   label: 'Wins'  },
                            { val: winRate(v.wins, v.spins), label: 'Win %', accent: true },
                          ].map((m) => (
                            <div key={m.label}>
                              <p className={`text-base font-bold tabular-nums ${m.accent ? v.accentText : 'text-white'}`}>
                                {m.val}
                              </p>
                              <p className="text-[9px] text-white/30 uppercase tracking-wider mt-0.5">{m.label}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
