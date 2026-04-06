'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

export default function LeaderboardPage() {
  const [wheels, setWheels]         = useState<Wheel[]>([]);
  const [wheelId, setWheelId]       = useState<string>('');
  const [period, setPeriod]         = useState('all');
  const [entries, setEntries]       = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading]       = useState(false);

  // Load wheel list
  useEffect(() => {
    api.get('/api/wheels')
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(d => {
        const list: Wheel[] = d.wheels ?? [];
        setWheels(list);
        if (list.length > 0) setWheelId(list[0].id);
      })
      .catch(() => {/* handled by api-client redirect */});
  }, []);

  // Load leaderboard whenever wheel or period changes
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

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <p className="text-muted-foreground">Top players ranked by wins across your wheels</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select value={wheelId} onValueChange={(v) => setWheelId(v ?? '')}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Select wheel" />
          </SelectTrigger>
          <SelectContent>
            {wheels.map(w => (
              <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={period} onValueChange={(v) => setPeriod(v ?? 'all')}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(PERIOD_LABELS).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary stats */}
      {entries.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-violet-200 bg-violet-50 dark:bg-violet-950/20">
            <CardContent className="py-4">
              <p className="text-xs text-muted-foreground">Total Players on Board</p>
              <p className="text-2xl font-bold text-violet-700 dark:text-violet-400">{entries.length}</p>
            </CardContent>
          </Card>
          <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
            <CardContent className="py-4">
              <p className="text-xs text-muted-foreground">Top Player Wins</p>
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{entries[0]?.total_wins ?? 0}</p>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
            <CardContent className="py-4">
              <p className="text-xs text-muted-foreground">Longest Current Streak</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                {Math.max(...entries.map(e => e.current_streak))} 🔥
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Leaderboard table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            🏆 {selectedWheel?.name ?? 'Wheel'} — {PERIOD_LABELS[period]}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-4xl mb-3">🏅</p>
              <p className="font-medium">No wins recorded yet</p>
              <p className="text-sm">Winners will appear here once players start spinning</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground w-12">#</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Player</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Wins</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Spins</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Win %</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Streak</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Prizes Won</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Last Win</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      {/* Rank */}
                      <td className="px-4 py-3 font-bold text-lg">
                        {MEDAL[entry.rank] ?? <span className="text-muted-foreground text-sm">{entry.rank}</span>}
                      </td>
                      {/* Player */}
                      <td className="px-4 py-3">
                        <p className="font-semibold">{entry.player_name}</p>
                        {entry.lead_email && (
                          <p className="text-xs text-muted-foreground">{entry.lead_email}</p>
                        )}
                      </td>
                      {/* Wins */}
                      <td className="px-4 py-3 text-center">
                        <Badge className="bg-violet-600 text-white">{entry.total_wins}</Badge>
                      </td>
                      {/* Spins */}
                      <td className="px-4 py-3 text-center text-muted-foreground">{entry.total_spins}</td>
                      {/* Win rate */}
                      <td className="px-4 py-3 text-center">
                        <span className={`font-medium ${entry.win_rate >= 50 ? 'text-green-600' : 'text-orange-500'}`}>
                          {entry.win_rate}%
                        </span>
                      </td>
                      {/* Streak */}
                      <td className="px-4 py-3 text-center">
                        {entry.current_streak > 0 ? (
                          <span className="font-bold text-orange-500">{entry.current_streak} 🔥</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      {/* Prizes */}
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(entry.prize_names ?? []).slice(0, 2).map((name, j) => (
                            <Badge key={j} variant="secondary" className="text-xs py-0">{name}</Badge>
                          ))}
                          {(entry.prize_names ?? []).length > 2 && (
                            <Badge variant="outline" className="text-xs py-0">+{entry.prize_names!.length - 2}</Badge>
                          )}
                        </div>
                      </td>
                      {/* Last win */}
                      <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                        {entry.last_win_at
                          ? new Date(entry.last_win_at).toLocaleDateString()
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
