// "Carta topográfica" palette. Contrast ratios measured against WCAG 2.2 (see docs/REDISENO.md §2.4).
export const colors = {
  ink: '#17251F', // 15.9:1 on white
  ink_muted: '#4F5F58', // 6.75:1
  ink_subtle: '#6B7A73', // 4.51:1, only for >=14px auxiliary text
  ink_inverse: '#FFFFFF',

  canvas: '#F3F5F2',
  surface: '#FFFFFF',
  surface_sunken: '#ECF0EC',
  surface_hover: '#F6F8F6',
  line: '#D9E0DB',
  line_strong: '#74857D', // 3.89:1 control boundaries

  bosque: '#175B47', // brand / primary action (white text 8:1)
  bosque_pressed: '#0F4636',
  bosque_tint: '#E3EFE8',
  pino: '#0F2A22', // web sidebar
  pino_line: '#22423A',
  pino_text: '#E6EFEA',
  pino_muted: '#9DB5AA',

  agua: '#24617F',
  agua_tint: '#E2EEF4',

  danger: '#B3222A',
  danger_pressed: '#8F1A21',
  danger_text: '#9E1A21',
  danger_tint: '#FADEDF',
  warning_text: '#6B4E00',
  warning_tint: '#FBF1D3',

  focus: '#24617F',
  focus_on_dark: '#9FD8BC', // 9.5:1 on pino
  scrim: 'rgba(15, 42, 34, 0.48)',

  // Dark navigation surfaces
  pino_accent: '#9FD8BC', // active indicator, avatar
  pino_contour: '#2B5446', // brand contour lines
  pino_hover: 'rgba(255, 255, 255, 0.07)',
  inverse_hover: 'rgba(255, 255, 255, 0.12)',
  brand_mark_bg: 'rgba(255, 255, 255, 0.06)',

  // Press feedback (Android ripple)
  ripple: 'rgba(23, 37, 31, 0.10)',
  ripple_on_fill: 'rgba(255, 255, 255, 0.24)',

  // Banner borders (tint + one step darker)
  info_line: '#C3D9E5',
  warning_line: '#EBD9A5',
  danger_line: '#F0B9BC',
  success_line: '#BCD6C8',

  // Toast icons on the dark toast surface
  toast_success: '#9FD8BC',
  toast_danger: '#FFB4B8',
  toast_info: '#A9D3EA',

  // Data and map surfaces
  chart_muted: '#A7C4B5',
  map_ground: '#E6EBE6',
  map_overlay: 'rgba(243, 245, 242, 0.92)',
  zone_critical_fill: 'rgba(179, 34, 42, 0.3)',
} as const;

export type Severity = 'baja' | 'media' | 'alta';

// Warm severity ramp, deliberately separate from the brand green so "baja" never reads as "success".
export const severity = {
  baja: { fill: '#D9A514', text: '#6B4E00', tint: '#FBF1D3', label: 'Baja', level: 1 },
  media: { fill: '#D9661A', text: '#8A3D00', tint: '#FCE8D6', label: 'Media', level: 2 },
  alta: { fill: '#B3222A', text: '#9E1A21', tint: '#FADEDF', label: 'Alta', level: 3 },
} as const satisfies Record<Severity, { fill: string; text: string; tint: string; label: string; level: number }>;

// Kept for the map HTML builder (marker fills).
export const severity_color: Record<Severity, string> = {
  baja: severity.baja.fill,
  media: severity.media.fill,
  alta: severity.alta.fill,
};
