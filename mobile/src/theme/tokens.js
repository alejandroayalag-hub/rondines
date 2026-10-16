// ── Design Tokens — Rondines App ──────────────────────────
// Paleta oscura con acento verde neón

export const colors = {
  // Fondos
  bg:          '#0A0E1A',
  bgCard:      '#111827',
  bgElevated:  '#1A2235',

  // Primario (verde neón)
  primary:     '#00FF88',
  primaryGlow: 'rgba(0, 255, 136, 0.10)',

  // Peligro (rojo)
  danger:      '#FF3B5C',
  dangerGlow:  'rgba(255, 59, 92, 0.12)',

  // Advertencia (amarillo)
  warning:     '#FFB800',
  warningGlow: 'rgba(255, 184, 0, 0.12)',

  // Texto
  textPrimary: '#F0F4FF',
  textSecond:  '#8B96B0',
  textMuted:   '#4B5568',

  // Borde
  border:      '#1E2A3D',
  borderLight: '#2D3E57',
};

export const typography = {
  // Tamaños
  xs:   11,
  sm:   13,
  base: 15,
  md:   16,
  lg:   18,
  xl:   22,
  xxl:  28,
  xxxl: 36,

  // Pesos
  regular:   '400',
  medium:    '500',
  semibold:  '600',
  bold:      '700',
  black:     '900',
};

export const spacing = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   24,
  xxl:  40,
};

export const radius = {
  sm:   6,
  md:   10,
  lg:   16,
  xl:   24,
  full: 999,
};

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  glow: (color) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  }),
};
