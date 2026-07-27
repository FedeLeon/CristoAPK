import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const REMEMBERED_EMAIL_KEY = 'remembered_email';

function canUseWebStorage() {
  return Platform.OS === 'web' && typeof window !== 'undefined' && 'localStorage' in window;
}

export async function getRememberedEmail() {
  if (canUseWebStorage()) {
    return window.localStorage.getItem(REMEMBERED_EMAIL_KEY);
  }

  return SecureStore.getItemAsync(REMEMBERED_EMAIL_KEY);
}

export async function setRememberedEmail(email: string) {
  if (canUseWebStorage()) {
    window.localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
    return;
  }

  await SecureStore.setItemAsync(REMEMBERED_EMAIL_KEY, email);
}

export async function clearRememberedEmail() {
  if (canUseWebStorage()) {
    window.localStorage.removeItem(REMEMBERED_EMAIL_KEY);
    return;
  }

  await SecureStore.deleteItemAsync(REMEMBERED_EMAIL_KEY);
}
