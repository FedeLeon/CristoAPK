import { notificationsResponseSchema } from '../types/api';
import { api } from './client';

export async function getNotifications() {
  const response = await api.get('/notificaciones');
  return notificationsResponseSchema.parse(response.data);
}

export async function markNotificationsRead() {
  await api.post('/notificaciones/leidas');
}
