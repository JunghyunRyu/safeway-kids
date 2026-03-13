import * as SecureStore from "expo-secure-store";
import apiClient from "./client";

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
  await SecureStore.setItemAsync("access_token", data.access_token);
  await SecureStore.setItemAsync("refresh_token", data.refresh_token);
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
  await SecureStore.setItemAsync("access_token", data.access_token);
  await SecureStore.setItemAsync("refresh_token", data.refresh_token);
  return data;
}

export async function getMe(): Promise<UserResponse> {
  const resp = await apiClient.get("/auth/me");
  return resp.data;
}

export async function logout(): Promise<void> {
  await SecureStore.deleteItemAsync("access_token");
  await SecureStore.deleteItemAsync("refresh_token");
}

export async function isLoggedIn(): Promise<boolean> {
  const token = await SecureStore.getItemAsync("access_token");
  return !!token;
}
