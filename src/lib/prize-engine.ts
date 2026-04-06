import { randomBytes } from 'crypto';
import type { Segment } from './types';

/**
 * Weighted random segment selection using server-side CSPRNG.
 * Returns the winning segment index and the server seed used.
 */
export function selectSegment(segments: Segment[]): { segment: Segment; serverSeed: string } {
  const serverSeed = randomBytes(32).toString('hex');

  // Filter out capped segments
  const eligible = segments.filter((s) => {
    if (s.win_cap_daily != null && s.wins_today >= s.win_cap_daily) return false;
    if (s.win_cap_total != null && s.wins_total >= s.win_cap_total) return false;
    return true;
  });

  if (eligible.length === 0) {
    // Fall back to all segments (no-prize fallback)
    const fallback = segments.find((s) => s.is_no_prize) ?? segments[0];
    return { segment: fallback, serverSeed };
  }

  const totalWeight = eligible.reduce((sum, s) => sum + Number(s.weight), 0);

  // Use server seed bytes as entropy for selection
  const seedInt = parseInt(serverSeed.slice(0, 8), 16);
  const rand = (seedInt / 0xffffffff) * totalWeight;

  let cumulative = 0;
  for (const seg of eligible) {
    cumulative += Number(seg.weight);
    if (rand <= cumulative) {
      return { segment: seg, serverSeed };
    }
  }

  // Fallback to last eligible
  return { segment: eligible[eligible.length - 1], serverSeed };
}

/**
 * Generate a unique coupon code for auto_generate mode.
 */
export function generateCouponCode(prefix: string, length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const suffixLength = Math.max(1, length - prefix.length);
  let suffix = '';
  const bytes = randomBytes(suffixLength);
  for (let i = 0; i < suffixLength; i++) {
    suffix += chars[bytes[i] % chars.length];
  }
  return prefix + suffix;
}
