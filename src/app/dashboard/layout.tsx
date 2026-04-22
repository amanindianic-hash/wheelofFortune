'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  LayoutDashboard, Disc3, Gift, BarChart2, Users, Trophy,
  Bell, FileText, Settings, LogOut, Menu, X, ChevronsUpDown,
  Zap, Wand2,
} from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/* ── Nav groups — Linear-style sectioned nav ────────────────────── */
const NAV_GROUPS = [
  {
    label: 'Platform',
    items: [
      { href: '/dashboard',             label: 'Overview',    icon: LayoutDashboard },
      { href: '/dashboard/wheels',      label: 'Wheels',      icon: Disc3 },
      { href: '/dashboard/prizes',      label: 'Prizes',      icon: Gift },
      { href: '/dashboard/analytics',   label: 'Analytics',   icon: BarChart2 },
      { href: '/dashboard/leads',       label: 'Leads',       icon: Users },
      { href: '/dashboard/leaderboard', label: 'Leaderboard', icon: Trophy },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/dashboard/push',    label: 'Push Alerts', icon: Bell },
      { href: '/dashboard/audit',   label: 'Audit Logs',  icon: FileText },
      { href: '/dashboard/account', label: 'Account',     icon: Settings },
    ],
  },
  {
    label: 'Tools',
    items: [
      { href: '/dashboard/theme-tester', label: 'Theme Tester', icon: Wand2 },
    ],
  },
];

const PLAN_BADGE: Record<string, string> = {
  starter:    'bg-slate-500/15 text-slate-400 ring-1 ring-slate-500/20',
  growth:     'bg-blue-500/12 text-blue-400 ring-1 ring-blue-500/18',
  pro:        'bg-violet-500/12 text-violet-400 ring-1 ring-violet-500/18',
  enterprise: 'bg-amber-500/12 text-amber-400 ring-1 ring-amber-500/18',
};

const PLAN_BAR: Record<string, string> = {
  starter:    'bg-slate-500',
  growth:     'bg-blue-500',
  pro:        'bg-violet-500',
  enterprise: 'bg-amber-500',
};

