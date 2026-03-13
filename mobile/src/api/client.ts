import Constants from "expo-constants";
import axios from "axios";
import * as SecureStore from "expo-secure-store";

const getApiBaseUrl = (): string => {
  // Use expoConfig extra field if available, otherwise default to localhost
  const extra = Constants.expoConfig?.extra;
  if (extra?.apiBaseUrl) return extra.apiBaseUrl;
  return "http://localhost:8000/api/v1";
};

export const API_BASE_URL = getApiBaseUrl();

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// Attach auth token to every request
apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 — token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = await SecureStore.getItemAsync("refresh_token");
      if (refreshToken) {
        try {
          const resp = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });
          await SecureStore.setItemAsync(
            "access_token",
            resp.data.access_token
          );
          await SecureStore.setItemAsync(
            "refresh_token",
            resp.data.refresh_token
          );
          error.config.headers.Authorization = `Bearer ${resp.data.access_token}`;
          return apiClient.request(error.config);
        } catch {
          await SecureStore.deleteItemAsync("access_token");
          await SecureStore.deleteItemAsync("refresh_token");
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
