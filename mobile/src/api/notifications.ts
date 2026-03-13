import apiClient from "./client";

export async function registerFcmToken(fcmToken: string): Promise<void> {
  await apiClient.post("/notifications/register-token", { fcm_token: fcmToken });
}
