'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Download, Loader2, BarChart2, Trophy, Users, Percent } from 'lucide-react';

interface Summary { total_spins: number; total_winners: number; unique_leads: number; }
interface DailyRow { date: string; spins: number; winners: number; }
interface PrizeRow { display_title: string; type: string; win_count: number; }
interface SegmentRow { label: string; position: number; spin_count: number; }
interface DeviceRow { device_type: string; count: number; }
interface OsRow { os: string; count: number; }

const DEVICE_COLORS: Record<string, string> = { mobile: '#7C3AED', desktop: '#3B82F6', tablet: '#10B981', unknown: '#9CA3AF' };
const OS_COLORS: Record<string, string> = { iOS: '#555', Android: '#3DDC84', Windows: '#0078D4', macOS: '#A8A8A8', Linux: '#E95420', Other: '#9CA3AF' };

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

  const maxSpins = Math.max(...daily.map(r => r.spins), 1);

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Spin performance and lead capture data</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={selectedWheel} onValueChange={(v) => setSelectedWheel(v ?? 'all')}>
            <SelectTrigger className="h-8 w-44 text-xs"><SelectValue placeholder="All Wheels" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Wheels</SelectItem>
              {wheels.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={range} onValueChange={(v) => setRange(v ?? '30')}>
            <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={handleExport} disabled={exporting}>
            {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MiniStat label="Total Spins"   value={summary?.total_spins ?? 0}  icon={<BarChart2 className="h-4 w-4" />} color="bg-violet-500/10 text-violet-600" />
        <MiniStat label="Winners"        value={summary?.total_winners ?? 0} icon={<Trophy    className="h-4 w-4" />} color="bg-amber-500/10 text-amber-600" />
        <MiniStat label="Unique Leads"   value={summary?.unique_leads ?? 0}  icon={<Users     className="h-4 w-4" />} color="bg-blue-500/10 text-blue-600" />
        <MiniStat label="Win Rate"       value={`${winRate}%`}               icon={<Percent   className="h-4 w-4" />} color="bg-emerald-500/10 text-emerald-600" isString />
      </div>

      {/* Daily spins chart */}
      {daily.length > 0 && (
        <Card>
          <CardHeader className="pb-2 pt-5 px-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Daily Spins</CardTitle>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-sm bg-violet-200 inline-block" /> Spins
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-sm bg-violet-600 inline-block" /> Winners
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-5">
            <div className="flex items-end gap-px h-28">
              {daily.map((d) => {
                const pct = (d.spins / maxSpins) * 100;
                const winPct = d.spins > 0 ? (d.winners / d.spins) * 100 : 0;
                return (
                  <div
                    key={d.date}
                    className="flex-1 flex flex-col justify-end relative group cursor-default"
                    title={`${d.date}: ${d.spins} spins, ${d.winners} winners`}
                  >
                    <div
                      className="w-full rounded-t-[2px] bg-violet-100 dark:bg-violet-900/30 relative overflow-hidden"
                      style={{ height: `${Math.max(pct, 2)}%` }}
                    >
                      <div
                        className="absolute bottom-0 left-0 right-0 bg-violet-600 rounded-t-[2px]"
                        style={{ height: `${winPct}%` }}
                      />
                    </div>
                    {/* tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-10 pointer-events-none">
                      <div className="bg-popover border rounded-md px-2 py-1 text-[10px] shadow-md whitespace-nowrap">
                        <p className="font-medium">{d.date}</p>
                        <p className="text-muted-foreground">{d.spins} spins · {d.winners} winners</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-[11px] text-muted-foreground mt-2">
              <span>{daily[0]?.date}</span>
              <span>{daily[daily.length - 1]?.date}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BreakdownCard title="Prize Distribution" rows={prizes} valueKey="win_count" labelKey="display_title" color="#7C3AED" />
        <BreakdownCard title="Segment Hit Rate" rows={segments} valueKey="spin_count" labelKey="label" color="#6366f1" />
        <BreakdownCard
          title="Device Breakdown"
          rows={deviceBreakdown.map(d => ({ label: d.device_type, value: d.count }))}
          valueKey="value" labelKey="label"
          color="#7C3AED"
          colorMap={DEVICE_COLORS}
          showPercent
        />
        <BreakdownCard
          title="OS Breakdown"
          rows={osBreakdown.map(d => ({ label: d.os, value: d.count }))}
          valueKey="value" labelKey="label"
          color="#7C3AED"
          colorMap={OS_COLORS}
          showPercent
        />
      </div>
    </div>
  );
}

function MiniStat({
  label, value, icon, color, isString,
}: { label: string; value: number | string; icon: React.ReactNode; color: string; isString?: boolean }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${color}`}>{icon}</div>
        </div>
        <p className="text-2xl font-semibold tabular-nums tracking-tight">
          {isString ? value : typeof value === 'number' ? value.toLocaleString() : value}
        </p>
      </CardContent>
    </Card>
  );
}

function BreakdownCard({
  title, rows, valueKey, labelKey, color, colorMap, showPercent,
}: {
  title: string;
  rows: Record<string, unknown>[];
  valueKey: string;
  labelKey: string;
  color: string;
  colorMap?: Record<string, string>;
  showPercent?: boolean;
}) {
  const total = showPercent ? rows.reduce((s, r) => s + (r[valueKey] as number), 0) : 0;
  const max   = rows.length > 0 ? (rows[0][valueKey] as number) : 1;

  return (
    <Card>
      <CardHeader className="pb-2 pt-5 px-6">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-5">
        {rows.length === 0 ? (
          <p className="text-xs text-muted-foreground py-6 text-center">No data in this period</p>
        ) : (
          <div className="space-y-3">
            {rows.map((r, i) => {
              const val   = r[valueKey] as number;
              const label = r[labelKey] as string;
              const pct   = showPercent && total > 0 ? (val / total) * 100 : (val / max) * 100;
              const bar   = colorMap?.[label] ?? color;
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground flex-1 truncate capitalize">{label}</span>
                  <div className="w-28 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: bar }} />
                  </div>
                  <span className="text-xs font-medium tabular-nums w-10 text-right">
                    {showPercent ? `${pct.toFixed(0)}%` : val}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
