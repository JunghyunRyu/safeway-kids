import apiClient from "./client";

export interface Student {
  id: string;
  guardian_id: string;
  name: string;
  date_of_birth: string;
  grade: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Enrollment {
  id: string;
  student_id: string;
  academy_id: string;
  enrolled_at: string;
  withdrawn_at: string | null;
}

export async function listStudents(): Promise<Student[]> {
  const resp = await apiClient.get("/students");
  return resp.data;
}

export async function getStudent(studentId: string): Promise<Student> {
  const resp = await apiClient.get(`/students/${studentId}`);
  return resp.data;
}

export async function listEnrollments(studentId: string): Promise<Enrollment[]> {
  const resp = await apiClient.get(`/students/${studentId}/enrollments`);
  return resp.data;
}
