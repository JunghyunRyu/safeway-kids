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
export { InfoRow, SOSButton, DatePickerModal, formatKorean } from './components';

// Hooks (PT/CC shared)
export {
  useFirebaseAuth,
  setFirebaseAuthAdapter,
} from './hooks/useFirebaseAuth';
export type {
  FirebaseAuthUser,
  FirebaseAuthState,
  FirebaseAuthActions,
  FirebaseAuthAdapter,
} from './hooks/useFirebaseAuth';

export { useImageUpload } from './hooks/useImageUpload';
export type {
  ImageUploadEntityType,
  ImageUploadParams,
  ImageUploadResult,
  UseImageUpload,
} from './hooks/useImageUpload';

export { useWebSocket } from './hooks/useWebSocket';
export type {
  WebSocketStatus,
  UseWebSocketOptions,
  UseWebSocketReturn,
} from './hooks/useWebSocket';
