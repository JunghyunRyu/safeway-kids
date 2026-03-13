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
  academy_id: string;
  vehicle_id: string | null;
  schedule_date: string;
  pickup_time: string;
  status: string;
  boarded_at: string | null;
  alighted_at: string | null;
  created_at: string;
}

export interface DriverDailySchedule {
  id: string;
  student_id: string;
  student_name: string;
  academy_id: string;
  academy_name: string;
  schedule_date: string;
  pickup_time: string;
  pickup_latitude: number;
  pickup_longitude: number;
  status: string;
  boarded_at: string | null;
  alighted_at: string | null;
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
  return resp.data;
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

export async function markAlighted(instanceId: string): Promise<DailySchedule> {
  const resp = await apiClient.post(`/schedules/daily/${instanceId}/alight`);
  return resp.data;
}
