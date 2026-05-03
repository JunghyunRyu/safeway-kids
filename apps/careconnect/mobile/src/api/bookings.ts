import { apiClient } from './client';

export interface CcBooking {
  id: string;
  parent_id: string;
  caregiver_id: string | null;
  caregiver_name?: string;
  child_id: string;
  child_name?: string;
  care_type: string;
  scheduled_at: string;
  duration_hours: number;
  hourly_rate: number;
  care_address: string | null;
  status: string;
  commission_rate: number;
  created_at: string;
}

export async function createBooking(data: {
  child_id: string; duration_hours: number; scheduled_at: string;
  hourly_rate: number; care_latitude: number; care_longitude: number; care_address?: string;
}): Promise<CcBooking> {
  return (await apiClient.post('/cc/bookings', data)).data;
}

export async function acceptBooking(id: string): Promise<CcBooking> {
  return (await apiClient.post(`/cc/bookings/${id}/accept`)).data;
}

export async function cancelBooking(id: string, reason?: string): Promise<void> {
  await apiClient.post(`/cc/bookings/${id}/cancel`, null, { params: reason ? { reason } : {} });
}

export async function listBookings(status?: string): Promise<CcBooking[]> {
  return (await apiClient.get('/cc/bookings', { params: status ? { status } : {} })).data;
}

export async function declineBooking(id: string, reason?: string): Promise<void> {
  await apiClient.post(`/cc/bookings/${id}/cancel`, null, { params: reason ? { reason } : { reason: '돌봄자 거절' } });
}
