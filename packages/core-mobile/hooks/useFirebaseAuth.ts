/**
 * useFirebaseAuth — shared Firebase Auth hook for PT/CC mobile apps.
 *
 * Tech Spec FR-2.5 (artifacts/specs/2026-04-24-pt-quality-uplift-final-tech-spec.md).
 *
 * **현재 상태:** interface 정의 + in-memory placeholder 구현.
 * 실 SDK 연결(`@react-native-firebase/auth` 또는 `firebase` JS SDK)은
 * Milestone B-9 PT LoginScreen 통합 시점에 PT 앱에서 주입한다 (provider 패턴).
 *
 * 도입 결정 사유 (Risk hold list):
 *   - `@react-native-firebase/auth` Expo SDK 54 호환 미확인
 *   - 호환 미확인 시 `firebase` JS SDK + REST 직접 호출 fallback
 */

import { useCallback, useEffect, useState } from 'react';

export interface FirebaseAuthUser {
  uid: string;
  email: string | null;
  phoneNumber: string | null;
  displayName: string | null;
  emailVerified: boolean;
}

export interface FirebaseAuthState {
  user: FirebaseAuthUser | null;
  idToken: string | null;
  loading: boolean;
  error: string | null;
}

export interface FirebaseAuthActions {
  signInWithCustomToken: (customToken: string) => Promise<FirebaseAuthUser>;
  signInWithEmailPassword: (email: string, password: string) => Promise<FirebaseAuthUser>;
  signOut: () => Promise<void>;
  refreshIdToken: () => Promise<string | null>;
}

export interface FirebaseAuthAdapter {
  /** SDK 측 onAuthStateChanged 구독 등록. unsubscribe 함수 반환. */
  subscribe: (cb: (user: FirebaseAuthUser | null) => void) => () => void;
  signInWithCustomToken: (customToken: string) => Promise<FirebaseAuthUser>;
  signInWithEmailPassword: (email: string, password: string) => Promise<FirebaseAuthUser>;
  signOut: () => Promise<void>;
  getIdToken: (forceRefresh?: boolean) => Promise<string | null>;
}

let adapter: FirebaseAuthAdapter | null = null;

export function setFirebaseAuthAdapter(a: FirebaseAuthAdapter): void {
  adapter = a;
}

const REQUIRE_ADAPTER_MSG =
  'Firebase Auth adapter not registered. Call setFirebaseAuthAdapter() in app entry point.';

export function useFirebaseAuth(): FirebaseAuthState & FirebaseAuthActions {
  const [user, setUser] = useState<FirebaseAuthUser | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!adapter) {
      setLoading(false);
      setError(REQUIRE_ADAPTER_MSG);
      return;
    }
    const unsub = adapter.subscribe(async (u) => {
      setUser(u);
      if (u && adapter) {
        const t = await adapter.getIdToken().catch(() => null);
        setIdToken(t);
      } else {
        setIdToken(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const signInWithCustomToken = useCallback(async (token: string) => {
    if (!adapter) throw new Error(REQUIRE_ADAPTER_MSG);
    const u = await adapter.signInWithCustomToken(token);
    setUser(u);
    const t = await adapter.getIdToken();
    setIdToken(t);
    return u;
  }, []);

  const signInWithEmailPassword = useCallback(async (email: string, password: string) => {
    if (!adapter) throw new Error(REQUIRE_ADAPTER_MSG);
    const u = await adapter.signInWithEmailPassword(email, password);
    setUser(u);
    const t = await adapter.getIdToken();
    setIdToken(t);
    return u;
  }, []);

  const signOut = useCallback(async () => {
    if (!adapter) throw new Error(REQUIRE_ADAPTER_MSG);
    await adapter.signOut();
    setUser(null);
    setIdToken(null);
  }, []);

  const refreshIdToken = useCallback(async () => {
    if (!adapter) return null;
    const t = await adapter.getIdToken(true);
    setIdToken(t);
    return t;
  }, []);

  return {
    user,
    idToken,
    loading,
    error,
    signInWithCustomToken,
    signInWithEmailPassword,
    signOut,
    refreshIdToken,
  };
}
