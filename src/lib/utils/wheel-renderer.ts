/**
 * Reusable Canvas Wheel Renderer — High Quality Edition
 * Used by both the live widget and the dashboard preview editor.
 *
 * Quality principles:
 *  - Always renders at ≥2x device pixels (crisp on all displays incl. 1x)
 *  - imageSmoothingQuality = 'high' for all image operations
 *  - Radial gradient fills give segments depth and premium feel
 *  - Gloss overlay on center hub for 3D effect
 *  - Sub-pixel stroke widths with round caps/joins
 */

export interface WheelSegment {
  id: string;
  position: number;
  label: string;
  bg_color: string;
  text_color: string;
  weight: number;
  is_no_prize: boolean;
  icon_url?: string | null;
  // Per-segment position overrides (local coords: X = radial outward, Y = perpendicular clockwise)
  label_offset_x?: number | null;
  label_offset_y?: number | null;
  icon_offset_x?: number | null;
  icon_offset_y?: number | null;
}

export interface WheelConfig {
  spin_duration_ms?: number;
  pointer_position?: string;
  confetti_enabled?: boolean;
  sound_enabled?: boolean;
  sound_url?: string | null;
  show_segment_labels?: boolean;
  center_image_url?: string | null;
  label_rotation?: 'radial' | 'horizontal';
  kiosk_mode?: boolean;
  kiosk_reset_delay_ms?: number;
  shopify_store_url?: string | null;
}

export interface WheelBranding {
  button_text?: string;
  primary_color?: string;
  border_color?: string;
  border_width?: number;
  background_value?: string;
  font_family?: string;
  // Ring customization
  outer_ring_color?: string;
  outer_ring_width?: number;
  rim_tick_style?: 'none' | 'dots' | 'triangles';
  rim_tick_color?: string;
  inner_ring_enabled?: boolean;
  inner_ring_color?: string;
  // Label customization
  label_font_size?: number | null;
  label_font_weight?: '400' | '600' | '700' | '800';
  label_position?: 'inner' | 'center' | 'outer';
  label_text_transform?: 'none' | 'uppercase' | 'capitalize';
  label_letter_spacing?: number;
  // Icon placement
  icon_position?: 'outer' | 'inner' | 'overlay';
}

// ─── Image cache ──────────────────────────────────────────────────────────────

export type ImageCache = Map<string, HTMLImageElement>;

export async function preloadSegmentImages(
  segments: WheelSegment[],
  config: WheelConfig,
  cache: ImageCache,
): Promise<void> {
  const urls = [
    ...segments.filter((s) => s.icon_url).map((s) => s.icon_url!),
    ...(config.center_image_url ? [config.center_image_url] : []),
  ].filter((url) => !cache.has(url));

  await Promise.all(
    urls.map(
      (url) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => { cache.set(url, img); resolve(); };
          img.onerror = () => resolve();
          img.src = url;
        }),
    ),
  );
}

// ─── Color helpers ────────────────────────────────────────────────────────────

/** Parse any CSS hex color (#RGB, #RRGGBB) into [r, g, b] 0-255. Falls back to provided default. */
function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    return [
      parseInt(clean[0] + clean[0], 16),
      parseInt(clean[1] + clean[1], 16),
      parseInt(clean[2] + clean[2], 16),
    ];
  }
  if (clean.length === 6) {
    return [parseInt(clean.slice(0, 2), 16), parseInt(clean.slice(2, 4), 16), parseInt(clean.slice(4, 6), 16)];
  }
  return [124, 58, 237]; // fallback violet
}

/** Lighten a hex color by mixing toward white by `amount` (0-255). */
function lightenHex(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const blend = (c: number) => Math.min(255, Math.round(c + amount));
  return `rgb(${blend(r)},${blend(g)},${blend(b)})`;
}

// ─── Main draw function ───────────────────────────────────────────────────────

