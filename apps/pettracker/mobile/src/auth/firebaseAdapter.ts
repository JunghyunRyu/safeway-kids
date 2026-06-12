/**
 * Firebase JS SDK 어댑터 주입 (FR-M5) — config-gate.
 *
 * app.json extra.firebaseWebConfig(웹 앱 구성 객체)가 있으면 App 엔트리에서
 * 동기적으로 setFirebaseAuthAdapter()를 등록한다 (EXT-13: Firebase 콘솔
 * 웹 앱 추가). 미설정이면 어댑터 미등록 = 기존 JWT 단독 동작이며,
 * 백엔드 듀얼 인증이 이를 그대로 수용한다.
 *
 * firebase 모듈은 lazy require — jest/미설정 환경에서 import 부작용 0.
 */

import Constants from 'expo-constants';
import {
  setFirebaseAuthAdapter,
  type FirebaseAuthAdapter,
  type FirebaseAuthUser,
} from '@safeway/core-mobile/hooks/useFirebaseAuth';
import {
  getFirebaseCustomToken,
  linkFirebaseUid,
} from '@safeway/core-mobile/api/auth';

let initialized = false;
let adapterRef: FirebaseAuthAdapter | null = null;

export function getFirebaseWebConfig(): Record<string, string> | null {
  const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;
  const config = extra.firebaseWebConfig as Record<string, string> | undefined;
  return config && config.apiKey ? config : null;
}

/** App 엔트리에서 1회 호출. 등록 성공 시 true. */
export function initFirebaseIfConfigured(): boolean {
  if (initialized) return adapterRef !== null;
  initialized = true;

  const config = getFirebaseWebConfig();
  if (!config) return false;

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { initializeApp, getApps } = require('firebase/app');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const fbAuth = require('firebase/auth');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;

  const app = getApps().length > 0 ? getApps()[0] : initializeApp(config);
  const auth = fbAuth.initializeAuth(app, {
    persistence: fbAuth.getReactNativePersistence(AsyncStorage),
  });

  const toUser = (u: any): FirebaseAuthUser | null =>
    u
      ? {
          uid: u.uid,
          email: u.email,
          phoneNumber: u.phoneNumber,
          displayName: u.displayName,
          emailVerified: u.emailVerified,
        }
      : null;

  const adapter: FirebaseAuthAdapter = {
    subscribe: (cb) => fbAuth.onAuthStateChanged(auth, (u: any) => cb(toUser(u))),
    signInWithCustomToken: async (token) => {
      const cred = await fbAuth.signInWithCustomToken(auth, token);
      return toUser(cred.user)!;
    },
    signInWithEmailPassword: async (email, password) => {
      const cred = await fbAuth.signInWithEmailAndPassword(auth, email, password);
      return toUser(cred.user)!;
    },
    signOut: () => fbAuth.signOut(auth),
    getIdToken: async (forceRefresh?: boolean) =>
      auth.currentUser ? auth.currentUser.getIdToken(forceRefresh ?? false) : null,
  };

  setFirebaseAuthAdapter(adapter);
  adapterRef = adapter;
  return true;
}

/**
 * JWT 로그인 직후 Firebase 세션 연결 (FR-F1/F2) — best-effort.
 * 실패해도 로그인 플로우를 막지 않는다 (JWT만으로 전 기능 동작).
 */
export async function bridgeJwtToFirebase(): Promise<void> {
  if (!adapterRef) return;
  try {
    const { custom_token } = await getFirebaseCustomToken();
    await adapterRef.signInWithCustomToken(custom_token);
    const idToken = await adapterRef.getIdToken(true);
    if (idToken) await linkFirebaseUid(idToken);
  } catch (e) {
    console.warn('[firebase-bridge] 연결 실패 — JWT 단독으로 계속:', e);
  }
}
