import { Platform } from 'react-native';

export const COLORS = {
  // Primary Brand Colors
  primary: {
    main: '#2563EB', // Modern blue
    light: '#60A5FA',
    dark: '#1E40AF',
    contrast: '#FFFFFF'
  },
  
  // Secondary Colors
  secondary: {
    main: '#10B981', // Fresh green
    light: '#34D399',
    dark: '#059669',
    contrast: '#FFFFFF'
  },

  // Status Colors
  success: {
    main: '#059669',
    light: '#34D399',
    dark: '#047857',
    contrast: '#FFFFFF'
  },
  warning: {
    main: '#F59E0B',
    light: '#FBBF24',
    dark: '#D97706',
    contrast: '#FFFFFF'
  },
  error: {
    main: '#DC2626',
    light: '#EF4444',
    dark: '#B91C1C',
    contrast: '#FFFFFF'
  },
  info: {
    main: '#3B82F6',
    light: '#60A5FA',
    dark: '#2563EB',
    contrast: '#FFFFFF'
  },

  // Call Colors
  call: {
    voice: '#8B5CF6', // Purple
    video: '#10B981', // Green
    missed: '#DC2626', // Red
    background: '#F3F4F6'
  },

  // Grayscale
  grey: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827'
  },

  // Common Colors
  common: {
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent'
  },

  // Background
  background: {
    default: '#F9FAFB',
    paper: '#FFFFFF',
    dark: '#111827'
  },

  // Text
  text: {
    primary: '#111827',
    secondary: '#4B5563',
    disabled: '#9CA3AF',
    hint: '#6B7280'
  },

  // Action
  action: {
    active: '#6B7280',
    hover: '#F3F4F6',
    selected: '#E5E7EB',
    disabled: '#D1D5DB',
    focus: '#60A5FA'
  },

  // Divider
  divider: '#E5E7EB'
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48
};

export const FONTS = {
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32
  },
  weights: {
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700'
  },
  families: {
    primary: Platform.select({
      ios: 'SF Pro Display',
      android: 'Roboto',
      default: 'System'
    }),
    secondary: Platform.select({
      ios: 'SF Pro Text',
      android: 'Roboto',
      default: 'System'
    })
  }
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 3
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 6
  }
};

export const BORDER_RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 9999
};

export const LAYOUT = {
  maxWidth: 1200,
  defaultPadding: 16
};

export const ANIMATIONS = {
  duration: {
    shortest: 150,
    shorter: 200,
    short: 250,
    standard: 300,
    complex: 375,
    enteringScreen: 225,
    leavingScreen: 195
  },
  easing: {
    easeInOut: 'ease-in-out',
    easeOut: 'ease-out',
    easeIn: 'ease-in',
    sharp: 'cubic-bezier(0.4, 0, 0.6, 1)'
  }
}; 