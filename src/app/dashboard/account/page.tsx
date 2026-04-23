'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import { useAuth } from '@/components/providers/auth-provider';
import type { Client } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { ClientPlan } from '@/lib/types';
import { useTheme } from '@/components/providers/theme-provider';

interface TeamMember { id: string; email: string; full_name: string; role: string; email_verified: boolean; last_login_at: string | null; }

export default function AccountPage() {
  const { user, refresh } = useAuth();
  const { theme, mounted: themeMounted, setTheme } = useTheme();
  const [client, setClient] = useState<Client | null>(null);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', timezone: '', custom_domain: '' });
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgrading, setUpgrading] = useState(false);

  async function load() {
    const res = await api.get('/api/account');
    const data = await res.json();
    if (res.ok) {
      setClient(data.client);
      setTeam(data.team ?? []);
      setForm({ name: data.client.name, timezone: data.client.timezone, custom_domain: data.client.custom_domain ?? '' });
    }
  }

  useEffect(() => { load(); }, []);

  async function saveAccount() {
    setSaving(true);
    try {
      const res = await api.put('/api/account', {
        name: form.name,
        timezone: form.timezone,
        custom_domain: form.custom_domain || null,
      });
      if (res.ok) { toast.success('Account updated'); load(); refresh(); }
      else toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  }

  const PLAN_LIMITS: Record<string, string> = {
    free: '50 spins/mo', starter: '500 spins/mo', growth: '5,000 spins/mo', pro: '25,000 spins/mo', enterprise: 'Unlimited',
  };

  const PLANS: Array<{ id: ClientPlan; label: string; price: string; spins: string; features: string[] }> = [
    { id: 'free',       label: 'Free',       price: '$0/mo',   spins: '50 spins/mo',      features: ['1 wheel', 'Basic branding', 'CSV export'] },
    { id: 'starter',    label: 'Starter',    price: '$29/mo',  spins: '500 spins/mo',     features: ['3 wheels', 'Custom branding', 'Email integrations'] },
    { id: 'growth',     label: 'Growth',     price: '$79/mo',  spins: '5,000 spins/mo',   features: ['10 wheels', 'A/B testing', 'Zapier + webhooks'] },
    { id: 'pro',        label: 'Pro',        price: '$199/mo', spins: '25,000 spins/mo',  features: ['Unlimited wheels', 'Custom domain', 'Priority support'] },
    { id: 'enterprise', label: 'Enterprise', price: 'Custom',  spins: 'Unlimited spins',  features: ['SLA', 'Dedicated CSM', 'SSO / SAML'] },
  ];

  const PAID_PLANS: ClientPlan[] = ['growth', 'pro', 'enterprise'];

  async function handleUpgrade(plan: ClientPlan) {
    if (!client || plan === client.plan) return;
    setUpgrading(true);
    try {
      if (PAID_PLANS.includes(plan)) {
        const res = await api.post('/api/billing/checkout', { plan });
        const data = await res.json();
        if (res.ok && data.url) {
          window.location.href = data.url;
        } else {
          toast.error(data.error?.message ?? 'Could not start checkout');
        }
      } else {
        const res = await api.put('/api/account', { plan });
        if (res.ok) {
          toast.success(`Plan changed to ${plan}`);
          setShowUpgrade(false);
          load();
        } else {
          const data = await res.json();
          toast.error(data.error?.message ?? 'Plan change failed');
        }
      }
    } finally {
      setUpgrading(false);
    }
  }

  return (
    <div className="min-h-full bg-[#13131b]">
      <div className="max-w-3xl mx-auto px-6 md:px-8 py-8 space-y-6">

        {/* Header */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-violet-400 mb-1">Account</p>
          <h1 className="text-[26px] font-bold tracking-[-0.03em] text-white">Account Settings</h1>
          <p className="text-sm text-white/50 mt-0.5">Manage your company settings and team</p>
        </div>

        {/* Plan info */}
        {client && (
          <div className="relative overflow-hidden rounded-2xl border border-violet-500/30 bg-violet-600/10 backdrop-blur-xl p-5">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-violet-600 to-violet-400" />
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-white/50 mb-2">Current Plan</p>
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex items-center rounded-full bg-violet-600 px-2.5 py-0.5 text-xs font-semibold text-white capitalize ring-1 ring-violet-500/40">
                    {client.plan}
                  </span>
                  <span className="text-sm text-white/70">{PLAN_LIMITS[client.plan]}</span>
                </div>
                <p className="text-xs text-white/40 mt-1.5">
                  {client.spins_used_this_month.toLocaleString()} of {client.plan_spin_limit.toLocaleString()} spins used this month
                </p>
              </div>
              {client.plan !== 'enterprise' && (
                <button
                  onClick={() => setShowUpgrade(true)}
                  className="shrink-0 h-9 px-4 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold shadow-[0_0_0_1px_rgba(124,58,237,0.4),0_4px_12px_-2px_rgba(124,58,237,0.35)] transition-all duration-200"
                >
                  Upgrade Plan
                </button>
              )}
            </div>
          </div>
        )}

        {/* Company settings */}
        <div className="rounded-2xl border border-white/5 bg-[rgba(31,31,40,0.7)] backdrop-blur-xl overflow-hidden">
          <div className="px-6 pt-5 pb-4 border-b border-white/5">
            <h2 className="text-sm font-semibold text-white">Company Settings</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/70">Company Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-white placeholder:text-white/30 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/70">Timezone</label>
              <input
                type="text"
                value={form.timezone}
                onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                placeholder="e.g. Asia/Kolkata, America/New_York"
                className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-white placeholder:text-white/30 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/70">Custom Domain <span className="text-white/30 font-normal">(optional)</span></label>
              <input
                type="text"
                value={form.custom_domain}
                onChange={(e) => setForm({ ...form, custom_domain: e.target.value })}
                placeholder="spin.yourcompany.com"
                className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-white placeholder:text-white/30 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-colors"
              />
              <p className="text-xs text-white/30">Configure DNS to point to this platform and we&apos;ll handle SSL.</p>
            </div>
            <div className="flex justify-end pt-1">
              <button
                onClick={saveAccount}
                disabled={saving}
                className="h-9 px-5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold shadow-[0_0_0_1px_rgba(124,58,237,0.4),0_4px_12px_-2px_rgba(124,58,237,0.35)] transition-all duration-200 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>

        {/* Team */}
        <div className="rounded-2xl border border-white/5 bg-[rgba(31,31,40,0.7)] backdrop-blur-xl overflow-hidden">
          <div className="px-6 pt-5 pb-4 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Team Members</h2>
            <span className="inline-flex items-center rounded-full bg-white/5 border border-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-white/50">
              {team.length} member{team.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="p-6 space-y-0">
            {team.map((member, i) => (
              <div key={member.id}>
                {i > 0 && <div className="border-t border-white/5 my-3" />}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-500/20 text-sm font-semibold text-violet-300 shrink-0">
                      {member.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white flex items-center gap-2">
                        {member.full_name}
                        {member.id === user?.id && <span className="text-xs text-white/30">(you)</span>}
                      </p>
                      <p className="text-xs text-white/40">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-medium text-white/60 capitalize">
                      {member.role}
                    </span>
                    {!member.email_verified && (
                      <span className="inline-flex items-center rounded-md bg-amber-500/10 ring-1 ring-amber-500/20 px-2 py-0.5 text-[11px] font-medium text-amber-400">
                        Unverified
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div className="mt-4 pt-4 border-t border-white/5">
              <p className="text-xs text-white/30">
                Team invitations are available on Growth and Pro plans. Contact support to invite additional team members.
              </p>
            </div>
          </div>
        </div>

        {/* Account Info */}
        {client && (
          <div className="rounded-2xl border border-white/5 bg-[rgba(31,31,40,0.7)] backdrop-blur-xl overflow-hidden">
            <div className="px-6 pt-5 pb-4 border-b border-white/5">
              <h2 className="text-sm font-semibold text-white">Account Info</h2>
            </div>
            <div className="p-6 space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-white/50">Account Slug</span>
                <code className="font-mono bg-white/5 border border-white/10 px-2 py-0.5 rounded-md text-xs text-violet-300">{client.slug}</code>
              </div>
              <div className="border-t border-white/5" />
              <div className="flex justify-between items-center">
                <span className="text-white/50">Member Since</span>
                <span className="text-white/80 text-xs">{new Date(client.created_at).toLocaleDateString()}</span>
              </div>
              <div className="border-t border-white/5" />
              <div className="flex justify-between items-center">
                <span className="text-white/50">Billing Cycle Day</span>
                <span className="text-white/80 text-xs">Day {client.billing_cycle_day} of each month</span>
              </div>
            </div>
          </div>
        )}

        {/* Appearance */}
        {themeMounted && (
          <div className="rounded-2xl border border-white/5 bg-[rgba(31,31,40,0.7)] backdrop-blur-xl overflow-hidden">
            <div className="px-6 pt-5 pb-4 border-b border-white/5">
              <h2 className="text-sm font-semibold text-white">Appearance</h2>
            </div>
            <div className="p-6">
              <p className="text-sm text-white/50 mb-4">Choose how the dashboard looks to you.</p>
              <div className="grid grid-cols-3 gap-3">
                {([
                  { value: 'light', label: 'Light', icon: '☀️', desc: 'Clean white' },
                  { value: 'dark',  label: 'Dark',  icon: '🌙', desc: 'Easy on eyes' },
                  { value: 'system',label: 'System',icon: '💻', desc: 'Follows OS' },
                ] as const).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setTheme(opt.value)}
                    className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-all cursor-pointer ${
                      theme === opt.value
                        ? 'border-violet-500 bg-violet-600/15'
                        : 'border-white/10 bg-white/5 hover:border-violet-500/50 hover:bg-white/8'
                    }`}
                  >
                    <span className="text-2xl">{opt.icon}</span>
                    <span className={`text-sm font-semibold ${theme === opt.value ? 'text-violet-400' : 'text-white/70'}`}>
                      {opt.label}
                    </span>
                    <span className="text-xs text-white/30">{opt.desc}</span>
                    {theme === opt.value && (
                      <span className="w-2 h-2 rounded-full bg-violet-500" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Upgrade Plan Modal */}
      <Dialog open={showUpgrade} onOpenChange={setShowUpgrade}>
        <DialogContent className="w-[min(560px,calc(100vw-2rem))] max-h-[90vh] overflow-y-auto bg-[#1f1f28] border border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Choose a Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 mt-2">
            {PLANS.map((plan) => {
              const isCurrent = client?.plan === plan.id;
              const currentIdx = PLANS.findIndex(p => p.id === client?.plan);
              const planIdx = PLANS.findIndex(p => p.id === plan.id);
              const isDowngrade = planIdx < currentIdx;
              const isPaid = PAID_PLANS.includes(plan.id);
              return (
                <div
                  key={plan.id}
                  className={`rounded-xl border p-3 transition-colors ${
                    isCurrent ? 'border-violet-500 bg-violet-600/15' : 'border-white/10 bg-white/5 hover:border-violet-500/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-white">{plan.label}</span>
                        {isCurrent && (
                          <span className="inline-flex items-center rounded-full bg-violet-600 px-1.5 py-0 text-[10px] font-semibold text-white">Current</span>
                        )}
                        <span className="text-xs text-white/40">{plan.spins}</span>
                      </div>
                      <p className="text-lg font-bold leading-tight text-white">{plan.price}</p>
                    </div>
                    <button
                      className={`shrink-0 min-w-[90px] h-8 px-3 rounded-lg text-xs font-semibold transition-all ${
                        isCurrent
                          ? 'border border-white/10 bg-white/5 text-white/50 cursor-default'
                          : isDowngrade
                          ? 'border border-white/10 bg-transparent text-white/60 hover:bg-white/5'
                          : 'bg-violet-600 hover:bg-violet-500 text-white shadow-[0_0_0_1px_rgba(124,58,237,0.4)]'
                      }`}
                      disabled={isCurrent || upgrading}
                      onClick={() => handleUpgrade(plan.id)}
                    >
                      {upgrading ? '…' : isCurrent ? 'Current' : isDowngrade ? 'Downgrade' : isPaid ? 'Checkout →' : 'Switch'}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-2">
                    {plan.features.map((f) => (
                      <span key={f} className="text-xs text-white/40 flex items-center gap-1">
                        <span className="text-emerald-400">✓</span>{f}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-white/30 text-center mt-3">
            Growth / Pro / Enterprise redirect to Stripe checkout. Free &amp; Starter switch instantly.
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
