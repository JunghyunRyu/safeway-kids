import axios from 'axios';
import { showToast } from '../components/Toast';

const API_BASE = '/api/v1';

function getToken(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setToken(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage unavailable (incognito/quota exceeded)
  }
}

function clearTokens(): void {
  try {
    localStorage.clear();
  } catch {
    // Storage unavailable
  }
}

const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  const token = getToken('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = getToken('refresh_token');
      if (refreshToken && !error.config._retry) {
        error.config._retry = true;
        try {
          const { data } = await axios.post(`${API_BASE}/auth/refresh`, {
            refresh_token: refreshToken,
          });
          setToken('access_token', data.access_token);
          setToken('refresh_token', data.refresh_token);
          error.config.headers.Authorization = `Bearer ${data.access_token}`;
          return api(error.config);
        } catch {
          clearTokens();
          window.location.href = '/login';
        }
      } else {
        clearTokens();
        window.location.href = '/login';
      }
    }

    // User-friendly error messages for non-401 errors
    if (error.response?.status !== 401) {
      const status = error.response?.status;
      if (!error.response) {
        showToast('네트워크 연결을 확인해 주세요', 'error');
      } else if (status === 403) {
        showToast('접근 권한이 없습니다', 'error');
      } else if (status && status >= 500) {
        showToast('서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요', 'error');
      }
    }

    return Promise.reject(error);
  }
);

export default api;
