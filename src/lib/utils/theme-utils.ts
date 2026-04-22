import type { WheelConfig, WheelBranding, Segment } from '@/lib/types';
import { type WheelTemplate, WHEEL_TEMPLATES } from '@/lib/wheel-templates';

/**
 * A "clean slate" of default WheelBranding values.
 *
 * When applying ANY theme (built-in or custom), we spread this base FIRST,
 * then the theme's own branding on top. This guarantees that properties set
 * by a *previous* theme (e.g. thick ring width, custom ticks, premium images)
 * are always reset to a sane default before the new theme is painted.
 *
 * Without this, switching from a "Luxury Gold" theme (outer_ring_width: 28)
 * to a "Corporate" theme (which doesn't specify outer_ring_width) would leave
 * the 28px ring in place.
 */
export const BRANDING_RESET_BASE: Partial<WheelBranding> = {
  // Colors
  primary_color:          'transparent',
  secondary_color:        undefined,
  pointer_color:          undefined,
  background_type:        'solid',
  background_value:       'transparent',

  // Ring
  outer_ring_color:       'transparent',
  outer_ring_width:       0,
  rim_tick_style:         'none',
  rim_tick_color:         'transparent',
  inner_ring_enabled:     false,
  inner_ring_color:       'transparent',

  // Labels
  label_font_size:        null,
  label_font_weight:      '700',
  label_position:         'outer',
  label_text_transform:   'none',
  label_letter_spacing:   0,

  // Typography / misc
  font_family:            'Inter, sans-serif',
  button_text:            'SPIN NOW!',
  button_color:           undefined,
  border_color:           undefined,
  border_width:           0,
  center_logo:            null,
  logo_position:          'above',

  // Premium assets — always explicitly cleared so switching away from a premium
  // theme removes the overlay images.
  premium_face_url:        null,
  premium_stand_url:       null,
  premium_frame_url:       null,
  premium_pointer_url:     null,
  premium_content_scale:   0.75,
  premium_center_offset_y: 0,
};

/**
 * A "clean slate" for WheelConfig visual settings.
 */
export const CONFIG_RESET_BASE: Partial<WheelConfig> = {
  spin_duration_ms: 4000,
  animation_speed: 'medium',
  pointer_position: 'top',
  confetti_enabled: true,
  show_segment_labels: true,
  label_rotation: 'radial',
  
  // Scratch defaults
  scratch_layer_color: '#B0B0B0',
  scratch_layer_style: 'solid',
  scratch_reveal_threshold: 0.6,
  
  // Roulette defaults
  roulette_pocket_style: 'classic',
  
  // Slot defaults
  slot_symbol_mode: 'both',
  slot_cabinet_style: 'modern',
};

/**
 * THE UNIFIED DATA PIPELINE (Deterministic View)
 *
 * STANDARD NORMALIZATION (Full Configuration / Snapshot)
 * Enforces Theme = Single Source of Truth architecture.
 * No merging. No local fallback for colors/rims/logo.
 */
