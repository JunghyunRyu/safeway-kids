import { useState, useCallback } from 'react';
import type { User } from '../types';

// XSS hardening — sessionStorage 사용 (R-11-Web 대응). 탭 단위 isolation으로 attack surface 감소.
// trade-off: 탭 닫으면 재로그인. V1.x에서 httpOnly cookie 전환 예정.
function readStoredUser(): User | null {
  try {
    const stored = sessionStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(readStoredUser);

  const login = useCallback(
    (userData: User, accessToken: string, refreshToken: string) => {
      try {
        sessionStorage.setItem('user', JSON.stringify(userData));
        sessionStorage.setItem('access_token', accessToken);
        sessionStorage.setItem('refresh_token', refreshToken);
      } catch {
        // Storage unavailable (incognito/quota exceeded)
      }
      setUser(userData);
    },
    []
  );

  const logout = useCallback(() => {
    try {
      sessionStorage.clear();
    } catch {
      // Storage unavailable
    }
    setUser(null);
    window.location.href = '/login';
  }, []);

  return { user, loading: false, login, logout };
}
