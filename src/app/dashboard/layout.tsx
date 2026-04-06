'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  LayoutDashboard, Disc3, Gift, BarChart2, Users, Trophy,
  Bell, FileText, Settings, LogOut, Menu, X, ChevronUp,
  Zap,
} from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const NAV_ITEMS = [
  { href: '/dashboard',                 label: 'Overview',     icon: LayoutDashboard },
  { href: '/dashboard/wheels',          label: 'Wheels',       icon: Disc3 },
  { href: '/dashboard/prizes',          label: 'Prizes',       icon: Gift },
  { href: '/dashboard/analytics',       label: 'Analytics',    icon: BarChart2 },
  { href: '/dashboard/leads',           label: 'Leads',        icon: Users },
  { href: '/dashboard/leaderboard',     label: 'Leaderboard',  icon: Trophy },
  { href: '/dashboard/push',            label: 'Push Alerts',  icon: Bell },
  { href: '/dashboard/audit',           label: 'Audit Logs',   icon: FileText },
  { href: '/dashboard/account',         label: 'Account',      icon: Settings },
];

const PLAN_BADGE: Record<string, string> = {
  starter:    'bg-slate-500/20 text-slate-400 ring-slate-500/20',
  growth:     'bg-blue-500/15 text-blue-400 ring-blue-500/20',
  pro:        'bg-violet-500/15 text-violet-400 ring-violet-500/20',
  enterprise: 'bg-amber-500/15 text-amber-400 ring-amber-500/20',
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

  return (
    <div className="flex flex-col h-full">

      {/* ── Logo / Brand ───────────────────────────────────── */}
      <div className="flex items-center gap-3 px-5 h-[60px] shrink-0" style={{ borderBottom: '1px solid var(--sidebar-border)' }}>
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600 shadow-[0_0_12px_0_rgb(124_58_237/0.5)] shrink-0">
          <Zap className="h-3.5 w-3.5 text-white fill-white" />
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-sidebar-foreground leading-none tracking-tight">SpinPlatform</p>
          {client && (
            <p className="text-[11px] text-sidebar-foreground/40 truncate mt-0.5 max-w-[140px]">{client.name}</p>
          )}
        </div>
      </div>

      {/* ── Plan Badge + Quota Bar ──────────────────────────── */}
      {client && (
        <div className="px-4 py-3 shrink-0" style={{ borderBottom: '1px solid var(--sidebar-border)' }}>
          <div className="flex items-center justify-between mb-2.5">
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 capitalize ${planBadge}`}>
              {client.plan}
            </span>
            <span className="text-[11px] text-sidebar-foreground/35 tabular-nums font-medium">
              {client.spins_used_this_month.toLocaleString()} <span className="text-sidebar-foreground/20">/</span> {client.plan_spin_limit.toLocaleString()}
            </span>
          </div>
          {/* Progress bar */}
          <div className="h-[3px] w-full rounded-full overflow-hidden" style={{ background: 'oklch(1 0 0 / 6%)' }}>
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                usedPct >= 90 ? 'bg-rose-500' : usedPct >= 70 ? 'bg-amber-400' : 'bg-violet-500'
              }`}
              style={{ width: `${usedPct}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Navigation ─────────────────────────────────────── */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNav}
              className={`group flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150 ${
                active
                  ? 'bg-violet-600/15 text-sidebar-foreground ring-1 ring-violet-500/20'
                  : 'text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground/80'
              }`}
            >
              <Icon
                className={`h-[15px] w-[15px] shrink-0 transition-colors duration-150 ${
                  active
                    ? 'text-violet-400'
                    : 'text-sidebar-foreground/30 group-hover:text-sidebar-foreground/60'
                }`}
              />
              {item.label}
              {active && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-violet-400 shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── User Section ────────────────────────────────────── */}
      <div className="shrink-0 p-2" style={{ borderTop: '1px solid var(--sidebar-border)' }}>
        <DropdownMenu>
          <DropdownMenuTrigger className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-sidebar-accent transition-all duration-150 group outline-none">
            <Avatar className="h-7 w-7 shrink-0">
              <AvatarFallback className="bg-gradient-to-br from-violet-500 to-violet-700 text-white text-[10px] font-bold shadow-[0_0_8px_0_rgb(124_58_237/0.4)]">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="text-left min-w-0 flex-1">
              <p className="text-[12px] font-semibold text-sidebar-foreground truncate leading-none">{user?.full_name}</p>
              <p className="text-[11px] text-sidebar-foreground/35 truncate mt-0.5">{user?.email}</p>
            </div>
            <ChevronUp className="h-3.5 w-3.5 text-sidebar-foreground/25 shrink-0 group-hover:text-sidebar-foreground/50 transition-colors" />
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

      {/* ── Desktop Sidebar ──────────────────────────────────── */}
      <aside className="hidden md:flex w-[220px] flex-col bg-sidebar shrink-0" style={{ borderRight: '1px solid var(--sidebar-border)' }}>
        <SidebarContent />
      </aside>

      {/* ── Mobile Overlay ───────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile Drawer ────────────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[220px] bg-sidebar flex flex-col transform transition-transform duration-250 ease-in-out md:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ borderRight: '1px solid var(--sidebar-border)' }}
      >
        <div className="flex items-center justify-between px-5 h-[60px] shrink-0" style={{ borderBottom: '1px solid var(--sidebar-border)' }}>
          <div className="flex items-center gap-2.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-600">
              <Zap className="h-3 w-3 text-white fill-white" />
            </div>
            <span className="font-semibold text-[13px] text-sidebar-foreground tracking-tight">SpinPlatform</span>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-md text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <SidebarContent onNav={() => setMobileOpen(false)} />
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Mobile top bar */}
        <header className="md:hidden flex items-center gap-3 px-4 h-[56px] border-b bg-card/50 backdrop-blur-sm shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-600">
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