export function normalizeTheme(theme: any, wheelSegments: any[] = []) {
  if (!theme) return null;
  
  // 1. Deep clone to guarantee no references
  const clone = JSON.parse(JSON.stringify(theme));
  
  // 2. Extract palette or segments
  const palette = clone.segmentPalette || clone.segment_palette || clone.palette || [];
  let resolvedSegments = clone.segments || [];

  // Generate segments from palette if we don't have literal segments
  if (resolvedSegments.length === 0 && palette.length > 0) {
    resolvedSegments = palette.map((p: any, i: number) => {
      const bgColor = p.background?.color || p.bg_color || (typeof p === 'string' ? p : 'rgba(124, 58, 237, 1)');
      const bgImage = p.background?.imageUrl || p.segment_image_url || p.image_url || null;
      const themeIcon = (p.icon_url && p.icon_url.length > 4 && !p.icon_url.startsWith('#')) ? p.icon_url : null;
      
      const existing = wheelSegments[i] || {};
      
      return {
        // ── IDENTITY & PRIZE DATA ────────────────────────────
        id: existing.id || `seg-${i}`,
        wheel_id: existing.wheel_id,
        position: i,
        label: existing.label || `Segment ${i + 1}`,
        weight: existing.weight || 1,
        prize_id: existing.prize_id,
        is_no_prize: existing.is_no_prize ?? true,
        consolation_message: existing.consolation_message,

        // ── VISUALS (USER OVERRIDES > THEME PALETTE) ─────────
        // Prioritize existing state to ensure manual tweaks in SegmentsTab are reactive
        bg_color: existing.bg_color || bgColor,
        background: { 
          color: existing.bg_color || bgColor, 
          imageUrl: existing.segment_image_url || bgImage 
        },
        text_color: existing.text_color || p.text_color || '#FFFFFF',
        icon_url: existing.icon_url || themeIcon, 
        segment_image_url: existing.segment_image_url || bgImage,

        // Explicitly NULL out all visual overrides to ensure theme parity
        label_offset_x: null,
        label_offset_y: null,
        icon_offset_x: null,
        icon_offset_y: null,
        label_rotation_angle: null,
        icon_rotation_angle: null,
        label_radial_offset: p.label_radial_offset ?? null,
        label_tangential_offset: p.label_tangential_offset ?? null,
        icon_radial_offset: p.icon_radial_offset ?? null,
        icon_tangential_offset: p.icon_tangential_offset ?? null,
        label_font_scale: p.label_font_scale ?? null,
        icon_scale: p.icon_scale ?? null,
      };
    });
  }

  const finalConfig = clone.config || clone.styles || {};
  const finalBranding = clone.branding || {};
  
  // 3. LOGO NORMALIZATION (Theme field name diversity)
  // Catch any variation: center_logo_url, centerLogo, center_logo, logo
  const logo = 
    finalBranding.centerLogo || 
    finalBranding.center_logo || 
    finalBranding.center_logo_url || 
    finalBranding.logo || 
    null;

  // Premium mode overrides hard reset
  if (finalBranding.premium_face_url) {
    finalBranding.outer_ring_width = 0;
    finalBranding.inner_ring_enabled = false;
    finalBranding.rim_tick_style = 'none';
  }

  const finalResult = {
    ...clone,
    segments: resolvedSegments,
    branding: {
      ...BRANDING_RESET_BASE,
      ...finalBranding,
      logo,
      center_logo: logo,
      centerLogo: logo,
    },
    styles: clone.styles || clone.config || {},
    config: {
      ...CONFIG_RESET_BASE,
      ...finalConfig
    }
  };


  return finalResult;
}

/**
 * Legacy wrapper for getFinalVisualConfig to ensure we just use normalizeTheme under the hood.
 */
export function getFinalVisualConfig(wheel: any, template?: any, uiOverrides?: any) {
  const activeTemplate = template || (wheel.config?.applied_theme_id ? WHEEL_TEMPLATES.find(t => t.id === wheel.config?.applied_theme_id) : null);
  
  if (activeTemplate) {
    const normalized = normalizeTheme(activeTemplate, wheel.segments || []);
    if (normalized) {
      if (uiOverrides) {
        normalized.branding = { ...normalized.branding, ...uiOverrides };
      }
      return {
        branding: normalized.branding,
        config: normalized.config,
        segments: normalized.segments
      };
    }
  }

  // If no template at all, we must return wheel state alone without any theme merges.
  const wheelConfig = {
    branding: { ...BRANDING_RESET_BASE, ...(wheel.branding || {}), ...uiOverrides },
    config: { ...CONFIG_RESET_BASE, ...(wheel.config || {}) },
    segments: wheel.segments || []
  };

  if (wheelConfig.branding.premium_face_url) {
    wheelConfig.branding.outer_ring_width = 0;
    wheelConfig.branding.inner_ring_enabled = false;
    wheelConfig.branding.rim_tick_style = 'none';
  }

  return wheelConfig;
}

export function applyTemplateToWheel(template: any, _segments?: any, _config?: any) {
  const normalized = normalizeTheme(template);
  return {
    newConfig: normalized?.config || {},
    newBranding: normalized?.branding || {},
    newSegments: normalized?.segments || []
  };
}
