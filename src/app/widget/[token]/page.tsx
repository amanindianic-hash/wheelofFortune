import { SpinWidget } from '@/components/widget/spin-widget';
import { ScratchWidget } from '@/components/widget/scratch-widget';
import { SlotWidget } from '@/components/widget/slot-widget';
import { RouletteWidget } from '@/components/widget/roulette-widget';

// Disable caching — always fetch fresh data from database
export const revalidate = 0;

export default async function WidgetPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const { token } = await params;
  const { preview } = await searchParams;
  const isPreview = preview === '1';

  // Server-side game type lookup so the client receives the right component with no extra round-trip.
  let gameType = 'wheel';
  try {
    // Use VERCEL_URL for production (auto-set by Vercel), fallback to localhost for local dev
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/spin/game-type?token=${token}`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      gameType = data.game_type ?? 'wheel';
    }
  } catch {
    // fallback to wheel on fetch error
  }

  if (gameType === 'scratch_card') return <ScratchWidget embedToken={token} isPreview={isPreview} />;
  if (gameType === 'slot_machine')  return <SlotWidget embedToken={token} isPreview={isPreview} />;
  if (gameType === 'roulette')      return <RouletteWidget embedToken={token} isPreview={isPreview} />;
  return <SpinWidget embedToken={token} isPreview={isPreview} />;
}