function SidebarContent({ onNav }: { onNav?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, client } = useAuth();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    toast.success('Signed out');
    router.push('/login');
  }

  const initials = user?.full_name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) ?? '??';
  const usedPct  = client ? Math.min(100, (client.spins_used_this_month / client.plan_spin_limit) * 100) : 0;
  const planBadge = PLAN_BADGE[client?.plan ?? ''] ?? PLAN_BADGE.starter;
  const planBarColor = PLAN_BAR[client?.plan ?? ''] ?? PLAN_BAR.starter;

  return (
    <div className="flex flex-col h-full select-none">

      {/* ── Brand ─────────────────────────────────────────── */}
      <div
        className="flex items-center gap-3 px-5 h-[64px] shrink-0"
        style={{ borderBottom: '1px solid oklch(var(--border) / 0.1)' }}
      >
        {/* Logo mark */}
        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
          style={{ 
            background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)', 
            boxShadow: '0 0 20px rgba(124,58,237,0.35), inset 0 1px 0 0 rgba(255,255,255,0.2)' 
          }}
        >
          <Zap className="h-4 w-4 text-white fill-white" />
          <div className="absolute inset-0 rounded-xl ring-1 ring-white/10" />
        </div>
        <div className="min-w-0">
          <p className="text-[14px] font-bold text-foreground leading-none tracking-[-0.03em]"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            SpinPlatform
          </p>
          {client && (
            <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider truncate mt-1 max-w-[130px]">
              {client.name}
            </p>
          )}
        </div>
      </div>

      {/* ── Usage Meter ──────────────────────────────────── */}
      {client && (
        <div
          className="px-5 pt-4 pb-4 shrink-0"
          style={{ borderBottom: '1px solid oklch(var(--border) / 0.08)' }}
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest ${planBadge}`}>
              {client.plan}
            </span>
            <span className="text-[11px] text-muted-foreground/50 tabular-nums font-semibold tracking-tight">
              {client.spins_used_this_month.toLocaleString()}&thinsp;<span className="text-muted-foreground/20">/</span>&thinsp;{client.plan_spin_limit.toLocaleString()}
            </span>
          </div>
          {/* Track */}
          <div
            className="h-1.5 w-full rounded-full overflow-hidden bg-muted/30"
          >
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out ${
                usedPct >= 90 ? 'bg-rose-500'
                : usedPct >= 70 ? 'bg-amber-500'
                : 'bg-primary'
              }`}
              style={{ width: `${usedPct}%`, boxShadow: '0 0 8px var(--primary)' }}
            />
          </div>
        </div>
      )}

      {/* ── Navigation ──────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            {/* Group label — Clean technical label style */}
            <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/40">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNav}
                    className={`group relative flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium transition-all duration-200 ${
                      active
                        ? 'text-foreground bg-white/[0.03] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]'
                        : 'text-muted-foreground/60 hover:text-foreground hover:bg-white/[0.05]'
                    }`}
                  >
                    {/* Active indicator — vertical pill */}
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-primary shadow-[0_0_12px_rgba(124,58,237,0.5)]" />
                    )}
                    <Icon
                      className={`h-[16px] w-[16px] shrink-0 transition-transform duration-200 ${
                        active
                          ? 'text-primary scale-110'
                          : 'opacity-40 group-hover:opacity-100'
                      }`}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── User Section ────────────────────────────────── */}
      <div
        className="shrink-0 p-3"
        style={{ borderTop: '1px solid oklch(var(--border) / 0.1)' }}
      >
        <DropdownMenu>
          <DropdownMenuTrigger className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-white/[0.05] transition-all duration-200 group outline-none ring-offset-background focus:ring-2 ring-primary/20">
            {/* Avatar */}
            <Avatar className="h-8 w-8 shrink-0 ring-1 ring-white/10 shadow-lg">
              <AvatarFallback className="text-[11px] font-bold text-white bg-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            {/* Name / Email */}
            <div className="text-left min-w-0 flex-1">
              <p className="text-[13px] font-bold text-foreground/90 truncate leading-none">
                {user?.full_name}
              </p>
              <p className="text-[10px] font-medium text-muted-foreground/40 truncate mt-1">
                {user?.email}
              </p>
            </div>
            <ChevronsUpDown className="h-4 w-4 text-muted-foreground/30 shrink-0 group-hover:text-muted-foreground/60 transition-colors" />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-60 mb-2 glass-panel p-1">
            <DropdownMenuLabel className="px-2 py-2 text-xs font-medium text-muted-foreground tabular-nums">
              {user?.email}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="opacity-20" />
            <DropdownMenuGroup>
              <DropdownMenuItem render={<Link href="/dashboard/account" />} className="rounded-lg">
                <Settings className="mr-2 h-4 w-4 opacity-70" />
                Account Settings
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="opacity-20" />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={handleLogout} className="rounded-lg text-rose-500 focus:text-rose-500 focus:bg-rose-500/10">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">

      {/* ── Desktop Sidebar ────────────────────────────── */}
      <aside
        className="hidden md:flex w-[216px] flex-col bg-sidebar shrink-0"
        style={{ borderRight: '1px solid oklch(1 0 0 / 5%)' }}
      >
        <SidebarContent />
      </aside>

      {/* ── Mobile Overlay ─────────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile Drawer ──────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[216px] bg-sidebar flex flex-col transform transition-transform duration-200 ease-in-out md:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ borderRight: '1px solid oklch(1 0 0 / 5%)' }}
      >
        <div
          className="flex items-center justify-between px-4 h-[58px] shrink-0"
          style={{ borderBottom: '1px solid oklch(1 0 0 / 5%)' }}
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-violet-500 to-violet-700">
              <Zap className="h-3 w-3 text-white fill-white" />
            </div>
            <span className="font-semibold text-[13px] text-sidebar-foreground/95 tracking-tight">SpinPlatform</span>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-md text-sidebar-foreground/35 hover:text-sidebar-foreground/70 hover:bg-white/[0.05] transition-colors"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <SidebarContent onNav={() => setMobileOpen(false)} />
        </div>
      </aside>

      {/* ── Main Content ───────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-dot-pattern">

        {/* Mobile top bar */}
        <header
          className="md:hidden flex items-center gap-3 px-4 h-[56px] shrink-0"
          style={{ borderBottom: '1px solid oklch(1 0 0 / 6%)', background: 'var(--card)' }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-violet-500 to-violet-700">
              <Zap className="h-3 w-3 text-white fill-white" />
            </div>
            <span className="font-semibold text-[13px] tracking-tight">SpinPlatform</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
