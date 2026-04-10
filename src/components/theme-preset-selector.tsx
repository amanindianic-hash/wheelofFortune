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
      <Tabs defaultValue="gaming" className="w-full">
        <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${Object.keys(presets).length}, 1fr)` }}>
          {Object.keys(presets).map((category) => (
            <TabsTrigger key={category} value={category} className="capitalize">
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
          <TabsContent key={category} value={category} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3">
              {categoryPresets.map((preset) => (
                <Card
                  key={preset.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedPresetId === preset.id ? 'ring-2 ring-primary border-primary' : ''
                  }`}
                  onClick={() => handleSelectPreset(preset)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span className="text-xl">{preset.emoji}</span>
                      <span>{preset.name}</span>
                    </CardTitle>
                    <CardDescription className="text-xs line-clamp-2">{preset.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-3">
                    {/* Color preview */}
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground">Color Palette:</p>
                      <div className="flex gap-1 flex-wrap">
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
                                className="w-6 h-6 rounded border border-gray-400 flex-shrink-0"
                                style={{ backgroundColor: color }}
                                title={color}
                              />
                            ))
                        ) : (
                          <p className="text-xs text-muted-foreground">No colors</p>
                        )}
                      </div>
                    </div>

                    {/* Typography & Style info */}
                    <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
                      {preset.config?.typography && (
                        <p className="line-clamp-1">
                          <strong>Fonts:</strong> {preset.config.typography.headingFont}
                        </p>
                      )}
                      {preset.config?.style && (
                        <p className="line-clamp-1">
                          <strong>Style:</strong> {preset.config.style}
                        </p>
                      )}
                    </div>

                    {/* Apply button */}
                    <Button
                      className="w-full mt-3 h-8 text-sm"
                      variant={selectedPresetId === preset.id ? 'default' : 'outline'}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectPreset(preset);
                      }}
                    >
                      {selectedPresetId === preset.id ? '✓ Applied' : 'Apply Theme'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
