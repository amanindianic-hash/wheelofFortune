'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
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
    <div className="min-h-full bg-[#13131b]">
      <div className="max-w-4xl mx-auto px-6 md:px-8 py-8 space-y-6">

        {/* Header */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-violet-400 mb-1">Notifications</p>
          <h1 className="text-[26px] font-bold tracking-[-0.03em] text-white">Push Notifications</h1>
          <p className="text-sm text-white/50 mt-0.5">Send web push notifications to your subscribers</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Subscribers',     value: loading ? '—' : subscriberCount.toLocaleString(), icon: Users,        bar: 'from-violet-600 to-violet-400',   bg: 'bg-violet-500/10',  iconCls: 'text-violet-400' },
            { label: 'Campaigns Sent',  value: loading ? '—' : logs.length,                      icon: Bell,         bar: 'from-blue-600 to-blue-400',       bg: 'bg-blue-500/10',    iconCls: 'text-blue-400' },
            { label: 'Total Delivered', value: loading ? '—' : totalDeliveries.toLocaleString(), icon: CheckCircle2, bar: 'from-emerald-600 to-emerald-400', bg: 'bg-emerald-500/10', iconCls: 'text-emerald-400' },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="relative overflow-hidden rounded-lg bg-[#1f1f28] border border-white/5 p-5">
                <div className={`absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r ${s.bar}`} />
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${s.bg} mb-4`}>
                  <Icon className={`h-4 w-4 ${s.iconCls}`} />
                </div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-white/40 mb-1.5">{s.label}</p>
                <p className="text-[36px] font-bold tabular-nums tracking-[-0.04em] leading-none text-white">{s.value}</p>
              </div>
            );
          })}
        </div>

        {/* VAPID warning */}
        {vapidMissing && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
            <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
            <div className="text-sm text-amber-400">
              <p className="font-semibold mb-1">Setup required</p>
              <p className="text-xs leading-relaxed text-amber-400/80">
                Set <code className="font-mono bg-amber-500/15 px-1 rounded text-[11px]">VAPID_PUBLIC_KEY</code>,{' '}
                <code className="font-mono bg-amber-500/15 px-1 rounded text-[11px]">VAPID_PRIVATE_KEY</code>, and{' '}
                <code className="font-mono bg-amber-500/15 px-1 rounded text-[11px]">VAPID_SUBJECT</code> to enable push.
                Generate with: <code className="font-mono bg-amber-500/15 px-1 rounded text-[11px]">npx web-push generate-vapid-keys</code>
              </p>
            </div>
          </div>
        )}

        {/* Send form */}
        <div className="rounded-2xl border border-white/5 bg-[rgba(31,31,40,0.7)] backdrop-blur-xl overflow-hidden">
          <div className="px-6 pt-5 pb-4 border-b border-white/5 flex items-center gap-2">
            <Send className="h-4 w-4 text-white/40" />
            <span className="text-sm font-semibold text-white">Send Notification</span>
          </div>
          <div className="p-6">
            <form onSubmit={handleSend} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/70">Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="New prize available!"
                    required
                    className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-white placeholder:text-white/30 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/70">Click URL</label>
                  <input
                    type="text"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    placeholder="https://yoursite.com/play/TOKEN"
                    className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-white placeholder:text-white/30 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-colors"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/70">Message *</label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Come back and spin the wheel to win exciting prizes!"
                  rows={3}
                  required
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-white placeholder:text-white/30 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-colors resize-none text-sm"
                />
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
                <div className="space-y-1.5 w-full sm:w-48">
                  <label className="text-xs font-medium text-white/70">Target Wheel <span className="text-white/30 font-normal">(optional)</span></label>
                  <Select value={targetWheel} onValueChange={(v) => setTargetWheel(v ?? 'all')}>
                    <SelectTrigger className="h-9 border-white/10 bg-white/5 text-white/70">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All subscribers</SelectItem>
                      {wheels.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <button
                  type="submit"
                  disabled={sending}
                  className="h-9 px-4 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold shadow-[0_0_0_1px_rgba(124,58,237,0.4),0_4px_12px_-2px_rgba(124,58,237,0.35)] transition-all duration-200 disabled:opacity-50 flex items-center gap-1.5 sm:ml-auto"
                >
                  <Send className="h-3.5 w-3.5" />
                  {sending ? 'Sending…' : `Send to ${subscriberCount} subscriber${subscriberCount !== 1 ? 's' : ''}`}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Notification history */}
        <div className="rounded-2xl border border-white/5 bg-[rgba(31,31,40,0.7)] backdrop-blur-xl overflow-hidden">
          <div className="px-6 pt-5 pb-4 border-b border-white/5">
            <span className="text-sm font-semibold text-white">Recent Campaigns</span>
          </div>

          {loading ? (
            <div className="space-y-2 p-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-white/5 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 mb-3">
                <Bell className="h-5 w-5 text-white/20" />
              </div>
              <p className="text-sm font-medium text-white/50">No notifications sent yet</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {logs.map(log => (
                <div key={log.id} className="flex items-start justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white truncate">{log.title}</p>
                    <p className="text-[11px] text-white/40 truncate mt-0.5">{log.message}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <span className="inline-flex items-center rounded-md bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20 px-2 py-0.5 text-[11px] font-medium">
                      {log.sent_count} sent
                    </span>
                    {log.failed_count > 0 && (
                      <span className="inline-flex items-center rounded-md bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20 px-2 py-0.5 text-[11px] font-medium">
                        {log.failed_count} failed
                      </span>
                    )}
                    <span className="text-[11px] text-white/30 tabular-nums hidden sm:block">
                      {new Date(log.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
