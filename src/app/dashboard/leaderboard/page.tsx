'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trophy, Users, Flame } from 'lucide-react';
import type { Wheel } from '@/lib/types';

interface LeaderboardEntry {
  rank: number;
  player_name: string;
  lead_email?: string;
  lead_phone?: string;
  total_wins: number;
  total_spins: number;
  win_rate: number;
  current_streak: number;
  last_win_at: string | null;
  prize_names: string[] | null;
}

const PERIOD_LABELS: Record<string, string> = {
  all: 'All Time', month: 'Last 30 Days', week: 'Last 7 Days', today: 'Today',
};

const RANK_STYLE: Record<number, { bg: string; text: string; label: string }> = {
  1: { bg: 'bg-amber-500/10',  text: 'text-amber-400',  label: '1st' },
  2: { bg: 'bg-slate-400/10',  text: 'text-slate-400',  label: '2nd' },
  3: { bg: 'bg-orange-500/10', text: 'text-orange-400', label: '3rd' },
};

export default function LeaderboardPage() {
  const [wheels, setWheels]   = useState<Wheel[]>([]);
  const [wheelId, setWheelId] = useState<string>('');
  const [period, setPeriod]   = useState('all');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/api/wheels')
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(d => {
        const list: Wheel[] = d.wheels ?? [];
        setWheels(list);
        if (list.length > 0) setWheelId(list[0].id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!wheelId) return;
    setLoading(true);
    api.get(`/api/analytics/leaderboard?wheel_id=${wheelId}&period=${period}&limit=20`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(d => setEntries(d.leaderboard ?? []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [wheelId, period]);

  const selectedWheel = wheels.find(w => w.id === wheelId);
  const maxStreak = entries.length > 0 ? Math.max(...entries.map(e => e.current_streak)) : 0;

  return (
    <div className="min-h-full bg-[#13131b]">
      <div className="max-w-4xl mx-auto px-6 md:px-8 py-8 space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-violet-400 mb-1">Rankings</p>
            <h1 className="text-[26px] font-bold tracking-[-0.03em] text-white">Leaderboard</h1>
            <p className="text-sm text-white/50 mt-0.5">Top players ranked by wins across your wheels</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Select value={wheelId} onValueChange={(v) => setWheelId(v ?? '')}>
              <SelectTrigger className="h-8 w-48 text-xs border-white/10 bg-white/5 text-white/70 hover:bg-white/10">
                <SelectValue placeholder="Select wheel" />
              </SelectTrigger>
              <SelectContent>
                {wheels.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={period} onValueChange={(v) => setPeriod(v ?? 'all')}>
              <SelectTrigger className="h-8 w-36 text-xs border-white/10 bg-white/5 text-white/70 hover:bg-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PERIOD_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary stats */}
        {entries.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Players on Board', value: entries.length,              icon: Users,  bar: 'from-violet-600 to-violet-400', bg: 'bg-violet-500/10', iconCls: 'text-violet-400' },
              { label: 'Top Player Wins',  value: entries[0]?.total_wins ?? 0, icon: Trophy, bar: 'from-amber-500 to-yellow-400',   bg: 'bg-amber-500/10',  iconCls: 'text-amber-400' },
              { label: 'Best Streak',      value: maxStreak,                   icon: Flame,  bar: 'from-orange-500 to-red-400',     bg: 'bg-orange-500/10', iconCls: 'text-orange-400' },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="relative overflow-hidden rounded-lg bg-[#1f1f28] border border-white/5 p-5">
                  <div className={`absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r ${s.bar}`} />
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${s.bg} mb-4`}>
                    <Icon className={`h-4 w-4 ${s.iconCls}`} />
                  </div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-white/40 mb-1.5">{s.label}</p>
                  <p className="text-[36px] font-bold tabular-nums tracking-[-0.04em] leading-none text-white">{s.value}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Leaderboard table */}
        <div className="rounded-2xl border border-white/5 bg-[rgba(31,31,40,0.7)] backdrop-blur-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-white/5 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-400" />
            <span className="text-sm font-semibold text-white">
              {selectedWheel?.name ?? 'Wheel'} — {PERIOD_LABELS[period]}
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 rounded-full border-2 border-violet-600 border-t-transparent animate-spin" />
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 ring-1 ring-amber-500/20 mb-4">
                <Trophy className="h-6 w-6 text-amber-400" />
              </div>
              <p className="text-sm font-semibold text-white mb-1">No wins recorded yet</p>
              <p className="text-xs text-white/40">Winners will appear here once players start spinning</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-white/30 w-14">#</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-white/30">Player</th>
                    <th className="text-center px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-white/30">Wins</th>
                    <th className="text-center px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-white/30 hidden sm:table-cell">Spins</th>
                    <th className="text-center px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-white/30 hidden sm:table-cell">Win %</th>
                    <th className="text-center px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-white/30 hidden md:table-cell">Streak</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-white/30 hidden lg:table-cell">Prizes Won</th>
                    <th className="text-right px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-white/30 hidden md:table-cell">Last Win</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry, i) => {
                    const rankStyle = RANK_STYLE[entry.rank];
                    return (
                      <tr key={i} className={`transition-colors hover:bg-white/[0.02] ${i < entries.length - 1 ? 'border-b border-white/5' : ''}`}>
                        <td className="px-5 py-3">
                          {rankStyle ? (
                            <span className={`inline-flex items-center justify-center h-6 w-8 rounded-md text-xs font-bold ${rankStyle.bg} ${rankStyle.text}`}>
                              {rankStyle.label}
                            </span>
                          ) : (
                            <span className="text-sm text-white/40 font-medium tabular-nums">{entry.rank}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-sm text-white leading-none">{entry.player_name}</p>
                          {entry.lead_email && (
                            <p className="text-[11px] text-white/40 mt-0.5">{entry.lead_email}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center rounded-md bg-violet-500/10 px-2 py-0.5 text-xs font-bold text-violet-300 ring-1 ring-violet-500/20">
                            {entry.total_wins}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-xs text-white/40 tabular-nums hidden sm:table-cell">
                          {entry.total_spins}
                        </td>
                        <td className="px-4 py-3 text-center hidden sm:table-cell">
                          <span className={`text-xs font-semibold tabular-nums ${entry.win_rate >= 50 ? 'text-emerald-400' : 'text-white/40'}`}>
                            {entry.win_rate}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center hidden md:table-cell">
                          {entry.current_streak > 0 ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-400">
                              <Flame className="h-3 w-3" /> {entry.current_streak}
                            </span>
                          ) : (
                            <span className="text-white/20 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {(entry.prize_names ?? []).slice(0, 2).map((name, j) => (
                              <span key={j} className="inline-flex items-center rounded-md bg-white/5 border border-white/10 px-1.5 py-0 text-[10px] font-medium text-white/50">{name}</span>
                            ))}
                            {(entry.prize_names ?? []).length > 2 && (
                              <span className="inline-flex items-center rounded-md border border-white/10 px-1.5 py-0 text-[10px] font-medium text-white/30">+{entry.prize_names!.length - 2}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-right text-xs text-white/40 tabular-nums hidden md:table-cell">
                          {entry.last_win_at ? new Date(entry.last_win_at).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
