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
    if (error instanceof Error) {
      return error.message;
    }

    return 'Ocurrio un error inesperado en la app.';
  }

  if (!error.response) {
    const apiUrl = api.defaults.baseURL ?? 'sin configurar';
    const detail = error.message ? ` Detalle: ${error.message}.` : '';

    return `No se pudo conectar con la API. URL actual: ${apiUrl}.${detail}`;
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
