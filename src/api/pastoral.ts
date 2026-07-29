import { extractApiData, pastoralGuidanceResponseSchema, pastoralSupportResponseSchema } from '../types/api';
import { api } from './client';

export async function requestPastoralGuidance(concern: string) {
  const response = await api.post('/orientacion-pastoral', { concern }, { timeout: 60000 });
  return pastoralGuidanceResponseSchema.parse(extractApiData(response.data));
}

export async function requestPastoralSupport() {
  const response = await api.post('/orientacion-pastoral/acompanamiento');
  return pastoralSupportResponseSchema.parse(extractApiData(response.data));
}
