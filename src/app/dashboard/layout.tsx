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
        className="flex items-center gap-3 px-4 h-[58px] shrink-0"
        style={{ borderBottom: '1px solid oklch(1 0 0 / 5%)' }}
      >
        {/* Logo mark */}
        <div className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-violet-700">
          <Zap className="h-3.5 w-3.5 text-white fill-white" />
          {/* Ambient glow */}
          <div className="absolute inset-0 rounded-lg ring-1 ring-violet-400/25" />
          <div className="absolute -inset-1 rounded-xl bg-violet-500/12 blur-md -z-10" />
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-sidebar-foreground/95 leading-none tracking-[-0.01em]">
            SpinPlatform
          </p>
          {client && (
            <p className="text-[11px] text-sidebar-foreground/35 truncate mt-[3px] max-w-[130px]">
              {client.name}
            </p>
          )}
        </div>
      </div>

      {/* ── Usage Meter ──────────────────────────────────── */}
      {client && (
        <div
          className="px-4 pt-3 pb-3.5 shrink-0"
          style={{ borderBottom: '1px solid oklch(1 0 0 / 5%)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider capitalize ${planBadge}`}>
              {client.plan}
            </span>
            <span className="text-[11px] text-sidebar-foreground/35 tabular-nums font-medium tracking-tight">
              {client.spins_used_this_month.toLocaleString()}&thinsp;<span className="text-sidebar-foreground/20">/</span>&thinsp;{client.plan_spin_limit.toLocaleString()}
            </span>
          </div>
          {/* Track */}
          <div
            className="h-[3px] w-full rounded-full overflow-hidden"
            style={{ background: 'oklch(1 0 0 / 5%)' }}
          >
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                usedPct >= 90 ? 'bg-gradient-to-r from-rose-500 to-pink-400'
                : usedPct >= 70 ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                : `${planBarColor}`
              }`}
              style={{ width: `${usedPct}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Navigation ──────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            {/* Group label */}
            <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-sidebar-foreground/25">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNav}
                    className={`group relative flex items-center gap-2.5 rounded-lg px-3 py-[7px] text-[13px] font-medium transition-all duration-150 ${
                      active
                        ? 'bg-white/[0.08] text-sidebar-foreground/95'
                        : 'text-sidebar-foreground/45 hover:bg-white/[0.04] hover:text-sidebar-foreground/75'
                    }`}
                  >
                    {/* Active indicator bar */}
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-0.5 rounded-r-full bg-violet-400" />
                    )}
                    <Icon
                      className={`h-[14px] w-[14px] shrink-0 transition-colors duration-150 ${
                        active
                          ? 'text-violet-400'
                          : 'text-sidebar-foreground/28 group-hover:text-sidebar-foreground/60'
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
        className="shrink-0 p-2"
        style={{ borderTop: '1px solid oklch(1 0 0 / 5%)' }}
      >
        <DropdownMenu>
          <DropdownMenuTrigger className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 hover:bg-white/[0.05] transition-all duration-150 group outline-none">
            {/* Avatar */}
            <Avatar className="h-7 w-7 shrink-0">
              <AvatarFallback className="text-[10px] font-bold text-white" style={{ background: 'linear-gradient(135deg, oklch(0.55 0.22 264) 0%, oklch(0.40 0.20 280) 100%)' }}>
                {initials}
              </AvatarFallback>
            </Avatar>
            {/* Name / Email */}
            <div className="text-left min-w-0 flex-1">
              <p className="text-[12px] font-semibold text-sidebar-foreground/90 truncate leading-tight tracking-[-0.005em]">
                {user?.full_name}
              </p>
              <p className="text-[10.5px] text-sidebar-foreground/30 truncate mt-px">
                {user?.email}
              </p>
            </div>
            <ChevronsUpDown className="h-3.5 w-3.5 text-sidebar-foreground/20 shrink-0 group-hover:text-sidebar-foreground/45 transition-colors" />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56 mb-1">
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground py-1.5">
              {user?.email}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem render={<Link href="/dashboard/account" />}>
                <Settings className="mr-2 h-3.5 w-3.5" />
                Account settings
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500">
                <LogOut className="mr-2 h-3.5 w-3.5" />
                Sign out
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
