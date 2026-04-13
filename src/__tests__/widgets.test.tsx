import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

// ─── Mock external deps that widgets rely on ─────────────────────────────────

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
  Toaster: () => null,
}));

vi.mock('qrcode', () => ({
  default: { toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,fake') },
}));

vi.mock('@/lib/utils/roulette-renderer', () => ({
  drawRoulette: vi.fn(),
  computeFinalBallAngle: vi.fn().mockReturnValue(0),
}));

vi.mock('@/lib/utils/wheel-renderer', () => ({
  drawWheel: vi.fn(),
  easeOutQuart: (t: number) => t,
}));

// ─── Static imports of widgets ────────────────────────────────────────────────

import { SpinWidget }     from '@/components/widget/spin-widget';
import { ScratchWidget }  from '@/components/widget/scratch-widget';
import { SlotWidget }     from '@/components/widget/slot-widget';
import { RouletteWidget } from '@/components/widget/roulette-widget';

// ─── Shared test fixtures ─────────────────────────────────────────────────────

const SESSION_OK = {
  session_id: 'sess-1',
  expires_at: new Date(Date.now() + 3600_000).toISOString(),
  wheel: {
    config: { game_type: 'wheel', spin_duration_ms: 100 },
    branding: { primary_color: '#7C3AED', button_text: 'SPIN!' },
    form_config: { enabled: false },
    trigger_rules: {},
  },
  segments: [
    { id: 'seg-1', label: '10% Off', bg_color: '#ff0000', text_color: '#fff', weight: 1, is_no_prize: false, position: 0 },
    { id: 'seg-2', label: 'Try Again', bg_color: '#aaa', text_color: '#000', weight: 1, is_no_prize: true, position: 1 },
  ],
};

const SESSION_WITH_FORM = {
  ...SESSION_OK,
  wheel: {
    ...SESSION_OK.wheel,
    form_config: {
      enabled: true,
      fields: [{ key: 'email', label: 'Email', type: 'email', required: true }],
      gdpr_enabled: false,
    },
  },
};

const SESSION_ERROR = { error: { code: 'NOT_FOUND', message: 'Wheel not found.' } };

// ─── Spin Widget ──────────────────────────────────────────────────────────────

describe('SpinWidget', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('shows loading state initially', () => {
    (global as any).fetch = vi.fn(() => new Promise(() => {})); // never resolves
    render(<SpinWidget embedToken="tok" />);
    // Shows spinner while loading
    expect(document.querySelector('.animate-spin')).toBeTruthy();
  });

  it('shows error state when session API returns an error', async () => {
    (global as any).fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve(SESSION_ERROR),
    });
    render(<SpinWidget embedToken="bad-tok" />);
    await waitFor(() => {
      expect(screen.getByText(/Wheel Unavailable/i)).toBeInTheDocument();
    });
  });
});

// ─── Scratch Widget ───────────────────────────────────────────────────────────

describe('ScratchWidget', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('shows error state on failed session', async () => {
    (global as any).fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve(SESSION_ERROR),
    });
    render(<ScratchWidget embedToken="bad-tok" />);
    await waitFor(() => {
      expect(screen.getByText(/Unavailable/i)).toBeInTheDocument();
    });
  });

  it('shows lead form when form_config.enabled is true', async () => {
    (global as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        ...SESSION_WITH_FORM,
        wheel: {
          ...SESSION_WITH_FORM.wheel,
          config: { game_type: 'scratch_card' },
          trigger_rules: {},
        },
      }),
    });
    render(<ScratchWidget embedToken="tok" />);
    await waitFor(() => {
      expect(screen.getByText(/Scratch to Win/i)).toBeInTheDocument();
    });
  });

  it('shows scratch card when no form required', async () => {
    (global as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        ...SESSION_OK,
        wheel: {
          ...SESSION_OK.wheel,
          config: { game_type: 'scratch_card' },
        },
      }),
    });
    render(<ScratchWidget embedToken="tok" />);
    await waitFor(() => {
      expect(screen.getByText(/Scratch & Win/i)).toBeInTheDocument();
    });
  });
});

// ─── Slot Widget ──────────────────────────────────────────────────────────────

describe('SlotWidget', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('shows error state on failed session', async () => {
    (global as any).fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve(SESSION_ERROR),
    });
    render(<SlotWidget embedToken="bad-tok" />);
    await waitFor(() => {
      expect(screen.getByText(/Unavailable/i)).toBeInTheDocument();
    });
  });

  it('renders slot machine UI when session loads', async () => {
    (global as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        ...SESSION_OK,
        wheel: {
          ...SESSION_OK.wheel,
          config: { game_type: 'slot_machine', slot_reel_count: 3, slot_visible_rows: 1 },
        },
      }),
    });
    render(<SlotWidget embedToken="tok" />);
    await waitFor(() => {
      expect(screen.getByText(/CASINO/i)).toBeInTheDocument();
    });
  });

  it('shows form when form_config.enabled is true', async () => {
    (global as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        ...SESSION_WITH_FORM,
        wheel: {
          ...SESSION_WITH_FORM.wheel,
          config: { game_type: 'slot_machine' },
        },
      }),
    });
    render(<SlotWidget embedToken="tok" />);
    await waitFor(() => {
      expect(screen.getByText(/Spin the Slots/i)).toBeInTheDocument();
    });
  });
});

// ─── Roulette Widget ──────────────────────────────────────────────────────────

describe('RouletteWidget', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('shows error state on failed session', async () => {
    (global as any).fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve(SESSION_ERROR),
    });
    render(<RouletteWidget embedToken="bad-tok" />);
    await waitFor(() => {
      expect(screen.getByText(/Wheel Unavailable/i)).toBeInTheDocument();
    });
  });

  it('renders roulette canvas when session loads without trigger rules', async () => {
    (global as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        ...SESSION_OK,
        wheel: {
          ...SESSION_OK.wheel,
          config: { game_type: 'roulette', roulette_pocket_style: 'classic' },
        },
      }),
    });
    render(<RouletteWidget embedToken="tok" />);
    await waitFor(() => {
      expect(screen.getByText(/Roulette/i)).toBeInTheDocument();
    });
  });

  it('shows lead form when form_config.enabled is true', async () => {
    (global as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        ...SESSION_WITH_FORM,
        wheel: {
          ...SESSION_WITH_FORM.wheel,
          config: { game_type: 'roulette' },
        },
      }),
    });
    render(<RouletteWidget embedToken="tok" />);
    await waitFor(() => {
      expect(screen.getByText(/Spin the Roulette/i)).toBeInTheDocument();
    });
  });
});
