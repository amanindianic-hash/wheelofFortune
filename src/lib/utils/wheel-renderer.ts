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
  
  // Premium Image Layer URLs
  premium_face_url?: string | null;
  premium_stand_url?: string | null;
}

// ─── Image cache ──────────────────────────────────────────────────────────────

export type ImageCache = Map<string, HTMLImageElement>;

export async function preloadSegmentImages(
  segments: WheelSegment[],
  config: WheelConfig,
  branding: WheelBranding,
  cache: ImageCache,
): Promise<void> {
  const urls = [
    ...segments.filter((s) => s.icon_url).map((s) => s.icon_url!),
    ...(config.center_image_url ? [config.center_image_url] : []),
    ...(branding.premium_face_url ? [branding.premium_face_url] : []),
    ...(branding.premium_stand_url ? [branding.premium_stand_url] : []),
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

    // ── Pre-calculate shadow base ─────────────────────────────────────────────
    // To make it look like a physical 3D object on the screen, add a soft drop shadow
    // beneath the entire wheel to give depth before drawing anything.
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = 25;
    ctx.shadowOffsetY = 15;
    ctx.beginPath();
    ctx.arc(cx, cy, outerRadius, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.fill();
    ctx.restore();

    // ── Empty state ───────────────────────────────────────────────────────────
    if (segments.length === 0) {
      ctx.beginPath();
      ctx.arc(cx, cy, innerRadius, 0, 2 * Math.PI);
      ctx.fillStyle = '#f3f4f6';
      ctx.fill();
      return;
    }

    const hasPremiumFace = branding.premium_face_url && imageCache?.has(branding.premium_face_url);
    const hasPremiumStand = branding.premium_stand_url && imageCache?.has(branding.premium_stand_url);

    // ── 1. Segment wedges (or Premium Image Layer) ────────────────────────────
    if (hasPremiumFace) {
      const faceImg = imageCache!.get(branding.premium_face_url!);
      if (faceImg) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rotation);
        const scale = (outerRadius * 2) / Math.max(faceImg.width, faceImg.height);
        const w = faceImg.width * scale;
        const h = faceImg.height * scale;
        ctx.drawImage(faceImg, -w / 2, -h / 2, w, h);
        ctx.restore();
      }
    } else {
      segments.forEach((seg, i) => {
        const startAngle = rotation + i * segAngle - Math.PI / 2;
        const endAngle = startAngle + segAngle;

        // Deep 3D radial gradient: almost black at center → mid-color → full color at edge
        const grad = ctx.createRadialGradient(cx, cy, innerRadius * 0.05, cx, cy, innerRadius);
        grad.addColorStop(0, '#000000'); // Deep dark core
        grad.addColorStop(0.35, lightenHex(seg.bg_color, 10)); // Darker mid
        grad.addColorStop(0.85, seg.bg_color); // Pure color
        grad.addColorStop(1, lightenHex(seg.bg_color, 25)); // Slightly lighter edge to catch light

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
    }

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
    if (!hasPremiumFace) {
      if (branding.inner_ring_enabled) {
      const bandWidth = Math.max(6, outerRingWidth * 0.3);
      ctx.beginPath();
      ctx.arc(cx, cy, innerRadius, 0, 2 * Math.PI);
      ctx.arc(cx, cy, innerRadius - bandWidth, 0, 2 * Math.PI, true);
      ctx.fillStyle = branding.inner_ring_color ?? 'rgba(255,255,255,0.18)';
      ctx.fill();
    }

    // ── 4. Outer decorative ring with 3D metallic/gloss gradient ──────────────
    // To match Freepik premium designs, the ring gets a rich, dark metallic rim 
    // instead of flat colors. We create a dual lighting linear gradient.
    const metallicOuterGrad = ctx.createLinearGradient(cx, cy - outerRadius, cx, cy + outerRadius);
    const [br, bg, bb] = hexToRgb(outerRingColor);
    
    // Create a metallic specular reflection by layering stops
    metallicOuterGrad.addColorStop(0, `rgb(${Math.min(br+80, 255)},${Math.min(bg+80, 255)},${Math.min(bb+80, 255)})`);
    metallicOuterGrad.addColorStop(0.15, outerRingColor);
    metallicOuterGrad.addColorStop(0.4, `rgb(${Math.max(br-60, 0)},${Math.max(bg-60, 0)},${Math.max(bb-60, 0)})`);
    metallicOuterGrad.addColorStop(0.8, `rgb(${Math.max(br-90, 0)},${Math.max(bg-90, 0)},${Math.max(bb-90, 0)})`);
    metallicOuterGrad.addColorStop(0.95, outerRingColor);
    metallicOuterGrad.addColorStop(1, `rgb(${Math.min(br+50, 255)},${Math.min(bg+50, 255)},${Math.min(bb+50, 255)})`);

    ctx.beginPath();
    ctx.arc(cx, cy, outerRadius, 0, 2 * Math.PI);
    ctx.arc(cx, cy, innerRadius, 0, 2 * Math.PI, true);
    ctx.fillStyle = metallicOuterGrad;
    ctx.fill();

    // 3D Rim Inner Bevel
    ctx.beginPath();
    ctx.arc(cx, cy, innerRadius, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 4;
    ctx.stroke();
    // Inner bevel highlight
    ctx.beginPath();
    ctx.arc(cx, cy, innerRadius + 2, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // ── Global Gloss overlay on the wheel ──
    // Dramatic soft crescent gloss highlight on the top left
    const globalGloss = ctx.createRadialGradient(
      cx - outerRadius * 0.4, cy - outerRadius * 0.6, 0,
      cx, cy, outerRadius
    );
    globalGloss.addColorStop(0, 'rgba(255,255,255,0.22)');
    globalGloss.addColorStop(0.3, 'rgba(255,255,255,0.06)');
    globalGloss.addColorStop(0.6, 'rgba(0,0,0,0.15)');
    globalGloss.addColorStop(1, 'rgba(0,0,0,0.45)');
    
    ctx.beginPath();
    ctx.arc(cx, cy, innerRadius, 0, 2 * Math.PI);
    ctx.fillStyle = globalGloss;
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
          // Premium Casino Bulb Style (3D luminous bulbs)
          ctx.save();
          // Glow around bulb
          ctx.shadowColor = rimTickColor; // Glow matches tick color
          ctx.shadowBlur = 12;
          ctx.beginPath();
          const bulbR = outerRingWidth * 0.28;
          ctx.arc(
            cx + Math.cos(angle) * midRingR,
            cy + Math.sin(angle) * midRingR,
            bulbR,
            0,
            2 * Math.PI,
          );
          ctx.fillStyle = rimTickColor;
          ctx.fill();
          
          // Bulb Core
          ctx.shadowBlur = 0;
          ctx.beginPath();
          ctx.arc(
            cx + Math.cos(angle) * midRingR,
            cy + Math.sin(angle) * midRingR,
            bulbR * 0.7,
            0,
            2 * Math.PI,
          );
          ctx.fillStyle = '#FFFFFF';
          ctx.fill();

          // Specular bulb highlight
          ctx.fillStyle = 'rgba(255,255,255,0.9)';
          ctx.beginPath();
          ctx.arc(
            cx + Math.cos(angle) * midRingR - bulbR * 0.25,
            cy + Math.sin(angle) * midRingR - bulbR * 0.25,
            bulbR * 0.2,
            0,
            2 * Math.PI,
          );
          ctx.fill();
          ctx.restore();
        }
      });
    }

    // Ring outer edge highlight
    ctx.beginPath();
    ctx.arc(cx, cy, outerRadius - 1, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(cx, cy, outerRadius, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // ── 6. Center hub with gloss ──────────────────────────────────────────────
    const centerR = Math.max(22, innerRadius * 0.16);

    // Outer shadow ring of hub
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, centerR + 4, 0, 2 * Math.PI);
    ctx.fillStyle = '#1D1D1D'; // Dark metallic hub housing
    ctx.fill();
    ctx.restore();

    // Secondary hub gradient ring
    const hubOuterGrad = ctx.createLinearGradient(cx - centerR, cy - centerR, cx + centerR, cy + centerR);
    hubOuterGrad.addColorStop(0, '#FFFFFF');
    hubOuterGrad.addColorStop(0.5, '#777777');
    hubOuterGrad.addColorStop(1, '#222222');
    ctx.beginPath();
    ctx.arc(cx, cy, centerR, 0, 2 * Math.PI);
    ctx.fillStyle = hubOuterGrad;
    ctx.fill();

    // Primary Color Fill
    ctx.beginPath();
    ctx.arc(cx, cy, centerR - 3, 0, 2 * Math.PI);
    ctx.fillStyle = primaryColor;
    ctx.fill();

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

    // Extreme Gloss overlay on hub (3D jewel spherical effect)
    const hubGloss = ctx.createRadialGradient(
      cx - centerR * 0.35, cy - centerR * 0.45, 1,
      cx, cy, centerR,
    );
    hubGloss.addColorStop(0, 'rgba(255,255,255,0.8)');
    hubGloss.addColorStop(0.35, 'rgba(255,255,255,0.15)');
    hubGloss.addColorStop(0.8, 'rgba(0,0,0,0.4)');
    hubGloss.addColorStop(1, 'rgba(0,0,0,0.7)');
    
    ctx.beginPath();
    ctx.arc(cx, cy, centerR - 3, 0, 2 * Math.PI);
    ctx.fillStyle = hubGloss;
    ctx.fill();
    } // <-- End if (!hasPremiumFace)

    // ── 7. Premium Stand Layer (STATIC) ───────────────────────────────────────
    if (hasPremiumStand) {
      const standImg = imageCache!.get(branding.premium_stand_url!);
      if (standImg) {
        ctx.save();
        const scale = (outerRadius * 2) / Math.max(standImg.width, standImg.height);
        const w = standImg.width * scale;
        const h = standImg.height * scale;
        ctx.drawImage(standImg, cx - w / 2, cy - h / 2, w, h);
        ctx.restore();
      }
    }

  } catch (e) {
    console.error('drawWheel error', e);
  }
}

export function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}
