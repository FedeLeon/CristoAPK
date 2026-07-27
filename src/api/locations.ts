import { z } from 'zod';
import { extractApiData } from '../types/api';
import { api } from './client';

const locationOptionSchema = z.object({
  code: z.string().nullable().optional(),
  flag: z.string().nullable().optional(),
  label: z.string(),
  value: z.string(),
});

const locationOptionsSchema = z.array(locationOptionSchema);

export type LocationOption = z.infer<typeof locationOptionSchema>;

export function isArgentinaNationality(value: string) {
  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  return normalized === 'argentina' || normalized === 'republica argentina';
}

export async function getCountries() {
  const response = await api.get('/ubicaciones/nacionalidades');

  return locationOptionsSchema.parse(extractApiData(response.data));
}

export async function getArgentinaProvinces() {
  const response = await api.get('/ubicaciones/provincias');

  return locationOptionsSchema.parse(extractApiData(response.data));
}

export async function getArgentinaCities(province: string) {
  const response = await api.get('/ubicaciones/ciudades', {
    params: {
      provincia: province,
    },
  });

  return locationOptionsSchema.parse(extractApiData(response.data));
}
