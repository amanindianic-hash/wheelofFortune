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
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Wheels</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your spin-to-win campaigns</p>
        </div>
        <Button
          size="sm"
          className="bg-violet-600 hover:bg-violet-700 gap-1.5 h-8"
          onClick={() => setShowCreate(true)}
        >
          <Plus className="h-3.5 w-3.5" /> New Wheel
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[68px] rounded-xl bg-muted/60 animate-pulse" />
          ))}
        </div>
      ) : wheels.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted mb-4">
              <Disc3 className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium mb-1">No wheels yet</p>
            <p className="text-xs text-muted-foreground mb-5 max-w-xs">
              Create your first campaign to start collecting leads and giving away prizes
            </p>
            <Button
              size="sm"
              className="bg-violet-600 hover:bg-violet-700 gap-1.5"
              onClick={() => setShowCreate(true)}
            >
              <Plus className="h-3.5 w-3.5" /> Create your first wheel
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="divide-y">
            {wheels.map((wheel) => {
              const s = STATUS_MAP[wheel.status] ?? STATUS_MAP.draft;
              return (
                <div key={wheel.id} className="flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors group">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted shrink-0">
                      <Disc3 className="h-4.5 w-4.5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{wheel.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                          <span className="text-xs text-muted-foreground">{s.label}</span>
                        </div>
                        <span className="text-muted-foreground/30 text-xs">·</span>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {wheel.total_spins.toLocaleString()} spins
                        </span>
                        <span className="text-muted-foreground/30 text-xs hidden sm:inline">·</span>
                        <span className="text-xs text-muted-foreground font-mono hidden sm:inline truncate max-w-[100px]">
                          {wheel.embed_token.slice(0, 10)}…
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs hidden sm:flex"
                      nativeButton={false}
                      render={<Link href={`/dashboard/wheels/${wheel.id}`} />}
                    >
                      <Pencil className="h-3 w-3 mr-1" /> Edit
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem render={<Link href={`/dashboard/wheels/${wheel.id}`} />}>
                          <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => toggleStatus(wheel.id, wheel.status)}
                          disabled={wheel.status === 'archived'}
                        >
                          {wheel.status === 'active'
                            ? <><Pause className="mr-2 h-3.5 w-3.5" /> Pause</>
                            : <><Play  className="mr-2 h-3.5 w-3.5" /> Activate</>
                          }
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDelete(wheel.id, wheel.name)}
                          className="text-red-500 focus:text-red-500"
                        >
                          <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Create new wheel</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="wheel-name" className="text-xs font-medium">Wheel name</Label>
              <Input
                id="wheel-name"
                placeholder="e.g. Summer Sale Campaign"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                autoFocus
              />
            </div>
            <p className="text-xs text-muted-foreground">Internal label — not visible to end users.</p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button
              size="sm"
              className="bg-violet-600 hover:bg-violet-700"
              onClick={handleCreate}
              disabled={creating || !newName.trim()}
            >
              {creating ? 'Creating…' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
