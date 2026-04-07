import { apiClient } from './client';

export interface SessionActivity {
  id: string;
  activity_type: string;
  description: string;
  time: string;
  photo_url?: string;
}

export async function checkin(bookingId: string, data: { latitude: number; longitude: number; accuracy: number }): Promise<{ session_id: string }> {
  return (await apiClient.post(`/cc/sessions/${bookingId}/checkin`, data)).data;
}

export async function addActivity(sessionId: string, data: { activity_type: string; description?: string; photo_url?: string }): Promise<void> {
  await apiClient.post(`/cc/sessions/${sessionId}/activity`, data);
}

export async function checkout(sessionId: string): Promise<{ total_minutes: number }> {
  return (await apiClient.post(`/cc/sessions/${sessionId}/checkout`)).data;
}

export async function confirmHandover(sessionId: string): Promise<void> {
  await apiClient.post(`/cc/sessions/${sessionId}/handover`);
}

export async function getSessionActivities(sessionId: string): Promise<SessionActivity[]> {
  return (await apiClient.get(`/cc/sessions/${sessionId}/activities`)).data;
}

export async function saveSessionMemo(sessionId: string, memo: string): Promise<void> {
  await apiClient.post(`/cc/sessions/${sessionId}/memo`, { memo });
}
