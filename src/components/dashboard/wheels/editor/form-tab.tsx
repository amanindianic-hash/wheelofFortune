'use client';

import React from 'react';
import { Users, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import type { Wheel } from '@/lib/types';

interface FormTabProps {
  wheel: Wheel;
  setWheel: (wheel: Wheel) => void;
  saveWheel: () => void;
  saving: boolean;
}

export function FormTab({
  wheel,
  setWheel,
  saveWheel,
  saving
}: FormTabProps) {
  return (
    <div className="space-y-6 mt-0">
      <div className="glass-panel p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="h-4 w-4 text-violet-400" />
              Lead Capture Protocol
            </h3>
            <p className="text-xs text-muted-foreground">Require visitor information before granting access to a spin.</p>
          </div>
          <Switch
            checked={wheel.form_config.enabled ?? false}
            onCheckedChange={(v) => setWheel({ ...wheel, form_config: { ...wheel.form_config, enabled: v } })}
            className="data-[state=checked]:bg-violet-600"
          />
        </div>

        {wheel.form_config.enabled && (
          <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="grid gap-4">
              <p className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">Active Data Channels</p>
              <div className="grid gap-3">
                {([
                  { key: 'name',  label: 'Identification', defaultLabel: 'Your Name', icon: '👤' },
                  { key: 'email', label: 'E-Mail Address', defaultLabel: 'Email', icon: '✉️' },
                  { key: 'phone', label: 'Neural Link / Phone', defaultLabel: 'Phone', icon: '📞' },
                ] as const).map((f) => {
                  const fields = wheel.form_config.fields ?? [];
                  const existing = fields.find(x => x.key === f.key);
                  const isEnabled = !!existing;
                  const isRequired = existing?.required ?? false;

                  return (
                    <div key={f.key} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isEnabled ? 'bg-violet-600/5 border-violet-500/20 shadow-lg shadow-violet-500/5' : 'bg-white/5 border-white/5 opacity-60'}`}>
                      <div className="flex items-center gap-4">
                        <div className="text-xl">{f.icon}</div>
                        <div>
                          <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mb-0.5">{f.label}</p>
                          <div className="flex items-center gap-2">
                             <Input
                               value={existing?.label ?? f.defaultLabel}
                               disabled={!isEnabled}
                               onChange={(e) => {
                                 const next = fields.map(x => x.key === f.key ? { ...x, label: e.target.value } : x);
                                 setWheel({ ...wheel, form_config: { ...wheel.form_config, fields: next } });
                               }}
                               className="h-7 bg-transparent border-none p-0 text-sm font-bold text-white focus-visible:ring-0 w-32"
                             />
                             {isEnabled && isRequired && <span className="text-[9px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-black">REQUIRED</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                         {isEnabled && (
                           <div className="flex items-center gap-2">
                             <span className="text-[9px] font-bold text-muted-foreground/40 uppercase">Mandatory</span>
                             <Switch
                               checked={isRequired}
                               onCheckedChange={(v) => {
                                 const next = fields.map(x => x.key === f.key ? { ...x, required: v } : x);
                                 setWheel({ ...wheel, form_config: { ...wheel.form_config, fields: next } });
                               }}
                             />
                           </div>
                         )}
                         <Switch
                           checked={isEnabled}
                           onCheckedChange={(enabled) => {
                             const next = fields.filter(x => x.key !== f.key);
                             if (enabled) next.push({ key: f.key, label: f.defaultLabel, type: f.key === 'name' ? 'text' : f.key === 'email' ? 'email' : 'tel', required: false });
                             setWheel({ ...wheel, form_config: { ...wheel.form_config, fields: next } });
                           }}
                         />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-white/5">
              <Label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">Post-Submission Directive</Label>
              <Input
                value={wheel.form_config.submit_button_text ?? 'Claim Reward'}
                onChange={(e) => setWheel({ ...wheel, form_config: { ...wheel.form_config, submit_button_text: e.target.value } })}
                className="h-11 bg-white/5 border-white/5 font-black uppercase tracking-wider text-violet-300"
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end pt-4">
        <Button className="bg-violet-600 hover:bg-violet-500 shadow-[0_4px_12px_-2px_rgba(124,58,237,0.3)] transition-all" onClick={saveWheel} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Syncing...' : 'Save Form Config'}
        </Button>
      </div>
      <div className="pb-24" />
    </div>
  );
}
