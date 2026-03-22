import apiClient from "./client";

export async function registerFcmToken(fcmToken: string): Promise<void> {
  await apiClient.post("/notifications/register-token", { fcm_token: fcmToken });
}

export interface NotificationPref {
  channel: string;
  notification_type: string;
  enabled: boolean;
}

export async function getNotificationPreferences(): Promise<NotificationPref[]> {
  const resp = await apiClient.get("/notifications/preferences");
  return resp.data.preferences ?? [];
}

export async function updateNotificationPreferences(
  preferences: NotificationPref[],
): Promise<NotificationPref[]> {
  const resp = await apiClient.patch("/notifications/preferences", { preferences });
  return resp.data.preferences ?? [];
}
