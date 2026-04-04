/**
 * Theme factory — each app provides a color palette, gets a full theme back.
 */

import { Typography, Spacing, Radius, Shadows } from './tokens';

export interface ColorPalette {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  accent: string;
  accentDark: string;
  accentLight: string;
  background: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  borderLight: string;
  textPrimary: string;
  textSecondary: string;
  textDisabled: string;
  textInverse: string;
  textAccent: string;
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  danger: string;
  dangerLight: string;
  info: string;
  infoLight: string;
  neutral: string;
  neutralLight: string;
}

export interface AppTheme {
  Colors: ColorPalette;
  Typography: typeof Typography;
  Spacing: typeof Spacing;
  Radius: typeof Radius;
  Shadows: typeof Shadows;
  STATUS_COLORS: Record<string, string>;
  STATUS_BG_COLORS: Record<string, string>;
}

export function createTheme(palette: ColorPalette): AppTheme {
  return {
    Colors: palette,
    Typography,
    Spacing,
    Radius,
    Shadows,
    STATUS_COLORS: {
      pending: palette.warning,
      confirmed: palette.info,
      in_progress: palette.accent,
      completed: palette.success,
      cancelled: palette.neutral,
      available: palette.success,
      booked: palette.info,
    },
    STATUS_BG_COLORS: {
      pending: palette.warningLight,
      confirmed: palette.infoLight,
      in_progress: palette.accentLight,
      completed: palette.successLight,
      cancelled: palette.neutralLight,
      available: palette.successLight,
      booked: palette.infoLight,
    },
  };
}
