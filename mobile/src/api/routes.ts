import client from './client';

export interface RouteStop {
  stop_id: string;
  student_name: string | null;
  latitude: number;
  longitude: number;
  order: number;
}

export interface RoutePlan {
  vehicle_id: string;
  plan_date: string;
  version: number;
  stops: RouteStop[];
  total_distance_km: number | null;
  total_duration_min: number | null;
  generated_by: string | null;
}

export async function getMyRoute(date: string): Promise<RoutePlan | null> {
  const response = await client.get<RoutePlan | null>(
    `/routes/my-route?plan_date=${date}`
  );
  return response.data;
}
