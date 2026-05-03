import { apiClient } from './client';

export interface WalkerProfile {
  id: string;
  name: string;
  bio: string | null;
  experience_years: number;
  approval_status: string;
  certification_type: string | null;
  avg_rating: number | null;
  total_walks: number;
  total_reviews: number;
  distance_km?: number;
  has_insurance?: boolean;
  insurance_expiry?: string | null;
  profile_photo_url?: string | null;
}

export interface WalkerSearchResult extends WalkerProfile {
  distance_km: number;
}

export async function searchWalkers(
  latitude: number, longitude: number, date: string, radiusKm = 3,
): Promise<WalkerSearchResult[]> {
  const resp = await apiClient.get('/pt/walkers/search', {
    params: { latitude, longitude, date, radius_km: radiusKm },
  });
  return resp.data;
}

export async function getWalkerProfile(walkerId: string): Promise<WalkerProfile> {
  const resp = await apiClient.get(`/pt/walkers/${walkerId}/profile`);
  return resp.data;
}

export async function submitQualification(data: {
  background_check_date?: string;
  background_check_doc_url?: string;
  certification_type?: string;
  bio?: string;
  experience_years?: number;
  service_areas?: Array<{ lat: number; lon: number; radius_km: number }>;
}): Promise<void> {
  await apiClient.post('/pt/walkers/qualification', data);
}

export async function setAvailability(data: {
  available_date: string;
  start_time: string;
  end_time: string;
}): Promise<void> {
  await apiClient.post('/pt/walkers/availability', data);
}

export async function listAvailability(): Promise<Array<{
  date: string; start: string; end: string; status: string;
}>> {
  const resp = await apiClient.get('/pt/walkers/availability');
  return resp.data;
}
