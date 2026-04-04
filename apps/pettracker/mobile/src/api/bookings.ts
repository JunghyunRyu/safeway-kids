import { apiClient } from './client';

export interface Booking {
  id: string;
  owner_id: string;
  walker_id: string | null;
  pet_id: string;
  service_type: string;
  duration_minutes: number;
  scheduled_at: string;
  pickup_address: string | null;
  status: string;
  price: number;
  commission_rate: number;
  created_at: string;
}

export interface BookingCreateData {
  pet_id: string;
  duration_minutes: number;
  scheduled_at: string;
  pickup_latitude: number;
  pickup_longitude: number;
  pickup_address?: string;
  price: number;
}

export async function createBooking(data: BookingCreateData): Promise<Booking> {
  const resp = await apiClient.post('/pt/bookings', data);
  return resp.data;
}

export async function acceptBooking(bookingId: string): Promise<Booking> {
  const resp = await apiClient.post(`/pt/bookings/${bookingId}/accept`);
  return resp.data;
}

export async function declineBooking(bookingId: string): Promise<void> {
  await apiClient.post(`/pt/bookings/${bookingId}/decline`);
}

export async function cancelBooking(bookingId: string, reason?: string): Promise<void> {
  await apiClient.post(`/pt/bookings/${bookingId}/cancel`, null, { params: { reason } });
}

export async function listBookings(status?: string): Promise<Booking[]> {
  const resp = await apiClient.get('/pt/bookings', { params: status ? { status } : {} });
  return resp.data;
}
