import apiClient from "./client";

export interface ScheduleTemplate {
  id: string;
  student_id: string;
  academy_id: string;
  day_of_week: number;
  pickup_time: string;
  pickup_latitude: number;
  pickup_longitude: number;
  pickup_address: string | null;
  is_active: boolean;
  created_at: string;
}

export interface DailySchedule {
  id: string;
  template_id: string | null;
  student_id: string;
  student_name: string | null;
  student_photo_url: string | null;
  academy_id: string;
  academy_name: string | null;
  vehicle_id: string | null;
  vehicle_license_plate: string | null;
  driver_name: string | null;
  driver_phone_masked: string | null;
  safety_escort_name: string | null;
  schedule_date: string;
  pickup_time: string;
  pickup_address: string | null;
  status: string;
  boarded_at: string | null;
  alighted_at: string | null;
  created_at: string;
}

export interface DriverDailySchedule {
  id: string;
  student_id: string;
  student_name: string;
  student_photo_url: string | null;
  academy_id: string;
  academy_name: string;
  schedule_date: string;
  pickup_time: string;
  pickup_latitude: number;
  pickup_longitude: number;
  pickup_address: string | null;
  special_notes: string | null;
  allergies: string | null;
  guardian_phone_masked: string | null;
  status: string;
  boarded_at: string | null;
  alighted_at: string | null;
  arrival_confirmed_at: string | null;
  notification_sent: boolean | null;
}

export async function listTemplates(studentId: string): Promise<ScheduleTemplate[]> {
  const resp = await apiClient.get(`/schedules/templates?student_id=${studentId}`);
  return resp.data;
}

export async function listDailySchedules(
  targetDate: string,
  studentId?: string
): Promise<DailySchedule[]> {
  let url = `/schedules/daily?target_date=${targetDate}`;
  if (studentId) url += `&student_id=${studentId}`;
  const resp = await apiClient.get(url);
  const data = resp.data;
  return Array.isArray(data) ? data : (data.items ?? []);
}

export async function cancelSchedule(instanceId: string, reason?: string): Promise<DailySchedule> {
  const resp = await apiClient.post(`/schedules/daily/${instanceId}/cancel`, { reason });
  return resp.data;
}

export async function getDriverDailySchedules(targetDate: string): Promise<DriverDailySchedule[]> {
  const resp = await apiClient.get(`/schedules/daily/driver?target_date=${targetDate}`);
  return resp.data;
}

export async function markBoarded(instanceId: string): Promise<DailySchedule> {
  const resp = await apiClient.post(`/schedules/daily/${instanceId}/board`);
  return resp.data;
}

export async function markAlighted(instanceId: string, handoffType?: string): Promise<DailySchedule> {
  const resp = await apiClient.post(`/schedules/daily/${instanceId}/alight`, handoffType ? { handoff_type: handoffType } : undefined);
  return resp.data;
}

export async function markNoShow(instanceId: string, reason: string): Promise<DailySchedule> {
  const resp = await apiClient.post(`/schedules/daily/${instanceId}/no-show`, { reason });
  return resp.data;
}

export async function undoBoard(instanceId: string): Promise<DailySchedule> {
  const resp = await apiClient.post(`/schedules/daily/${instanceId}/undo-board`);
  return resp.data;
}

export async function undoAlight(instanceId: string): Promise<DailySchedule> {
  const resp = await apiClient.post(`/schedules/daily/${instanceId}/undo-alight`);
  return resp.data;
}

export async function confirmArrival(instanceId: string): Promise<DailySchedule> {
  const resp = await apiClient.post(`/schedules/daily/${instanceId}/arrival-confirm`);
  return resp.data;
}

export async function startRoute(vehicleId: string, scheduleDate: string): Promise<unknown> {
  const resp = await apiClient.post(`/schedules/daily/route/start`, { vehicle_id: vehicleId, schedule_date: scheduleDate });
  return resp.data;
}

export async function endRoute(vehicleId: string, scheduleDate: string): Promise<unknown> {
  const resp = await apiClient.post(`/schedules/daily/route/end`, { vehicle_id: vehicleId, schedule_date: scheduleDate });
  return resp.data;
}

export async function batchBoard(instanceIds: string[]): Promise<unknown> {
  const resp = await apiClient.post("/schedules/daily/batch-board", { instance_ids: instanceIds });
  return resp.data;
}

export async function createDriverMemo(instanceId: string, memo: string): Promise<unknown> {
  const resp = await apiClient.post(`/schedules/daily/${instanceId}/memo`, { memo });
  return resp.data;
}

export async function reorderRoute(
  scheduleDate: string,
  instanceIds: string[]
): Promise<unknown> {
  const resp = await apiClient.patch("/schedules/daily/reorder", {
    schedule_date: scheduleDate,
    instance_ids: instanceIds,
  });
  return resp.data;
}

export async function submitVehicleClearance(
  vehicleId: string,
  scheduleDate: string,
  checklist: { seats_checked: boolean; trunk_checked: boolean; locked: boolean }
): Promise<unknown> {
  const resp = await apiClient.post("/schedules/daily/vehicle-clear", {
    vehicle_id: vehicleId,
    schedule_date: scheduleDate,
    checklist,
  });
  return resp.data;
}
