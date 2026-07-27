import { clearAuthToken, setAuthToken } from '../auth/tokenStorage';
import { extractApiData, loginResponseSchema, userSchema } from '../types/api';
import { api } from './client';

export async function login(email: string, password: string) {
  const response = await api.post('/login', { email, password });
  const parsed = loginResponseSchema.parse(response.data);

  await setAuthToken(parsed.token);

  return parsed.user;
}

export async function logout() {
  try {
    await api.post('/logout');
  } finally {
    await clearAuthToken();
  }
}

export async function me() {
  const response = await api.get('/me');
  return userSchema.parse(extractApiData(response.data));
}
