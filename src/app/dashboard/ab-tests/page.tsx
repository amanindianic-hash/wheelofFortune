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

interface Wheel {
  id: string;
  name: string;
  status: string;
}

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

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  paused: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-gray-100 text-gray-600',
};

function winRate(wins: number, spins: number) {
  if (!spins) return '—';
  return `${((wins / spins) * 100).toFixed(1)}%`;
}

export default function ABTestsPage() {
  const [wheels, setWheels] = useState<Wheel[]>([]);
  const [allTests, setAllTests] = useState<AbTest[]>([]);
  const [loading, setLoading] = useState(true);

  // New test form
  const [form, setForm] = useState({
    wheel_id: '',
    name: '',
    variant_b_id: '',
    traffic_split_percent: 50,
  });
  const [creating, setCreating] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const wheelsRes = await api.get('/api/wheels');
      const wheelsJson = await wheelsRes.json();
      const wData: Wheel[] = wheelsJson.wheels || [];
      setWheels(wData);

      // Fetch tests for all wheels in parallel
      const testResults = await Promise.all(
        wData.map((w) =>
          api.get(`/api/wheels/${w.id}/ab-test`)
            .then((r) => r.json())
            .then((j) => (j.tests || []) as AbTest[])
            .catch(() => [] as AbTest[])
        )
      );
      setAllTests(testResults.flat());
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  async function createTest() {
    if (!form.wheel_id || !form.name || !form.variant_b_id) {
      toast.error('Fill in all required fields');
      return;
    }
    if (form.wheel_id === form.variant_b_id) {
      toast.error('Variant A and Variant B must be different wheels');
      return;
    }
    setCreating(true);
    try {
      const res = await api.post(`/api/wheels/${form.wheel_id}/ab-test`, {
        name: form.name,
        variant_b_id: form.variant_b_id,
        traffic_split_percent: form.traffic_split_percent,
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      toast.success('A/B Test created!');
      setForm({ wheel_id: '', name: '', variant_b_id: '', traffic_split_percent: 50 });
      await loadData();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to create test');
    } finally {
      setCreating(false);
    }
  }

  async function updateStatus(test: AbTest, status: string) {
    try {
      const res = await api.put(`/api/wheels/${test.wheel_id}/ab-test`, { test_id: test.id, status });
      if (!res.ok) throw new Error('Failed');
      toast.success(`Test ${status}`);
      await loadData();
    } catch {
      toast.error('Failed to update test');
    }
  }

  async function deleteTest(test: AbTest) {
    if (!confirm('Delete this A/B test permanently?')) return;
    try {
      const res = await api.del(`/api/wheels/${test.wheel_id}/ab-test?test_id=${test.id}`);
      if (!res.ok) throw new Error('Failed');
      toast.success('Test deleted');
      await loadData();
    } catch {
      toast.error('Failed to delete test');
    }
  }

  const activeCount = allTests.filter((t) => t.status === 'active').length;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">A/B Testing</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Split traffic between two wheel variants and compare conversion rates in real time.
          </p>
        </div>
        <Badge className={activeCount > 0 ? 'bg-green-100 text-green-700' : ''}>
          {activeCount} active test{activeCount !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Create Test Card */}
      <Card className="border-violet-100 shadow">
        <CardHeader>
          <CardTitle className="text-base">Create New A/B Test</CardTitle>
          <CardDescription>
            Choose two wheels to compare. Variant A is the &quot;control&quot;; Variant B is the challenger.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Test Name *</Label>
              <Input
                placeholder="e.g. Summer vs Default Wheel"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Variant A — Control Wheel *</Label>
              <Select value={form.wheel_id} onValueChange={(v) => setForm({ ...form, wheel_id: v || '' })}>
                <SelectTrigger><SelectValue placeholder="Select wheel…" /></SelectTrigger>
                <SelectContent>
                  {wheels.map((w) => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Variant B — Challenger Wheel *</Label>
              <Select value={form.variant_b_id} onValueChange={(v) => setForm({ ...form, variant_b_id: v || '' })}>
                <SelectTrigger><SelectValue placeholder="Select wheel…" /></SelectTrigger>
                <SelectContent>
                  {wheels.filter((w) => w.id !== form.wheel_id).map((w) => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>
                Traffic Split — Variant A gets {form.traffic_split_percent}%, Variant B gets {100 - form.traffic_split_percent}%
              </Label>
              <input
                type="range"
                min={10}
                max={90}
                step={5}
                value={form.traffic_split_percent}
                onChange={(e) => setForm({ ...form, traffic_split_percent: Number(e.target.value) })}
                className="w-full accent-violet-600"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              className="bg-violet-600 hover:bg-violet-700"
              onClick={createTest}
              disabled={creating}
            >
              {creating ? 'Creating…' : 'Launch A/B Test'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {loading ? (
        <p className="text-center text-muted-foreground py-12">Loading tests…</p>
      ) : allTests.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-4xl mb-3">🧪</p>
            <p className="text-muted-foreground">No A/B tests yet. Create one above to get started.</p>
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
                <div className="flex items-center justify-between px-5 pt-4 pb-2">
                  <div>
                    <h3 className="font-semibold text-base">{test.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      Created {new Date(test.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[test.status]}`}>
                      {test.status}
                    </span>
                    {test.status === 'active' && (
                      <Button variant="outline" size="sm" onClick={() => updateStatus(test, 'paused')}>Pause</Button>
                    )}
                    {test.status === 'paused' && (
                      <Button variant="outline" size="sm" onClick={() => updateStatus(test, 'active')}>Resume</Button>
                    )}
                    {test.status !== 'completed' && (
                      <Button variant="outline" size="sm" onClick={() => updateStatus(test, 'completed')}>
                        Conclude
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="text-red-500" onClick={() => deleteTest(test)}>
                      Delete
                    </Button>
                  </div>
                </div>

                {/* Traffic bar */}
                <div className="mx-5 h-2 rounded-full overflow-hidden bg-gray-100 mb-4">
                  <div className="h-full bg-violet-500 rounded-full" style={{ width: `${test.traffic_split_percent}%` }} />
                </div>

                {/* Variant comparison */}
                <div className="grid grid-cols-2 divide-x border-t">
                  {/* Variant A */}
                  <div className={`p-4 ${winner === 'a' ? 'bg-green-50' : ''}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold bg-violet-100 text-violet-700 px-2 py-0.5 rounded">A</span>
                      <span className="text-sm font-medium truncate">{test.variant_a_name}</span>
                      {winner === 'a' && <span className="text-xs text-green-600 font-semibold">🏆 Leading</span>}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-lg font-bold">{test.variant_a_spins}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Spins</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold">{test.variant_a_wins}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Wins</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-violet-600">{winRate(test.variant_a_wins, test.variant_a_spins)}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Win Rate</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Traffic: {test.traffic_split_percent}%</p>
                  </div>

                  {/* Variant B */}
                  <div className={`p-4 ${winner === 'b' ? 'bg-green-50' : ''}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded">B</span>
                      <span className="text-sm font-medium truncate">{test.variant_b_name}</span>
                      {winner === 'b' && <span className="text-xs text-green-600 font-semibold">🏆 Leading</span>}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-lg font-bold">{test.variant_b_spins}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Spins</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold">{test.variant_b_wins}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Wins</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-orange-500">{winRate(test.variant_b_wins, test.variant_b_spins)}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Win Rate</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Traffic: {100 - test.traffic_split_percent}%</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
