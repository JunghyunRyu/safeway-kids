/**
 * PetTracker API client — re-exports core client.
 * The app.json extra.apiBaseUrl and extra.appContext configure it automatically.
 */
export { default as apiClient, tokenStorage, API_BASE_URL, getAppContext } from '@safeway/core-mobile/api/client';
