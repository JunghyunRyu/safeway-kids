import { apiClient } from './client';

export interface WalkReport {
  session_id: string;
  booking_id: string;
  started_at: string | null;
  ended_at: string | null;
  distance_meters: number | null;
  walker_memo: string | null;
  route_polyline: number[][] | null;
}

export async function startWalk(bookingId: string): Promise<{ session_id: string; started_at: string }> {
  const resp = await apiClient.post(`/pt/walks/${bookingId}/start`);
  return resp.data;
}

export async function recordGps(sessionId: string, data: {
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  accuracy?: number;
  recorded_at: string;
}): Promise<void> {
  await apiClient.post(`/pt/walks/${sessionId}/gps`, data);
}

export async function endWalk(sessionId: string): Promise<{
  session_id: string; distance_meters: number; ended_at: string;
}> {
  const resp = await apiClient.post(`/pt/walks/${sessionId}/end`);
  return resp.data;
}

export async function getWalkReport(sessionId: string): Promise<WalkReport> {
  const resp = await apiClient.get(`/pt/walks/${sessionId}/report`);
  return resp.data;
}
