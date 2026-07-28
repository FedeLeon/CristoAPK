import { z } from 'zod';
import {
  adminDownloadableMaterialSchema,
  adminPastoralCourseSchema,
  extractApiData,
} from '../types/api';
import { api } from './client';

const adminPastoralCoursesResponseSchema = z.array(adminPastoralCourseSchema);
const adminDownloadableMaterialsResponseSchema = z.array(adminDownloadableMaterialSchema);

export async function getAdminPastoralCourses() {
  const response = await api.get('/admin/cursos-pastorales');
  return adminPastoralCoursesResponseSchema.parse(extractApiData(response.data));
}

export async function getAdminDownloadableMaterials() {
  const response = await api.get('/admin/contenido-descargable');
  return adminDownloadableMaterialsResponseSchema.parse(extractApiData(response.data));
}

export type AdminDownloadableMaterialInput = {
  description?: string | null;
  file?: {
    mimeType?: string | null;
    name: string;
    uri: string;
  };
  title: string;
};

function downloadableMaterialFormData(input: AdminDownloadableMaterialInput, includeFile: boolean) {
  const form = new FormData();

  form.append('title', input.title);

  if (input.description) {
    form.append('description', input.description);
  }

  if (includeFile && input.file) {
    form.append('file', {
      name: input.file.name,
      type: input.file.mimeType ?? 'application/octet-stream',
      uri: input.file.uri,
    } as unknown as Blob);
  }

  return form;
}

export async function createAdminDownloadableMaterial(input: AdminDownloadableMaterialInput) {
  const response = await api.post('/admin/contenido-descargable', downloadableMaterialFormData(input, true), {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return adminDownloadableMaterialSchema.parse(extractApiData(response.data));
}

export async function updateAdminDownloadableMaterial(id: number, input: AdminDownloadableMaterialInput) {
  const response = await api.put(`/admin/contenido-descargable/${id}`, downloadableMaterialFormData(input, false), {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return adminDownloadableMaterialSchema.parse(extractApiData(response.data));
}

export async function deleteAdminDownloadableMaterial(id: number) {
  await api.delete(`/admin/contenido-descargable/${id}`);
}
