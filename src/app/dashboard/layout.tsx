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

const PLAN_COLOR: Record<string, string> = {
  starter:    'bg-slate-500/15 text-slate-400',
  growth:     'bg-blue-500/15 text-blue-400',
  pro:        'bg-violet-500/15 text-violet-400',
  enterprise: 'bg-amber-500/15 text-amber-400',
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
  const planCls  = PLAN_COLOR[client?.plan ?? ''] ?? PLAN_COLOR.starter;

  return (
    <div className="flex flex-col h-full">

      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-14 border-b border-sidebar-border shrink-0">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600 shrink-0">
          <Zap className="h-3.5 w-3.5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-sidebar-foreground leading-none">SpinPlatform</p>
          {client && (
            <p className="text-xs text-sidebar-foreground/50 truncate mt-0.5 max-w-[140px]">{client.name}</p>
          )}
        </div>
      </div>

      {/* Plan pill + quota */}
      {client && (
        <div className="px-4 py-3 border-b border-sidebar-border shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${planCls}`}>
              {client.plan}
            </span>
            <span className="text-[11px] text-sidebar-foreground/40 tabular-nums">
              {client.spins_used_this_month.toLocaleString()} / {client.plan_spin_limit.toLocaleString()}
            </span>
          </div>
          <div className="h-1 w-full rounded-full bg-sidebar-border overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${usedPct >= 90 ? 'bg-rose-500' : usedPct >= 70 ? 'bg-amber-400' : 'bg-violet-500'}`}
              style={{ width: `${usedPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNav}
              className={`group flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150 ${
                active
                  ? 'bg-sidebar-accent text-sidebar-foreground'
                  : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 transition-colors ${active ? 'text-violet-400' : 'text-sidebar-foreground/40 group-hover:text-sidebar-foreground/70'}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="shrink-0 border-t border-sidebar-border p-2">
        <DropdownMenu>
          <DropdownMenuTrigger className="w-full flex items-center gap-2.5 rounded-md px-3 py-2 text-sm hover:bg-sidebar-accent/60 transition-colors duration-150 group">
            <Avatar className="h-7 w-7 shrink-0">
              <AvatarFallback className="bg-violet-600 text-white text-[10px] font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <div className="text-left min-w-0 flex-1">
              <p className="text-xs font-medium text-sidebar-foreground truncate leading-none">{user?.full_name}</p>
              <p className="text-[11px] text-sidebar-foreground/40 truncate mt-0.5">{user?.email}</p>
            </div>
            <ChevronUp className="h-3.5 w-3.5 text-sidebar-foreground/30 shrink-0" />
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

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 flex-col bg-sidebar shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-sidebar flex flex-col transform transition-transform duration-200 ease-in-out md:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 h-14 border-b border-sidebar-border shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-600">
              <Zap className="h-3 w-3 text-white" />
            </div>
            <span className="font-semibold text-sm text-sidebar-foreground">SpinPlatform</span>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-md text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/60 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <SidebarContent onNav={() => setMobileOpen(false)} />
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Mobile top bar */}
        <header className="md:hidden flex items-center gap-3 px-4 h-14 border-b bg-card shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-600">
              <Zap className="h-3 w-3 text-white" />
            </div>
            <span className="font-semibold text-sm">SpinPlatform</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
