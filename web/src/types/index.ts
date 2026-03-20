export interface User {
  id: string;
  phone: string;
  name: string;
  role: string;
  is_active: boolean;
}

export interface Academy {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string;
  admin_id?: string;
}

export interface Student {
  id: string;
  guardian_id: string;
  name: string;
  date_of_birth: string;
  grade?: string;
  school_name?: string;
  is_active: boolean;
  created_at?: string;
}

export interface Enrollment {
  id: string;
  student_id: string;
  academy_id: string;
  status: string;
  enrolled_at: string;
}

export interface Vehicle {
  id: string;
  license_plate: string;
  capacity: number;
  model_name?: string;
  is_active: boolean;
}

export interface DailySchedule {
  id: string;
  student_id: string;
  academy_id: string;
  schedule_date: string;
  pickup_time: string;
  pickup_latitude: number;
  pickup_longitude: number;
  status: string;
}

export interface BillingPlan {
  id: string;
  academy_id: string;
  name: string;
  price_per_ride: number;
  monthly_cap: number | null;
  is_active: boolean;
}

export interface Invoice {
  id: string;
  parent_id: string;
  academy_id: string;
  student_id: string;
  billing_month: string;
  total_rides: number;
  amount: number;
  status: string;
  due_date: string;
  paid_at: string | null;
}

export interface UserResponse {
  id: number;
  phone: string;
  name: string;
  role: string;
  is_active: boolean;
  created_at?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}
