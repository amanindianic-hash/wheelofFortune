'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Search, Users, Mail, Phone } from 'lucide-react';

interface Lead {
  session_id: string;
  lead_name: string | null;
  lead_email: string | null;
  lead_phone: string | null;
  gdpr_consent: boolean;
  created_at: string;
  wheel_id: string;
  wheel_name: string;
  prize_won: string | null;
  coupon_code: string | null;
}
interface Wheel { id: string; name: string; }

export default function LeadsPage() {
  const [leads, setLeads]     = useState<Lead[]>([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [search, setSearch]   = useState('');
  const [wheelId, setWheelId] = useState('');
  const [wheels, setWheels]   = useState<Wheel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/wheels')
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(d => setWheels(d.wheels ?? []))
      .catch(() => {});
  }, []);

  const fetchLeads = useCallback(async (p = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: '50' });
    if (wheelId) params.set('wheel_id', wheelId);
    if (search)  params.set('search', search);
    const res  = await api.get(`/api/leads?${params}`);
    if (!res.ok) { setLoading(false); return; }
    const data = await res.json();
    setLeads(data.leads ?? []);
    setTotal(data.total ?? 0);
    setPage(p);
    setLoading(false);
  }, [wheelId, search]);

  useEffect(() => { fetchLeads(1); }, [fetchLeads]);

  function exportCSV() {
    const headers = ['Name', 'Email', 'Phone', 'GDPR Consent', 'Wheel', 'Prize Won', 'Coupon Code', 'Date'];
    const rows = leads.map(l => [
      l.lead_name ?? '', l.lead_email ?? '', l.lead_phone ?? '',
      l.gdpr_consent ? 'Yes' : 'No', l.wheel_name, l.prize_won ?? '',
      l.coupon_code ?? '', new Date(l.created_at).toLocaleString(),
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'leads.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  const withEmail = leads.filter(l => l.lead_email).length;
  const withPhone = leads.filter(l => l.lead_phone).length;
  const totalPages = Math.ceil(total / 50);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Leads</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Contact details collected before each spin</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs"
          onClick={exportCSV}
          disabled={leads.length === 0}
        >
          <Download className="h-3.5 w-3.5" /> Export CSV
        </Button>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-2">
              <p className="text-xs font-medium text-muted-foreground">Total Leads</p>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-semibold tabular-nums tracking-tight">{total.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-2">
              <p className="text-xs font-medium text-muted-foreground">With Email</p>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
                <Mail className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-semibold tabular-nums tracking-tight">{withEmail}</p>
            <p className="text-xs text-muted-foreground mt-0.5">this page</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-2">
              <p className="text-xs font-medium text-muted-foreground">With Phone</p>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                <Phone className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-semibold tabular-nums tracking-tight">{withPhone}</p>
            <p className="text-xs text-muted-foreground mt-0.5">this page</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Select value={wheelId || 'all'} onValueChange={v => setWheelId(v === 'all' ? '' : (v ?? ''))}>
          <SelectTrigger className="h-8 w-44 text-xs">
            <SelectValue placeholder="All Wheels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Wheels</SelectItem>
            {wheels.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search name, email or phone…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchLeads(1)}
            className="h-8 pl-8 text-xs"
          />
        </div>
        <Button size="sm" variant="secondary" className="h-8 text-xs" onClick={() => fetchLeads(1)}>
          Search
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full border-2 border-violet-600 border-t-transparent animate-spin" />
                Loading…
              </div>
            </div>
          ) : leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted mb-4">
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium mb-1">No leads yet</p>
              <p className="text-xs text-muted-foreground max-w-xs">
                Enable the lead form on a wheel to start collecting contacts
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-medium pl-5">Name</TableHead>
                  <TableHead className="text-xs font-medium">Email</TableHead>
                  <TableHead className="text-xs font-medium hidden md:table-cell">Phone</TableHead>
                  <TableHead className="text-xs font-medium hidden lg:table-cell">Wheel</TableHead>
                  <TableHead className="text-xs font-medium">Prize</TableHead>
                  <TableHead className="text-xs font-medium hidden sm:table-cell">Coupon</TableHead>
                  <TableHead className="text-xs font-medium hidden md:table-cell">GDPR</TableHead>
                  <TableHead className="text-xs font-medium pr-5">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map(l => (
                  <TableRow key={l.session_id} className="text-sm">
                    <TableCell className="font-medium pl-5 py-3">
                      {l.lead_name || <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="py-3">
                      {l.lead_email
                        ? <span className="text-xs">{l.lead_email}</span>
                        : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="py-3 hidden md:table-cell">
                      {l.lead_phone
                        ? <span className="text-xs">{l.lead_phone}</span>
                        : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="py-3 hidden lg:table-cell">
                      <span className="text-xs text-muted-foreground">{l.wheel_name}</span>
                    </TableCell>
                    <TableCell className="py-3">
                      {l.prize_won
                        ? <span className="inline-flex items-center rounded-full bg-violet-50 dark:bg-violet-900/20 px-2 py-0.5 text-[11px] font-medium text-violet-700 dark:text-violet-300">{l.prize_won}</span>
                        : <span className="text-muted-foreground text-xs">—</span>}
                    </TableCell>
                    <TableCell className="py-3 hidden sm:table-cell">
                      {l.coupon_code
                        ? <code className="text-[11px] bg-muted px-1.5 py-0.5 rounded font-mono">{l.coupon_code}</code>
                        : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="py-3 hidden md:table-cell">
                      {l.gdpr_consent
                        ? <span className="inline-flex items-center rounded-full bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">Yes</span>
                        : <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">No</span>}
                    </TableCell>
                    <TableCell className="py-3 pr-5">
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {new Date(l.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Showing {(page - 1) * 50 + 1}–{Math.min(page * 50, total)} of {total.toLocaleString()} leads</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page <= 1} onClick={() => fetchLeads(page - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page >= totalPages} onClick={() => fetchLeads(page + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
