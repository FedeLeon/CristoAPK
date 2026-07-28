import {
  adminIndividualSchema,
  adminIndividualsResponseSchema,
  extractApiData,
  type AdminIndividualRole,
  type AdminIndividualStatus,
} from '../types/api';
import { api } from './client';

export type AdminIndividualsTab = 'all' | 'pastors' | 'tutors' | 'students';

export type GetAdminIndividualsParams = {
  search?: string;
  status?: '' | AdminIndividualStatus;
  tab: AdminIndividualsTab;
};

export type UpdateAdminIndividualInput = {
  email: string;
  id: number;
  last_name?: string | null;
  name: string;
  password?: string;
  password_confirmation?: string;
  role: AdminIndividualRole;
  status: AdminIndividualStatus;
  tutor_id?: number | null;
};

export async function getAdminIndividuals(params: GetAdminIndividualsParams) {
  const response = await api.get('/admin/individuos', { params });
  return adminIndividualsResponseSchema.parse(response.data);
}

export async function updateAdminIndividual(input: UpdateAdminIndividualInput) {
  const response = await api.put(`/admin/individuos/${input.id}`, input);
  return adminIndividualSchema.parse(extractApiData(response.data));
}

export async function toggleAdminIndividualStatus(id: number) {
  const response = await api.put(`/admin/individuos/${id}/estado`);
  return adminIndividualSchema.parse(extractApiData(response.data));
}

export async function deleteAdminIndividual(id: number) {
  await api.delete(`/admin/individuos/${id}`);
}
