'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface RGBAPickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

/**
 * A custom color picker that supports both HEX and RGBA transparency.
 * It provides a native color picker for the base hue and a slider for alpha.
 */
export function RGBAPicker({ value, onChange, label }: RGBAPickerProps) {
  // Parse incoming value (supports #hex, rgba, or rgb)
  const [hex, setHex] = useState('#7c3aed');
  const [opacity, setOpacity] = useState(1); // 0 to 1

  useEffect(() => {
    if (!value) return;

    if (value.startsWith('rgba')) {
      const match = value.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
      if (match) {
        const r = parseInt(match[1]);
        const g = parseInt(match[2]);
        const b = parseInt(match[3]);
        const a = parseFloat(match[4]);
        setHex(rgbToHex(r, g, b));
        setOpacity(a);
      }
    } else if (value.startsWith('rgb')) {
       // Handle rgb(r,g,b) as opacity 1
       const match = value.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
       if (match) {
         setHex(rgbToHex(parseInt(match[1]), parseInt(match[2]), parseInt(match[3])));
         setOpacity(1);
       }
    } else if (value.startsWith('#')) {
      setHex(value);
      setOpacity(1);
    } else if (value === 'transparent') {
      setOpacity(0);
    }
  }, [value]);

  const updateColor = (newHex: string, newOpacity: number) => {
    setHex(newHex);
    setOpacity(newOpacity);

    const { r, g, b } = hexToRgb(newHex);
    onChange(`rgba(${r}, ${g}, ${b}, ${newOpacity.toFixed(2)})`);
  };

  return (
    <div className="flex flex-col gap-2 p-1 border rounded-lg bg-card/50">
      <div className="flex items-center gap-3">
        {/* Color Preview & Native Picker */}
        <div className="relative w-10 h-10 rounded-md border shadow-sm shrink-0 overflow-hidden bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAACtJREFUGFdjZEACJmAmYCQUMIEkmYCJYBIgkQmYyAQsCBVgAmYCRiAmYMIEAOv6Bv7hF4EAAAAAAElFTkSuQmCC')] bg-repeat">
          <input
            type="color"
            value={hex}
            onChange={(e) => updateColor(e.target.value, opacity)}
            className="absolute inset-0 w-full h-full p-0 border-0 cursor-pointer opacity-0"
          />
          <div 
            className="w-full h-full pointer-events-none" 
            style={{ backgroundColor: opacity === 1 ? hex : (opacity === 0 ? 'transparent' : value) }}
          />
        </div>

        {/* Text Input for manual Hex/RGBA entry */}
        <div className="flex-1 space-y-1">
          <Input 
            value={value} 
            onChange={(e) => onChange(e.target.value)}
            className="h-8 text-xs font-mono"
            placeholder="#RRGGBB or rgba()"
          />
        </div>
      </div>

      {/* Opacity Slider */}
      <div className="px-1 py-1">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Opacity</span>
          <span className="text-[10px] font-mono">{Math.round(opacity * 100)}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={opacity}
          onChange={(e) => updateColor(hex, parseFloat(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-violet-500 bg-muted"
        />
      </div>
    </div>
  );
}

// Helpers
function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 124, g: 58, b: 237 };
}

function rgbToHex(r: number, g: number, b: number) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
