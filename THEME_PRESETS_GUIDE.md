# Theme Presets System - Implementation Guide

## Overview

This guide covers the new theme presets system that provides users with professionally designed, ready-to-use themes for gaming and entertainment wheels.

## What's New

### 1. **5 Professional Theme Presets**
   - **Gaming Neon Dark** - High-energy neon on dark backgrounds
   - **Gaming Dark Minimal** - Clean, focused interface for strategy games
   - **Gaming Retro Arcade** - Nostalgic arcade aesthetic
   - **Streaming Platform Dark** - OLED-optimized for media
   - **Social Media Vibrant** - Colorful, engagement-focused design

### 2. **Theme Data Assets**
All converted from the "ui-ux-pro-max-skill" repository (MIT licensed):
- **161 color palettes** by product type (gaming, entertainment, saas, ecommerce, etc.)
- **73 font pairings** with Google Fonts integration
- **84 UI design styles** (Minimalism, Neumorphism, Glassmorphism, Dark Mode, etc.)
- **99 UX guidelines** and best practices

### 3. **Database Changes**
Migration: `V20260410c__add_gaming_theme_presets.sql`
```sql
ALTER TABLE wheel_themes
  ADD COLUMN is_preset BOOLEAN DEFAULT FALSE,
  ADD COLUMN preset_category VARCHAR(50);
```

Presets are stored in `wheel_themes` table with:
- `is_preset = TRUE`
- `preset_category` = 'gaming' | 'entertainment' | etc.
- `client_id = NULL` (accessible to all clients)

### 4. **API Endpoint**
`GET /api/themes/presets`

Query parameters:
- `category` - Filter by category (gaming, entertainment)
- `grouped` - Return grouped by category (true/false)

Response:
```json
{
  "presets": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Gaming Neon Dark",
      "emoji": "🎮",
      "description": "High-energy neon colors...",
      "category": "gaming",
      "config": {
        "colorPalette": { ... },
        "typography": { ... },
        "style": "Retro-Futurism"
      }
    }
  ]
}
```

## Components

### 1. **ThemePresetSelector**
`src/components/theme-preset-selector.tsx`

Standalone component for browsing and selecting presets.

**Props:**
```typescript
interface ThemePresetSelectorProps {
  onPresetSelect: (preset: ThemePreset) => void;
  currentTheme?: string;
  gameType?: string;
}
```

**Usage:**
```tsx
<ThemePresetSelector
  onPresetSelect={(preset) => {
    // Apply preset config to wheel
    setWheel(prev => ({
      ...prev,
      branding: { ...prev.branding, ...preset.config }
    }));
  }}
  gameType="wheel"
/>
```

### 2. **ThemeDialog**
`src/components/theme-dialog.tsx`

Complete dialog with two tabs:
- **Browse Presets** - Select from available presets
- **Save Current** - Save current wheel config as custom theme

**Props:**
```typescript
interface ThemeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gametype?: string;
  onSaveTheme?: (name: string, emoji: string) => Promise<void>;
  onApplyPreset?: (config: any) => void;
  saving?: boolean;
}
```

**Usage:**
```tsx
const [themeDialogOpen, setThemeDialogOpen] = useState(false);

<ThemeDialog
  open={themeDialogOpen}
  onOpenChange={setThemeDialogOpen}
  gametype={wheel.config.game_type || 'wheel'}
  onApplyPreset={(config) => {
    setWheel(prev => ({
      ...prev,
      config: { ...prev.config, ...config }
    }));
  }}
  onSaveTheme={async (name, emoji) => {
    // POST /api/themes with current config
  }}
  saving={savingTheme}
/>
```

## Integration Steps

### Step 1: Run Database Migration
```sql
-- Execute in Neon console
-- File: Documents/V20260410c__add_gaming_theme_presets.sql
```

### Step 2: Update Wheel Editor (Optional)
Replace the existing "Save as Theme" dialog with the new `ThemeDialog`:

```tsx
import { ThemeDialog } from '@/components/theme-dialog';

// In your component:
const [themeDialogOpen, setThemeDialogOpen] = useState(false);

<Button 
  onClick={() => setThemeDialogOpen(true)}
  className="bg-orange-500 hover:bg-orange-600"
>
  🎨 Theme Manager
</Button>

<ThemeDialog
  open={themeDialogOpen}
  onOpenChange={setThemeDialogOpen}
  gametype={wheel.config.game_type || 'wheel'}
  onApplyPreset={(config) => {
    // Apply preset to current wheel
  }}
  onSaveTheme={saveCurrentAsTheme}
  saving={savingTheme}
/>
```

### Step 3: Testing
```bash
# Build and test
npm run build
npm test

# Test the presets endpoint
curl "http://localhost:3000/api/themes/presets?grouped=true"
```

## Data Assets

All data files are in `src/lib/design-assets/`:
- `theme-presets.json` - 5 curated theme bundles
- `colors.json` - 161 color palettes
- `typography.json` - 73 font pairings
- `styles.json` - 84 UI styles
- `products.json` - Product type recommendations

These can be imported and used in:
- Future preset creation
- Admin dashboard for preset management
- API recommendations
- Theme suggestion engine

## Preset Structure

Each preset includes:
```json
{
  "id": "gaming-neon-dark",
  "name": "Gaming Neon Dark",
  "emoji": "🎮",
  "description": "High-energy neon colors on dark background...",
  "category": "gaming",
  "config": {
    "colorPalette": {
      "primary": "#7C3AED",
      "secondary": "#A78BFA",
      "accent": "#F43F5E",
      "background": "#0F0F23",
      "foreground": "#E2E8F0",
      "card": "#1E1C35",
      "cardForeground": "#E2E8F0",
      "border": "#4C1D95",
      "destructive": "#EF4444",
      "ring": "#7C3AED"
    },
    "typography": {
      "headingFont": "Space Grotesk",
      "bodyFont": "DM Sans",
      "cssImport": "@import url(...);",
      "tailwindConfig": "fontFamily: { ... }"
    },
    "style": "Retro-Futurism",
    "moodKeywords": ["vibrant", "neon", "immersive"],
    "darkMode": true,
    "mobileOptimized": true
  }
}
```

## Utility Functions

`src/lib/utils/theme-presets.ts`

```typescript
// Get all presets
const presets = await getThemePresets();

// Get by category
const gamingPresets = await getThemePresets('gaming');

// Get grouped by category
const grouped = await getThemePresetsByCategory();

// Get by ID
const preset = await getThemePresetById('gaming-neon-dark');

// Get gaming specifically
const gaming = await getGamingPresets();

// Get entertainment specifically
const entertainment = await getEntertainmentPresets();
```

## Next Steps

### Immediate (Ready to Deploy)
- ✅ Database migration for presets
- ✅ API endpoint for fetching presets
- ✅ React components (selector + dialog)
- ✅ Integration with existing theme system

### Future Enhancements
1. **Preset Customization UI**
   - Allow users to modify presets before applying
   - Save variations as new custom themes

2. **Recommendation Engine**
   - Suggest presets based on wheel type
   - A/B test different presets
   - Track which presets convert best

3. **More Presets**
   - Add all 161 color palettes as presets
   - Add all 85 UI styles
   - Create category-specific bundles (luxury, fintech, etc.)

4. **Admin Dashboard**
   - Manage/update presets
   - Create custom preset bundles
   - Track preset usage analytics

5. **Export/Import**
   - Export theme as JSON
   - Import community themes
   - Share themes via URL

## File Locations

```
src/
  ├── components/
  │   ├── theme-preset-selector.tsx     (NEW)
  │   └── theme-dialog.tsx               (NEW)
  ├── lib/
  │   ├── utils/
  │   │   └── theme-presets.ts          (NEW)
  │   └── design-assets/                (NEW)
  │       ├── colors.json
  │       ├── typography.json
  │       ├── styles.json
  │       ├── products.json
  │       └── theme-presets.json
  └── app/
      └── api/
          └── themes/
              └── presets/
                  └── route.ts          (NEW)

Documents/
  └── V20260410c__add_gaming_theme_presets.sql  (NEW)
```

## License

- **Presets & Data Assets:** MIT License (from ui-ux-pro-max-skill repository)
- **Components & Integration:** Same as project license

## Questions?

See `THEME_PRESETS_GUIDE.md` for full documentation or contact the development team.
