// ============================================================================
// Database Entity Types — mirrors WheelOfFortune_Schema_v1.1_fixed.sql
// ============================================================================

export type ClientPlan = 'free' | 'starter' | 'growth' | 'pro' | 'enterprise';
export type GameType = 'wheel' | 'scratch_card' | 'slot_machine' | 'roulette';
export type UserRole = 'owner' | 'admin' | 'editor' | 'viewer';
export type WheelStatus = 'draft' | 'active' | 'paused' | 'archived';
export type PrizeType = 'coupon' | 'points' | 'gift_card' | 'message' | 'url_redirect' | 'try_again';
export type CouponMode = 'static' | 'unique_pool' | 'auto_generate';
export type CouponStatus = 'available' | 'issued' | 'redeemed' | 'expired' | 'cancelled';
export type SessionStatus = 'loaded' | 'form_submitted' | 'spun' | 'expired';
export type IntegrationType = 'mailchimp' | 'klaviyo' | 'hubspot' | 'salesforce' | 'zapier' | 'webhook' | 'google_sheets';

export interface Client {
  id: string;
  name: string;
  slug: string;
  email: string;
  plan: ClientPlan;
  plan_spin_limit: number;
  spins_used_this_month: number;
  billing_cycle_day: number;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  custom_domain?: string | null;
  timezone: string;
  is_active: boolean;
  created_at: string;
  deleted_at?: string | null;
}

export interface User {
  id: string;
  client_id: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: UserRole;
  email_verified: boolean;
  last_login_at?: string | null;
  created_at: string;
  deleted_at?: string | null;
}

export interface WheelConfig {
  spin_duration_ms?: number;
  animation_speed?: 'slow' | 'medium' | 'fast' | 'custom';
  pointer_position?: 'top' | 'right' | 'bottom' | 'left';
  confetti_enabled?: boolean;
  sound_enabled?: boolean;
  sound_url?: string | null;
  show_segment_labels?: boolean;
  center_image_url?: string | null;
  label_rotation?: 'radial' | 'horizontal';                         // default 'radial'
  guaranteed_win_every_n?: number | null;
  guaranteed_win_segment_id?: string | null;
  game_type?: GameType;

  // ── Scratch Card options ──────────────────────────────────────────────────
  scratch_layer_color?: string;                                    // default '#B0B0B0'
  scratch_layer_style?: 'solid' | 'metallic' | 'foil' | 'striped'; // default 'solid'
  scratch_reveal_threshold?: number;                               // 0.1–0.9, default 0.6
  scratch_card_layout?: 'single' | 'grid_2x2' | 'row_3x1';        // default 'single'
  scratch_card_size?: 'small' | 'medium' | 'large';                // default 'medium'
  scratch_border_color?: string;
  scratch_border_radius?: number;                                  // px, default 16
  scratch_brush_multiplier?: number;                               // 0.5–3.0, default 1.0 (controls brush size / scratch sensitivity)

  // ── Roulette options ─────────────────────────────────────────────────────
  roulette_spin_duration_ms?: number;                               // default 5000
  roulette_pocket_style?: 'classic' | 'modern' | 'neon';           // default 'classic'

  // ── Slot Machine options ──────────────────────────────────────────────────
  slot_reel_count?: 2 | 3 | 5;                                     // default 3
  slot_visible_rows?: 1 | 3 | 5;                                   // default 3
  slot_symbol_mode?: 'icon' | 'label' | 'both';                    // default 'both'
  slot_spin_duration_ms?: number;                                  // default 3000
  slot_stop_delay_ms?: number;                                     // ms between reel stops, default 600
  slot_cabinet_style?: 'classic' | 'modern' | 'neon';              // default 'modern'
  slot_win_line_color?: string;                                    // default = primary_color

  // ── Kiosk / in-store mode ─────────────────────────────────────────────────
  kiosk_mode?: boolean;                                            // auto-reset after result
  kiosk_reset_delay_ms?: number;                                   // default 8000

