import { z } from 'zod';
import {
  extractApiData,
  tutorGroupSchema,
  tutorPastoralAnalysisResponseSchema,
  tutorStudentSchema,
  tutorUsersResponseSchema,
} from '../types/api';
import { api } from './client';

const tutorStudentsResponseSchema = z.array(tutorStudentSchema);
const tutorGroupsResponseSchema = z.array(tutorGroupSchema);

export type CreateTutorStudentInput = {
  email: string;
  last_name: string;
  name: string;
  password: string;
};

export type UpdateTutorStudentStatusInput = {
  id: number;
  status: 'activo' | 'bloqueado';
};

export type UpdateTutorPastoralProfileInput = {
  care_alerts?: string;
  children_count?: number | null;
  communication_preferences?: string;
  current_challenges?: string;
  emotional_state?: string;
  family_situation?: string;
  has_children: boolean;
  next_steps?: string;
  prayer_requests?: string;
  sentimental_status?: string;
  spiritual_needs?: string;
  support_network?: string;
  tutor_notes?: string;
};

export type CreateTutorGroupInput = {
  description?: string;
  meeting_days: string[];
  meeting_time: string;
  modality: 'presencial' | 'virtual';
  name: string;
  start_date: string;
  status: 'activo' | 'pausado' | 'terminado';
  students?: number[];
};

export type UpdateTutorGroupStudentsInput = {
  id: number;
  students: number[];
};

export async function getTutorUsers() {
  const response = await api.get('/tutor/usuarios');
  const payload = extractApiData(response.data);

  if (Array.isArray(payload)) {
    return {
      groups: [],
      students: tutorStudentsResponseSchema.parse(payload),
    };
  }

  return tutorUsersResponseSchema.parse(payload);
}

export async function getTutorGroups() {
  const response = await api.get('/tutor/grupos');
  return tutorGroupsResponseSchema.parse(extractApiData(response.data));
}

export async function createTutorStudent(input: CreateTutorStudentInput) {
  const response = await api.post('/tutor/usuarios', input);
  return tutorStudentSchema.parse(extractApiData(response.data));
}

export async function updateTutorStudentStatus(input: UpdateTutorStudentStatusInput) {
  const response = await api.put(`/tutor/usuarios/${input.id}/estado`, { status: input.status });
  return tutorStudentSchema.parse(extractApiData(response.data));
}

export async function updateTutorPastoralProfile(id: number, input: UpdateTutorPastoralProfileInput) {
  const response = await api.put(`/tutor/usuarios/${id}/ficha`, input);
  return tutorStudentSchema.parse(extractApiData(response.data));
}

export async function analyzeTutorPastoralProfile(id: number) {
  const response = await api.post(`/tutor/usuarios/${id}/analisis-ia`, undefined, { timeout: 60000 });
  return tutorPastoralAnalysisResponseSchema.parse(extractApiData(response.data));
}

export async function deleteTutorStudent(id: number) {
  await api.delete(`/tutor/usuarios/${id}`);
}

export async function createTutorGroup(input: CreateTutorGroupInput) {
  const response = await api.post('/tutor/grupos', input);
  return tutorGroupSchema.parse(extractApiData(response.data));
}

export async function updateTutorGroup(input: CreateTutorGroupInput & { id: number }) {
  const response = await api.put(`/tutor/grupos/${input.id}`, input);
  return tutorGroupSchema.parse(extractApiData(response.data));
}

export async function updateTutorGroupStudents(input: UpdateTutorGroupStudentsInput) {
  const response = await api.put(`/tutor/grupos/${input.id}/usuarios`, { students: input.students });
  return tutorGroupSchema.parse(extractApiData(response.data));
}

export async function deleteTutorGroup(id: number) {
  await api.delete(`/tutor/grupos/${id}`);
}
