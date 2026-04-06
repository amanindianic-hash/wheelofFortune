'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
    return { icon: <Plus className="h-3 w-3" />, badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-500/20' };
  }
  if (action.includes('delete') || action.includes('remove')) {
    return { icon: <Trash2 className="h-3 w-3" />, badge: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 ring-1 ring-rose-500/20' };
  }
  if (action.includes('update') || action.includes('edit')) {
    return { icon: <PenLine className="h-3 w-3" />, badge: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 ring-1 ring-blue-500/20' };
  }
  return { icon: <ShieldCheck className="h-3 w-3" />, badge: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 ring-1 ring-slate-500/20' };
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
    <div className="min-h-full bg-background">
      <div className="max-w-5xl mx-auto px-6 md:px-8 py-8 space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-[26px] font-bold tracking-[-0.03em]">Audit Logs</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Review all administrative actions and security events on your account.
          </p>
        </div>

        <Card className="overflow-hidden">
          <CardHeader className="pb-3 pt-5 px-5 border-b border-border/50">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div>
                <CardTitle className="text-sm font-semibold">Activity History</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Historical record of changes to wheels, prizes, and settings.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-5 w-5 rounded-full border-2 border-violet-600 border-t-transparent animate-spin" />
              </div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted ring-1 ring-border mb-4">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-semibold mb-1">No audit logs yet</p>
                <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                  Actions taken on your account will appear here for security and compliance.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/50 bg-muted/20">
                    <TableHead className="text-xs font-medium pl-5">Date & Time</TableHead>
                    <TableHead className="text-xs font-medium">Action</TableHead>
                    <TableHead className="text-xs font-medium">Resource</TableHead>
                    <TableHead className="text-xs font-medium hidden sm:table-cell">Changes</TableHead>
                    <TableHead className="text-xs font-medium pr-5 hidden md:table-cell">IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => {
                    const { icon, badge } = getActionStyle(log.action);
                    const changeCount = Object.keys(
                      (log.changes as Record<string, Record<string, unknown>>)?.after ?? (log.changes as Record<string, unknown>) ?? {}
                    ).length;
                    return (
                      <TableRow key={log.id} className="border-border/40 hover:bg-muted/20 transition-colors">
                        <TableCell className="pl-5 py-3">
                          <span className="text-[11px] font-mono text-muted-foreground whitespace-nowrap">
                            {new Date(log.created_at).toLocaleString('en-US', {
                              month: 'short', day: 'numeric',
                              hour: 'numeric', minute: '2-digit',
                            })}
                          </span>
                        </TableCell>
                        <TableCell className="py-3">
                          <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium capitalize ${badge}`}>
                            {icon}
                            {log.action.replace(/_/g, ' ')}
                          </span>
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-foreground capitalize">{log.resource_type || '—'}</span>
                            {log.resource_id && (
                              <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[100px] mt-0.5">
                                {log.resource_id.slice(0, 8)}…
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-3 hidden sm:table-cell">
                          {changeCount > 0 ? (
                            <span className="text-xs text-muted-foreground">{changeCount} field{changeCount !== 1 ? 's' : ''} modified</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="py-3 pr-5 hidden md:table-cell">
                          <span className="text-xs font-mono text-muted-foreground">{log.ip_address || '—'}</span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
