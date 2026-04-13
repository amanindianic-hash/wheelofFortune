import type { SlotConfig, WheelBranding, GameType } from '@/lib/types';
import { PREMIUM_CASINO_SYMBOLS } from '@/lib/slot-symbol-palette';

export interface SlotTemplate {
  id: string;
  name: string;
  description: string;
  emoji: string;
  gameType: GameType;
  config: Partial<SlotConfig>;
  branding: Partial<WheelBranding>;
  /** Default segment colors (cycled for symbols) */
  segmentPalette: Array<{ bg_color: string; text_color: string }>;
}

// ─── Slot Machine Templates ────────────────────────────────────────────────────

/**
 * Export premium casino symbols for use as default icons
 */
export { PREMIUM_CASINO_SYMBOLS, createDefaultSlotSegments } from '@/lib/slot-symbol-palette';

export const SLOT_TEMPLATES: SlotTemplate[] = [
  {
    id: 'classic-casino',
    gameType: 'slot_machine',
    name: 'Classic Casino',
    description: 'Professional 3D casino cabinet with premium icon set (777, Watermelon, BAR, Crown, etc.)',
    emoji: '🎰',
    config: {
      slot_reel_count: 3,
      slot_visible_rows: 1,
      slot_symbol_mode: 'both',
      slot_spin_duration_ms: 4000,
      slot_stop_delay_ms: 400,
      slot_cabinet_style: 'classic',
      sound_enabled: true,
    },
    branding: {
      primary_color: '#DC143C',
      button_text: 'PULL',
      background_value: '#1a1a1a',
    },
    segmentPalette: [
      { bg_color: '#DC143C', text_color: '#FFFFFF' },
      { bg_color: '#FFD700', text_color: '#000000' },
      { bg_color: '#FF6347', text_color: '#FFFFFF' },
      { bg_color: '#FF8C00', text_color: '#FFFFFF' },
      { bg_color: '#32CD32', text_color: '#FFFFFF' },
      { bg_color: '#4169E1', text_color: '#FFFFFF' },
    ],
  },
  {
    id: 'neon-lights',
    gameType: 'slot_machine',
    name: 'Neon Lights',
    description: 'Electric neon glow with dark background',
    emoji: '💡',
    config: {
      slot_reel_count: 3,
      slot_visible_rows: 3,
      slot_symbol_mode: 'both',
      slot_spin_duration_ms: 3500,
      slot_stop_delay_ms: 300,
      slot_cabinet_style: 'neon',
      sound_enabled: true,
    },
    branding: {
      primary_color: '#00FFFF',
      button_text: 'SPIN',
      background_value: '#0A0A14',
    },
    segmentPalette: [
      { bg_color: '#FF00FF', text_color: '#00FFFF' },
      { bg_color: '#00FFFF', text_color: '#FF00FF' },
      { bg_color: '#39FF14', text_color: '#000000' },
      { bg_color: '#FF4500', text_color: '#FFFFFF' },
      { bg_color: '#7B00FF', text_color: '#FFFFFF' },
      { bg_color: '#FFE600', text_color: '#000000' },
    ],
  },
  {
    id: 'vegas-gold',
    gameType: 'slot_machine',
    name: 'Vegas Gold',
    description: 'Luxurious gold and black theme',
    emoji: '✨',
    config: {
      slot_reel_count: 5,
      slot_visible_rows: 3,
      slot_symbol_mode: 'both',
      slot_spin_duration_ms: 5000,
      slot_stop_delay_ms: 500,
      slot_cabinet_style: 'modern',
      sound_enabled: true,
    },
    branding: {
      primary_color: '#FFD700',
      button_text: 'GO LUCKY',
      background_value: '#0D0D0D',
    },
    segmentPalette: [
      { bg_color: '#1A1A1A', text_color: '#FFD700' },
      { bg_color: '#B8860B', text_color: '#FFFFFF' },
      { bg_color: '#DAA520', text_color: '#000000' },
      { bg_color: '#FFD700', text_color: '#000000' },
      { bg_color: '#2A2A2A', text_color: '#FFD700' },
      { bg_color: '#C9A84C', text_color: '#000000' },
    ],
  },
  {
    id: 'ocean-waves',
    gameType: 'slot_machine',
    name: 'Ocean Waves',
    description: 'Cool blue and teal relaxing theme',
    emoji: '🌊',
    config: {
      slot_reel_count: 3,
      slot_visible_rows: 3,
      slot_symbol_mode: 'both',
      slot_spin_duration_ms: 3500,
      slot_stop_delay_ms: 350,
      slot_cabinet_style: 'modern',
      sound_enabled: true,
    },
    branding: {
      primary_color: '#0077B6',
      button_text: 'WAVE',
      background_value: '#CAF0F8',
    },
    segmentPalette: [
      { bg_color: '#023E8A', text_color: '#FFFFFF' },
      { bg_color: '#0077B6', text_color: '#FFFFFF' },
      { bg_color: '#0096C7', text_color: '#FFFFFF' },
      { bg_color: '#00B4D8', text_color: '#FFFFFF' },
      { bg_color: '#48CAE4', text_color: '#023E8A' },
      { bg_color: '#90E0EF', text_color: '#023E8A' },
    ],
  },
];
