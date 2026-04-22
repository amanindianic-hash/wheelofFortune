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
  background: {
    color: string;
    imageUrl: string | null;
  };
  text_color: string;
  weight: number;
  is_no_prize: boolean;
  icon_url?: string | null;
  // Legacy fields for backward compatibility
  bg_color?: string;
  segment_image_url?: string | null;
  // Per-segment position overrides (local coords: X = radial outward, Y = perpendicular clockwise)
  label_offset_x?: number | null;
  label_offset_y?: number | null;
  icon_offset_x?: number | null;
  icon_offset_y?: number | null;
  // Per-segment rotation overrides (degrees)
  label_rotation_angle?: number | null;
  icon_rotation_angle?: number | null;
  // Relative placement (0-1 based on wheel radius)
  label_radial_offset?: number | null;
  label_tangential_offset?: number | null;
  icon_radial_offset?: number | null;
  icon_tangential_offset?: number | null;
  label_font_scale?: number | null;
  icon_scale?: number | null;
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
  centerLogo?: string | null;
}

export interface WheelBranding {
  button_text?: string;
  primary_color?: string;
  pointer_color?: string;
  secondary_color?: string;
  background_type?: 'solid' | 'gradient' | 'image';
  background_value?: string;
  font_family?: string;
  button_color?: string;
  border_color?: string;
  border_width?: number;
  center_logo?: string | null;
  centerLogo?: string | null;
  logo_position?: 'above' | 'center';
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
  premium_frame_url?: string | null;
  premium_pointer_url?: string | null;
  premium_content_scale?: number;
  premium_center_offset_y?: number;
  segment_image_offset_x?: number;
  segment_image_offset_y?: number;
  // Relative placement (0-1 based on wheel radius)
  label_font_scale?: number;
  label_radial_offset?: number;
  label_tangential_offset?: number;
  icon_radial_offset?: number;
  icon_tangential_offset?: number;
  icon_scale?: number;
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
    // 1. Foreground Icon URLs (Prizes)
    ...segments.filter((s) => s.icon_url).map((s) => s.icon_url!),
    
    // 2. Background Segment Images (Fills)
    ...segments.filter((s) => s.background?.imageUrl || s.segment_image_url)
               .map((s) => (s.background?.imageUrl || s.segment_image_url)!),

    // 3. Central Hub & Background Fills
    ...(branding.centerLogo ? [branding.centerLogo] : []),
    ...(branding.center_logo ? [branding.center_logo] : []),
    ...(config.centerLogo ? [config.centerLogo] : []),
    ...(config.center_image_url ? [config.center_image_url] : []),
    ...(branding.premium_face_url ? [branding.premium_face_url] : []),
    ...(branding.premium_stand_url ? [branding.premium_stand_url] : []),
    ...(branding.premium_frame_url ? [branding.premium_frame_url] : []),
    ...(branding.premium_pointer_url ? [branding.premium_pointer_url] : []),
  ].filter((url) => !cache.has(url));

  await Promise.all(
    urls.map(
      (url) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          // Don't set crossOrigin for data: or blob: URLs
          const isBlobOrData = url.startsWith('blob:') || url.startsWith('data:');

          if (!isBlobOrData) {
            img.crossOrigin = 'anonymous';
          }

          img.onload = () => { cache.set(url, img); resolve(); };
          img.onerror = () => {
            if (!isBlobOrData && img.crossOrigin === 'anonymous') {
              // CORS failed — retry WITHOUT crossOrigin.
              // The canvas will be tainted (no toDataURL) but the image will still RENDER visually.
              console.warn(`[WheelRenderer] CORS blocked for: ${url} — retrying without crossOrigin`);
              const fallbackImg = new Image();
              fallbackImg.onload = () => { cache.set(url, fallbackImg); resolve(); };
              fallbackImg.onerror = () => {
                console.warn(`[WheelRenderer] Failed to load image even without crossOrigin: ${url}`);
                resolve();
              };
              fallbackImg.src = url;
            } else {
              console.warn(`[WheelRenderer] Failed to load image: ${url}`);
              resolve();
            }
          };
          img.src = url;
        }),
    ),
  );
}

