/**
 * Kakao 소셜 로그인 (FR-M4) — expo-auth-session 코드 플로우.
 *
 * config-gate: app.json extra.kakaoRestApiKey + extra.kakaoRedirectUri가
 * 없으면 버튼 자체가 노출되지 않는다 (EXT-12: Kakao 콘솔 redirect URI 등록).
 * 토큰 교환은 백엔드(/auth/kakao)가 client_secret으로 수행하는 서버측
 * 모델 — PKCE 미사용 (Consensus #14).
 */

import Constants from 'expo-constants';
import { kakaoLogin, type TokenResponse } from '@safeway/core-mobile/api/auth';

const KAKAO_AUTHORIZE_URL = 'https://kauth.kakao.com/oauth/authorize';

interface KakaoConfig {
  restApiKey: string;
  redirectUri: string;
}

export function getKakaoConfig(): KakaoConfig | null {
  const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;
  const restApiKey = extra.kakaoRestApiKey as string | undefined;
  const redirectUri = extra.kakaoRedirectUri as string | undefined;
  if (!restApiKey || !redirectUri) return null;
  return { restApiKey, redirectUri };
}

export function isKakaoLoginAvailable(): boolean {
  return getKakaoConfig() !== null;
}

/**
 * 카카오 인가 → 백엔드 로그인. 사용자가 취소하면 null 반환.
 * expo-auth-session은 lazy require — config 미설정 환경(jest 포함)에서
 * 모듈 부작용이 없도록 한다.
 */
export async function signInWithKakao(role: 'pet_owner' | 'walker'): Promise<TokenResponse | null> {
  const config = getKakaoConfig();
  if (!config) throw new Error('Kakao 로그인 설정이 없습니다 (extra.kakaoRestApiKey)');

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const AuthSession = require('expo-auth-session');

  const request = new AuthSession.AuthRequest({
    clientId: config.restApiKey,
    redirectUri: config.redirectUri,
    responseType: AuthSession.ResponseType.Code,
    usePKCE: false,
    scopes: [],
  });

  const result = await request.promptAsync({
    authorizationEndpoint: KAKAO_AUTHORIZE_URL,
  });

  if (result.type !== 'success' || !result.params.code) {
    return null; // 사용자 취소/중단
  }
  return kakaoLogin(result.params.code, config.redirectUri, role);
}
