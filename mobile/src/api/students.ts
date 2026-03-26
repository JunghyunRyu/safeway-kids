import apiClient from "./client";

export interface Student {
  id: string;
  guardian_id: string;
  name: string;
  date_of_birth: string;
  grade: string | null;
  special_notes: string | null;
  allergies: string | null;
  emergency_contact: string | null;
  school_name: string | null;
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
  // API returns { items: [...], total: N } (paginated)
  const data = resp.data;
  return Array.isArray(data) ? data : (data.items ?? []);
}

export async function getStudent(studentId: string): Promise<Student> {
  const resp = await apiClient.get(`/students/${studentId}`);
  return resp.data;
}

export async function listEnrollments(studentId: string): Promise<Enrollment[]> {
  const resp = await apiClient.get(`/students/${studentId}/enrollments`);
  return resp.data;
}

// P3-70: Academy branding
export interface AcademyBranding {
  id: string;
  name: string;
  logo_url: string | null;
  primary_color: string | null;
}

export async function getAcademyBranding(): Promise<AcademyBranding | null> {
  try {
    const resp = await apiClient.get("/academies");
    const academies = resp.data;
    if (Array.isArray(academies) && academies.length > 0) {
      const a = academies[0];
      return {
        id: a.id,
        name: a.name,
        logo_url: a.logo_url ?? null,
        primary_color: a.primary_color ?? null,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function updateStudentProfile(
  studentId: string,
  data: {
    special_notes?: string;
    allergies?: string;
    emergency_contact?: string;
    school_name?: string;
    grade?: string;
  },
): Promise<Student> {
  const resp = await apiClient.patch(`/students/${studentId}`, data);
  return resp.data;
}
