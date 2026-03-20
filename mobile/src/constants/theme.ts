/**
 * Safeway Kids — Design System: Teal Amber Palette
 *
 * Primary: #0F7A7A (Ocean Teal) — 신뢰, 안전, 전문성
 * Accent:  #F4A22D (Saffron Amber) — 따뜻함, 에너지, 스쿨버스
 */

export const Colors = {
  // ── Brand ──────────────────────────────────────────────────
  primary: '#0F7A7A',
  primaryDark: '#095E5E',
  primaryLight: '#E0F2F2',

  accent: '#F4A22D',
  accentDark: '#C47D10',
  accentLight: '#FEF3DC',

  // ── Surface ────────────────────────────────────────────────
  background: '#F5F8F8',
  surface: '#FFFFFF',
  surfaceElevated: '#EBF3F3',
  border: '#C8DBDB',
  borderLight: '#E4EDED',

  // ── Text ───────────────────────────────────────────────────
  textPrimary: '#1C2E2E',
  textSecondary: '#5A7272',
  textDisabled: '#9EB3B3',
  textInverse: '#FFFFFF',
  textAccent: '#0F7A7A',

  // ── Status ─────────────────────────────────────────────────
  success: '#2D9E6B',
  successLight: '#D4F2E7',
  successDark: '#1E6B48',

  warning: '#F4A22D',
  warningLight: '#FEF3DC',
  warningDark: '#C47D10',

  danger: '#D44C3E',
  dangerLight: '#FAE0DD',
  dangerDark: '#A03830',

  info: '#3B82C4',
  infoLight: '#DBEAFE',
  infoDark: '#2460A0',

  neutral: '#9EB3B3',
  neutralLight: '#EEF4F4',

  // ── Role Accents (tab bar active tint) ─────────────────────
  roleParent: '#0F7A7A',    // Ocean Teal
  roleDriver: '#E08020',    // Warm Amber (darker for readability)
  roleEscort: '#7B5EA7',    // Soft Purple
  roleAdmin: '#D44C3E',     // Safety Red
  roleStudent: '#2E9E6B',   // Leaf Green

  // ── Schedule Status ────────────────────────────────────────
  statusScheduled: '#3B82C4',
  statusBoarded: '#F4A22D',
  statusCompleted: '#2D9E6B',
  statusCancelled: '#9EB3B3',

  // ── Billing Status ─────────────────────────────────────────
  billingPending: '#F4A22D',
  billingPaid: '#2D9E6B',
  billingOverdue: '#D44C3E',

  // ── Shift Status ───────────────────────────────────────────
  shiftAssigned: '#3B82C4',
  shiftCheckedIn: '#F4A22D',
  shiftCompleted: '#2D9E6B',
  shiftNoShow: '#D44C3E',
} as const;

export type ColorKey = keyof typeof Colors;

// ── Typography ───────────────────────────────────────────────
export const Typography = {
  sizes: {
    xs: 11,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
    display: 34,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

// ── Spacing ──────────────────────────────────────────────────
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

// ── Border Radius ────────────────────────────────────────────
export const Radius = {
  xs: 4,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  xxl: 28,
  full: 9999,
} as const;

// ── Shadows ──────────────────────────────────────────────────
export const Shadows = {
  sm: {
    shadowColor: '#1C2E2E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#1C2E2E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#1C2E2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;

// ── Schedule/Billing status helpers ──────────────────────────
export const STATUS_COLORS: Record<string, string> = {
  scheduled: Colors.statusScheduled,
  boarded: Colors.statusBoarded,
  completed: Colors.statusCompleted,
  cancelled: Colors.statusCancelled,
  pending: Colors.billingPending,
  paid: Colors.billingPaid,
  overdue: Colors.billingOverdue,
  assigned: Colors.shiftAssigned,
  checked_in: Colors.shiftCheckedIn,
  no_show: Colors.shiftNoShow,
  available: Colors.success,
  matched: Colors.info,
};

export const STATUS_BG_COLORS: Record<string, string> = {
  scheduled: Colors.infoLight,
  boarded: Colors.warningLight,
  completed: Colors.successLight,
  cancelled: Colors.neutralLight,
  pending: Colors.warningLight,
  paid: Colors.successLight,
  overdue: Colors.dangerLight,
  assigned: Colors.infoLight,
  checked_in: Colors.warningLight,
  no_show: Colors.dangerLight,
  available: Colors.successLight,
  matched: Colors.infoLight,
};
