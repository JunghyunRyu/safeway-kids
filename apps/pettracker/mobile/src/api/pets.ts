import { apiClient } from './client';

export interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  birth_date: string | null;
  weight_kg: number | null;
  photo_url: string | null;
  medical_notes: string | null;
  temperament: string | null;
  vaccination_status: string;
  special_needs: string | null;
  is_active: boolean;
}

export interface PetCreateData {
  name: string;
  species?: string;
  breed?: string;
  birth_date?: string;
  weight_kg?: number;
  photo_url?: string;
  medical_notes?: string;
  temperament?: string;
  vaccination_status?: string;
  special_needs?: string;
}

export async function listPets(): Promise<Pet[]> {
  const resp = await apiClient.get('/pt/pets');
  return resp.data;
}

export async function createPet(data: PetCreateData): Promise<Pet> {
  const resp = await apiClient.post('/pt/pets', data);
  return resp.data;
}

export async function updatePet(petId: string, data: Partial<PetCreateData>): Promise<Pet> {
  const resp = await apiClient.put(`/pt/pets/${petId}`, data);
  return resp.data;
}
