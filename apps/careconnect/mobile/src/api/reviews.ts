import { apiClient } from './client';

export async function createReview(data: { booking_id: string; rating: number; comment?: string }): Promise<void> {
  await apiClient.post('/cc/reviews', data);
}
