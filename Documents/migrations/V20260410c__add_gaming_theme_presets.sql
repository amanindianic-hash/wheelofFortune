-- Migration: Add gaming and entertainment theme presets
-- Date: 2026-04-10

-- Add columns to track system presets
ALTER TABLE wheel_themes
  ADD COLUMN IF NOT EXISTS is_preset BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS preset_category VARCHAR(50);

-- Create index for preset lookup
CREATE INDEX IF NOT EXISTS idx_wheel_themes_is_preset ON wheel_themes(is_preset, preset_category);

-- Insert Gaming Presets
INSERT INTO wheel_themes (id, client_id, name, emoji, description, branding, config, segment_palette, is_preset, preset_category, created_at, updated_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440001'::UUID,
  NULL,
  'Gaming Neon Dark',
  '🎮',
  'High-energy neon colors on dark background for immersive gaming experience',
  '{"gamingPreset": true}',
  '{
    "colorPalette": {
      "primary": "#7C3AED",
      "onPrimary": "#FFFFFF",
      "secondary": "#A78BFA",
      "onSecondary": "#0F172A",
      "accent": "#F43F5E",
      "onAccent": "#FFFFFF",
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
      "cssImport": "@import url('\''https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=DM+Sans:wght@400;500;700&display=swap'\'');"
    },
    "style": "Retro-Futurism",
    "moodKeywords": ["vibrant", "neon", "immersive", "energetic", "futuristic"],
    "darkMode": true
  }',
  '[]',
  TRUE,
  'gaming',
  NOW(),
  NOW()
),
(
  '550e8400-e29b-41d4-a716-446655440002'::UUID,
  NULL,
  'Gaming Dark Minimal',
  '🎮',
  'Clean dark interface with accent colors for focus on gameplay',
  '{"gamingPreset": true}',
  '{
    "colorPalette": {
      "primary": "#0F172A",
      "secondary": "#1E293B",
      "accent": "#3B82F6",
      "background": "#020617",
      "foreground": "#F1F5F9",
      "card": "#1E293B",
      "cardForeground": "#F1F5F9",
      "destructive": "#EF4444",
      "border": "#334155"
    },
    "typography": {
      "headingFont": "Inter",
      "bodyFont": "Inter",
      "cssImport": "@import url('\''https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'\'');"
    },
    "style": "Minimalism & Swiss Style",
    "moodKeywords": ["clean", "minimal", "professional", "focused", "high-contrast"],
    "darkMode": true
  }',
  '[]',
  TRUE,
  'gaming',
  NOW(),
  NOW()
),
(
  '550e8400-e29b-41d4-a716-446655440003'::UUID,
  NULL,
  'Gaming Retro Arcade',
  '🕹️',
  'Vintage arcade aesthetic with bold fonts and nostalgic colors',
  '{"gamingPreset": true}',
  '{
    "colorPalette": {
      "primary": "#FF006E",
      "secondary": "#8338EC",
      "accent": "#FFBE0B",
      "background": "#0A0E27",
      "foreground": "#FFFFFF",
      "card": "#1A1F3A",
      "cardForeground": "#FFFFFF",
      "destructive": "#FF4757",
      "border": "#8338EC"
    },
    "typography": {
      "headingFont": "Space Mono",
      "bodyFont": "Space Mono",
      "cssImport": "@import url('\''https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap'\'');"
    },
    "style": "Retro-Futurism",
    "moodKeywords": ["retro", "arcade", "nostalgic", "bold", "vibrant"],
    "darkMode": true
  }',
  '[]',
  TRUE,
  'gaming',
  NOW(),
  NOW()
);

-- Insert Entertainment Presets
INSERT INTO wheel_themes (id, client_id, name, emoji, description, branding, config, segment_palette, is_preset, preset_category, created_at, updated_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440004'::UUID,
  NULL,
  'Streaming Platform Dark',
  '🎬',
  'OLED-optimized dark mode for media streaming platforms',
  '{"entertainmentPreset": true}',
  '{
    "colorPalette": {
      "primary": "#121212",
      "secondary": "#282828",
      "accent": "#1DB954",
      "background": "#0F0F0F",
      "foreground": "#FFFFFF",
      "card": "#282828",
      "cardForeground": "#FFFFFF",
      "destructive": "#E22134",
      "border": "#404040"
    },
    "typography": {
      "headingFont": "Poppins",
      "bodyFont": "Inter",
      "cssImport": "@import url('\''https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700&family=Inter:wght@400;500&display=swap'\'');"
    },
    "style": "Dark Mode (OLED)",
    "moodKeywords": ["dark", "media", "entertainment", "streaming", "modern"],
    "darkMode": true
  }',
  '[]',
  TRUE,
  'entertainment',
  NOW(),
  NOW()
),
(
  '550e8400-e29b-41d4-a716-446655440005'::UUID,
  NULL,
  'Social Media Vibrant',
  '📱',
  'Vibrant colors for engagement-driven social platforms',
  '{"entertainmentPreset": true}',
  '{
    "colorPalette": {
      "primary": "#FF006E",
      "secondary": "#FB5607",
      "accent": "#FFBE0B",
      "background": "#FFFFFF",
      "foreground": "#0F172A",
      "card": "#F8FAFC",
      "cardForeground": "#0F172A",
      "destructive": "#DC2626",
      "border": "#E2E8F0"
    },
    "typography": {
      "headingFont": "Poppins",
      "bodyFont": "Open Sans",
      "cssImport": "@import url('\''https://fonts.googleapis.com/css2?family=Poppins:wght@600;700&family=Open+Sans:wght@400;500&display=swap'\'');"
    },
    "style": "Vibrant & Block-based",
    "moodKeywords": ["vibrant", "social", "engaging", "colorful", "playful"],
    "darkMode": false
  }',
  '[]',
  TRUE,
  'entertainment',
  NOW(),
  NOW()
);