// ─── Color helpers ────────────────────────────────────────────────────────────

/** Detect if a color is fully transparent (rgba with alpha 0 or 'transparent' keyword) */
export function isTransparent(color?: string | null): boolean {
  if (!color || color === 'transparent') return true;
  const c = color.toLowerCase().replace(/\s/g, '');
  if (c === 'rgba(0,0,0,0)') return true;
  // Match rgba(r,g,b,0) or rgba(r,g,b,0.0) or rgba(r,g,b,.0)
  return c.includes('rgba') && (c.endsWith(',0)') || c.endsWith(',0.0)') || c.endsWith(',.0)'));
}

/** 
 * Standardize any color input to a valid rgba() string.
 * This ensures the alpha channel is never dropped during rendering.
 */
export function normalizeToRgba(color: string | null | undefined): string {
  if (!color || color === 'transparent') return 'rgba(0,0,0,0)';
  if (typeof color !== 'string') return 'rgba(0,0,0,1)';
  
  const c = color.trim().toLowerCase();
  if (c.startsWith('rgba') || c.startsWith('rgb')) return c;
  
  if (c.startsWith('#')) {
    const [r, g, b] = hexToRgb(color); // use original case for hexToRgb if needed
    // Handle 8-char hex if present
    if (c.length === 9) {
      const alpha = parseInt(c.slice(7, 9), 16) / 255;
      return `rgba(${r},${g},${b},${alpha.toFixed(3)})`;
    }
    return `rgba(${r},${g},${b},1)`;
  }
  
  return color;
}

/** Parse any CSS hex color (#RGB, #RRGGBB) into [r, g, b] 0-255. */
function hexToRgb(hex: string): [number, number, number] {
  if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) {
    return [0, 0, 0]; // return black if invalid, baseline should have prevented this
  }
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
  return [0, 0, 0];
}

