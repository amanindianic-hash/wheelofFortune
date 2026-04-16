// Canvas renderer for the Roulette game type.
// Draws wheel segments, ball track, ball, and hub.

export interface RouletteSegment {
  id: string;
  label: string;
  bg_color: string;
  text_color: string;
  icon_url?: string | null;
}

export interface RouletteBranding {
  primary_color?: string;
  roulette_pocket_style?: 'classic' | 'modern' | 'neon';
  label_font_scale?: number;
  label_radial_offset?: number;
  label_perp_offset?: number;
  icon_radial_offset?: number;
  icon_perp_offset?: number;
  [key: string]: any;
}

/**
 * @param canvas      Target canvas (should be square, e.g. 420×420)
 * @param segments    Prize segments in order
 * @param wheelRot    Current wheel rotation in radians (CW)
 * @param ballAngle   Current ball angle in radians (canvas coords)
 * @param ballDepth   0 = on outer track, 1 = settled in pocket
 * @param branding    Visual options
 * @param imageCache  Pre-loaded images keyed by icon_url
 */
export function drawRoulette(
  canvas: HTMLCanvasElement,
  segments: RouletteSegment[],
  wheelRot: number,
  ballAngle: number,
  ballDepth: number,
  branding: RouletteBranding = {},
  imageCache: Record<string, HTMLImageElement> = {},
) {
  const ctx = canvas.getContext('2d');
  if (!ctx || segments.length === 0) return;

  const W = canvas.width;
  const H = canvas.height;
  const cx = W / 2;
  const cy = H / 2;
  const outerR    = Math.min(cx, cy) - 4;
  const rimW      = 18;
  const trackW    = 20;
  const trackR    = outerR - rimW;           // outer edge of ball track
  const trackInR  = trackR - trackW;         // inner edge of ball track = outer edge of wheel
  const wheelR    = trackInR;
  const hubR      = Math.max(18, wheelR * 0.14);

  const n = segments.length;
  const segAngle = (2 * Math.PI) / n;
  const style = branding.roulette_pocket_style ?? 'classic';
  const primary = branding.primary_color ?? '#7C3AED';

  ctx.clearRect(0, 0, W, H);

  // ── Outer rim ──────────────────────────────────────────────────────────────
  if (style === 'neon') {
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, 0, 2 * Math.PI);
    ctx.fillStyle = '#0A0A14';
    ctx.fill();
    ctx.strokeStyle = primary;
    ctx.lineWidth = 3;
    ctx.shadowColor = primary;
    ctx.shadowBlur = 14;
    ctx.stroke();
    ctx.shadowBlur = 0;
  } else {
    const rimGrad = ctx.createRadialGradient(cx, cy, trackR, cx, cy, outerR);
    rimGrad.addColorStop(0,   '#3a1e00');
    rimGrad.addColorStop(0.5, '#5c3000');
    rimGrad.addColorStop(1,   '#2a1500');
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, 0, 2 * Math.PI);
    ctx.fillStyle = rimGrad;
    ctx.fill();
    // Gold outer edge
    ctx.beginPath();
    ctx.arc(cx, cy, outerR - 2, 0, 2 * Math.PI);
    ctx.strokeStyle = '#C8A050';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, trackR + 1, 0, 2 * Math.PI);
    ctx.strokeStyle = '#C8A050';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // ── Ball track fill ────────────────────────────────────────────────────────
  ctx.beginPath();
  ctx.arc(cx, cy, trackR, 0, 2 * Math.PI);
  if (style === 'neon') {
    ctx.fillStyle = '#05050D';
  } else {
    const tg = ctx.createRadialGradient(cx, cy, trackInR, cx, cy, trackR);
    tg.addColorStop(0, '#1a0a00');
    tg.addColorStop(1, '#2d1800');
    ctx.fillStyle = tg;
  }
  ctx.fill();

  // ── Segments ───────────────────────────────────────────────────────────────
  for (let i = 0; i < n; i++) {
    const seg = segments[i];
    const startA = wheelRot - Math.PI / 2 + i * segAngle;
    const endA   = startA + segAngle;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, wheelR, startA, endA);
    ctx.closePath();
    ctx.fillStyle = seg.bg_color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Icon + Label — radial, readable from outside
    const midA      = startA + segAngle / 2;
    const fontSize  = ((branding.label_font_scale ?? 0.07) * wheelR) || Math.max(7, Math.min(13, 170 / n));
    const img       = seg.icon_url ? imageCache[seg.icon_url] : null;

    // Use relative offsets if available, otherwise fallback to defaults
    const labelRadOffset = (branding.label_radial_offset ?? 0.62) * wheelR;
    const labelPerpOffset = (branding.label_perp_offset ?? 0) * wheelR;
    const iconRadOffset = (branding.icon_radial_offset ?? 0.8) * wheelR;
    const iconPerpOffset = (branding.icon_perp_offset ?? 0) * wheelR;

    // Label Draw
    ctx.save();
    ctx.translate(
      cx + Math.cos(midA) * labelRadOffset + Math.cos(midA + Math.PI / 2) * labelPerpOffset,
      cy + Math.sin(midA) * labelRadOffset + Math.sin(midA + Math.PI / 2) * labelPerpOffset,
    );
    ctx.rotate(midA + Math.PI / 2);

    ctx.fillStyle = seg.text_color;
    ctx.font = `bold ${fontSize}px Inter, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Auto-truncate long labels for roulette
    const labelLimit = n > 12 ? 4 : 7;
    const lbl = seg.label.length > labelLimit ? seg.label.slice(0, labelLimit - 1) + '…' : seg.label;
    ctx.fillText(lbl, 0, 0);
    ctx.restore();

    // Icon Draw (if exists)
    if (img) {
      ctx.save();
      ctx.translate(
        cx + Math.cos(midA) * iconRadOffset + Math.cos(midA + Math.PI / 2) * iconPerpOffset,
        cy + Math.sin(midA) * iconRadOffset + Math.sin(midA + Math.PI / 2) * iconPerpOffset,
      );
      ctx.rotate(midA + Math.PI / 2);
      const iconSize = Math.min(fontSize * 2.2, 20);
      ctx.drawImage(img, -iconSize / 2, -iconSize / 2, iconSize, iconSize);
      ctx.restore();
    }
  }

  // ── Pocket divider ticks on the track inner wall ───────────────────────────
  for (let i = 0; i < n; i++) {
    const a  = wheelRot - Math.PI / 2 + i * segAngle;
    const x1 = cx + Math.cos(a) * (wheelR + 1);
    const y1 = cy + Math.sin(a) * (wheelR + 1);
    const x2 = cx + Math.cos(a) * (trackInR + 5);
    const y2 = cy + Math.sin(a) * (trackInR + 5);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = style === 'neon' ? primary + '88' : 'rgba(200,160,80,0.75)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // ── Center hub ────────────────────────────────────────────────────────────
  ctx.beginPath();
  ctx.arc(cx, cy, hubR, 0, 2 * Math.PI);
  const hg = ctx.createRadialGradient(cx - hubR * 0.3, cy - hubR * 0.3, 1, cx, cy, hubR);
  if (style === 'neon') {
    hg.addColorStop(0, primary + 'cc');
    hg.addColorStop(1, '#0A0A14');
  } else {
    hg.addColorStop(0, '#8a5a00');
    hg.addColorStop(1, '#2a1500');
  }
  ctx.fillStyle = hg;
  ctx.fill();
  ctx.strokeStyle = style === 'neon' ? primary : '#C8A050';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Hub center ornament
  ctx.beginPath();
  ctx.arc(cx, cy, hubR * 0.35, 0, 2 * Math.PI);
  ctx.fillStyle = style === 'neon' ? primary : '#C8A050';
  ctx.fill();

  // ── Ball ──────────────────────────────────────────────────────────────────
  // ballDepth 0 → on track, 1 → inside pocket
  const ballOnTrackR  = trackR - 9;
  const ballInPocketR = wheelR * 0.78;
  const ballR         = ballOnTrackR + (ballInPocketR - ballOnTrackR) * ballDepth;

  const bx   = cx + Math.cos(ballAngle) * ballR;
  const by   = cy + Math.sin(ballAngle) * ballR;
  const bSz  = 7;

  // Drop shadow
  ctx.beginPath();
  ctx.arc(bx + 2, by + 2, bSz, 0, 2 * Math.PI);
  ctx.fillStyle = 'rgba(0,0,0,0.32)';
  ctx.fill();

  // Sphere gradient
  const bg = ctx.createRadialGradient(bx - 2.5, by - 2.5, 1, bx, by, bSz);
  bg.addColorStop(0,   '#ffffff');
  bg.addColorStop(0.5, '#e4e4e4');
  bg.addColorStop(1,   '#a8a8a8');
  ctx.beginPath();
  ctx.arc(bx, by, bSz, 0, 2 * Math.PI);
  ctx.fillStyle = bg;
  ctx.fill();

  // Specular
  ctx.beginPath();
  ctx.arc(bx - 2, by - 2, 2.2, 0, 2 * Math.PI);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fill();
}

/** Compute the ball's final angle so it lands on the winning segment */
export function computeFinalBallAngle(
  startBallAngle: number,
  finalWheelRot: number,        // total wheel travel
  startWheelRot: number,        // wheel rotation before spin
  winIdx: number,
  segCount: number,
  orbitCount = 9,
): number {
  const segAngle      = (2 * Math.PI) / segCount;
  const winCanvas     = (startWheelRot + finalWheelRot) - Math.PI / 2 + segAngle * (winIdx + 0.5);
  const normWin       = ((winCanvas % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  const diff          = normWin - startBallAngle;
  const normDiff      = ((diff % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  // Go CCW: normDiff > 0 means we'd overshoot CW, so subtract 2π first
  const ccwStep       = normDiff > 0 ? normDiff - 2 * Math.PI : normDiff;
  return startBallAngle + ccwStep - orbitCount * 2 * Math.PI;
}
