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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Theme Manager</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="presets">🎨 Browse Presets</TabsTrigger>
            <TabsTrigger value="save">💾 Save Current</TabsTrigger>
          </TabsList>

          {/* Browse Presets Tab */}
          <TabsContent value="presets" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Choose from our professionally designed theme presets optimized for {gametype} wheels.
            </p>
            <ThemePresetSelector
              onPresetSelect={handlePresetSelect}
              gameType={gametype}
            />
          </TabsContent>

          {/* Save Current Theme Tab */}
          <TabsContent value="save" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Saves the current branding, colours, and segment palette as a reusable theme for{' '}
              <strong>{gametype}</strong> game type.
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Emoji"
                value={themeEmoji}
                onChange={(e) => setThemeEmoji(e.target.value)}
                className="w-16 text-center"
                maxLength={2}
              />
              <Input
                placeholder="Theme name"
                value={themeName}
                onChange={(e) => setThemeName(e.target.value)}
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                }}
              />
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !themeName.trim()}
              >
                {saving ? 'Saving...' : 'Save Theme'}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
