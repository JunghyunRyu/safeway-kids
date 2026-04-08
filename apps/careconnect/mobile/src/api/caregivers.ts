import { apiClient } from './client';

export interface CaregiverProfile {
  id: string;
  name: string;
  bio: string | null;
  experience_years: number;
  approval_status: string;
  has_background_check: boolean;
  has_child_abuse_check: boolean;
  has_sex_offense_check: boolean;
  has_cpr_cert: boolean;
  has_insurance: boolean;
  avg_rating: number | null;
  total_sessions: number;
  total_reviews: number;
  distance_km?: number;
}

export interface AvailabilitySlot {
  id: string;
  available_date: string;
  start_time: string;
  end_time: string;
  status: string;
}

export async function searchCaregivers(lat: number, lon: number, date: string, radiusKm = 5): Promise<CaregiverProfile[]> {
  return (await apiClient.get('/cc/caregivers/search', { params: { latitude: lat, longitude: lon, date, radius_km: radiusKm } })).data;
}

export async function getCaregiverProfile(cgId: string): Promise<CaregiverProfile> {
  return (await apiClient.get(`/cc/caregivers/${cgId}/profile`)).data;
}

export async function submitQualification(data: Record<string, unknown>): Promise<void> {
  await apiClient.post('/cc/caregivers/qualification', data);
}

export async function setAvailability(data: { available_date: string; start_time: string; end_time: string }): Promise<void> {
  await apiClient.post('/cc/caregivers/availability', data);
}

export async function listAvailability(): Promise<AvailabilitySlot[]> {
  return (await apiClient.get('/cc/caregivers/availability')).data;
}

export async function deleteAvailability(availId: string): Promise<void> {
  await apiClient.delete(`/cc/caregivers/availability/${availId}`);
}

export async function getQualificationStatus(): Promise<{ approval_status: string }> {
  return (await apiClient.get('/cc/caregivers/qualification/status')).data;
}
