import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const AUTH_TOKEN_KEY = 'auth_token';

function canUseWebStorage() {
  return Platform.OS === 'web' && typeof window !== 'undefined' && 'localStorage' in window;
}

export async function getAuthToken() {
  if (canUseWebStorage()) {
    return window.localStorage.getItem(AUTH_TOKEN_KEY);
  }

  return SecureStore.getItemAsync(AUTH_TOKEN_KEY);
}

export async function setAuthToken(token: string) {
  if (canUseWebStorage()) {
    window.localStorage.setItem(AUTH_TOKEN_KEY, token);
    return;
  }

  await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
}

export async function clearAuthToken() {
  if (canUseWebStorage()) {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
    return;
  }

  await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
}
