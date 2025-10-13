import { Platform } from 'react-native';

// Clinical, sophisticated color palette for Fuell
export const Colors = {
  // Primary - Deep professional blue/slate
  primary: '#1a2332',
  primaryLight: '#2a3544',
  primaryDark: '#0f1419',
  
  // Accent - Muted scientific teal
  accent: '#4a9fa8',
  accentLight: '#6bb5bd',
  accentDark: '#357980',
  
  // Backgrounds
  background: '#f8f9fa',
  backgroundElevated: '#ffffff',
  backgroundSubtle: '#e9ecef',
  
  // Text - SIMPLIFIED: Use only textPrimary and textSecondary
  textPrimary: '#1a2332',    // Main text color - same as primary
  textSecondary: '#6c757d',  // Secondary/muted text
  textTertiary: '#adb5bd',   // Keep for very subtle elements
  textInverse: '#ffffff',
  
  // Borders & Dividers
  border: '#dee2e6',
  borderLight: '#e9ecef',
  borderDark: '#ced4da',
  
  // Status colors (muted, clinical)
  success: '#2d8659',
  successLight: '#d4edda',
  warning: '#856404',
  warningLight: '#fff3cd',
  error: '#842029',
  errorLight: '#f8d7da',
  info: '#0c5460',
  infoLight: '#d1ecf1',
  
  // Data visualization (sophisticated, scientific palette)
  dataCalories: '#4a9fa8',
  dataProtein: '#e07856',
  dataCarbs: '#8b7fb8',
  dataFat: '#f4c542',
  
  // Macro-specific (subtle, professional)
  macroCalories: '#2a3544',
  macroProtein: '#d65c3b',
  macroCarbs: '#6a5a9f',
  macroFat: '#e5a826',
  
  // Overlay
  overlay: 'rgba(26, 35, 50, 0.75)',
  overlayLight: 'rgba(26, 35, 50, 0.5)',
  
  // Shadows (subtle)
  shadowLight: 'rgba(0, 0, 0, 0.05)',
  shadowMedium: 'rgba(0, 0, 0, 0.08)',
  shadowStrong: 'rgba(0, 0, 0, 0.12)',
};

// Typography scale - Professional, readable
export const Typography = {
  // Font families (system fonts for now, can add custom later)
  fontRegular: Platform.OS === 'ios' ? 'System' : 'Roboto',
  fontMedium: Platform.OS === 'ios' ? 'System' : 'Roboto-Medium',
  fontBold: Platform.OS === 'ios' ? 'System' : 'Roboto-Bold',
  
  // Font sizes
  xs: 11,
  sm: 13,
  base: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  
  // Line heights
  lineHeightTight: 1.2,
  lineHeightNormal: 1.5,
  lineHeightRelaxed: 1.75,
  
  // Letter spacing (subtle, professional)
  letterSpacingTight: -0.3,
  letterSpacingNormal: 0,
  letterSpacingWide: 0.5,
};

// Spacing scale - Consistent, precise
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

// Border radius - Minimal, clean
export const BorderRadius = {
  none: 0,
  sm: 4,
  base: 8,
  md: 10,
  lg: 12,
  xl: 16,
  full: 9999,
};

// Shadows - Subtle elevation
export const Shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: Colors.shadowLight,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
  },
  base: {
    shadowColor: Colors.shadowMedium,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: Colors.shadowMedium,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: Colors.shadowStrong,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
};

export default {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
};

