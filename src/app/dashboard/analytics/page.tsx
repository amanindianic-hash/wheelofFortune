'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';

interface Summary { total_spins: number; total_winners: number; unique_leads: number; }
interface DailyRow { date: string; spins: number; winners: number; }
interface PrizeRow { display_title: string; type: string; win_count: number; }
interface SegmentRow { label: string; position: number; spin_count: number; }
interface DeviceRow { device_type: string; count: number; }
interface OsRow { os: string; count: number; }

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [daily, setDaily] = useState<DailyRow[]>([]);
  const [prizes, setPrizes] = useState<PrizeRow[]>([]);
  const [segments, setSegments] = useState<SegmentRow[]>([]);
  const [deviceBreakdown, setDeviceBreakdown] = useState<DeviceRow[]>([]);
  const [osBreakdown, setOsBreakdown] = useState<OsRow[]>([]);
  const [wheels, setWheels] = useState<{ id: string; name: string }[]>([]);
  const [selectedWheel, setSelectedWheel] = useState('all');
  const [range, setRange] = useState('30');
  const [exporting, setExporting] = useState(false);

  async function load() {
    const from = new Date(Date.now() - parseInt(range) * 86400000).toISOString();
    const query = selectedWheel !== 'all' ? `&wheel_id=${selectedWheel}` : '';
    const res = await api.get(`/api/analytics?from=${from}${query}`);
    const data = await res.json();
    if (res.ok) {
      setSummary(data.summary);
      setDaily(data.daily ?? []);
      setPrizes(data.prize_breakdown ?? []);
      setSegments(data.segment_breakdown ?? []);
      setDeviceBreakdown(data.device_breakdown ?? []);
      setOsBreakdown(data.os_breakdown ?? []);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const query = selectedWheel !== 'all' ? `?wheel_id=${selectedWheel}` : '';
      const res = await fetch(`/api/analytics/export${query}`);
      if (!res.ok) throw new Error('Export failed');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error(err);
    } finally {
      setExporting(false);
    }
  }

  useEffect(() => {
    api.get('/api/wheels').then(r => r.json()).then(d => setWheels(d.wheels ?? []));
  }, []);

  useEffect(() => { load(); }, [selectedWheel, range]);

  const winRate = summary && summary.total_spins > 0
    ? ((summary.total_winners / summary.total_spins) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Spin performance and lead capture data</p>
        </div>
        <div className="flex gap-3">
          <Select value={selectedWheel} onValueChange={(v) => setSelectedWheel(v ?? 'all')}>
            <SelectTrigger className="w-48"><SelectValue placeholder="All Wheels" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Wheels</SelectItem>
              {wheels.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={range} onValueChange={(v) => setRange(v ?? '30')}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            className="flex items-center gap-2" 
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Spins" value={summary?.total_spins ?? 0} icon="🎰" />
        <StatCard label="Winners" value={summary?.total_winners ?? 0} icon="🏆" />
        <StatCard label="Unique Leads" value={summary?.unique_leads ?? 0} icon="📧" />
        <StatCard label="Win Rate" value={`${winRate}%`} icon="📊" />
      </div>

      {/* Daily chart (simple bar) */}
      {daily.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Daily Spins</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-end gap-1 h-32">
              {daily.map((d) => {
                const max = Math.max(...daily.map(r => r.spins), 1);
                const pct = (d.spins / max) * 100;
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1" title={`${d.date}: ${d.spins} spins`}>
                    <div className="w-full bg-violet-200 rounded-t-sm relative" style={{ height: `${Math.max(pct, 2)}%` }}>
                      <div className="absolute bottom-0 left-0 right-0 bg-violet-600 rounded-t-sm"
                        style={{ height: `${d.winners > 0 ? (d.winners / d.spins) * 100 : 0}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>{daily[0]?.date}</span>
              <span className="flex items-center gap-3">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-violet-200 inline-block" />Spins</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-violet-600 inline-block" />Winners</span>
              </span>
              <span>{daily[daily.length - 1]?.date}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Prize breakdown */}
        <Card>
          <CardHeader><CardTitle className="text-base">Prize Distribution</CardTitle></CardHeader>
          <CardContent>
            {prizes.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No prize wins in this period</p>
            ) : (
              <div className="space-y-2">
                {prizes.map((p, i) => {
                  const maxCount = prizes[0].win_count;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-sm flex-1 truncate">{p.display_title}</span>
                      <div className="w-24 bg-secondary rounded-full h-2">
                        <div className="bg-violet-600 h-2 rounded-full" style={{ width: `${(p.win_count / maxCount) * 100}%` }} />
                      </div>
                      <span className="text-sm font-medium w-8 text-right">{p.win_count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Segment breakdown */}
        <Card>
          <CardHeader><CardTitle className="text-base">Segment Hit Rate</CardTitle></CardHeader>
          <CardContent>
            {segments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No data in this period</p>
            ) : (
              <div className="space-y-2">
                {segments.map((s, i) => {
                  const maxCount = segments[0].spin_count;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-sm flex-1 truncate">{s.label}</span>
                      <div className="w-24 bg-secondary rounded-full h-2">
                        <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${(s.spin_count / maxCount) * 100}%` }} />
                      </div>
                      <span className="text-sm font-medium w-8 text-right">{s.spin_count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Device breakdown */}
        <Card>
          <CardHeader><CardTitle className="text-base">Device Breakdown</CardTitle></CardHeader>
          <CardContent>
            {deviceBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No device data in this period</p>
            ) : (
              <div className="space-y-3">
                {(() => {
                  const total = deviceBreakdown.reduce((s, d) => s + d.count, 0);
                  const COLORS: Record<string, string> = { mobile: '#7C3AED', desktop: '#3B82F6', tablet: '#10B981', unknown: '#9CA3AF' };
                  const ICONS: Record<string, string> = { mobile: '📱', desktop: '🖥️', tablet: '📟', unknown: '❓' };
                  return deviceBreakdown.map((d, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span>{ICONS[d.device_type] ?? '❓'}</span>
                      <span className="text-sm capitalize flex-1">{d.device_type}</span>
                      <div className="w-24 bg-secondary rounded-full h-2">
                        <div className="h-2 rounded-full" style={{ width: `${total > 0 ? (d.count / total) * 100 : 0}%`, backgroundColor: COLORS[d.device_type] ?? '#9CA3AF' }} />
                      </div>
                      <span className="text-sm font-medium w-12 text-right">
                        {total > 0 ? `${((d.count / total) * 100).toFixed(0)}%` : '0%'}
                      </span>
                      <span className="text-xs text-muted-foreground w-8 text-right">{d.count}</span>
                    </div>
                  ));
                })()}
              </div>
            )}
          </CardContent>
        </Card>

        {/* OS breakdown */}
        <Card>
          <CardHeader><CardTitle className="text-base">OS Breakdown</CardTitle></CardHeader>
          <CardContent>
            {osBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No OS data in this period</p>
            ) : (
              <div className="space-y-3">
                {(() => {
                  const total = osBreakdown.reduce((s, d) => s + d.count, 0);
                  const OS_COLORS: Record<string, string> = { iOS: '#555555', Android: '#3DDC84', Windows: '#0078D4', macOS: '#A8A8A8', Linux: '#E95420', Other: '#9CA3AF' };
                  const OS_ICONS: Record<string, string> = { iOS: '🍎', Android: '🤖', Windows: '🪟', macOS: '🍎', Linux: '🐧', Other: '💻' };
                  return osBreakdown.map((d, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span>{OS_ICONS[d.os] ?? '💻'}</span>
                      <span className="text-sm flex-1">{d.os}</span>
                      <div className="w-24 bg-secondary rounded-full h-2">
                        <div className="h-2 rounded-full" style={{ width: `${total > 0 ? (d.count / total) * 100 : 0}%`, backgroundColor: OS_COLORS[d.os] ?? '#9CA3AF' }} />
                      </div>
                      <span className="text-sm font-medium w-12 text-right">
                        {total > 0 ? `${((d.count / total) * 100).toFixed(0)}%` : '0%'}
                      </span>
                      <span className="text-xs text-muted-foreground w-8 text-right">{d.count}</span>
                    </div>
                  ));
                })()}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number | string; icon: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-5">
        <span className="text-3xl">{icon}</span>
        <div>
          <p className="text-2xl font-bold">{typeof value === 'number' ? value.toLocaleString() : value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
