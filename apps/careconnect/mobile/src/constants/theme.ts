/**
 * CareConnect Theme — Teal / Navy palette
 * 감성: 신뢰, 안전, 전문적 돌봄
 */

import { createTheme, type ColorPalette } from '@safeway/core-mobile';

const palette: ColorPalette = {
  primary: '#0F7A7A',       // Ocean Teal
  primaryDark: '#095E5E',
  primaryLight: '#E0F2F2',
  accent: '#2C5282',        // Navy Blue
  accentDark: '#1A365D',
  accentLight: '#D6E4F0',
  background: '#F0F7F7',
  surface: '#FFFFFF',
  surfaceElevated: '#E0EFEF',
  border: '#B8D4D4',
  borderLight: '#D8ECEC',
  textPrimary: '#1C2E2E',
  textSecondary: '#5A7272',
  textDisabled: '#9EB3B3',
  textInverse: '#FFFFFF',
  textAccent: '#095E5E',
  success: '#2D9E6B',
  successLight: '#D4F2E7',
  warning: '#F4A22D',
  warningLight: '#FEF3DC',
  danger: '#D44C3E',
  dangerLight: '#FAE0DD',
  info: '#3B82C4',
  infoLight: '#DBEAFE',
  neutral: '#9EB3B3',
  neutralLight: '#EEF4F4',
};

const theme = createTheme(palette);

export const { Colors, Typography, Spacing, Radius, Shadows, STATUS_COLORS, STATUS_BG_COLORS } = theme;
export default theme;