export function drawWheel(
  canvas: HTMLCanvasElement,
  segments: WheelSegment[],
  rotation: number,
  config: WheelConfig,
  branding: WheelBranding,
  imageCache?: ImageCache,
) {
  try {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // ── High-quality rendering setup ──────────────────────────────────────────
    // Force minimum 2x so 1x displays also get crisp rendering
    const dpr = Math.max(2, typeof window !== 'undefined' ? (window.devicePixelRatio || 2) : 2);
    const rect = canvas.getBoundingClientRect();
    const cssWidth = rect.width || canvas.width;
    const cssHeight = rect.height || canvas.height;

    canvas.width = cssWidth * dpr;
    canvas.height = cssHeight * dpr;
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;
    ctx.scale(dpr, dpr);

    // High-quality image interpolation
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    const cx = cssWidth / 2;
    const cy = cssHeight / 2;

    const outerRingWidth = branding.outer_ring_width ?? 20;
    const outerRadius = Math.min(cx, cy) - 2;
    const innerRadius = outerRadius - outerRingWidth;
    const segAngle = (2 * Math.PI) / (segments.length || 1);

    const primaryColor = branding.primary_color ?? '#7C3AED';
    const outerRingColor = branding.outer_ring_color ?? primaryColor;
    const rimTickStyle = branding.rim_tick_style ?? 'triangles';
    const rimTickColor = branding.rim_tick_color ?? '#FFFFFF';
    const fontFamily = branding.font_family ?? 'Inter, system-ui, sans-serif';

    ctx.clearRect(0, 0, cssWidth, cssHeight);

    // ── Empty state ───────────────────────────────────────────────────────────
    if (segments.length === 0) {
      ctx.beginPath();
      ctx.arc(cx, cy, innerRadius, 0, 2 * Math.PI);
      ctx.fillStyle = '#f3f4f6';
      ctx.fill();
      return;
    }

    // ── 1. Segment wedges with radial gradient ────────────────────────────────
    segments.forEach((seg, i) => {
      const startAngle = rotation + i * segAngle - Math.PI / 2;
      const endAngle = startAngle + segAngle;

      // Radial gradient: lighter at center → full color at edge (depth effect)
      const grad = ctx.createRadialGradient(cx, cy, innerRadius * 0.1, cx, cy, innerRadius);
      grad.addColorStop(0, lightenHex(seg.bg_color, 55));
      grad.addColorStop(0.6, lightenHex(seg.bg_color, 18));
      grad.addColorStop(1, seg.bg_color);

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, innerRadius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Crisp white divider
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    // ── 2. Segment icons + labels ─────────────────────────────────────────────
    const iconRadius = Math.min(innerRadius * 0.18, 26);
    const iconPositionSetting = branding.icon_position ?? 'outer';
    const hubR = Math.max(18, innerRadius * 0.13);

    // Pre-compute icon distances for outer/inner modes
    // outer: icon near rim (65%); inner: icon just outside hub; overlay: icon at label_position
    const outerIconDist = innerRadius * 0.65;
    const innerIconDist = hubR + iconRadius + 6; // hub outer edge + iconRadius + 6px gap

    segments.forEach((seg, i) => {
      const midAngle = rotation + i * segAngle - Math.PI / 2 + segAngle / 2;
      const hasIcon = !!(seg.icon_url && imageCache?.has(seg.icon_url));

      // ── Common label helpers (needed for overlay icon placement) ─────────────
      const positionRatio = branding.label_position === 'inner' ? 0.28
        : branding.label_position === 'center' ? 0.44
        : 0.58; // outer (default)
      const autoSize = segments.length > 12 ? 9 : segments.length > 8 ? 11 : 13;
      const fontSize = branding.label_font_size ?? autoSize;
      const fontWeight = branding.label_font_weight ?? '700';
      const letterSpacing = branding.label_letter_spacing ?? 0;
      const maxChars = segments.length > 8 ? 8 : 13;
      let displayLabel = seg.label.length > maxChars
        ? seg.label.slice(0, maxChars - 1) + '…'
        : seg.label;
      if (branding.label_text_transform === 'uppercase') {
        displayLabel = displayLabel.toUpperCase();
      } else if (branding.label_text_transform === 'capitalize') {
        displayLabel = displayLabel.replace(/\b\w/g, (c) => c.toUpperCase());
      }

      // ── Determine icon distance ───────────────────────────────────────────────
      // For overlay: icon placed at the label_position ratio (same spot as text will be)
      const iconDist = !hasIcon ? outerIconDist
        : iconPositionSetting === 'inner' ? innerIconDist
        : iconPositionSetting === 'overlay' ? innerRadius * positionRatio
        : outerIconDist;

      // Per-segment offsets in local coordinate system (X=radial, Y=perpendicular)
      const ioxRaw = seg.icon_offset_x ?? 0;
      const ioyRaw = seg.icon_offset_y ?? 0;
      const loxRaw = seg.label_offset_x ?? 0;
      const loyRaw = seg.label_offset_y ?? 0;

      if (hasIcon) {
        // Apply icon offset: transform local (X,Y) → canvas coords
        const iconX = cx + Math.cos(midAngle) * (iconDist + ioxRaw) - Math.sin(midAngle) * ioyRaw;
        const iconY = cy + Math.sin(midAngle) * (iconDist + ioxRaw) + Math.cos(midAngle) * ioyRaw;

        // Drop shadow on icon circle
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.22)';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(iconX, iconY, iconRadius + 3, 0, 2 * Math.PI);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.restore();

        // Clipped image
        ctx.save();
        ctx.beginPath();
        ctx.arc(iconX, iconY, iconRadius, 0, 2 * Math.PI);
        ctx.clip();
        ctx.drawImage(
          imageCache!.get(seg.icon_url!)!,
          iconX - iconRadius,
          iconY - iconRadius,
          iconRadius * 2,
          iconRadius * 2,
        );
        ctx.restore();

        // Subtle icon circle border
        ctx.beginPath();
        ctx.arc(iconX, iconY, iconRadius + 3, 0, 2 * Math.PI);
        ctx.strokeStyle = 'rgba(255,255,255,0.6)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // ── Label ─────────────────────────────────────────────────────────────────
      if (config.show_segment_labels !== false && seg.label) {
        // ── Label distance based on icon layout ───────────────────────────────
        let labelDist: number;
        if (!hasIcon || iconPositionSetting === 'overlay') {
          // No icon OR overlay: label at configured position
          labelDist = innerRadius * positionRatio;
        } else if (iconPositionSetting === 'inner') {
          // Icon near hub → label beyond icon outer edge, centered in outer zone
          const iconOuterEdge = iconDist + iconRadius + 6;
          labelDist = (iconOuterEdge + innerRadius * 0.92) / 2;
        } else {
          // Icon outer (65%) → label centered between hub and icon inner edge
          const iconInnerEdge = iconDist - iconRadius - 4;
          labelDist = Math.max(hubR + 6, (hubR + 4 + iconInnerEdge) / 2);
        }

        ctx.save();
        ctx.fillStyle = seg.text_color || '#FFFFFF';
        ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
        ctx.shadowColor = 'rgba(0,0,0,0.4)';
        ctx.shadowBlur = 4;
        if (letterSpacing) ctx.letterSpacing = `${letterSpacing}px`;

        if (iconPositionSetting === 'overlay' && hasIcon) {
          // ── Overlay: draw text centered on top of the icon ────────────────────
          // Recompute iconX/Y applying icon offset (same transform as above)
          const iconX = cx + Math.cos(midAngle) * (iconDist + ioxRaw) - Math.sin(midAngle) * ioyRaw;
          const iconY = cy + Math.sin(midAngle) * (iconDist + ioxRaw) + Math.cos(midAngle) * ioyRaw;

          // Pill background for legibility
          const textW = Math.min(ctx.measureText(displayLabel).width + 8, iconRadius * 2);
          const pillH = fontSize + 4;
          const pillY = iconY + iconRadius - pillH - 2;
          ctx.fillStyle = 'rgba(0,0,0,0.55)';
          ctx.beginPath();
          const pr = pillH / 2;
          ctx.roundRect(iconX - textW / 2, pillY, textW, pillH, pr);
          ctx.fill();

          // Text over pill
          ctx.fillStyle = '#FFFFFF';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.shadowBlur = 0;
          ctx.fillText(displayLabel, iconX, pillY + pillH / 2);

        } else if (config.label_rotation === 'horizontal') {
          // ── Horizontal: text stays upright, offset applied via coord transform ─
          const effDist = labelDist + loxRaw;
          const textX = cx + Math.cos(midAngle) * effDist - Math.sin(midAngle) * loyRaw;
          const textY = cy + Math.sin(midAngle) * effDist + Math.cos(midAngle) * loyRaw;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(displayLabel, textX, textY);
        } else {
          // ── Radial: text rotates with segment, offset in local coords ──────────
          ctx.translate(cx, cy);
          ctx.rotate(midAngle);
          ctx.textAlign = 'center';
          ctx.textBaseline = 'alphabetic';
          ctx.fillText(displayLabel, labelDist + loxRaw, fontSize * 0.35 + loyRaw);
        }
        ctx.restore();
      }
    });

    // ── 3. Inner ring band ────────────────────────────────────────────────────
    if (branding.inner_ring_enabled) {
      const bandWidth = Math.max(6, outerRingWidth * 0.3);
      ctx.beginPath();
      ctx.arc(cx, cy, innerRadius, 0, 2 * Math.PI);
      ctx.arc(cx, cy, innerRadius - bandWidth, 0, 2 * Math.PI, true);
      ctx.fillStyle = branding.inner_ring_color ?? 'rgba(255,255,255,0.18)';
      ctx.fill();
    }

    // ── 4. Outer decorative ring with gloss ───────────────────────────────────
    // Base ring fill
    ctx.beginPath();
    ctx.arc(cx, cy, outerRadius, 0, 2 * Math.PI);
    ctx.arc(cx, cy, innerRadius, 0, 2 * Math.PI, true);
    ctx.fillStyle = outerRingColor;
    ctx.fill();

    // Gloss highlight — top half brighter, bottom darker (3D cylinder illusion)
    const glossGrad = ctx.createLinearGradient(cx, cy - outerRadius, cx, cy + outerRadius);
    glossGrad.addColorStop(0, 'rgba(255,255,255,0.30)');
    glossGrad.addColorStop(0.45, 'rgba(255,255,255,0.08)');
    glossGrad.addColorStop(0.55, 'rgba(0,0,0,0.05)');
    glossGrad.addColorStop(1, 'rgba(0,0,0,0.18)');
    ctx.beginPath();
    ctx.arc(cx, cy, outerRadius, 0, 2 * Math.PI);
    ctx.arc(cx, cy, innerRadius, 0, 2 * Math.PI, true);
    ctx.fillStyle = glossGrad;
    ctx.fill();

    // ── 5. Rim tick marks ─────────────────────────────────────────────────────
    if (rimTickStyle !== 'none' && segments.length > 1) {
      const midRingR = (outerRadius + innerRadius) / 2;

      segments.forEach((_, i) => {
        const angle = rotation + i * segAngle - Math.PI / 2;

        if (rimTickStyle === 'triangles') {
          const tickSize = outerRingWidth * 0.36;
          ctx.save();
          ctx.translate(
            cx + Math.cos(angle) * midRingR,
            cy + Math.sin(angle) * midRingR,
          );
          ctx.rotate(angle + Math.PI / 2);
          ctx.beginPath();
          ctx.moveTo(0, -tickSize);
          ctx.lineTo(tickSize * 0.65, tickSize * 0.55);
          ctx.lineTo(-tickSize * 0.65, tickSize * 0.55);
          ctx.closePath();
          ctx.fillStyle = rimTickColor;
          ctx.shadowColor = 'rgba(0,0,0,0.25)';
          ctx.shadowBlur = 3;
          ctx.fill();
          ctx.restore();
        } else if (rimTickStyle === 'dots') {
          ctx.save();
          ctx.shadowColor = 'rgba(0,0,0,0.25)';
          ctx.shadowBlur = 4;
          ctx.beginPath();
          ctx.arc(
            cx + Math.cos(angle) * midRingR,
            cy + Math.sin(angle) * midRingR,
            outerRingWidth * 0.2,
            0,
            2 * Math.PI,
          );
          ctx.fillStyle = rimTickColor;
          ctx.fill();
          ctx.restore();
        }
      });
    }

    // Ring edge highlights
    ctx.beginPath();
    ctx.arc(cx, cy, outerRadius - 0.75, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, innerRadius + 0.75, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // ── 6. Center hub with gloss ──────────────────────────────────────────────
    const centerR = Math.max(18, innerRadius * 0.13);

    // Outer shadow ring
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, centerR, 0, 2 * Math.PI);
    ctx.fillStyle = primaryColor;
    ctx.fill();
    ctx.restore();

    // White border
    ctx.beginPath();
    ctx.arc(cx, cy, centerR, 0, 2 * Math.PI);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Center image or gloss dot
    const centerImgUrl = config.center_image_url;
    if (centerImgUrl && imageCache?.has(centerImgUrl)) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, centerR - 3, 0, 2 * Math.PI);
      ctx.clip();
      ctx.drawImage(
        imageCache.get(centerImgUrl)!,
        cx - (centerR - 3),
        cy - (centerR - 3),
        (centerR - 3) * 2,
        (centerR - 3) * 2,
      );
      ctx.restore();
    } else {
      // Small white inner dot
      ctx.beginPath();
      ctx.arc(cx, cy, centerR * 0.35, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fill();
    }

    // Gloss overlay on hub (top-left highlight = 3D sphere effect)
    const hubGloss = ctx.createRadialGradient(
      cx - centerR * 0.3, cy - centerR * 0.35, 0,
      cx, cy, centerR,
    );
    hubGloss.addColorStop(0, 'rgba(255,255,255,0.42)');
    hubGloss.addColorStop(0.5, 'rgba(255,255,255,0.08)');
    hubGloss.addColorStop(1, 'rgba(0,0,0,0.0)');
    ctx.beginPath();
    ctx.arc(cx, cy, centerR - 1, 0, 2 * Math.PI);
    ctx.fillStyle = hubGloss;
    ctx.fill();

  } catch (e) {
    console.error('drawWheel error', e);
  }
}

export function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}
