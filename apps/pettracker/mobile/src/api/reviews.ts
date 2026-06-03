import { apiClient } from './client';

export interface Review {
  id: string;
  booking_id: string;
  reviewer_id: string;
  walker_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface WalkerReview extends Review {
  reviewer_name?: string | null;
}

export async function createReview(data: {
  booking_id: string;
  rating: number;
  comment?: string;
}): Promise<Review> {
  const resp = await apiClient.post('/pt/reviews', data);
  return resp.data;
}

export async function listWalkerReviews(walkerId: string, limit = 5): Promise<WalkerReview[]> {
  const resp = await apiClient.get(`/pt/walkers/${walkerId}/reviews`, { params: { limit } });
  return resp.data;
}
