'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import type { Prize, PrizeType, CouponMode } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Gift, Tag, Star, CreditCard, MessageSquare, Link2, RefreshCw, Trash2 } from 'lucide-react';

const PRIZE_ICONS: Record<string, React.ReactNode> = {
  coupon:       <Tag className="h-4 w-4" />,
  points:       <Star className="h-4 w-4" />,
  gift_card:    <CreditCard className="h-4 w-4" />,
  message:      <MessageSquare className="h-4 w-4" />,
  url_redirect: <Link2 className="h-4 w-4" />,
  try_again:    <RefreshCw className="h-4 w-4" />,
};

const PRIZE_COLORS: Record<string, string> = {
  coupon:       'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  points:       'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  gift_card:    'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  message:      'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  url_redirect: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
  try_again:    'bg-slate-500/10 text-slate-600 dark:text-slate-400',
};

export default function PrizesPage() {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: '', type: 'coupon' as PrizeType, display_title: '', display_description: '',
    coupon_mode: 'static' as CouponMode, static_coupon_code: '',
    auto_gen_prefix: 'SPIN', auto_gen_length: 8, coupon_expiry_days: '',
    points_value: '', redirect_url: '', custom_message_html: '',
  });

  async function load() {
    const res = await api.get('/api/prizes');
    const data = await res.json();
    setPrizes(data.prizes ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function set(field: string, value: unknown) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleCreate() {
    setCreating(true);
    try {
      const body: Record<string, unknown> = {
        name: form.name, type: form.type, display_title: form.display_title,
        display_description: form.display_description || undefined,
      };
      if (form.type === 'coupon') {
        body.coupon_mode = form.coupon_mode;
        if (form.coupon_mode === 'static') body.static_coupon_code = form.static_coupon_code;
        if (form.coupon_mode === 'auto_generate') { body.auto_gen_prefix = form.auto_gen_prefix; body.auto_gen_length = form.auto_gen_length; }
        if (form.coupon_expiry_days) body.coupon_expiry_days = parseInt(form.coupon_expiry_days);
      }
      if (form.type === 'points') body.points_value = parseInt(form.points_value);
      if (form.type === 'url_redirect') body.redirect_url = form.redirect_url;
      if (form.type === 'message') body.custom_message_html = form.custom_message_html;

      const res = await api.post('/api/prizes', body);
      const data = await res.json();
      if (!res.ok) { toast.error(data.error?.message ?? 'Failed to create prize'); return; }
      toast.success('Prize created!');
      setShowCreate(false);
      load();
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete prize "${name}"?`)) return;
    const res = await api.del(`/api/prizes/${id}`);
    const data = await res.json();
    if (res.ok) { toast.success('Prize deleted'); load(); }
    else toast.error(data.error?.message ?? 'Failed to delete');
  }

  return (
    <div className="min-h-full bg-background">
      <div className="max-w-4xl mx-auto px-6 md:px-8 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[26px] font-bold tracking-[-0.03em]">Prizes</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Define prizes that can be assigned to wheel segments</p>
          </div>
          <Button
            size="sm"
            className="bg-violet-600 hover:bg-violet-700 text-white gap-1.5"
            onClick={() => setShowCreate(true)}
          >
            <Plus className="h-3.5 w-3.5" /> New Prize
          </Button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-[68px] rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : prizes.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 ring-1 ring-violet-500/20 mb-4">
                <Gift className="h-6 w-6 text-violet-500" />
              </div>
              <p className="text-sm font-semibold mb-1">No prizes yet</p>
              <p className="text-xs text-muted-foreground mb-5 max-w-[240px] leading-relaxed">
                Create prizes and assign them to wheel segments to reward your players
              </p>
              <Button
                size="sm"
                className="bg-violet-600 hover:bg-violet-700 text-white gap-1.5"
                onClick={() => setShowCreate(true)}
              >
                <Plus className="h-3.5 w-3.5" /> Create Prize
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden py-0 gap-0">
            <div className="divide-y divide-border/50">
              {prizes.map((prize) => {
                const icon = PRIZE_ICONS[prize.type] ?? <Gift className="h-4 w-4" />;
                const color = PRIZE_COLORS[prize.type] ?? PRIZE_COLORS.coupon;
                return (
                  <div key={prize.id} className="group flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors duration-150">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${color}`}>
                        {icon}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate leading-none">{prize.display_title}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {prize.name} · <span className="capitalize">{prize.type.replace(/_/g, ' ')}</span>
                          {prize.coupon_mode && <> · {prize.coupon_mode.replace(/_/g, ' ')}</>}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-all duration-150"
                      onClick={() => handleDelete(prize.id, prize.display_title)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Create Dialog */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Prize</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Internal Name</Label>
                  <Input placeholder="20% Discount Code" value={form.name} onChange={(e) => set('name', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Prize Type</Label>
                  <Select value={form.type} onValueChange={(v) => set('type', v ?? 'coupon')}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="coupon">Coupon</SelectItem>
                      <SelectItem value="points">Points</SelectItem>
                      <SelectItem value="gift_card">Gift Card</SelectItem>
                      <SelectItem value="message">Custom Message</SelectItem>
                      <SelectItem value="url_redirect">URL Redirect</SelectItem>
                      <SelectItem value="try_again">Try Again</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Display Title (shown to winner)</Label>
                <Input placeholder="20% OFF Your Order" value={form.display_title} onChange={(e) => set('display_title', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Display Description (optional)</Label>
                <Input placeholder="Use code at checkout" value={form.display_description} onChange={(e) => set('display_description', e.target.value)} />
              </div>
              {form.type === 'coupon' && (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Coupon Mode</Label>
                    <Select value={form.coupon_mode} onValueChange={(v) => set('coupon_mode', v ?? 'static')}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="static">Static (same code for everyone)</SelectItem>
                        <SelectItem value="unique_pool">Unique Pool (pre-uploaded codes)</SelectItem>
                        <SelectItem value="auto_generate">Auto Generate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {form.coupon_mode === 'static' && (
                    <div className="space-y-1.5">
                      <Label className="text-xs">Coupon Code</Label>
                      <Input placeholder="SUMMER20" value={form.static_coupon_code} onChange={(e) => set('static_coupon_code', e.target.value)} />
                    </div>
                  )}
                  {form.coupon_mode === 'auto_generate' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Prefix</Label>
                        <Input placeholder="SPIN" value={form.auto_gen_prefix} onChange={(e) => set('auto_gen_prefix', e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Total Length</Label>
                        <Input type="number" min="4" max="20" value={form.auto_gen_length} onChange={(e) => set('auto_gen_length', parseInt(e.target.value))} />
                      </div>
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label className="text-xs">Expiry (days, optional)</Label>
                    <Input type="number" placeholder="30" value={form.coupon_expiry_days} onChange={(e) => set('coupon_expiry_days', e.target.value)} />
                  </div>
                </>
              )}
              {form.type === 'points' && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Points Value</Label>
                  <Input type="number" placeholder="100" value={form.points_value} onChange={(e) => set('points_value', e.target.value)} />
                </div>
              )}
              {form.type === 'url_redirect' && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Redirect URL</Label>
                  <Input type="url" placeholder="https://example.com/prize" value={form.redirect_url} onChange={(e) => set('redirect_url', e.target.value)} />
                </div>
              )}
              {form.type === 'message' && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Custom Message HTML</Label>
                  <Textarea rows={4} placeholder="<p>Congratulations! You won a <strong>free gift</strong>!</p>"
                    value={form.custom_message_html} onChange={(e) => set('custom_message_html', e.target.value)} />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button
                className="bg-violet-600 hover:bg-violet-700 text-white"
                onClick={handleCreate}
                disabled={creating || !form.name || !form.display_title}
              >
                {creating ? 'Creating…' : 'Create Prize'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}
