import { describe, it, expect } from 'vitest';
import { computeFinalBallAngle } from '@/lib/utils/roulette-renderer';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Normalise angle to [0, 2π) */
function norm(a: number): number {
  return ((a % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
}

/** Return the canvas angle of the centre of segment `idx` after totalWheelTravel rotation */
function segCentreAngle(startWheelRot: number, totalWheelTravel: number, idx: number, n: number) {
  const segAngle = (2 * Math.PI) / n;
  return norm((startWheelRot + totalWheelTravel) - Math.PI / 2 + segAngle * (idx + 0.5));
}

// ─── computeFinalBallAngle ────────────────────────────────────────────────────

describe('computeFinalBallAngle', () => {
  it('returns a finite number', () => {
    const angle = computeFinalBallAngle(0, 30, 0, 0, 8);
    expect(Number.isFinite(angle)).toBe(true);
  });

  it('ball lands within the winning segment (8 segments, various winIdx)', () => {
    const n = 8;
    const segAngle = (2 * Math.PI) / n;
    const startBall = -Math.PI / 2;
    const startWheel = 0;
    const totalTravel = 4 * 2 * Math.PI + 5; // arbitrary travel

    for (let winIdx = 0; winIdx < n; winIdx++) {
      const finalAngle = computeFinalBallAngle(startBall, totalTravel, startWheel, winIdx, n);
      const normFinal = norm(finalAngle);
      const expectedCenter = segCentreAngle(startWheel, totalTravel, winIdx, n);

      // The ball's normalised angle should be within half a segment of the winning segment centre
      const diff = Math.abs(norm(normFinal - expectedCenter));
      const adjustedDiff = Math.min(diff, 2 * Math.PI - diff);
      expect(adjustedDiff).toBeLessThanOrEqual(segAngle / 2 + 0.001); // tiny epsilon for float
    }
  });

  it('ball lands within the winning segment (2 segments)', () => {
    const n = 2;
    const segAngle = (2 * Math.PI) / n;
    const totalTravel = 6 * Math.PI;

    for (let winIdx = 0; winIdx < n; winIdx++) {
      const finalAngle = computeFinalBallAngle(-Math.PI / 2, totalTravel, 0, winIdx, n);
      const normFinal = norm(finalAngle);
      const expectedCenter = segCentreAngle(0, totalTravel, winIdx, n);
      const diff = norm(normFinal - expectedCenter);
      const adjustedDiff = Math.min(diff, 2 * Math.PI - diff);
      expect(adjustedDiff).toBeLessThanOrEqual(segAngle / 2 + 0.001);
    }
  });

  it('ball lands within the winning segment (24 segments)', () => {
    const n = 24;
    const segAngle = (2 * Math.PI) / n;
    const totalTravel = 10 * Math.PI + 1.23;

    for (let winIdx = 0; winIdx < n; winIdx++) {
      const finalAngle = computeFinalBallAngle(-Math.PI / 2, totalTravel, 0, winIdx, n);
      const normFinal = norm(finalAngle);
      const expectedCenter = segCentreAngle(0, totalTravel, winIdx, n);
      const diff = norm(normFinal - expectedCenter);
      const adjustedDiff = Math.min(diff, 2 * Math.PI - diff);
      expect(adjustedDiff).toBeLessThanOrEqual(segAngle / 2 + 0.001);
    }
  });

  it('is deterministic — same inputs produce same output', () => {
    const a1 = computeFinalBallAngle(-Math.PI / 2, 25.6, 3.1, 3, 10);
    const a2 = computeFinalBallAngle(-Math.PI / 2, 25.6, 3.1, 3, 10);
    expect(a1).toBe(a2);
  });

  it('orbit count changes the travel distance but not the pocket landing', () => {
    const n = 6;
    const segAngle = (2 * Math.PI) / n;
    const totalTravel = 8 * Math.PI;

    const angle5 = computeFinalBallAngle(0, totalTravel, 0, 2, n, 5);
    const angle9 = computeFinalBallAngle(0, totalTravel, 0, 2, n, 9);

    const expectedCenter = segCentreAngle(0, totalTravel, 2, n);

    for (const angle of [angle5, angle9]) {
      const diff = norm(norm(angle) - expectedCenter);
      const adjustedDiff = Math.min(diff, 2 * Math.PI - diff);
      expect(adjustedDiff).toBeLessThanOrEqual(segAngle / 2 + 0.001);
    }
  });
});
