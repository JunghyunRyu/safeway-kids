import apiClient, { tokenStorage } from "./client";

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface UserResponse {
  id: string;
  role: string;
  phone: string;
  name: string;
  email?: string;
}

export async function sendOtp(phone: string): Promise<void> {
  await apiClient.post("/auth/otp/send", { phone });
}

export async function verifyOtp(
  phone: string,
  code: string,
  name: string,
  role: string = "parent"
): Promise<TokenResponse> {
  const resp = await apiClient.post("/auth/otp/verify", {
    phone,
    code,
    name,
    role,
  });
  const data: TokenResponse = resp.data;
  await tokenStorage.setItem("access_token", data.access_token);
  await tokenStorage.setItem("refresh_token", data.refresh_token);
  return data;
}

export async function devLogin(
  phone: string,
  name: string,
  role: string = "parent"
): Promise<TokenResponse> {
  const resp = await apiClient.post("/auth/dev-login", {
    phone,
    code: "000000",
    name,
    role,
  });
  const data: TokenResponse = resp.data;
  await tokenStorage.setItem("access_token", data.access_token);
  await tokenStorage.setItem("refresh_token", data.refresh_token);
  return data;
}

export async function getMe(): Promise<UserResponse> {
  const resp = await apiClient.get("/auth/me");
  return resp.data;
}

export async function logout(): Promise<void> {
  await tokenStorage.deleteItem("access_token");
  await tokenStorage.deleteItem("refresh_token");
}

export async function isLoggedIn(): Promise<boolean> {
  const token = await tokenStorage.getItem("access_token");
  return !!token;
}
