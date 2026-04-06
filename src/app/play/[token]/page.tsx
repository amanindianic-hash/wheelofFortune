import { SpinWidget } from '@/components/widget/spin-widget';
import { ScratchWidget } from '@/components/widget/scratch-widget';
import { SlotWidget } from '@/components/widget/slot-widget';
import { RouletteWidget } from '@/components/widget/roulette-widget';
import { PlayPageShell } from '@/components/widget/play-page-shell';
import type { Metadata } from 'next';

async function getWheelMeta(token: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/spin/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embed_token: token, fingerprint_data: 'server', page_url: null }),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      name: data.wheel?.name ?? 'Spin to Win',
      gameType: data.wheel?.config?.game_type ?? 'wheel',
      primaryColor: data.wheel?.branding?.primary_color ?? '#7C3AED',
      backgroundValue: data.wheel?.branding?.background_value ?? null,
      buttonText: data.wheel?.branding?.button_text ?? 'SPIN!',
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  const meta = await getWheelMeta(token);
  return {
    title: meta ? `${meta.name} — Play Now!` : 'Spin to Win',
    description: 'Try your luck and win exciting prizes!',
  };
}

export default async function PlayPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const meta = await getWheelMeta(token);
  const gameType = meta?.gameType ?? 'wheel';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const playUrl = `${appUrl}/play/${token}`;

  const game =
    gameType === 'scratch_card' ? <ScratchWidget embedToken={token} /> :
    gameType === 'slot_machine'  ? <SlotWidget embedToken={token} /> :
    gameType === 'roulette'      ? <RouletteWidget embedToken={token} /> :
    <SpinWidget embedToken={token} />;

  return (
    <PlayPageShell
      wheelName={meta?.name ?? 'Spin to Win'}
      gameType={gameType}
      primaryColor={meta?.primaryColor ?? '#7C3AED'}
      playUrl={playUrl}
    >
      {game}
    </PlayPageShell>
  );
}
