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

export async function createReview(data: {
  booking_id: string;
  rating: number;
  comment?: string;
}): Promise<Review> {
  const resp = await apiClient.post('/pt/reviews', data);
  return resp.data;
}
