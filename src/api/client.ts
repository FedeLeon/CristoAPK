import axios, { AxiosError } from 'axios';
import { clearAuthToken, getAuthToken } from '../auth/tokenStorage';

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const token = await getAuthToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      await clearAuthToken();
    }

    return Promise.reject(error);
  },
);

export function getApiErrorMessage(error: unknown) {
  if (!axios.isAxiosError(error)) {
    return 'Ocurrio un error inesperado.';
  }

  if (!error.response) {
    return 'No se pudo conectar con la API. Revisa la URL y que Laravel este corriendo.';
  }

  const status = error.response.status;
  const data = error.response.data as { message?: string; errors?: Record<string, string[]> } | undefined;

  if (status === 401) {
    return data?.message ?? 'No autenticado.';
  }

  if (status === 403) {
    return data?.message ?? 'No tenes permisos para esta accion.';
  }

  if (status === 422) {
    const firstError = data?.errors ? Object.values(data.errors).flat()[0] : undefined;
    return firstError ?? data?.message ?? 'Los datos enviados no son validos.';
  }

  if (status === 404) {
    return data?.message ?? 'Recurso no encontrado.';
  }

  return data?.message ?? `Error del servidor (${status}).`;
}