  // ── Shopify integration ───────────────────────────────────────────────────
  shopify_store_url?: string | null;                               // e.g. https://mystore.myshopify.com
}

export interface SlotConfig {
  slot_reel_count?: 2 | 3 | 5;
  slot_visible_rows?: 1 | 3 | 5;
  slot_symbol_mode?: 'icon' | 'label' | 'both';
  slot_spin_duration_ms?: number;
  slot_stop_delay_ms?: number;
  slot_cabinet_style?: 'classic' | 'modern' | 'neon';
  slot_win_line_color?: string;
  sound_enabled?: boolean;
  sound_url?: string | null;
}

export interface WheelBranding {
  logo_url?: string | null;
  logo_position?: 'above' | 'center';
  primary_color?: string;
  pointer_color?: string;
  secondary_color?: string;
  background_type?: 'solid' | 'gradient' | 'image';
  background_value?: string;
  font_family?: string;
  custom_font_url?: string | null;
  button_text?: string;
  button_color?: string;
  border_color?: string;
  border_width?: number;
  // Ring customization
  outer_ring_color?: string;
  outer_ring_width?: number;
  rim_tick_style?: 'none' | 'dots' | 'triangles';
  rim_tick_color?: string;
  inner_ring_enabled?: boolean;
  inner_ring_color?: string;
  // Segment label customization
  label_font_size?: number | null;                                   // null = auto (based on segment count)
  label_font_weight?: '400' | '600' | '700' | '800';                // default '700'
  label_position?: 'inner' | 'center' | 'outer';                    // default 'outer'
  label_text_transform?: 'none' | 'uppercase' | 'capitalize';       // default 'none'
  label_letter_spacing?: number;                                     // px, default 0
  // Icon placement (when segment has icon_url)
  icon_position?: 'outer' | 'inner' | 'overlay';                    // default 'outer' (icon near rim, label near hub); 'overlay' = label on top of icon

  // Premium Image Layer URLs
  premium_face_url?: string | null;
  premium_stand_url?: string | null;
  premium_frame_url?: string | null;
  premium_pointer_url?: string | null;
  premium_content_scale?: number;     // e.g. 0.65 to pull text closer to center if image wheel is smaller than canvas
  premium_center_offset_y?: number;   // e.g. 10 to shift rotation center down if image is not vertically centered
  segment_image_offset_x?: number;    // px offset for segment custom images (radial axis)
  segment_image_offset_y?: number;    // px offset for segment custom images (perpendicular axis)
  // Relative placement (0-1 based on wheel radius)
  label_font_scale?: number;          // font size relative to wheel radius (e.g. 0.08)
  label_radial_offset?: number;       // relative radial offset (0-1)
  label_perp_offset?: number;         // relative perpendicular offset (-1 to 1)
  icon_radial_offset?: number;        // relative radial offset (0-1)
  icon_perp_offset?: number;          // relative perpendicular offset (-1 to 1)
  [key: string]: any;
}

export interface WheelFormConfig {
  enabled?: boolean;
  fields?: Array<{
    key: string;
    label: string;
    type: 'email' | 'text' | 'tel' | 'checkbox';
    required?: boolean;
  }>;
  gdpr_enabled?: boolean;
  gdpr_text?: string;
  privacy_policy_url?: string | null;
  terms_url?: string | null;
}

export interface WheelTriggerRules {
  time_on_page?: number | null;      // seconds before showing (popup)
  scroll_depth?: number | null;      // 0–100 percent scroll before showing
  exit_intent?: boolean | null;      // show on mouse-leave
  geo_fence?: {
    mode: 'allow' | 'block';        // 'allow' = only show to these countries, 'block' = hide from them
    countries: string[];             // ISO 3166-1 alpha-2 codes, e.g. ['IN','US','GB']
  } | null;
}

