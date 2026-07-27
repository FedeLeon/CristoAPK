import { extractApiData, pastoralGuidanceResponseSchema } from '../types/api';
import { api } from './client';

export async function requestPastoralGuidance(concern: string) {
  const response = await api.post('/orientacion-pastoral', { concern }, { timeout: 60000 });
  return pastoralGuidanceResponseSchema.parse(extractApiData(response.data));
}
