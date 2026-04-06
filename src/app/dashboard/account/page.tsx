'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import { useAuth } from '@/components/providers/auth-provider';
import type { Client } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
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

  // Free / starter → direct switch (no payment needed)
  // growth / pro / enterprise → Stripe checkout
  const PAID_PLANS: ClientPlan[] = ['growth', 'pro', 'enterprise'];

  async function handleUpgrade(plan: ClientPlan) {
    if (!client || plan === client.plan) return;
    setUpgrading(true);
    try {
      if (PAID_PLANS.includes(plan)) {
        // Redirect to Stripe checkout
        const res = await api.post('/api/billing/checkout', { plan });
        const data = await res.json();
        if (res.ok && data.url) {
          window.location.href = data.url;
        } else {
          toast.error(data.error?.message ?? 'Could not start checkout');
        }
      } else {
        // Free / starter — direct plan switch
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
    <div className="p-8 space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Account Settings</h1>
        <p className="text-muted-foreground">Manage your company settings and team</p>
      </div>

      {/* Plan info */}
      {client && (
        <Card className="border-violet-400/40 bg-violet-50 dark:bg-violet-950/30 dark:border-violet-500/30">
          <CardContent className="flex items-center justify-between py-5">
            <div>
              <p className="text-sm text-muted-foreground">Current Plan</p>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge className="capitalize bg-violet-600">{client.plan}</Badge>
                <span className="text-sm">{PLAN_LIMITS[client.plan]}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {client.spins_used_this_month.toLocaleString()} of {client.plan_spin_limit.toLocaleString()} spins used this month
              </p>
            </div>
            {client.plan !== 'enterprise' && (
              <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white" onClick={() => setShowUpgrade(true)}>
                Upgrade Plan
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Company settings */}
      <Card>
        <CardHeader><CardTitle className="text-base">Company Settings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Company Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Timezone</Label>
            <Input value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })}
              placeholder="e.g. Asia/Kolkata, America/New_York" />
          </div>
          <div className="space-y-2">
            <Label>Custom Domain (optional)</Label>
            <Input value={form.custom_domain} onChange={(e) => setForm({ ...form, custom_domain: e.target.value })}
              placeholder="spin.yourcompany.com" />
            <p className="text-xs text-muted-foreground">Configure DNS to point to this platform and we&apos;ll handle SSL.</p>
          </div>
          <div className="flex justify-end">
            <Button className="bg-violet-600 hover:bg-violet-700" onClick={saveAccount} disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Team */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Team Members</CardTitle>
            <Badge variant="secondary">{team.length} member{team.length !== 1 ? 's' : ''}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {team.map((member, i) => (
              <div key={member.id}>
                {i > 0 && <Separator className="mb-3" />}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-violet-100 text-violet-700 text-sm">
                        {member.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium flex items-center gap-2">
                        {member.full_name}
                        {member.id === user?.id && <span className="text-xs text-muted-foreground">(you)</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize text-xs">{member.role}</Badge>
                    {!member.email_verified && (
                      <Badge variant="secondary" className="text-xs">Unverified</Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Team invitations are available on Growth and Pro plans. Contact support to invite additional team members.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Account slug */}
      {client && (
        <Card>
          <CardHeader><CardTitle className="text-base">Account Info</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Account Slug</span>
              <code className="font-mono bg-muted px-2 py-0.5 rounded text-xs">{client.slug}</code>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Member Since</span>
              <span>{new Date(client.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Billing Cycle Day</span>
              <span>Day {client.billing_cycle_day} of each month</span>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Appearance */}
      {themeMounted && <Card>
        <CardHeader><CardTitle className="text-base">Appearance</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">Choose how the dashboard looks to you.</p>
          <div className="grid grid-cols-3 gap-3">
            {([
              { value: 'light', label: 'Light', icon: '☀️', desc: 'Clean white' },
              { value: 'dark',  label: 'Dark',  icon: '🌙', desc: 'Easy on eyes' },
              { value: 'system',label: 'System',icon: '💻', desc: 'Follows OS' },
            ] as const).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all cursor-pointer ${
                  theme === opt.value
                    ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30'
                    : 'border-border hover:border-violet-300 bg-card'
                }`}
              >
                <span className="text-2xl">{opt.icon}</span>
                <span className={`text-sm font-semibold ${theme === opt.value ? 'text-violet-600 dark:text-violet-400' : ''}`}>
                  {opt.label}
                </span>
                <span className="text-xs text-muted-foreground">{opt.desc}</span>
                {theme === opt.value && (
                  <span className="w-2 h-2 rounded-full bg-violet-500" />
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>}

      {/* Upgrade Plan Modal */}
      <Dialog open={showUpgrade} onOpenChange={setShowUpgrade}>
        <DialogContent className="w-[min(560px,calc(100vw-2rem))] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Choose a Plan</DialogTitle>
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
                    isCurrent ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30' : 'border-border hover:border-violet-300'
                  }`}
                >
                  {/* Top row: name + price + button */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm">{plan.label}</span>
                        {isCurrent && <Badge className="text-[10px] bg-violet-600 px-1.5 py-0">Current</Badge>}
                        <span className="text-xs text-muted-foreground">{plan.spins}</span>
                      </div>
                      <p className="text-lg font-bold leading-tight">{plan.price}</p>
                    </div>
                    <Button
                      size="sm"
                      className="shrink-0 min-w-[90px]"
                      variant={isCurrent ? 'outline' : isDowngrade ? 'ghost' : 'default'}
                      style={!isCurrent && !isDowngrade ? { backgroundColor: '#7C3AED' } : {}}
                      disabled={isCurrent || upgrading}
                      onClick={() => handleUpgrade(plan.id)}
                    >
                      {upgrading ? '…' : isCurrent ? 'Current' : isDowngrade ? 'Downgrade' : isPaid ? 'Checkout →' : 'Switch'}
                    </Button>
                  </div>
                  {/* Features row */}
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-2">
                    {plan.features.map((f) => (
                      <span key={f} className="text-xs text-muted-foreground flex items-center gap-1">
                        <span className="text-green-500">✓</span>{f}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground text-center mt-3">
            Growth / Pro / Enterprise redirect to Stripe checkout. Free &amp; Starter switch instantly.
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
