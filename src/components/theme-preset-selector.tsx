'use client';

import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface ThemePreset {
  id: string;
  name: string;
  emoji: string;
  description: string;
  category: string;
  config: any;
}

interface ThemePresetSelectorProps {
  onPresetSelect: (preset: ThemePreset) => void;
  currentTheme?: string;
  gameType?: string;
}

export function ThemePresetSelector({
  onPresetSelect,
  currentTheme,
  gameType = 'wheel',
}: ThemePresetSelectorProps) {
  const [presets, setPresets] = useState<Record<string, ThemePreset[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(currentTheme || null);

  useEffect(() => {
    fetchPresets();
  }, []);

  async function fetchPresets() {
    try {
      setLoading(true);
      const res = await fetch('/api/themes/presets?grouped=true');
      if (!res.ok) throw new Error('Failed to fetch presets');
      const { presets: groupedPresets } = await res.json();
      setPresets(groupedPresets);
    } catch (err) {
      console.error('Fetch presets error:', err);
      toast.error('Failed to load theme presets');
    } finally {
      setLoading(false);
    }
  }

  const handleSelectPreset = (preset: ThemePreset) => {
    setSelectedPresetId(preset.id);
    onPresetSelect(preset);
    toast.success(`${preset.emoji} ${preset.name} applied`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-sm text-muted-foreground">Loading presets...</p>
      </div>
    );
  }

  const hasPresets = Object.keys(presets).length > 0;

  if (!hasPresets) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">No theme presets available</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Tabs defaultValue="gaming" className="w-full mt-2">
        <TabsList className="flex items-center gap-2 bg-transparent p-0 mb-8 border-0">
          {Object.keys(presets).map((category) => (
            <TabsTrigger 
              key={category} 
              value={category} 
              className="px-4 h-9 rounded-xl border border-white/5 bg-white/5 data-[state=active]:bg-violet-600 data-[state=active]:text-white text-[10px] font-black uppercase tracking-widest transition-all"
            >
              {category === 'gaming' && '🎮'}
              {category === 'entertainment' && '🎬'}
              {category === 'luxury' && '✨'}
              {category === 'saas' && '💼'}
              {' '}
              {category}
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.entries(presets).map(([category, categoryPresets]) => (
          <TabsContent key={category} value={category} className="space-y-4 mt-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {categoryPresets.map((preset) => (
                <div
                  key={preset.id}
                  className={`glass-panel group relative overflow-hidden transition-all hover:border-violet-500/40 cursor-pointer flex flex-col ${
                    selectedPresetId === preset.id ? 'border-violet-500/50 shadow-[0_0_30px_rgba(124,58,237,0.15)] ring-1 ring-violet-500/20' : ''
                  }`}
                  onClick={() => handleSelectPreset(preset)}
                >
                  <div className="p-5 flex-1 space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="h-14 w-14 shrink-0 rounded-2xl bg-white/5 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                        {preset.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-black text-white text-sm uppercase tracking-tight truncate">{preset.name}</h4>
                        <p className="text-[10px] text-muted-foreground/60 font-medium leading-relaxed line-clamp-2 mt-1">{preset.description}</p>
                      </div>
                    </div>
                    
                    {/* Color preview */}
                    <div className="space-y-2">
                      <p className="text-[9px] font-black text-violet-400/60 uppercase tracking-[0.1em]">Spectral Array</p>
                      <div className="flex gap-1.5 p-1.5 bg-black/40 rounded-xl w-fit border border-white/5">
                        {preset.config?.colorPalette ? (
                          [
                            preset.config.colorPalette.primary,
                            preset.config.colorPalette.secondary,
                            preset.config.colorPalette.accent,
                            preset.config.colorPalette.background,
                          ]
                            .filter(Boolean)
                            .map((color, idx) => (
                              <div
                                key={idx}
                                className="w-5 h-5 rounded-md shadow-sm ring-1 ring-white/10"
                                style={{ backgroundColor: color }}
                                title={color}
                              />
                            ))
                        ) : (
                          <div className="w-5 h-5 rounded-md bg-zinc-800 animate-pulse" />
                        )}
                      </div>
                    </div>

                    {/* Typography & Style info */}
                    <div className="grid grid-cols-2 gap-4 bg-white/[0.02] p-3 rounded-xl border border-white/5">
                      {preset.config?.typography && (
                        <div className="space-y-1">
                          <p className="text-[8px] font-bold text-muted-foreground/40 uppercase tracking-widest">Typeface</p>
                          <p className="text-[10px] font-bold text-white truncate">{preset.config.typography.headingFont}</p>
                        </div>
                      )}
                      {preset.config?.style && (
                        <div className="space-y-1">
                          <p className="text-[8px] font-bold text-muted-foreground/40 uppercase tracking-widest">Visual DNA</p>
                          <p className="text-[10px] font-bold text-white uppercase truncate">{preset.config.style}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="px-5 py-3 bg-white/[0.02] border-t border-white/5 mt-auto">
                    <Button
                      size="sm"
                      variant={selectedPresetId === preset.id ? 'default' : 'ghost'}
                      className={`w-full text-[10px] font-black uppercase tracking-widest h-9 rounded-xl transition-all ${
                        selectedPresetId === preset.id 
                        ? 'bg-violet-600 text-white shadow-[0_0_15px_rgba(124,58,237,0.3)]' 
                        : 'text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectPreset(preset);
                      }}
                    >
                      {selectedPresetId === preset.id ? '✓ Synchronized' : 'Execute Deploy'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
