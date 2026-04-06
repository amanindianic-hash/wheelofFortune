'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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
      l.lead_name ?? '',
      l.lead_email ?? '',
      l.lead_phone ?? '',
      l.gdpr_consent ? 'Yes' : 'No',
      l.wheel_name,
      l.prize_won ?? '',
      l.coupon_code ?? '',
      new Date(l.created_at).toLocaleString(),
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'leads.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  const totalPages = Math.ceil(total / 50);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="text-sm text-muted-foreground mt-1">Contact details collected before each spin</p>
        </div>
        <Button onClick={exportCSV} variant="outline" disabled={leads.length === 0}>
          Export CSV
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">{total}</p>
            <p className="text-sm text-muted-foreground">Total Leads</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">{leads.filter(l => l.lead_email).length}</p>
            <p className="text-sm text-muted-foreground">With Email (this page)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">{leads.filter(l => l.lead_phone).length}</p>
            <p className="text-sm text-muted-foreground">With Phone (this page)</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader><CardTitle className="text-base">Filter Leads</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-3 flex-wrap items-center">
            <Select value={wheelId || 'all'} onValueChange={v => setWheelId(v === 'all' ? '' : (v ?? ''))}>
              <SelectTrigger className="w-52">
                <SelectValue placeholder="All Wheels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Wheels</SelectItem>
                {wheels.map(w => (
                  <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Search name, email or phone…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchLeads(1)}
              className="w-full sm:w-72"
            />
            <Button onClick={() => fetchLeads(1)} variant="secondary">Search</Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">Loading…</div>
          ) : leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 space-y-2">
              <p className="text-4xl">📋</p>
              <p className="text-sm text-muted-foreground">No leads yet. Enable the lead form on a wheel to start collecting contacts.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Wheel</TableHead>
                  <TableHead>Prize Won</TableHead>
                  <TableHead>Coupon</TableHead>
                  <TableHead>GDPR</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map(l => (
                  <TableRow key={l.session_id}>
                    <TableCell className="font-medium">{l.lead_name || <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell>{l.lead_email || <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell>{l.lead_phone || <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell className="text-sm">{l.wheel_name}</TableCell>
                    <TableCell>
                      {l.prize_won
                        ? <Badge variant="secondary" className="text-xs">{l.prize_won}</Badge>
                        : <span className="text-muted-foreground text-xs">No win</span>}
                    </TableCell>
                    <TableCell>
                      {l.coupon_code
                        ? <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{l.coupon_code}</code>
                        : <span className="text-muted-foreground text-xs">—</span>}
                    </TableCell>
                    <TableCell>
                      {l.gdpr_consent
                        ? <Badge className="bg-green-100 text-green-700 text-xs">Yes</Badge>
                        : <Badge variant="outline" className="text-xs">No</Badge>}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(l.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
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
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Showing {(page - 1) * 50 + 1}–{Math.min(page * 50, total)} of {total}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => fetchLeads(page - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => fetchLeads(page + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
