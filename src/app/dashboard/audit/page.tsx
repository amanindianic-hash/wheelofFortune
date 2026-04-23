'use client';

import { useEffect, useState } from 'react';
import { FileText, ShieldCheck, PenLine, Trash2, Plus } from 'lucide-react';

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  changes: unknown;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

function getActionStyle(action: string): { icon: React.ReactNode; badge: string } {
  if (action.includes('create') || action.includes('add')) {
    return { icon: <Plus className="h-3 w-3" />, badge: 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20' };
  }
  if (action.includes('delete') || action.includes('remove')) {
    return { icon: <Trash2 className="h-3 w-3" />, badge: 'bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20' };
  }
  if (action.includes('update') || action.includes('edit')) {
    return { icon: <PenLine className="h-3 w-3" />, badge: 'bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20' };
  }
  return { icon: <ShieldCheck className="h-3 w-3" />, badge: 'bg-slate-500/10 text-slate-400 ring-1 ring-slate-500/20' };
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/account/audit-logs')
      .then((res) => res.json())
      .then((data) => {
        setLogs(data.logs || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-full bg-[#13131b]">
      <div className="max-w-5xl mx-auto px-6 md:px-8 py-8 space-y-6">

        {/* Header */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-violet-400 mb-1">Security</p>
          <h1 className="text-[26px] font-bold tracking-[-0.03em] text-white">Audit Logs</h1>
          <p className="text-sm text-white/50 mt-0.5">
            Review all administrative actions and security events on your account.
          </p>
        </div>

        {/* Log Table */}
        <div className="rounded-2xl border border-white/5 bg-[rgba(31,31,40,0.7)] backdrop-blur-xl overflow-hidden">
          <div className="px-6 pt-5 pb-4 border-b border-white/5 flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5">
              <FileText className="h-3.5 w-3.5 text-white/40" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Activity History</p>
              <p className="text-xs text-white/40 mt-0.5">Historical record of changes to wheels, prizes, and settings.</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-14">
              <div className="h-5 w-5 rounded-full border-2 border-violet-600 border-t-transparent animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10 mb-4">
                <FileText className="h-6 w-6 text-white/20" />
              </div>
              <p className="text-sm font-semibold text-white mb-1">No audit logs yet</p>
              <p className="text-xs text-white/40 max-w-xs leading-relaxed">
                Actions taken on your account will appear here for security and compliance.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <th className="text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-white/30 px-5 py-3">Date & Time</th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-white/30 px-3 py-3">Action</th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-white/30 px-3 py-3">Resource</th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-white/30 px-3 py-3 hidden sm:table-cell">Changes</th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-white/30 px-5 py-3 hidden md:table-cell">IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, i) => {
                    const { icon, badge } = getActionStyle(log.action);
                    const changeCount = Object.keys(
                      (log.changes as Record<string, Record<string, unknown>>)?.after ?? (log.changes as Record<string, unknown>) ?? {}
                    ).length;
                    return (
                      <tr
                        key={log.id}
                        className={`transition-colors hover:bg-white/[0.02] ${i < logs.length - 1 ? 'border-b border-white/5' : ''}`}
                      >
                        <td className="px-5 py-3.5">
                          <span className="text-[11px] font-mono text-white/40 whitespace-nowrap">
                            {new Date(log.created_at).toLocaleString('en-US', {
                              month: 'short', day: 'numeric',
                              hour: 'numeric', minute: '2-digit',
                            })}
                          </span>
                        </td>
                        <td className="px-3 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium capitalize ${badge}`}>
                            {icon}
                            {log.action.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-3 py-3.5">
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-white/80 capitalize">{log.resource_type || '—'}</span>
                            {log.resource_id && (
                              <span className="text-[10px] text-white/30 font-mono truncate max-w-[100px] mt-0.5">
                                {log.resource_id.slice(0, 8)}…
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3.5 hidden sm:table-cell">
                          {changeCount > 0 ? (
                            <span className="text-xs text-white/40">{changeCount} field{changeCount !== 1 ? 's' : ''} modified</span>
                          ) : (
                            <span className="text-xs text-white/20">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 hidden md:table-cell">
                          <span className="text-xs font-mono text-white/40">{log.ip_address || '—'}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
