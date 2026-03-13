import apiClient from "./client";

export interface VehicleAssignment {
  vehicle_id: string;
  license_plate: string;
  capacity: number;
  operator_name: string | null;
  safety_escort_name: string | null;
  assigned_date: string;
}

export interface GpsLocation {
  vehicle_id: string;
  latitude: number;
  longitude: number;
  heading: number | null;
  speed: number | null;
  recorded_at: string;
}

export async function getMyAssignment(targetDate: string): Promise<VehicleAssignment | null> {
  const resp = await apiClient.get(`/telemetry/vehicles/my-assignment?target_date=${targetDate}`);
  return resp.data;
}

export async function getVehicleLocation(vehicleId: string): Promise<GpsLocation | null> {
  const resp = await apiClient.get(`/telemetry/vehicles/${vehicleId}/location`);
  return resp.data;
}

export async function updateGps(
  vehicleId: string,
  latitude: number,
  longitude: number,
  heading?: number,
  speed?: number
): Promise<void> {
  await apiClient.post("/telemetry/gps", {
    vehicle_id: vehicleId,
    latitude,
    longitude,
    heading,
    speed,
  });
}
