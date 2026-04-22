'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { useAuth } from '@/components/providers/auth-provider';
import { 
  BarChart2, Users, Trophy, Zap, Disc3, ChevronsUpDown,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AnalyticsSummary { total_spins: number; total_winners: number; unique_leads: number; }
interface DailyRow { date: string; spins: number; winners: number; }

function trendPct(curr: number, prev: number): number | null {
  if (prev === 0 && curr === 0) return null;
  if (prev === 0) return null;
  return Math.round(((curr - prev) / prev) * 100);
}

export default function DashboardPage() {
  const { user, client } = useAuth();
  const [wheels, setWheels] = useState<{ id: string; name: string; status: string; total_spins: number }[]>([]);
  const [summary, setSummary]         = useState<AnalyticsSummary | null>(null);
  const [prevSummary, setPrevSummary] = useState<AnalyticsSummary | null>(null);
  const [daily, setDaily]             = useState<DailyRow[]>([]);

  useEffect(() => {
    api.get('/api/wheels').then(r => r.json()).then(d => setWheels(d.wheels ?? []));
    const now = Date.now();
    const from30 = new Date(now - 30 * 86400000).toISOString();
    const from60 = new Date(now - 60 * 86400000).toISOString();
    api.get(`/api/analytics?from=${from30}`)
      .then(r => r.json())
      .then(d => { setSummary(d.summary); setDaily(d.daily ?? []); });
    api.get(`/api/analytics?from=${from60}&to=${from30}`)
      .then(r => r.json())
      .then(d => setPrevSummary(d.summary));
  }, []);

  const spinTrend = trendPct(summary?.total_spins ?? 0, prevSummary?.total_spins ?? 0);
  const convRate = summary?.total_spins ? ((summary.unique_leads ?? 0) / summary.total_spins * 100).toFixed(0) : '0';
  const spinVelocity = daily.length > 0 ? daily[daily.length - 1].spins : 0;

  return (
    <div className="p-8 md:p-12 min-h-screen bg-background flex-1 w-full max-w-7xl mx-auto space-y-16">
      {/* Neural Header Section */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 relative">
        <div className="space-y-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-px w-8 bg-primary/40 shrink-0" />
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Neural Interface v4.0</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black font-heading tracking-tight text-foreground leading-[0.9]">
            System <span className="text-white/20">Telemetry</span>
          </h1>
          <p className="text-muted-foreground/40 font-bold text-[11px] uppercase tracking-[0.2em] max-w-md leading-relaxed">
            Real-time engagement matrix synthesis for <span className="text-foreground/60">{client?.name ?? 'Distributed Network'}</span>
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="glass-panel px-5 py-2.5 rounded-2xl flex items-center gap-3 border-white/5 shadow-[0_0_30px_rgba(16,185,129,0.05)] transition-all hover:border-emerald-500/20 group">
            <div className="relative">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)]"></div>
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-500 animate-ping opacity-40"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-[0.1em] text-emerald-400/80">Active Protocol</span>
              <span className="text-[10px] font-bold text-muted-foreground/60">Live Stream Data</span>
            </div>
          </div>
          
          <button className="glass-panel p-3 rounded-2xl border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all group active:scale-95">
            <BarChart2 className="h-5 w-5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
          </button>
        </div>
      </header>
      
      {/* Analytics Bento Matrix */}
      <section className="grid grid-cols-12 gap-8">
        {/* Engagement Volume Card - Large Technical Module */}
        <div className="col-span-12 lg:col-span-8 glass-panel rounded-[2rem] p-10 relative overflow-hidden group border-white/10 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)]">
          <div className="flex justify-between items-start relative z-10">
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Temporal Distribution</p>
              </div>
              <h3 className="text-4xl font-bold text-foreground tracking-tighter">Spin Activity</h3>
            </div>
            <div className="bg-black/40 rounded-2xl p-4 border border-white/5 text-right min-w-[120px] backdrop-blur-md">
              <span className={`text-2xl font-black font-heading tabular-nums block ${spinTrend && spinTrend > 0 ? 'text-emerald-400' : 'text-primary/80'}`}>
                {spinTrend != null ? (spinTrend > 0 ? '+' : '-') + Math.abs(spinTrend) + '%' : '0.00%'}
              </span>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/30 mt-1">Efficiency Delta</p>
            </div>
          </div>
          
          {/* High-Fidelity Data Visualization */}
          <div className="mt-16 h-44 w-full flex items-end gap-2 relative">
            {/* Background Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between opacity-[0.03] pointer-events-none">
              {[0, 1, 2].map(i => <div key={i} className="w-full h-px bg-white" />)}
            </div>

            {daily.map((day, i) => {
              const maxVal = Math.max(...daily.map(d => d.spins), 1);
              const height = (day.spins / maxVal) * 100;
              const isLast = i === daily.length - 1;
              return (
                <div key={day.date} className="flex-1 group/bar relative h-full flex flex-col justify-end">
                  <div 
                    className={`w-full rounded-t-xl transition-all duration-700 ease-out-expo hover:brightness-125 ${
                      isLast 
                        ? 'bg-primary shadow-[0_0_30px_rgba(124,58,237,0.4)] border-t border-primary-foreground/20' 
                        : 'bg-white/[0.05] hover:bg-white/[0.12]'
                    }`}
                    style={{ height: `${Math.max(8, height)}%` }}
                  />
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-all translate-y-2 group-hover/bar:translate-y-0 z-20 pointer-events-none">
                    <div className="bg-white text-black text-[10px] font-black px-3 py-1.5 rounded-lg shadow-xl uppercase tracking-widest whitespace-nowrap">
                      {day.spins} Units
                    </div>
                  </div>
                </div>
              );
            })}
            {daily.length === 0 && Array.from({length: 14}).map((_, i) => (
              <div key={i} className="flex-1 bg-white/[0.02] rounded-t-lg h-[15%] border-t border-white/5" />
            ))}
          </div>
          
          {/* Subtle neural aesthetic depth */}
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary/10 blur-[120px] rounded-full pointer-events-none group-hover:bg-primary/15 transition-all duration-1000"></div>
        </div>

        {/* System Efficiency Card - High Complexity SVG */}
        <div className="col-span-12 lg:col-span-4 glass-panel rounded-[2rem] p-10 relative overflow-hidden flex flex-col justify-between border-white/10 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)]">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Core Ratio Analysis</p>
            </div>
            <h3 className="text-4xl font-bold text-foreground tracking-tighter">Efficiency</h3>
          </div>
          
          <div className="flex flex-col items-center justify-center flex-1 py-10">
            <div className="relative w-44 h-44 flex items-center justify-center">
              {/* Outer Decorative Ring */}
              <div className="absolute inset-0 rounded-full border border-white/[0.02] scale-110" />
              <div className="absolute inset-0 rounded-full border border-white/[0.02] scale-125 opacity-30" />
              
              <svg className="w-full h-full -rotate-90 drop-shadow-[0_0_15px_rgba(124,58,237,0.15)]">
                <circle className="text-white/[0.03]" cx="88" cy="88" fill="transparent" r="80" stroke="currentColor" strokeWidth="12"></circle>
                <circle 
                  className="text-primary" 
                  cx="88" 
                  cy="88" 
                  fill="transparent" 
                  r="80" 
                  stroke="currentColor" 
                  strokeWidth="12" 
                  strokeLinecap="round"
                  strokeDasharray="502" 
                  strokeDashoffset={502 - (502 * Number(convRate) / 100)} 
                  style={{ transition: 'stroke-dashoffset 2s cubic-bezier(0.16, 1, 0.3, 1)' }}
                ></circle>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
                <span className="text-5xl font-black font-heading tabular-nums text-white leading-none tracking-tighter">{convRate}<span className="text-xl text-primary/60 opacity-50 ml-0.5">%</span></span>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/30 mt-4">Global C.R.</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-5 bg-black/20 p-5 rounded-2xl border border-white/5">
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
              <span className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-white/20" />
                System Samples
              </span>
              <span className="text-foreground tracking-widest">{summary?.total_spins?.toLocaleString() ?? '0'}</span>
            </div>
            <div className="w-full h-2 bg-white/[0.04] rounded-full overflow-hidden p-0.5">
              <div className="h-full bg-gradient-to-r from-primary/60 to-primary shadow-[0_0_12px_rgba(124,58,237,0.5)] rounded-full transition-all duration-2000 ease-out" style={{ width: `${Math.min(100, (summary?.total_spins || 0) / 1000)}%` }}></div>
            </div>
          </div>
        </div>
        
        {/* Metric Modules Row */}
        {[
          { label: 'Leads Aggregated', value: summary?.unique_leads, icon: Users, color: 'text-primary', gradient: 'from-primary/10 to-transparent' },
          { label: 'Winners Synced', value: summary?.total_winners, icon: Trophy, color: 'text-emerald-400', gradient: 'from-emerald-500/10 to-transparent' },
          { label: 'Neural Velocity', value: spinVelocity, icon: Zap, color: 'text-amber-400', gradient: 'from-amber-500/10 to-transparent' }
        ].map((item, idx) => (
          <div key={idx} className="col-span-12 md:col-span-4 glass-panel rounded-[1.5rem] p-7 flex items-center gap-6 border-white/5 hover:border-white/20 transition-all duration-500 group relative overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
            <div className="relative z-10 p-4 bg-white/[0.03] rounded-2xl group-hover:bg-white/[0.08] transition-all group-hover:scale-110 shadow-inner">
              <item.icon className={`h-6 w-6 ${item.color} opacity-70 group-hover:opacity-100 transition-all`} />
            </div>
            <div className="relative z-10 flex-1">
              <h4 className="text-3xl font-bold font-heading tabular-nums text-foreground tracking-tight">{item.value?.toLocaleString() ?? '0'}</h4>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/30 mt-1">{item.label}</p>
            </div>
            <div className="relative z-10 h-8 w-px bg-white/[0.05]" />
          </div>
        ))}
      </section>

      {/* Deployment Oversight - Campaign Modules */}
      <section className="space-y-10 relative">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 px-1">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold text-foreground tracking-tighter">Active Deployments</h2>
            <p className="text-[11px] font-black text-muted-foreground/30 uppercase tracking-[0.2em] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse" />
              Live Campaign Engine Tracking
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="text-[10px] font-black uppercase tracking-[0.15em] px-6 py-2.5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all text-muted-foreground/60 hover:text-foreground">All Systems</button>
            <button className="text-[10px] font-black uppercase tracking-[0.15em] px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white transition-all shadow-[0_10px_20px_-5px_rgba(124,58,237,0.4)] active:scale-95">
              New Deployment
            </button>
          </div>
        </div>

        <div className="grid gap-4 relative">
          {/* Subtle connecting line for modules */}
          <div className="absolute left-10 top-0 bottom-0 w-px bg-gradient-to-b from-white/[0.05] via-white/[0.02] to-transparent pointer-events-none hidden sm:block" />

          {wheels.length === 0 && (
            <div className="text-center py-24 glass-panel rounded-3xl border-dashed border-white/10 backdrop-blur-sm">
               <div className="w-16 h-16 bg-white/[0.02] rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5">
                 <Disc3 className="h-8 w-8 text-muted-foreground/10" />
               </div>
               <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-muted-foreground/20">No active telemetry found. Start your first deployment.</p>
            </div>
          )}
          
          {wheels.map((wheel) => (
            <div 
              key={wheel.id} 
              className={`group glass-panel border-white/5 hover:border-white/20 hover:bg-white/[0.03] transition-all duration-500 rounded-[1.5rem] p-5 flex flex-col sm:flex-row items-center justify-between gap-8 relative overflow-hidden ${
                wheel.status === 'draft' ? 'opacity-40 grayscale-[0.8]' : ''
              }`}
            >
              {/* Module ID Anchor (Left) */}
              <div className="flex items-center gap-6 w-full sm:w-auto relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-black/40 flex items-center justify-center shrink-0 overflow-hidden ring-1 ring-white/10 group-hover:ring-primary/40 transition-all shadow-inner">
                  <Disc3 className={`h-8 w-8 transition-all duration-700 ${
                    wheel.status === 'active' ? 'text-primary/60 animate-[spin_6s_linear_infinite]' : 'text-muted-foreground/20'
                  } group-hover:text-primary`} />
                </div>
                <div className="min-w-0 space-y-1.5">
                  <Link href={`/dashboard/wheels/${wheel.id}`} className="group/link flex items-center gap-3">
                    <h4 className="text-xl font-bold text-foreground tracking-tight group-hover/link:text-primary transition-colors truncate">{wheel.name}</h4>
                  </Link>
                  <div className="flex items-center gap-3">
                    <div className="px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                       <span className="text-[8px] font-black text-primary uppercase tracking-widest">v2.4.0</span>
                    </div>
                    <p className="text-[9px] font-black font-mono text-muted-foreground/20 uppercase tracking-[0.1em]">UUID: {wheel.id.slice(0, 12)}</p>
                  </div>
                </div>
              </div>
              
              {/* Module Metrics (Center/Right) */}
              <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-12 relative z-10 px-2 sm:px-0">
                <div className="flex flex-col items-end">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/20 mb-2">Network Samples</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black tabular-nums text-white tracking-tighter">{wheel.total_spins?.toLocaleString() ?? 0}</span>
                    <span className="text-[10px] font-black text-muted-foreground/40 uppercase">Units</span>
                  </div>
                </div>
                
                <div className="h-10 w-px bg-white/[0.05]" />

                <div className={`px-4 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2.5 transition-all duration-500 shadow-sm ${
                  wheel.status === 'active' 
                    ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400/80 group-hover:bg-emerald-500/10'
                    : 'bg-white/5 border-white/5 text-muted-foreground/40'
                }`}>
                  {wheel.status === 'active' ? (
                    <div className="relative">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                      <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping opacity-30"></div>
                    </div>
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-white/10"></div>
                  )}
                  {wheel.status}
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <button className="p-3 text-muted-foreground/20 hover:text-white transition-all hover:bg-white/5 rounded-2xl border border-transparent hover:border-white/5 group-hover:text-muted-foreground/60 active:scale-90">
                        <ChevronsUpDown className="h-5 w-5" />
                      </button>
                    }
                  />
                  <DropdownMenuContent align="end" className="glass-panel w-56 p-1.5 border-white/10 shadow-2xl backdrop-blur-2xl">
                    <DropdownMenuItem render={<Link href={`/dashboard/wheels/${wheel.id}`} />} className="rounded-xl py-2.5 text-xs font-bold tracking-tight">
                       Manage Sequence
                    </DropdownMenuItem>
                    <DropdownMenuItem className="rounded-xl py-2.5 text-xs font-bold tracking-tight">
                       Telemetry Logs
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="opacity-[0.05] mx-1" />
                    <DropdownMenuItem className="text-rose-500 focus:text-rose-500 rounded-xl py-2.5 text-xs font-bold tracking-tight">
                       Archive Module
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Module Hover Highlight Effect */}
              <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            </div>
          ))}
        </div>
      </section>

      {/* Technical Footer Design Anchor */}
      <footer className="pt-20 pb-12 border-t border-white/[0.05] relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-center gap-10 relative z-10">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.3)]">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <span className="text-[14px] font-black tracking-widest text-foreground uppercase">Neural Platform</span>
            </div>
            <p className="text-[10px] font-black text-muted-foreground/20 uppercase tracking-[0.25em]">© 2024 Engineering Edition. Scaled for production.</p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-10">
            {[
              { label: 'Security Compliance', sub: 'ISO Synthesis' },
              { label: 'API Gateway', sub: 'v4.2.1 Stable' },
              { label: 'Neural Core', sub: 'Active Node' }
            ].map((link, idx) => (
              <div key={idx} className="flex flex-col gap-1 group cursor-pointer">
                <span className="text-[10px] font-black text-muted-foreground/30 group-hover:text-primary transition-colors tracking-[0.1em]">{link.label}</span>
                <span className="text-[11px] font-bold text-foreground/40 font-mono">{link.sub}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Footer Ambient Light */}
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-50" />
      </footer>
    </div>
  );
}
