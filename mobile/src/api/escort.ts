import apiClient from "./client";

export interface EscortAvailability {
  id: string;
  escort_id: string;
  available_date: string;
  start_time: string;
  end_time: string;
  status: string;
}

export interface EscortShift {
  id: string;
  escort_id: string;
  vehicle_assignment_id: string;
  shift_date: string;
  check_in_at: string | null;
  check_out_at: string | null;
  compensation_amount: number;
  status: string;
}

export async function registerAvailability(
  available_date: string,
  start_time: string,
  end_time: string
): Promise<EscortAvailability> {
  const { data } = await apiClient.post<EscortAvailability>(
    "/escorts/availability",
    { available_date, start_time, end_time }
  );
  return data;
}

export async function getMyAvailability(): Promise<EscortAvailability[]> {
  const { data } = await apiClient.get<EscortAvailability[]>(
    "/escorts/availability/my"
  );
  return data;
}

export async function getMyShifts(): Promise<EscortShift[]> {
  const { data } = await apiClient.get<EscortShift[]>("/escorts/shifts/my");
  return data;
}

export async function checkIn(shiftId: string): Promise<EscortShift> {
  const { data } = await apiClient.post<EscortShift>(
    `/escorts/shifts/${shiftId}/check-in`
  );
  return data;
}

export async function checkOut(shiftId: string): Promise<EscortShift> {
  const { data } = await apiClient.post<EscortShift>(
    `/escorts/shifts/${shiftId}/check-out`
  );
  return data;
}
