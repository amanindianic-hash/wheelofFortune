import { SpinWidget } from '@/components/widget/spin-widget';
import { ScratchWidget } from '@/components/widget/scratch-widget';
import { SlotWidget } from '@/components/widget/slot-widget';
import { RouletteWidget } from '@/components/widget/roulette-widget';
import { PlayPageShell } from '@/components/widget/play-page-shell';
import type { Metadata } from 'next';
import { cache } from 'react';

// Memoized data fetcher to share results between metadata generation and page rendering
const getWheelData = cache(async (token: string) => {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    console.log(`[PlayPage] Pre-fetching data for token: ${token}`);
    
    const res = await fetch(`${baseUrl}/api/spin/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        embed_token: token, 
        fingerprint_data: 'server-prepass', 
        page_url: null 
      }),
      cache: 'no-store',
    });
    
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error('[PlayPage] Pre-fetch failed:', error);
    return null;
  }
});

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  const data = await getWheelData(token);
  
  if (!data?.wheel) {
    return { title: 'Spin to Win', description: 'Try your luck and win exciting prizes!' };
  }

  return {
    title: `${data.wheel.name ?? 'Spin to Win'} — Play Now!`,
    description: 'Try your luck and win exciting prizes!',
  };
}

export default async function PlayPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const data = await getWheelData(token);
  
  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
        <div className="text-center space-y-4">
          <p className="text-4xl">😕</p>
          <h1 className="text-xl font-bold">Campaign Unavailable</h1>
          <p className="text-sm text-zinc-500">The link may be expired or invalid.</p>
        </div>
      </div>
    );
  }

  const gameType = data.wheel?.config?.game_type ?? 'wheel';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const playUrl = `${appUrl}/play/${token}`;

  // We pass 'initialData' to the widgets. 
  // This allows them to render the UI immediately on the first frame!
  const game =
    gameType === 'scratch_card' ? <ScratchWidget embedToken={token} initialData={data} /> :
    gameType === 'slot_machine'  ? <SlotWidget embedToken={token} initialData={data} /> :
    gameType === 'roulette'      ? <RouletteWidget embedToken={token} initialData={data} /> :
    <SpinWidget embedToken={token} initialData={data} />;

  return (
    <PlayPageShell
      wheelName={data.wheel?.name ?? 'Spin to Win'}
      gameType={gameType}
      primaryColor={data.wheel?.branding?.primary_color ?? '#7C3AED'}
      playUrl={playUrl}
    >
      {game}
    </PlayPageShell>
  );
}
