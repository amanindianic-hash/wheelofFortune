'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Send, Users, CheckCircle2, AlertTriangle } from 'lucide-react';

interface Wheel { id: string; name: string; }

interface NotifLog {
  id: string;
  title: string;
  message: string;
  url: string | null;
  wheel_id: string | null;
  sent_count: number;
  failed_count: number;
  created_at: string;
}

export default function PushPage() {
  const [subscriberCount, setSubscriberCount] = useState<number>(0);
  const [wheels, setWheels] = useState<Wheel[]>([]);
  const [logs, setLogs] = useState<NotifLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [url, setUrl] = useState('');
  const [targetWheel, setTargetWheel] = useState('all');

  const loadData = useCallback(async () => {
    try {
      const [subsRes, wheelsRes, logsRes] = await Promise.all([
        fetch('/api/push/stats'),
        fetch('/api/wheels?limit=100'),
        fetch('/api/push/logs'),
      ]);
      if (subsRes.ok) { const d = await subsRes.json(); setSubscriberCount(d.data?.total ?? 0); }
      if (wheelsRes.ok) { const d = await wheelsRes.json(); setWheels(d.data?.wheels ?? []); }
      if (logsRes.ok) { const d = await logsRes.json(); setLogs(d.data?.logs ?? []); }
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !message.trim()) { toast.error('Title and message are required'); return; }
    setSending(true);
    try {
      const res = await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          url: url.trim() || '/',
          wheel_id: targetWheel === 'all' ? null : targetWheel,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message ?? 'Failed to send');
      toast.success(`Sent to ${data.data?.sent ?? 0} subscribers`);
      setTitle(''); setMessage(''); setUrl(''); setTargetWheel('all');
      loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to send');
    } finally {
      setSending(false);
    }
  }

  const totalDeliveries = logs.reduce((s, l) => s + (l.sent_count ?? 0), 0);
  const vapidMissing = !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  return (
    <div className="min-h-full bg-background">
      <div className="max-w-4xl mx-auto px-6 md:px-8 py-8 space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-[26px] font-bold tracking-[-0.03em]">Push Notifications</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Send web push notifications to your subscribers</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Subscribers',     value: loading ? '—' : subscriberCount.toLocaleString(), icon: Users,         bar: 'from-violet-600 to-violet-400', bg: 'bg-violet-500/10', iconCls: 'text-violet-600 dark:text-violet-400' },
            { label: 'Campaigns Sent',  value: loading ? '—' : logs.length,                      icon: Bell,          bar: 'from-blue-600 to-blue-400',     bg: 'bg-blue-500/10',   iconCls: 'text-blue-600 dark:text-blue-400' },
            { label: 'Total Delivered', value: loading ? '—' : totalDeliveries.toLocaleString(), icon: CheckCircle2,  bar: 'from-emerald-600 to-emerald-400', bg: 'bg-emerald-500/10', iconCls: 'text-emerald-600 dark:text-emerald-400' },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.label} className="relative overflow-hidden">
                <div className={`absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r ${s.bar}`} />
                <CardContent className="p-5 pt-6">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${s.bg} mb-4`}>
                    <Icon className={`h-4 w-4 ${s.iconCls}`} />
                  </div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground mb-1.5">{s.label}</p>
                  <p className="text-[36px] font-bold tabular-nums tracking-[-0.04em] leading-none text-foreground">{s.value}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* VAPID warning */}
        {vapidMissing && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div className="text-sm text-amber-700 dark:text-amber-400">
              <p className="font-semibold mb-1">Setup required</p>
              <p className="text-xs leading-relaxed">
                Set <code className="font-mono bg-amber-500/15 px-1 rounded text-[11px]">VAPID_PUBLIC_KEY</code>,{' '}
                <code className="font-mono bg-amber-500/15 px-1 rounded text-[11px]">VAPID_PRIVATE_KEY</code>, and{' '}
                <code className="font-mono bg-amber-500/15 px-1 rounded text-[11px]">VAPID_SUBJECT</code> to enable push.
                Generate with: <code className="font-mono bg-amber-500/15 px-1 rounded text-[11px]">npx web-push generate-vapid-keys</code>
              </p>
            </div>
          </div>
        )}

        {/* Send form */}
        <Card>
          <CardHeader className="pb-3 pt-5 px-5">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Send className="h-4 w-4 text-muted-foreground" />
              Send Notification
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <form onSubmit={handleSend} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Title *</Label>
                  <Input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="New prize available!"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Click URL</Label>
                  <Input
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    placeholder="https://yoursite.com/play/TOKEN"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Message *</Label>
                <Textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Come back and spin the wheel to win exciting prizes!"
                  rows={3}
                  className="resize-none"
                  required
                />
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
                <div className="space-y-1.5 w-full sm:w-48">
                  <Label className="text-xs">Target Wheel (optional)</Label>
                  <Select value={targetWheel} onValueChange={(v) => setTargetWheel(v ?? 'all')}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All subscribers</SelectItem>
                      {wheels.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="submit"
                  disabled={sending}
                  className="bg-violet-600 hover:bg-violet-700 text-white gap-1.5 h-9 sm:ml-auto"
                >
                  <Send className="h-3.5 w-3.5" />
                  {sending ? 'Sending…' : `Send to ${subscriberCount} subscriber${subscriberCount !== 1 ? 's' : ''}`}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Notification history */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-3 pt-5 px-5 border-b border-border/50">
            <CardTitle className="text-sm font-semibold">Recent Campaigns</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-2 p-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />
                ))}
              </div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted mb-3">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">No notifications sent yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {logs.map(log => (
                  <div key={log.id} className="flex items-start justify-between px-5 py-3.5 hover:bg-muted/20 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{log.title}</p>
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">{log.message}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-4">
                      <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-500/20 text-[11px] py-0.5">
                        {log.sent_count} sent
                      </Badge>
                      {log.failed_count > 0 && (
                        <Badge variant="secondary" className="bg-rose-500/10 text-rose-700 dark:text-rose-400 ring-1 ring-rose-500/20 text-[11px] py-0.5">
                          {log.failed_count} failed
                        </Badge>
                      )}
                      <span className="text-[11px] text-muted-foreground tabular-nums hidden sm:block">
                        {new Date(log.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
