/**
 * Premium Casino Slot Machine Symbol Palettes
 * High-quality icon sets for slot machine games
 */

export interface SlotSymbol {
  id: string;
  label: string;
  icon_url: string;
  bg_color: string;
  text_color: string;
  weight: number;
  description?: string;
}

/**
 * Premium sprite sheet with professional casino icons
 * Layout: 4x3 grid of 12 icons
 * Icons: 777, Watermelon, BAR, Apple, Hearts/Diamonds, Crown,
 *        Bonus, Cherries, Money, WILD, Lemon, 7
 */
export const PREMIUM_CASINO_SYMBOLS: SlotSymbol[] = [
  {
    id: 'premium-777',
    label: '777',
    icon_url: '/slot-icons-premium.png',
    bg_color: '#1a1a2e',
    text_color: '#FFD700',
    weight: 3,
    description: 'Lucky sevens - highest value',
  },
  {
    id: 'premium-watermelon',
    label: 'Watermelon',
    icon_url: '/slot-icons-premium.png',
    bg_color: '#1a1a2e',
    text_color: '#FFFFFF',
    weight: 2,
    description: 'Fresh fruit symbol',
  },
  {
    id: 'premium-bar',
    label: 'BAR',
    icon_url: '/slot-icons-premium.png',
    bg_color: '#1a1a2e',
    text_color: '#FFD700',
    weight: 2,
    description: 'Classic BAR symbol',
  },
  {
    id: 'premium-apple',
    label: 'Apple',
    icon_url: '/slot-icons-premium.png',
    bg_color: '#1a1a2e',
    text_color: '#FFFFFF',
    weight: 2,
    description: 'Red apple fruit',
  },
  {
    id: 'premium-diamonds',
    label: 'Diamonds',
    icon_url: '/slot-icons-premium.png',
    bg_color: '#1a1a2e',
    text_color: '#FF1493',
    weight: 2,
    description: 'Precious diamonds',
  },
  {
    id: 'premium-crown',
    label: 'Crown',
    icon_url: '/slot-icons-premium.png',
    bg_color: '#1a1a2e',
    text_color: '#FFD700',
    weight: 3,
    description: 'Royal crown - bonus symbol',
  },
  {
    id: 'premium-bonus',
    label: 'BONUS',
    icon_url: '/slot-icons-premium.png',
    bg_color: '#1a1a2e',
    text_color: '#FFD700',
    weight: 1,
    description: 'Bonus feature trigger',
  },
  {
    id: 'premium-cherries',
    label: 'Cherries',
    icon_url: '/slot-icons-premium.png',
    bg_color: '#1a1a2e',
    text_color: '#FF69B4',
    weight: 2,
    description: 'Lucky cherries pair',
  },
  {
    id: 'premium-money',
    label: 'Money',
    icon_url: '/slot-icons-premium.png',
    bg_color: '#1a1a2e',
    text_color: '#00FF00',
    weight: 2,
    description: 'Cash prize symbol',
  },
  {
    id: 'premium-wild',
    label: 'WILD',
    icon_url: '/slot-icons-premium.png',
    bg_color: '#1a1a2e',
    text_color: '#FFD700',
    weight: 1,
    description: 'Wild card - substitutes any symbol',
  },
  {
    id: 'premium-lemon',
    label: 'Lemon',
    icon_url: '/slot-icons-premium.png',
    bg_color: '#1a1a2e',
    text_color: '#FFFF00',
    weight: 2,
    description: 'Golden lemon fruit',
  },
  {
    id: 'premium-seven',
    label: '7',
    icon_url: '/slot-icons-premium.png',
    bg_color: '#1a1a2e',
    text_color: '#FF4500',
    weight: 2,
    description: 'Lucky number seven',
  },
];

/**
 * Create default segments for a new slot machine wheel
 * Uses premium casino symbol palette
 */
export function createDefaultSlotSegments(): Array<{
  label: string;
  bg_color: string;
  text_color: string;
  icon_url: string;
  weight: number;
  is_no_prize: boolean;
}> {
  // Shuffle and select a mix of symbols for variety
  const selectedSymbols = PREMIUM_CASINO_SYMBOLS.slice(0, 8); // Use first 8 for default mix

  return selectedSymbols.map((symbol) => ({
    label: symbol.label,
    bg_color: symbol.bg_color,
    text_color: symbol.text_color,
    icon_url: symbol.icon_url,
    weight: symbol.weight,
    is_no_prize: symbol.id === 'premium-wild',
  }));
}
