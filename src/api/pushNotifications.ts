import { api } from './client';

export type PushTokenInput = {
  device_id?: string | null;
  expo_push_token: string;
  platform?: 'android' | 'ios' | 'web';
};

export async function registerPushToken(input: PushTokenInput) {
  await api.post('/mobile/push-token', input);
}

export async function unregisterPushToken(expoPushToken: string) {
  await api.delete('/mobile/push-token', {
    data: {
      expo_push_token: expoPushToken,
    },
  });
}