/** Lighten a hex color by mixing toward white by `amount` (0-255). */
function lightenHex(color: string, amount: number): string {
  if (!color || typeof color !== 'string') return 'rgba(0,0,0,0)';
  // Allow native passthrough for rgba(), rgb(), hsla(), hsl(), or transparent
  if (!color.startsWith('#')) return color;

  const [r, g, b] = hexToRgb(color);
  const blend = (c: number) => Math.min(255, Math.round(c + amount));

  // If it's an 8-character hex (#rrggbbaa), preserve its alpha channel at the end
  if (color.replace('#', '').length === 8) {
    const alphaHex = color.slice(-2);
    return `rgba(${blend(r)},${blend(g)},${blend(b)},${(parseInt(alphaHex, 16)/255).toFixed(3)})`;
  }

  return `rgba(${blend(r)},${blend(g)},${blend(b)},1)`;
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

    // Mandatory Audit Logs
    console.log("[FINAL SEGMENTS DATA]", segments);

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

    let cx = cssWidth / 2;
    let cy = cssHeight / 2;

    const intendsPremiumFace = !!branding.premium_face_url;
    const intendsPremiumStand = !!branding.premium_stand_url;

    const hasPremiumFace = branding.premium_face_url ? !!imageCache?.has(branding.premium_face_url) : false;
    const hasPremiumStand = branding.premium_stand_url ? !!imageCache?.has(branding.premium_stand_url) : false;

    // ── 1. Calculate Dimensions ──
    // If we intend premium mode but don't have the image yet, use a small fallback ring width
    // so the wheel doesn't look "naked" while loading.
    const requestedRingWidth = branding.outer_ring_width ?? 20;
    const outerRingWidth = (intendsPremiumStand && !hasPremiumStand) ? 4 : requestedRingWidth;

    const outerRadius = Math.min(cx, cy) - 10; // Increased padding from 2.5 to 10 for clipping safety
    let innerRadius = outerRadius - outerRingWidth;

    // Apply premium scaling and offsets for labels
    if (hasPremiumFace) {
      if (branding.premium_content_scale) {
        innerRadius *= branding.premium_content_scale;
      }
      if (branding.premium_center_offset_y) {
        cy += branding.premium_center_offset_y;
      }
    }

    const segAngle = (2 * Math.PI) / (segments.length || 1);

    const primaryColor = branding.primary_color ?? '#7C3AED';
    const outerRingColor = branding.outer_ring_color ?? primaryColor;
    const rimTickStyle = branding.rim_tick_style ?? 'triangles';
    const rimTickColor = branding.rim_tick_color ?? '#FFFFFF';
    const fontFamily = branding.font_family ?? 'Inter, system-ui, sans-serif';

    ctx.clearRect(0, 0, cssWidth, cssHeight);

    // ── 0. Premium Stand Layer (STATIC BACKGROUND — drawn first so wheel spins on top) ──
    if (hasPremiumStand) {
      const standImg = imageCache!.get(branding.premium_stand_url!);
      if (standImg) {
        ctx.save();
        const standScale = (outerRadius * 2) / Math.max(standImg.width, standImg.height);
        const sw = standImg.width * standScale;
        const sh = standImg.height * standScale;
        // Draw at original canvas center (not offset by premium_center_offset_y)
        ctx.drawImage(standImg, cssWidth / 2 - sw / 2, cssHeight / 2 - sh / 2, sw, sh);
        ctx.restore();
      }
    }

    // To make it look like a physical 3D object on the screen, add a soft drop shadow
    // beneath the entire wheel to give depth before drawing anything.
    // RULE: Only draw shadow if rim is visible or segments are opaque.
    const isRimVisible = !isTransparent(outerRingColor) && (outerRingWidth || 0) > 0;
    if (!hasPremiumStand && isRimVisible) {
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.45)';
      ctx.shadowBlur = 25;
      ctx.shadowOffsetY = 15;
      ctx.beginPath();
      ctx.arc(cx, cy, outerRadius, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(0,0,0,0.1)';
      ctx.fill();
      ctx.restore();
    }

    // ── Empty state ───────────────────────────────────────────────────────────
    if (segments.length === 0) {
      ctx.beginPath();
      ctx.arc(cx, cy, innerRadius, 0, 2 * Math.PI);
      ctx.fillStyle = normalizeToRgba('#f3f4f6');
      ctx.fill();
      return;
    }

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

        // Check if segment has custom background image
        const bgImgUrl = seg.background?.imageUrl || seg.segment_image_url;
        const hasSegmentImage = !!(bgImgUrl && imageCache?.has(bgImgUrl));

        if (hasSegmentImage) {
          // ── Render segment with custom image ────────────────────────────────
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.arc(cx, cy, innerRadius, startAngle, endAngle);
          ctx.closePath();
          ctx.clip();

          // Draw the segment image
          const img = imageCache!.get(bgImgUrl!)!;
          const imgSize = innerRadius * 2;

          // Move context origin to wheel center
          ctx.translate(cx, cy);
          const segMidAngle = (startAngle + endAngle) / 2;
          // Rotate context so the Y axis aligns with the outward midpoint vector (standard upright orientation)
          // We add Math.PI / 2 because native canvas images point upward (negative Y), but segMidAngle has X pointing outward.
          ctx.rotate(segMidAngle + Math.PI / 2);

          // Draw the image halfway outwards
          // Because of our +90deg rotation matrices, negative Y is directly outwards from center matching the slice.
          // The image's top (which points to negative Y) will face exactly outward toward the rim.
          const imgBaseX = -imgSize / 2;
          const imgBaseY = -imgSize / 2 - (innerRadius / 2);

          // Apply custom user offsets if provided in branding (Global) or segment (Local)
          // Local segment offsets override global offsets
          const userOffsetX = seg.icon_offset_x ?? branding.segment_image_offset_x ?? 0;
          const userOffsetY = seg.icon_offset_y ?? branding.segment_image_offset_y ?? 0;

          ctx.drawImage(img, imgBaseX + userOffsetX, imgBaseY + userOffsetY, imgSize, imgSize);
          ctx.restore();
        } else {
          // ── Render segment with solid color gradient (original logic) ────────
          const segmentColor = seg.background?.color || seg.bg_color || 'rgba(124, 58, 237, 1)';
          
          if (!isTransparent(segmentColor)) {
            const grad = ctx.createRadialGradient(cx, cy, innerRadius * 0.05, cx, cy, innerRadius);
            const safeBg = lightenHex(segmentColor, 0);
            const c1 = 'rgba(0,0,0,1)';
            const c2 = normalizeToRgba(lightenHex(safeBg, 10));
            const c3 = normalizeToRgba(safeBg);
            const c4 = normalizeToRgba(lightenHex(safeBg, 25));

            console.log(`[COLOR CHECK] Seg ${i} Gradient:`, { c1, c2, c3, c4 });

            grad.addColorStop(0, c1);
            grad.addColorStop(0.35, c2); // Darker mid
            grad.addColorStop(0.85, c3); // Pure color
            grad.addColorStop(1, c4); // Slightly lighter edge to catch light

            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, innerRadius, startAngle, endAngle);
            ctx.closePath();
            ctx.fillStyle = grad;
            ctx.fill();
          }
        }

        // Divider stroke (respects theme/transparency)
        // If segments are empty or user wants transparent dividers, we set to transparent
        ctx.strokeStyle = 'transparent'; 
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
      const fontWeight = branding.label_font_weight ?? '700';
      const letterSpacing = branding.label_letter_spacing ?? 0;

      // ── Calculate dynamic Font Size ──
      // Priority: Segment override (relative) -> Branding (relative) -> Branding (absolute px) -> auto
      let fontSize: number;
      if (seg.label_font_scale != null) {
        fontSize = innerRadius * seg.label_font_scale;
      } else if (branding.label_font_scale != null) {
        fontSize = innerRadius * branding.label_font_scale;
      } else {
        const autoSize = segments.length > 12 ? 9 : segments.length > 8 ? 11 : 13;
        fontSize = branding.label_font_size ?? autoSize;
      }

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

      // ── Determine Offsets (Relative vs Absolute) ──
      // Local segment offsets: Priority: Relative -> Absolute px
      const ioxRawArr = [
        seg.icon_radial_offset != null ? seg.icon_radial_offset * innerRadius : null,
        seg.icon_offset_x
      ].filter(v => v != null);
      const ioxRaw = ioxRawArr.length > 0 ? Number(ioxRawArr[0]) : 0;

      const ioyRawArr = [
        seg.icon_tangential_offset != null ? seg.icon_tangential_offset * innerRadius : null,
        seg.icon_offset_y
      ].filter(v => v != null);
      const ioyRaw = ioyRawArr.length > 0 ? Number(ioyRawArr[0]) : 0;

      const loxRawArr = [
        seg.label_radial_offset != null ? seg.label_radial_offset * innerRadius : null,
        branding.label_radial_offset != null ? branding.label_radial_offset * innerRadius : null,
        seg.label_offset_x
      ].filter(v => v != null);
      const loxRaw = loxRawArr.length > 0 ? Number(loxRawArr[0]) : 0;

      const loyRawArr = [
        seg.label_tangential_offset != null ? seg.label_tangential_offset * innerRadius : null,
        branding.label_tangential_offset != null ? branding.label_tangential_offset * innerRadius : null,
        seg.label_offset_y
      ].filter(v => v != null);
      const loyRaw = loyRawArr.length > 0 ? Number(loyRawArr[0]) : 0;

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

        // Base icon radius: priority is segment scale override -> branding scale override -> fixed math
        const scale = seg.icon_scale ?? branding.icon_scale ?? 1.0;
        const currentIconRadius = iconRadius * scale;

        // Clipped image (with optional per-segment icon rotation)
        ctx.save();
        ctx.beginPath();
        ctx.arc(iconX, iconY, currentIconRadius, 0, 2 * Math.PI);
        ctx.clip();
        const iRotRad = ((seg.icon_rotation_angle ?? 0) || 0) * Math.PI / 180;
        if (iRotRad !== 0) {
          ctx.translate(iconX, iconY);
          ctx.rotate(iRotRad);
          ctx.drawImage(
            imageCache!.get(seg.icon_url!)!,
            -currentIconRadius,
            -currentIconRadius,
            currentIconRadius * 2,
            currentIconRadius * 2,
          );
        } else {
          ctx.drawImage(
            imageCache!.get(seg.icon_url!)!,
            iconX - currentIconRadius,
            iconY - currentIconRadius,
            currentIconRadius * 2,
            currentIconRadius * 2,
          );
        }
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
          const lRotRad = ((seg.label_rotation_angle ?? 0) || 0) * Math.PI / 180;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          if (lRotRad !== 0) {
            ctx.translate(textX, textY);
            ctx.rotate(lRotRad);
            ctx.fillText(displayLabel, 0, 0);
          } else {
            ctx.fillText(displayLabel, textX, textY);
          }
        } else {
          // ── Radial: text rotates with segment, offset in local coords ──────────
          ctx.translate(cx, cy);
          ctx.rotate(midAngle);
          // Extra per-segment rotation around the label's own centre
          ctx.translate(labelDist + loxRaw, fontSize * 0.35 + loyRaw);
          ctx.rotate(((seg.label_rotation_angle ?? 0) || 0) * Math.PI / 180);
          ctx.textAlign = 'center';
          ctx.textBaseline = 'alphabetic';
          ctx.fillText(displayLabel, 0, 0);
        }
        ctx.restore();
      }
    });

    // ── 3. Inner ring band ────────────────────────────────────────────────────
    if (!hasPremiumFace && branding.inner_ring_enabled && !isTransparent(branding.inner_ring_color)) {
      const bandWidth = Math.max(6, outerRingWidth * 0.3);
      ctx.beginPath();
      ctx.arc(cx, cy, innerRadius, 0, 2 * Math.PI);
      ctx.arc(cx, cy, innerRadius - bandWidth, 0, 2 * Math.PI, true);
      const innerCol = normalizeToRgba(branding.inner_ring_color ?? 'rgba(255,255,255,0.15)');
      console.log("[COLOR CHECK] Inner Ring:", innerCol);
      ctx.fillStyle = innerCol;
      ctx.fill();
    }

    // ── 4. Outer decorative ring with 3D metallic/gloss gradient ──────────────
    if (!hasPremiumFace && !isTransparent(outerRingColor)) {
      // To match Freepik premium designs, the ring gets a rich, dark metallic rim
      // instead of flat colors. We create a dual lighting linear gradient.
      const metallicOuterGrad = ctx.createLinearGradient(cx, cy - outerRadius, cx, cy + outerRadius);
      const [br, bg, bb] = hexToRgb(outerRingColor);

      // Create a metallic specular reflection by layering stops
      const safeOuter = lightenHex(outerRingColor, 0);
      metallicOuterGrad.addColorStop(0, normalizeToRgba(`rgb(${Math.min(br+80, 255)},${Math.min(bg+80, 255)},${Math.min(bb+80, 255)})`));
      metallicOuterGrad.addColorStop(0.15, normalizeToRgba(safeOuter));
      metallicOuterGrad.addColorStop(0.4, normalizeToRgba(`rgb(${Math.max(br-60, 0)},${Math.max(bg-60, 0)},${Math.max(bb-60, 0)})`));
      metallicOuterGrad.addColorStop(0.8, normalizeToRgba(`rgb(${Math.max(br-90, 0)},${Math.max(bg-90, 0)},${Math.max(bb-90, 0)})`));
      metallicOuterGrad.addColorStop(0.95, normalizeToRgba(safeOuter));
      metallicOuterGrad.addColorStop(1, normalizeToRgba(`rgb(${Math.min(br+50, 255)},${Math.min(bg+50, 255)},${Math.min(bb+50, 255)})`));

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
    }

    // ── 5. Rim tick marks ─────────────────────────────────────────────────────
    if (rimTickStyle !== 'none' && segments.length > 1 && !isTransparent(rimTickColor)) {
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
          const tickCol = normalizeToRgba(rimTickColor);
          console.log("[COLOR CHECK] Tick (Triangle):", tickCol);
          ctx.fillStyle = tickCol;
          ctx.shadowColor = 'rgba(0,0,0,0.25)';
          ctx.shadowBlur = 3;
          ctx.fill();
          ctx.restore();
        } else if (rimTickStyle === 'dots') {
          // Premium Casino Bulb Style (3D luminous bulbs)
          ctx.save();
          // Glow around bulb
          const bulbCol = normalizeToRgba(rimTickColor);
          console.log("[COLOR CHECK] Tick (Bulb):", bulbCol);
          ctx.shadowColor = bulbCol; // Glow matches tick color
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
          ctx.fillStyle = bulbCol;
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


    // Ring outer edge — only add 3D gloss highlight when ring is visible and thick enough.
    // A thin or transparent ring should NOT get a bright white outline artifact.
    if (!hasPremiumFace && !isTransparent(outerRingColor) && outerRingWidth >= 8) {
      // Very subtle white top-edge highlight (only for thick metallic rings)
      ctx.beginPath();
      ctx.arc(cx, cy, outerRadius - 1, 0, 2 * Math.PI);
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Outer edge dark boundary clip — only draw if rim is visible or requested
    if (!hasPremiumFace && isRimVisible) {
      ctx.beginPath();
      ctx.arc(cx, cy, outerRadius, 0, 2 * Math.PI);
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // ── 5.5. Premium Frame Layer (ROTATING OUTER RIM — drawn on top of wheel) ──
    // Frame rotates with wheel and appears on top of the wheel geometry
    const hasPremiumFrame = branding.premium_frame_url && imageCache?.has(branding.premium_frame_url);
    if (hasPremiumFrame) {
      const frameImg = imageCache!.get(branding.premium_frame_url!);
      if (frameImg && frameImg.width > 0 && frameImg.height > 0) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rotation);
        // Scale frame to match the wheel size
        const scale = (outerRadius * 2.1) / Math.max(frameImg.width, frameImg.height);
        const w = frameImg.width * scale;
        const h = frameImg.height * scale;
        ctx.drawImage(frameImg, -w / 2, -h / 2, w, h);
        ctx.restore();
      }
    }

    // ── 6. Center hub with gloss ──────────────────────────────────────────────
    if (!isTransparent(primaryColor)) {
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
      const hubCol = normalizeToRgba(primaryColor);
      console.log("[COLOR CHECK] Hub Fill:", hubCol);
      ctx.fillStyle = hubCol;
      ctx.fill();

      // Center image (Standardized branding.centerLogo) or gloss dot
      // Bridging: prioritized branding.centerLogo then branding.center_logo then config.centerLogo then config.center_image_url
      const centerImgUrl = 
        branding.centerLogo || 
        branding.center_logo || 
        config.centerLogo || 
        config.center_image_url;
      if (centerImgUrl && imageCache?.has(centerImgUrl)) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, centerR - 3, 0, 2 * Math.PI);
        ctx.clip();
        const img = imageCache.get(centerImgUrl)!;
        const scale = (branding as any).center_logo_scale ?? 1.0;
        const drawSize = (centerR - 3) * 2 * scale;
        ctx.drawImage(
          img,
          cx - (drawSize / 2),
          cy - (drawSize / 2),
          drawSize,
          drawSize,
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
    }
  } catch (e) {
    console.error('drawWheel error', e);
  }
}

export function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}
