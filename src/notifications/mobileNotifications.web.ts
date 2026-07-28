import { router, type Href } from 'expo-router';
import { Meeting } from '../types/api';

export async function setupAndroidNotificationChannel() {
  return;
}

export async function registerDeviceForPushNotifications() {
  return null;
}

export async function unregisterDevicePushToken() {
  return;
}

export function observeNotificationResponses() {
  return { remove: () => undefined };
}

export async function scheduleMeetingReminders(_meetings: Meeting[]) {
  return;
}

export function openNotificationUrl(url?: unknown) {
  if (typeof url === 'string' && url.startsWith('/')) {
    router.push(url as Href);
  }
}
