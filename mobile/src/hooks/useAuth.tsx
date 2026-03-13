import React, { createContext, useContext, useEffect, useState } from "react";
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
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const bootstrap = async () => {
    try {
      const loggedIn = await isLoggedIn();
      if (loggedIn) {
        const me = await getMe();
        setUser(me);
        setAuthenticated(true);
      }
    } catch {
      setAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    bootstrap();
  }, []);

  const onLoginSuccess = async () => {
    const me = await getMe();
    setUser(me);
    setAuthenticated(true);
  };

  const signOut = async () => {
    await logout();
    setUser(null);
    setAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{ user, authenticated, loading, onLoginSuccess, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
