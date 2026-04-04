import { apiClient } from './client';

export interface Child {
  id: string;
  name: string;
  birth_date: string;
  age_group: string;
  allergies: string | null;
  medical_notes: string | null;
  emergency_contact: string | null;
  school_name: string | null;
  photo_url: string | null;
  is_active: boolean;
}

export interface ChildCreateData {
  name: string;
  birth_date: string;
  age_group: string;
  allergies?: string;
  medical_notes?: string;
  emergency_contact?: string;
  school_name?: string;
  favorite_activities?: string[];
}

export async function listChildren(): Promise<Child[]> {
  return (await apiClient.get('/cc/children')).data;
}

export async function createChild(data: ChildCreateData): Promise<Child> {
  return (await apiClient.post('/cc/children', data)).data;
}

export async function createConsent(childId: string, scope: Record<string, boolean>): Promise<void> {
  await apiClient.post(`/cc/children/${childId}/consent`, { child_id: childId, consent_scope: scope });
}