export interface Wheel {
  id: string;
  client_id: string;
  name: string;
  status: WheelStatus;
  config: WheelConfig;
  branding: WheelBranding;
  trigger_rules: WheelTriggerRules;
  frequency_rules: Record<string, unknown>;
  active_from?: string | null;
  active_until?: string | null;
  total_spin_cap?: number | null;
  total_spins: number;
  embed_token: string;
  form_config: WheelFormConfig;
  created_at: string;
  deleted_at?: string | null;
}

export interface Segment {
  id: string;
  wheel_id: string;
  position: number;
  label: string;
  bg_color: string;
  text_color: string;
  icon_url?: string | null;
  weight: number;
  prize_id?: string | null;
  is_no_prize: boolean;
  consolation_message?: string | null;
  win_cap_daily?: number | null;
  win_cap_total?: number | null;
  wins_today: number;
  wins_total: number;
  // Per-segment position overrides (local coordinate system: X = radial outward, Y = perpendicular clockwise)
  label_offset_x?: number | null;       // px offset along radial axis
  label_offset_y?: number | null;       // px offset perpendicular to radial axis
  icon_offset_x?: number | null;        // px offset along radial axis
  icon_offset_y?: number | null;        // px offset perpendicular to radial axis
  // Per-segment rotation overrides (degrees, applied on top of the radial rotation)
  label_rotation_angle?: number | null; // degrees: 180 = flip, 90 = sideways
  icon_rotation_angle?: number | null;  // degrees: rotates image inside its circle
  // Relative placement overrides (priority over absolute px offsets)
  label_radial_offset?: number | null;
  label_perp_offset?: number | null;
  icon_radial_offset?: number | null;
  icon_perp_offset?: number | null;
  label_font_scale?: number | null;
  [key: string]: any;
}

export interface Prize {
  id: string;
  client_id: string;
  name: string;
  type: PrizeType;
  display_title: string;
  display_description?: string | null;
  coupon_mode?: CouponMode | null;
  static_coupon_code?: string | null;
  auto_gen_prefix?: string | null;
  auto_gen_length?: number | null;
  coupon_expiry_days?: number | null;
  points_value?: number | null;
  redirect_url?: string | null;
  custom_message_html?: string | null;
  created_at: string;
}

export interface SpinSession {
  id: string;
  wheel_id: string;
  fingerprint: string;
  ip_address: string;
  user_agent?: string | null;
  page_url?: string | null;
  referrer_url?: string | null;
  lead_email?: string | null;
  lead_name?: string | null;
  lead_phone?: string | null;
  lead_custom_fields: Record<string, unknown>;
  gdpr_consent: boolean;
  gdpr_consent_at?: string | null;
  status: SessionStatus;
  expires_at: string;
  created_at: string;
}

export interface SpinResult {
  id: string;
  session_id: string;
  wheel_id: string;
  segment_id: string;
  prize_id?: string | null;
  coupon_code_id?: string | null;
  idempotency_key: string;
  server_seed: string;
  client_seed?: string | null;
  created_at: string;
}

export type AuditAction =
  | 'wheel_created' | 'wheel_updated' | 'wheel_status_changed' | 'wheel_deleted'
  | 'segment_updated'
  | 'prize_created' | 'prize_updated' | 'prize_deleted'
  | 'coupon_uploaded' | 'coupon_redeemed'
  | 'integration_created' | 'integration_updated' | 'integration_deleted'
  | 'user_invited' | 'user_role_changed' | 'user_removed'
  | 'account_settings_updated' | 'plan_changed'
  | 'data_export_requested' | 'user_data_deleted'
  | 'ab_test_created' | 'ab_test_updated' | 'ab_test_deleted';

export interface AuditLog {
  id: string;
  client_id: string;
  user_id?: string | null;
  action: AuditAction;
  resource_type?: string | null;
  resource_id?: string | null;
  changes: Record<string, unknown>;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
}

// ============================================================================
// API Request/Response types
// ============================================================================

export interface AuthUser {
  id: string;
  client_id: string;
  email: string;
  full_name: string;
  role: UserRole;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
