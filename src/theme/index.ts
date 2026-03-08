/**
 * DilCare Design System - Ported from Web App
 * Colors are converted from HSL CSS variables to hex/rgba
 */

export const Colors = {
  // Primary - Deep Blue (HSL 217 91% 60%)
  primary: '#3B82F6',
  primaryHover: '#2563EB',
  primaryLight: '#EFF6FF',
  primaryForeground: '#FFFFFF',

  // Background & Foreground
  background: '#F8FAFC',
  foreground: '#0F172A',
  card: '#FFFFFF',
  cardForeground: '#0F172A',

  // Secondary - Cool Gray
  secondary: '#F1F5F9',
  secondaryForeground: '#1E293B',
  secondaryHover: '#E2E8F0',

  // Accent - Emerald Green (HSL 160 84% 39%)
  accent: '#10B981',
  accentForeground: '#FFFFFF',
  accentLight: '#ECFDF5',

  // Muted
  muted: '#F1F5F9',
  mutedForeground: '#64748B',

  // Border & Input
  border: '#E2E8F0',
  input: '#E2E8F0',
  ring: '#3B82F6',

  // Status Colors
  destructive: '#EF4444',
  destructiveForeground: '#FFFFFF',
  success: '#16A34A',
  successForeground: '#FFFFFF',
  warning: '#F59E0B',
  warningForeground: '#FFFFFF',

  // Health-specific
  healthGood: '#16A34A',
  healthWarning: '#F59E0B',
  healthDanger: '#EF4444',
  medicineBlue: '#3B82F6',
  calmPurple: '#8B5CF6',

  // Chart Colors
  chart1: '#3B82F6',
  chart2: '#10B981',
  chart3: '#F59E0B',
  chart4: '#8B5CF6',
  chart5: '#F97316',

  // Feature-specific colors (from the web quick actions)
  blue50: '#EFF6FF',
  blue500: '#3B82F6',
  blue600: '#2563EB',
  orange50: '#FFF7ED',
  orange500: '#F97316',
  orange600: '#EA580C',
  purple50: '#FAF5FF',
  purple500: '#8B5CF6',
  purple600: '#7C3AED',
  emerald50: '#ECFDF5',
  emerald500: '#10B981',
  emerald600: '#059669',
  red50: '#FEF2F2',
  red500: '#EF4444',
  red600: '#DC2626',
  pink500: '#EC4899',
  amber500: '#F59E0B',
  teal500: '#14B8A6',

  // Glass morphism
  glassBackground: 'rgba(255, 255, 255, 0.80)',
  glassBorder: 'rgba(255, 255, 255, 0.20)',

  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

export const Gradients = {
  primary: ['#3B82F6', '#2563EB'] as const,
  secondary: ['#F1F5F9', '#E2E8F0'] as const,
  success: ['#16A34A', '#15803D'] as const,
  blue: ['#3B82F6', '#2563EB'] as const,
  orange: ['#F97316', '#EA580C'] as const,
  purple: ['#8B5CF6', '#7C3AED'] as const,
  emerald: ['#10B981', '#059669'] as const,
  red: ['#EF4444', '#DC2626'] as const,
  teal: ['#14B8A6', '#0D9488'] as const,
  backgroundGradient: ['#F8FAFC', '#F1F5F9', '#EFF6FF'] as const,
};

export const Typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semiBold: 'System',
    bold: 'System',
  },
  fontSize: {
    xs: 10,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
    extraBold: '800' as const,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 999,
};

export const Shadows = {
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  premium: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 32,
    elevation: 8,
  },
  premiumLg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.12,
    shadowRadius: 64,
    elevation: 12,
  },
};
