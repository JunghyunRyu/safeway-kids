/**
 * Shared auth API — login, OTP, token management.
 * app_context is automatically injected from Expo config.
 */

import apiClient, { tokenStorage, getAppContext } from "./client";

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: {
    id: string;
    phone: string;
    name: string;
    role: string;
    app_context: string;
    is_active: boolean;
  };
  /** 기존 사용자가 현재 버전 필수 동의를 미보유한 경우 — 동의 화면 유도 (FR-C3) */
  required_consents?: string[] | null;
}

export interface ConsentItem {
  doc_type: string;
  doc_version: string;
}

export interface UserResponse {
  id: string;
  role: string;
  phone: string;
  name: string;
  email?: string;
  app_context?: string;
}

export async function sendOtp(phone: string): Promise<void> {
  await apiClient.post("/auth/otp/send", { phone });
}

export async function verifyOtp(
  phone: string,
  code: string,
  name: string,
  role: string,
  consents?: ConsentItem[],
): Promise<TokenResponse> {
  const resp = await apiClient.post("/auth/otp/verify", {
    phone,
    code,
    name,
    role,
    app_context: getAppContext(),
    ...(consents && consents.length > 0 ? { consents } : {}),
  });
  const data: TokenResponse = resp.data;
  await tokenStorage.setItem("access_token", data.access_token);
  await tokenStorage.setItem("refresh_token", data.refresh_token);
  await tokenStorage.setItem("user_role", data.user.role);
  return data;
}

export async function devLogin(
  phone: string,
  name: string,
  role: string,
): Promise<TokenResponse> {
  const resp = await apiClient.post("/auth/dev-login", {
    phone,
    code: "000000",
    name,
    role,
    app_context: getAppContext(),
  });
  const data: TokenResponse = resp.data;
  await tokenStorage.setItem("access_token", data.access_token);
  await tokenStorage.setItem("refresh_token", data.refresh_token);
  await tokenStorage.setItem("user_role", data.user.role);
  return data;
}

export async function getMe(): Promise<UserResponse> {
  const resp = await apiClient.get("/auth/me");
  return resp.data;
}

/** 카카오 인가 코드 → 백엔드 로그인/가입 (FR-M4) */
export async function kakaoLogin(
  code: string,
  redirectUri?: string,
  role?: string,
): Promise<TokenResponse> {
  const resp = await apiClient.post("/auth/kakao", {
    code,
    ...(redirectUri ? { redirect_uri: redirectUri } : {}),
    ...(role ? { role, app_context: getAppContext() } : {}),
  });
  const data: TokenResponse = resp.data;
  await tokenStorage.setItem("access_token", data.access_token);
  await tokenStorage.setItem("refresh_token", data.refresh_token);
  await tokenStorage.setItem("user_role", data.user.role);
  return data;
}

/** 동의 추가/철회 (FR-C4) */
export async function updateConsents(payload: {
  grant?: ConsentItem[];
  withdraw?: string[];
}): Promise<{ consents: unknown[]; missing_required: string[] }> {
  const resp = await apiClient.post("/auth/consents", payload);
  return resp.data;
}

/** JWT 사용자 → Firebase 세션 브리지 (FR-F1/F2). 실패는 호출 측에서 best-effort 처리. */
export async function getFirebaseCustomToken(): Promise<{
  custom_token: string;
  firebase_uid: string;
}> {
  const resp = await apiClient.post("/auth/firebase/custom-token");
  return resp.data;
}

export async function linkFirebaseUid(idToken: string): Promise<void> {
  await apiClient.post("/auth/firebase/link", { id_token: idToken });
}

export async function logout(): Promise<void> {
  await tokenStorage.deleteItem("access_token");
  await tokenStorage.deleteItem("refresh_token");
  await tokenStorage.deleteItem("user_role");
}

export async function isLoggedIn(): Promise<boolean> {
  const token = await tokenStorage.getItem("access_token");
  return !!token;
}
