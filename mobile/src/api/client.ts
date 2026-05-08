import Constants from "expo-constants";
import axios from "axios";
import { Platform } from "react-native";
import { showError } from "../utils/toast";

// Web: in-memory only (XSS hardening — localStorage 저장 시 동일 origin XSS로 토큰 탈취 가능)
// Native: SecureStore (Keychain on iOS, EncryptedSharedPreferences on Android)
// Trade-off: Web에서 페이지 새로고침 시 토큰 손실 → 재로그인 필요. 보안 > 사용성 의도.
let _memoryTokens: Record<string, string> = {};

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    return _memoryTokens[key] ?? null;
  }
  const SecureStore = await import("expo-secure-store");
  return SecureStore.getItemAsync(key);
}

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    _memoryTokens[key] = value;
    return;
  }
  const SecureStore = await import("expo-secure-store");
  await SecureStore.setItemAsync(key, value);
}

async function deleteItem(key: string): Promise<void> {
  if (Platform.OS === "web") {
    delete _memoryTokens[key];
    return;
  }
  const SecureStore = await import("expo-secure-store");
  await SecureStore.deleteItemAsync(key);
}

export const tokenStorage = { getItem, setItem, deleteItem };

const getApiBaseUrl = (): string => {
  // Expo Web (브라우저)은 localhost를 강제 사용한다.
  // app.json의 apiBaseUrl은 Expo Go(폰)가 노트북 백엔드에 LAN IP로 닿기 위한
  // override라, 브라우저에서는 그 IP가 다른 호스트를 가리키거나 CORS·DNS가
  // 깨지면서 fetch가 실패한다. 두 흐름을 모두 살리기 위해 web만 분기.
  if (Platform.OS === "web") {
    return "http://localhost:8000/api/v1";
  }
  const extra = Constants.expoConfig?.extra;
  if (extra?.apiBaseUrl) return extra.apiBaseUrl;
  return "http://localhost:8000/api/v1";
};

export const API_BASE_URL = getApiBaseUrl();

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
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
          }, { timeout: 3000, headers: { "ngrok-skip-browser-warning": "true" } });
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

    // User-friendly error messages for non-401 errors
    // Skip toast for /auth/me (initial session check) and /auth/refresh
    const url = error.config?.url || "";
    const isAuthCheck = url.includes("/auth/me") || url.includes("/auth/refresh");
    if (error.response?.status !== 401 && !isAuthCheck) {
      const status = error.response?.status;
      if (!error.response) {
        showError("네트워크 연결을 확인해 주세요");
      } else if (status === 403) {
        showError("접근 권한이 없습니다");
      } else if (status && status >= 500) {
        showError("서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요");
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Attempt to refresh the access token using the stored refresh token.
 * Returns the new access token on success, or null on failure.
 */
export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await tokenStorage.getItem("refresh_token");
  if (!refreshToken) return null;
  try {
    const resp = await axios.post(`${API_BASE_URL}/auth/refresh`, {
      refresh_token: refreshToken,
    });
    await tokenStorage.setItem("access_token", resp.data.access_token);
    await tokenStorage.setItem("refresh_token", resp.data.refresh_token);
    return resp.data.access_token;
  } catch {
    await tokenStorage.deleteItem("access_token");
    await tokenStorage.deleteItem("refresh_token");
    return null;
  }
}

export default apiClient;
