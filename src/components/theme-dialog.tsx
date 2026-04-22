'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThemePresetSelector } from './theme-preset-selector';

interface ThemeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gametype?: string;
  onSaveTheme?: (name: string, emoji: string) => Promise<void>;
  onApplyPreset?: (config: any) => void;
  saving?: boolean;
}

export function ThemeDialog({
  open,
  onOpenChange,
  gametype = 'wheel',
  onSaveTheme,
  onApplyPreset,
  saving = false,
}: ThemeDialogProps) {
  const [themeName, setThemeName] = useState('');
  const [themeEmoji, setThemeEmoji] = useState('🎨');
  const [activeTab, setActiveTab] = useState('presets');

  const handleSave = async () => {
    if (onSaveTheme && themeName.trim()) {
      await onSaveTheme(themeName, themeEmoji);
      setThemeName('');
      setThemeEmoji('🎨');
      setActiveTab('presets');
    }
  };

  const handlePresetSelect = (preset: any) => {
    if (onApplyPreset) {
      onApplyPreset(preset.config);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0a0a0b]/95 backdrop-blur-2xl border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.5)] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-8 py-6 border-b border-white/5 bg-white/[0.02]">
          <DialogTitle className="text-xl font-black text-white uppercase tracking-[0.15em] flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-violet-500 shadow-[0_0_10px_rgba(124,58,237,0.5)]" />
            Neural Theme Vault
          </DialogTitle>
        </DialogHeader>

        <div className="p-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-white/5 border border-white/5 p-1 rounded-2xl mb-8">
              <TabsTrigger 
                value="presets" 
                className="flex-1 rounded-xl data-[state=active]:bg-violet-600 data-[state=active]:text-white text-[10px] font-black uppercase tracking-widest h-10 transition-all"
              >
                🎨 Global Presets
              </TabsTrigger>
              <TabsTrigger 
                value="save" 
                className="flex-1 rounded-xl data-[state=active]:bg-violet-600 data-[state=active]:text-white text-[10px] font-black uppercase tracking-widest h-10 transition-all"
              >
                💾 Capture Current
              </TabsTrigger>
            </TabsList>

            {/* Browse Presets Tab */}
            <TabsContent value="presets" className="space-y-6 mt-0">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-px flex-1 bg-white/5" />
                <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">
                  Optimized for {gametype} architecture
                </p>
                <div className="h-px flex-1 bg-white/5" />
              </div>
              <ThemePresetSelector
                onPresetSelect={handlePresetSelect}
                gameType={gametype}
              />
            </TabsContent>

            {/* Save Current Theme Tab */}
            <TabsContent value="save" className="space-y-8 mt-0">
              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
                <p className="text-xs text-muted-foreground/60 leading-relaxed font-medium italic">
                  Persist the current branding vectors, color palettes, and segment weights as a reusable template in your private neural vault.
                </p>
                <div className="flex gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest pl-0.5">Icon</Label>
                    <Input
                      placeholder="🎨"
                      value={themeEmoji}
                      onChange={(e) => setThemeEmoji(e.target.value)}
                      className="w-16 h-12 text-center text-xl bg-white/5 border-white/5 focus:border-violet-500/50"
                      maxLength={2}
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest pl-0.5">Protocol Designation</Label>
                    <Input
                      placeholder="Enter theme name..."
                      value={themeName}
                      onChange={(e) => setThemeName(e.target.value)}
                      className="h-12 bg-white/5 border-white/5 focus:border-violet-500/50 font-bold text-violet-400"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSave();
                      }}
                    />
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-3 sm:gap-0">
                <Button 
                  variant="ghost" 
                  onClick={() => onOpenChange(false)}
                  className="h-11 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/5 text-muted-foreground"
                >
                  Terminate
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving || !themeName.trim()}
                  className="h-11 px-8 rounded-xl bg-violet-600 hover:bg-violet-500 text-[10px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(124,58,237,0.3)] transition-all"
                >
                  {saving ? 'Encrypting...' : 'Confirm Upload'}
                </Button>
              </DialogFooter>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
