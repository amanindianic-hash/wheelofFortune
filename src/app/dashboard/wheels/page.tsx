'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Plus, Disc3, MoreHorizontal, Pencil, Pause, Play, Trash2 } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { Wheel } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const STATUS_MAP: Record<string, { dot: string; label: string }> = {
  active:   { dot: 'bg-emerald-500', label: 'Active' },
  draft:    { dot: 'bg-slate-400',   label: 'Draft' },
  paused:   { dot: 'bg-amber-400',   label: 'Paused' },
  archived: { dot: 'bg-rose-400',    label: 'Archived' },
};

export default function WheelsPage() {
  const [wheels, setWheels] = useState<Wheel[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  async function load() {
    const res = await api.get('/api/wheels');
    const data = await res.json();
    setWheels(data.wheels ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await api.post('/api/wheels', { name: newName.trim() });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error?.message); return; }
      toast.success('Wheel created!');
      setShowCreate(false);
      setNewName('');
      load();
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    const res = await api.del(`/api/wheels/${id}`);
    if (res.ok) { toast.success('Wheel deleted'); load(); }
    else toast.error('Failed to delete');
  }

  async function toggleStatus(id: string, currentStatus: string) {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    const res = await api.post(`/api/wheels/${id}/publish`, { status: newStatus });
    const data = await res.json();
    if (res.ok) { toast.success(`Wheel ${newStatus}`); load(); }
    else toast.error(data.error?.message ?? 'Failed to update status');
  }

  return (
    <div className="relative min-h-full">
      {/* Ambient background light leak */}
      <div 
        className="pointer-events-none absolute inset-x-0 top-0 h-[400px] z-0"
        style={{ background: 'radial-gradient(ellipse 70% 50% at 50% -10%, rgba(124,58,237,0.08) 0%, transparent 70%)' }}
      />

      <div className="relative z-10 p-6 md:p-8 max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-[32px] md:text-[40px] font-bold tracking-[-0.04em] leading-tight text-foreground"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Campaigns
            </h1>
            <p className="text-[14px] text-muted-foreground/60 font-medium mt-1">
              Design and manage your interactive spin-to-win experiences
            </p>
          </div>
          <Button
            size="sm"
            className="gap-2 h-10 px-5 text-[13px] font-bold tracking-tight text-white border-0 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            style={{ 
              background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
              boxShadow: '0 0 25px rgba(124,58,237,0.3), inset 0 1px 0 0 rgba(255,255,255,0.2)' 
            }}
            onClick={() => setShowCreate(true)}
          >
            <Plus className="h-4 w-4" /> New Campaign
          </Button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[80px] rounded-2xl glass-panel animate-pulse bg-white/[0.02]" />
            ))}
          </div>
        ) : wheels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-6 glass-panel rounded-[32px] text-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 blur-2xl bg-primary/20 rounded-full" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.03] ring-1 ring-white/10 shadow-xl">
                <Disc3 className="h-8 w-8 text-primary animate-[spin_10s_linear_infinite]" />
              </div>
            </div>
            <h3 className="text-xl font-bold tracking-tight text-foreground mb-2">No campaigns found</h3>
            <p className="text-[14px] text-muted-foreground/60 mb-8 max-w-sm leading-relaxed">
              Start your growth engine by creating your first interactive wheel or sweepstakes.
            </p>
            <Button
              size="lg"
              className="gap-2 h-11 px-8 rounded-xl font-bold text-white bg-primary hover:bg-primary/90 transition-all duration-300 shadow-[0_0_20px_rgba(124,58,237,0.4)]"
              onClick={() => setShowCreate(true)}
            >
              <Plus className="h-4 w-4" /> Create your first wheel
            </Button>
          </div>
        ) : (
          <div className="grid gap-3">
            {wheels.map((wheel) => {
              const s = STATUS_MAP[wheel.status] ?? STATUS_MAP.draft;
              return (
                <div key={wheel.id} 
                  className="group relative flex items-center justify-between pl-6 pr-5 py-5 glass-panel rounded-2xl hover:bg-white/[0.03] transition-all duration-300"
                >
                  <div className="flex items-center gap-5 min-w-0">
                    {/* Visual Marker */}
                    <div className="relative shrink-0">
                      <div className="absolute inset-0 blur-lg bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors" />
                      <div className="relative flex h-11 w-11 items-center justify-center rounded-[14px] bg-white/[0.03] ring-1 ring-white/10 shadow-lg group-hover:scale-110 transition-transform duration-500">
                        <Disc3 className={`h-5 w-5 text-muted-foreground/60 transition-colors group-hover:text-primary ${wheel.status === 'active' ? 'animate-[spin_8s_linear_infinite]' : ''}`} />
                      </div>
                    </div>

                    <div className="min-w-0">
                      <p className="text-[15px] font-bold text-foreground leading-[1.2] truncate tracking-tight mb-1">
                        {wheel.name}
                      </p>
                      <div className="flex items-center gap-3">
                        {/* Status Pill */}
                        <div className={`px-2 py-0.5 rounded-full ring-1 items-center gap-1.5 flex transition-all duration-300 ${
                          wheel.status === 'active' ? 'bg-emerald-500/10 ring-emerald-500/20 text-emerald-400'
                          : wheel.status === 'paused' ? 'bg-amber-500/10 ring-amber-500/20 text-amber-400'
                          : 'bg-slate-500/10 ring-slate-500/20 text-slate-400'
                        }`}>
                          <span className={`h-1 w-1 rounded-full ${
                            wheel.status === 'active' ? 'bg-emerald-400 animate-pulse'
                            : wheel.status === 'paused' ? 'bg-amber-400'
                            : 'bg-slate-400'
                          }`} />
                          <span className="text-[10px] font-bold uppercase tracking-[0.05em]">{s.label}</span>
                        </div>

                        <span className="text-muted-foreground/20 text-[10px] tabular-nums font-bold">·</span>
                        
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-bold text-muted-foreground/50 tabular-nums">
                            {wheel.total_spins.toLocaleString()}
                          </span>
                          <span className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest">Spins</span>
                        </div>

                        <span className="text-muted-foreground/20 text-[10px] tabular-nums font-bold hidden sm:inline">·</span>
                        
                        <div className="hidden sm:flex items-center gap-1.5">
                          <span className="text-[10px] font-mono font-bold text-muted-foreground/30 uppercase tracking-widest">Token:</span>
                          <span className="text-[10px] font-mono font-medium text-muted-foreground/40">
                            {wheel.embed_token.slice(0, 8)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 pr-4 pl-3.5 text-[11px] font-bold tracking-tight rounded-lg glass-panel hover:bg-white/[0.04] border-0 ring-1 ring-white/10 hidden sm:flex"
                      nativeButton={false}
                      render={<Link href={`/dashboard/wheels/${wheel.id}`} />}
                    >
                      <Pencil className="h-3 w-3 mr-2 text-primary" /> Edit
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-white/[0.05] transition-colors">
                            <MoreHorizontal className="h-4 w-4 text-muted-foreground/40" />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end" className="w-52 glass-panel p-1.5">
                        <DropdownMenuItem render={<Link href={`/dashboard/wheels/${wheel.id}`} />} className="rounded-lg py-2">
                          <Pencil className="mr-2 h-3.5 w-3.5 opacity-60" /> Edit Campaign
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="rounded-lg py-2"
                          onClick={() => toggleStatus(wheel.id, wheel.status)}
                          disabled={wheel.status === 'archived'}
                        >
                          {wheel.status === 'active'
                            ? <><Pause className="mr-2 h-3.5 w-3.5 opacity-60" /> Pause Automation</>
                            : <><Play  className="mr-2 h-3.5 w-3.5 opacity-60" /> Activate Campaign</>
                          }
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="opacity-10" />
                        <DropdownMenuItem
                          onClick={() => handleDelete(wheel.id, wheel.name)}
                          className="rounded-lg py-2 text-rose-500 focus:text-rose-500 focus:bg-rose-500/10"
                        >
                          <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete Forever
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create dialog */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="sm:max-w-md glass-panel border-0 shadow-2xl p-0 overflow-hidden rounded-[24px]">
            <div className="p-6 md:p-8 space-y-6">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
                  Create New Campaign
                </DialogTitle>
                <p className="text-[13px] text-muted-foreground/60 leading-relaxed mt-1">
                  Give your campaign a title. This is for internal reference only.
                </p>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="wheel-name" className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/50 ml-1">
                    Internal Title
                  </Label>
                  <Input
                    id="wheel-name"
                    placeholder="e.g. Q4 Growth Wheel"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                    autoFocus
                    className="h-11 bg-white/[0.02] border-white/[0.08] focus:border-primary/50 focus:ring-primary/20 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button 
                  variant="outline" 
                  className="flex-1 h-11 rounded-cl font-bold text-[13px] border-white/10 hover:bg-white/[0.05]" 
                  onClick={() => setShowCreate(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 h-11 rounded-xl font-bold text-[13px] text-white shadow-lg transition-transform active:scale-[0.98]"
                  style={{ 
                    background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                    boxShadow: '0 0 20px rgba(124,58,237,0.3)' 
                  }}
                  onClick={handleCreate}
                  disabled={creating || !newName.trim()}
                >
                  {creating ? 'Creating…' : 'Initialize Campaign'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
