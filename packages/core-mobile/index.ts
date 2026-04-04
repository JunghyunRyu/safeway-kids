/**
 * @safeway/core-mobile — Shared mobile code for SafeWay Platform apps.
 *
 * Provides: theme factory, API client, auth, shared components.
 * Each app imports what it needs and provides its own palette/config.
 */

// Theme
export { createTheme, Typography, Spacing, Radius, Shadows } from './theme';
export type { ColorPalette, AppTheme } from './theme';

// API
export { apiClient, tokenStorage, API_BASE_URL, getAppContext, refreshAccessToken } from './api';
export * from './api/auth';

// Components
export { InfoRow, SOSButton } from './components';
