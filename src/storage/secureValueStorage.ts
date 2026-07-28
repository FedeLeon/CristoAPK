import * as SecureStore from 'expo-secure-store';

function canUseWebStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function hasSecureStoreMethod(method: 'deleteItemAsync' | 'getItemAsync' | 'setItemAsync') {
  return typeof SecureStore[method] === 'function';
}

export async function readSecureValue(key: string) {
  if (canUseWebStorage()) {
    return window.localStorage.getItem(key);
  }

  if (!hasSecureStoreMethod('getItemAsync')) {
    return null;
  }

  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

export async function writeSecureValue(key: string, value: string) {
  if (canUseWebStorage()) {
    window.localStorage.setItem(key, value);
    return;
  }

  if (!hasSecureStoreMethod('setItemAsync')) {
    return;
  }

  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    // SecureStore can be unavailable in web previews or old native builds.
  }
}

export async function deleteSecureValue(key: string) {
  if (canUseWebStorage()) {
    window.localStorage.removeItem(key);
    return;
  }

  if (!hasSecureStoreMethod('deleteItemAsync')) {
    return;
  }

  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    // SecureStore can be unavailable in web previews or old native builds.
  }
}
