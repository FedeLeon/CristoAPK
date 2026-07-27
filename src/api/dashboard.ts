import axios from 'axios';
import { z } from 'zod';
import { readCache, writeCache } from '../storage/localDb';
import { dashboardResponseSchema, extractApiData } from '../types/api';
import { api } from './client';

export async function getDashboard() {
  const cacheKey = 'dashboard:show';

  try {
    const response = await api.get('/dashboard');
    const dashboard = dashboardResponseSchema.parse(extractApiData(response.data));
    await writeCache(cacheKey, dashboard);
    return dashboard;
  } catch (error) {
    const cached = await readCache<z.infer<typeof dashboardResponseSchema>>(cacheKey);

    if (cached && axios.isAxiosError(error) && !error.response) {
      return dashboardResponseSchema.parse(cached);
    }

    throw error;
  }
}

export async function markDashboardAnnouncementRead(id: number) {
  await api.post(`/dashboard/anuncios/${id}/leido`);
}
