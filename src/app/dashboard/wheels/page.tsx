'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import type { Wheel } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Wheels</h1>
          <p className="text-muted-foreground">Manage your spin-to-win campaigns</p>
        </div>
        <Button className="bg-violet-600 hover:bg-violet-700" onClick={() => setShowCreate(true)}>
          + New Wheel
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : wheels.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <p className="text-5xl mb-4">🎡</p>
            <p className="text-lg font-medium mb-1">No wheels yet</p>
            <p className="text-sm text-muted-foreground mb-5">Create your first campaign to start collecting leads</p>
            <Button className="bg-violet-600 hover:bg-violet-700" onClick={() => setShowCreate(true)}>
              Create Your First Wheel
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {wheels.map((wheel) => (
            <Card key={wheel.id} className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-center justify-between py-4 px-5">
                <div className="flex items-center gap-4 min-w-0">
                  <span className="text-3xl shrink-0">🎡</span>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{wheel.name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <StatusBadge status={wheel.status} />
                      <span className="text-xs text-muted-foreground">{wheel.total_spins.toLocaleString()} spins</span>
                      <span className="text-xs text-muted-foreground font-mono truncate max-w-[140px]">
                        token: {wheel.embed_token.slice(0, 12)}…
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleStatus(wheel.id, wheel.status)}
                    disabled={wheel.status === 'archived'}
                  >
                    {wheel.status === 'active' ? 'Pause' : 'Activate'}
                  </Button>
                  <Button variant="outline" size="sm" nativeButton={false} render={<Link href={`/dashboard/wheels/${wheel.id}`} />}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDelete(wheel.id, wheel.name)}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Wheel</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="wheel-name">Wheel Name</Label>
            <Input
              id="wheel-name"
              placeholder="e.g. Summer Sale Campaign"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">This is an internal label — not shown to end users.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button className="bg-violet-600 hover:bg-violet-700" onClick={handleCreate} disabled={creating || !newName.trim()}>
              {creating ? 'Creating…' : 'Create Wheel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    draft: 'bg-gray-100 text-gray-600',
    paused: 'bg-yellow-100 text-yellow-700',
    archived: 'bg-red-100 text-red-600',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${map[status] ?? ''}`}>
      {status}
    </span>
  );
}
