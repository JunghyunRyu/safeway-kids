/**
 * PetTracker Theme — Warm Orange / Green palette
 * 감성: 따뜻함, 활력, 반려동물 케어
 */

import { createTheme, type ColorPalette } from '@safeway/core-mobile';

const palette: ColorPalette = {
  primary: '#F4A22D',       // Saffron Orange
  primaryDark: '#C47D10',
  primaryLight: '#FEF3DC',
  accent: '#2D9E6B',        // Leaf Green
  accentDark: '#1E6B48',
  accentLight: '#D4F2E7',
  background: '#FFF8F0',
  surface: '#FFFFFF',
  surfaceElevated: '#FFF0E0',
  border: '#E8D5B8',
  borderLight: '#F5EDE0',
  textPrimary: '#2E1E0A',
  textSecondary: '#7A6A52',
  textDisabled: '#B8A890',
  textInverse: '#FFFFFF',
  textAccent: '#C47D10',
  success: '#2D9E6B',
  successLight: '#D4F2E7',
  warning: '#F4A22D',
  warningLight: '#FEF3DC',
  danger: '#D44C3E',
  dangerLight: '#FAE0DD',
  info: '#3B82C4',
  infoLight: '#DBEAFE',
  neutral: '#B8A890',
  neutralLight: '#F5EDE0',
};

const theme = createTheme(palette);

export const { Colors, Typography, Spacing, Radius, Shadows, STATUS_COLORS, STATUS_BG_COLORS } = theme;
export default theme;
