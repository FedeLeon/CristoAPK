import { z } from 'zod';
import { clearAuthToken, setAuthToken } from '../auth/tokenStorage';
import { registerDeviceForPushNotifications, unregisterDevicePushToken } from '../notifications/mobileNotifications';
import { clearApiCache } from '../storage/localDb';
import { extractApiData, loginResponseSchema, userSchema } from '../types/api';
import { api } from './client';

const registerResponseSchema = z.object({
  message: z.string().optional(),
  token: z.string().optional(),
  user: userSchema,
});

export type ProfileUpdateInput = {
  name?: string;
  last_name?: string;
  birth_date?: string;
  phone?: string;
  address?: string;
  country?: string;
  state?: string;
  city?: string;
  postal_code?: string;
  avatar?: {
    name: string;
    type: string;
    uri: string;
  };
};

const profileResponseSchema = z.object({
  message: z.string().optional(),
  data: userSchema,
});

export type ProfileEmailUpdateInput = {
  new_email: string;
};

export type ProfilePasswordUpdateInput = {
  current_password: string;
  password: string;
  password_confirmation: string;
};

export type RegisterInput = {
  email: string;
  name: string;
  password: string;
  password_confirmation: string;
  role: 'student' | 'pastor';
};

export async function login(email: string, password: string) {
  const response = await api.post('/login', { email, password });
  const parsed = loginResponseSchema.parse(response.data);

  await setAuthToken(parsed.token);
  await registerDeviceForPushNotifications();

  return parsed.user;
}

export async function register(input: RegisterInput) {
  const response = await api.post('/register', input);
  const parsed = registerResponseSchema.parse(response.data);

  if (parsed.token) {
    await setAuthToken(parsed.token);
    await registerDeviceForPushNotifications();
  }

  return parsed;
}

export async function forgotPassword(email: string) {
  const response = await api.post('/olvide-mi-contrasena', { email });
  return response.data as { message: string };
}

export async function logout() {
  try {
    await unregisterDevicePushToken();
    await api.post('/logout');
  } finally {
    await clearAuthToken();
    await clearApiCache();
  }
}

export async function me() {
  const response = await api.get('/me');
  return userSchema.parse(extractApiData(response.data));
}

export async function updateProfile(input: ProfileUpdateInput) {
  const form = new FormData();

  Object.entries(input).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    if (key === 'avatar') {
      form.append('avatar', value as unknown as Blob);
      return;
    }

    form.append(key, String(value));
  });

  const response = await api.post('/profile', form, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return userSchema.parse(extractApiData(response.data));
}

export async function updateProfileEmail(input: ProfileEmailUpdateInput) {
  const response = await api.post('/profile', input);
  const parsed = profileResponseSchema.parse(response.data);

  return {
    message: parsed.message ?? 'Email actualizado.',
    user: parsed.data,
  };
}

export async function updateProfilePassword(input: ProfilePasswordUpdateInput) {
  const response = await api.post('/profile', input);
  const parsed = profileResponseSchema.parse(response.data);

  return {
    message: parsed.message ?? 'Contrasena actualizada.',
    user: parsed.data,
  };
}
