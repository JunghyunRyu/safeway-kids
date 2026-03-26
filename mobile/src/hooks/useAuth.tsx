import React, { createContext, use, useCallback, useEffect, useState } from "react";
import { getMe, isLoggedIn, logout, UserResponse } from "../api/auth";

interface AuthContextValue {
  user: UserResponse | null;
  authenticated: boolean;
  loading: boolean;
  onLoginSuccess: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  authenticated: false,
  loading: true,
  onLoginSuccess: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // `authenticated` is derived from `user` — no separate state needed
  const authenticated = user !== null;

  useEffect(() => {
    (async () => {
      try {
        const loggedIn = await isLoggedIn();
        if (loggedIn) {
          const me = await getMe();
          setUser(me);
        }
      } catch {
        // 토큰 만료 등으로 실패 시 토큰 삭제하고 로그인 화면으로
        await logout();
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onLoginSuccess = useCallback(async () => {
    const me = await getMe();
    setUser(me);
  }, []);

  const signOut = useCallback(async () => {
    await logout();
    setUser(null);
  }, []);

  return (
    <AuthContext value={{ user, authenticated, loading, onLoginSuccess, signOut }}>
      {children}
    </AuthContext>
  );
}

export function useAuth() {
  return use(AuthContext);
}
