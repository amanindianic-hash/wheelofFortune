'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Wheel {
  id: string;
  name: string;
}

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

  // Form state
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [url, setUrl] = useState('');
  const [targetWheel, setTargetWheel] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [subsRes, wheelsRes, logsRes] = await Promise.all([
        fetch('/api/push/stats'),
        fetch('/api/wheels?limit=100'),
        fetch('/api/push/logs'),
      ]);

      if (subsRes.ok) {
        const d = await subsRes.json();
        setSubscriberCount(d.data?.total ?? 0);
      }
      if (wheelsRes.ok) {
        const d = await wheelsRes.json();
        setWheels(d.data?.wheels ?? []);
      }
      if (logsRes.ok) {
        const d = await logsRes.json();
        setLogs(d.data?.logs ?? []);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.error('Title and message are required');
      return;
    }
    setSending(true);
    try {
      const res = await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), message: message.trim(), url: url.trim() || '/', wheel_id: targetWheel || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message ?? 'Failed to send');
      toast.success(`Sent to ${data.data?.sent ?? 0} subscribers`);
      setTitle('');
      setMessage('');
      setUrl('');
      setTargetWheel('');
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Push Notifications</h1>
        <p className="text-muted-foreground text-sm mt-1">Send web push notifications to subscribers</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-3xl font-bold">{loading ? '—' : subscriberCount}</p>
            <p className="text-sm text-muted-foreground mt-1">Total Subscribers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-3xl font-bold">{loading ? '—' : logs.length}</p>
            <p className="text-sm text-muted-foreground mt-1">Notifications Sent</p>
          </CardContent>
        </Card>
        <Card className="col-span-2 md:col-span-1">
          <CardContent className="pt-6">
            <p className="text-3xl font-bold">
              {loading ? '—' : logs.reduce((s, l) => s + (l.sent_count ?? 0), 0)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Total Deliveries</p>
          </CardContent>
        </Card>
      </div>

      {/* VAPID Keys note */}
      {(!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <strong>Setup required:</strong> Set <code className="font-mono text-xs bg-amber-100 px-1 rounded">VAPID_PUBLIC_KEY</code>, <code className="font-mono text-xs bg-amber-100 px-1 rounded">VAPID_PRIVATE_KEY</code>, and <code className="font-mono text-xs bg-amber-100 px-1 rounded">VAPID_SUBJECT</code> in your environment variables to enable push notifications.
          <br />
          Generate keys with: <code className="font-mono text-xs bg-amber-100 px-1 rounded">npx web-push generate-vapid-keys</code>
        </div>
      )}

      {/* Send form */}
      <Card>
        <CardHeader>
          <CardTitle>Send Notification</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Title *</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="New prize available! 🎁"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Message *</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Come back and spin the wheel to win exciting prizes!"
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Click URL</label>
                <input
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://yoursite.com/play/TOKEN"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Target Wheel (optional)</label>
                <select
                  value={targetWheel}
                  onChange={e => setTargetWheel(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
                >
                  <option value="">All subscribers</option>
                  {wheels.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="submit"
              disabled={sending}
              className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
            >
              {sending ? 'Sending…' : `Send to ${subscriberCount} subscriber${subscriberCount !== 1 ? 's' : ''}`}
            </button>
          </form>
        </CardContent>
      </Card>

      {/* Notification history */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No notifications sent yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Title</th>
                    <th className="pb-2 pr-4 font-medium">Message</th>
                    <th className="pb-2 pr-4 font-medium text-right">Sent</th>
                    <th className="pb-2 pr-4 font-medium text-right">Failed</th>
                    <th className="pb-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {logs.map(log => (
                    <tr key={log.id}>
                      <td className="py-2 pr-4 font-medium max-w-[140px] truncate">{log.title}</td>
                      <td className="py-2 pr-4 text-muted-foreground max-w-[200px] truncate">{log.message}</td>
                      <td className="py-2 pr-4 text-right">
                        <Badge variant="secondary" className="bg-green-100 text-green-700">{log.sent_count}</Badge>
                      </td>
                      <td className="py-2 pr-4 text-right">
                        {log.failed_count > 0 ? (
                          <Badge variant="secondary" className="bg-red-100 text-red-700">{log.failed_count}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-2 text-muted-foreground text-xs whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
