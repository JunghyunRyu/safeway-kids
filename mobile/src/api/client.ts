import Constants from "expo-constants";
import axios from "axios";
import { Platform } from "react-native";

// Web-safe token storage (SecureStore is native-only)
let _memoryTokens: Record<string, string> = {};

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    return _memoryTokens[key] ?? localStorage.getItem(key);
  }
  const SecureStore = await import("expo-secure-store");
  return SecureStore.getItemAsync(key);
}

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    _memoryTokens[key] = value;
    localStorage.setItem(key, value);
    return;
  }
  const SecureStore = await import("expo-secure-store");
  await SecureStore.setItemAsync(key, value);
}

async function deleteItem(key: string): Promise<void> {
  if (Platform.OS === "web") {
    delete _memoryTokens[key];
    localStorage.removeItem(key);
    return;
  }
  const SecureStore = await import("expo-secure-store");
  await SecureStore.deleteItemAsync(key);
}

export const tokenStorage = { getItem, setItem, deleteItem };

const getApiBaseUrl = (): string => {
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
  const token = await tokenStorage.getItem("access_token");
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
      const refreshToken = await tokenStorage.getItem("refresh_token");
      if (refreshToken) {
        try {
          const resp = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });
          await tokenStorage.setItem("access_token", resp.data.access_token);
          await tokenStorage.setItem("refresh_token", resp.data.refresh_token);
          error.config.headers.Authorization = `Bearer ${resp.data.access_token}`;
          return apiClient.request(error.config);
        } catch {
          await tokenStorage.deleteItem("access_token");
          await tokenStorage.deleteItem("refresh_token");
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
