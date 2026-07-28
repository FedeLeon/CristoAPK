import axios from 'axios';
import { z } from 'zod';
import { readCache, writeCache } from '../storage/localDb';
import { dashboardAdminAnnouncementSchema, dashboardResponseSchema, extractApiData } from '../types/api';
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

export type AdminAnnouncementInput = {
  body: string;
  ends_at?: string | null;
  image?: {
    name: string;
    type: string;
    uri: string;
  };
  starts_at?: string | null;
  status?: 'activo' | 'inactivo';
  title: string;
};

function adminAnnouncementFormData(input: AdminAnnouncementInput) {
  const form = new FormData();

  form.append('title', input.title);
  form.append('body', input.body);
  form.append('status', input.status ?? 'activo');

  if (input.starts_at) {
    form.append('starts_at', input.starts_at);
  }

  if (input.ends_at) {
    form.append('ends_at', input.ends_at);
  }

  if (input.image) {
    form.append('image', input.image as unknown as Blob);
  }

  return form;
}

export async function createAdminAnnouncement(input: AdminAnnouncementInput) {
  const response = await api.post('/admin/anuncios', adminAnnouncementFormData(input), {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return dashboardAdminAnnouncementSchema.parse(extractApiData(response.data));
}

export async function updateAdminAnnouncement(id: number, input: AdminAnnouncementInput) {
  const response = await api.post(`/admin/anuncios/${id}`, adminAnnouncementFormData(input), {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return dashboardAdminAnnouncementSchema.parse(extractApiData(response.data));
}

export async function updateAdminAnnouncementStatus(id: number, status: 'activo' | 'inactivo') {
  const response = await api.put(`/admin/anuncios/${id}/estado`, { status });
  return dashboardAdminAnnouncementSchema.parse(extractApiData(response.data));
}

export async function deleteAdminAnnouncement(id: number) {
  await api.delete(`/admin/anuncios/${id}`);
}
