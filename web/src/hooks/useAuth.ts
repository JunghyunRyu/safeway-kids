import { useState, useCallback } from 'react';
import type { User } from '../types';

function readStoredUser(): User | null {
  try {
    const stored = localStorage.getItem('user');
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
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);
      } catch {
        // Storage unavailable (incognito/quota exceeded)
      }
      setUser(userData);
    },
    []
  );

  const logout = useCallback(() => {
    try {
      localStorage.clear();
    } catch {
      // Storage unavailable
    }
    setUser(null);
    window.location.href = '/login';
  }, []);

  return { user, loading: false, login, logout };
}
