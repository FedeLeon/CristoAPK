import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const REMEMBERED_EMAIL_KEY = 'remembered_email';
const REMEMBERED_USER_KEY = 'remembered_user';

export type RememberedUser = {
  avatar_color?: string | null;
  avatar_initials?: string | null;
  avatar_url?: string | null;
  email: string;
  name: string;
};

function canUseWebStorage() {
  return Platform.OS === 'web' && typeof window !== 'undefined' && 'localStorage' in window;
}

export async function getRememberedEmail() {
  if (canUseWebStorage()) {
    return window.localStorage.getItem(REMEMBERED_EMAIL_KEY);
  }

  return SecureStore.getItemAsync(REMEMBERED_EMAIL_KEY);
}

export async function getRememberedUser(): Promise<RememberedUser | null> {
  const storedValue = canUseWebStorage()
    ? window.localStorage.getItem(REMEMBERED_USER_KEY)
    : await SecureStore.getItemAsync(REMEMBERED_USER_KEY);

  if (storedValue) {
    try {
      const parsed = JSON.parse(storedValue) as Partial<RememberedUser>;

      if (parsed.email && parsed.name) {
        return {
          avatar_color: parsed.avatar_color ?? null,
          avatar_initials: parsed.avatar_initials ?? null,
          avatar_url: parsed.avatar_url ?? null,
          email: parsed.email,
          name: parsed.name,
        };
      }
    } catch {
      // Fall through to the legacy email-only value.
    }
  }

  const legacyEmail = await getRememberedEmail();

  return legacyEmail ? { email: legacyEmail, name: legacyEmail } : null;
}

export async function setRememberedEmail(email: string) {
  if (canUseWebStorage()) {
    window.localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
    return;
  }

  await SecureStore.setItemAsync(REMEMBERED_EMAIL_KEY, email);
}

export async function setRememberedUser(user: RememberedUser) {
  const value = JSON.stringify(user);

  if (canUseWebStorage()) {
    window.localStorage.setItem(REMEMBERED_EMAIL_KEY, user.email);
    window.localStorage.setItem(REMEMBERED_USER_KEY, value);
    return;
  }

  await SecureStore.setItemAsync(REMEMBERED_EMAIL_KEY, user.email);
  await SecureStore.setItemAsync(REMEMBERED_USER_KEY, value);
}

export async function clearRememberedEmail() {
  if (canUseWebStorage()) {
    window.localStorage.removeItem(REMEMBERED_EMAIL_KEY);
    window.localStorage.removeItem(REMEMBERED_USER_KEY);
    return;
  }

  await SecureStore.deleteItemAsync(REMEMBERED_EMAIL_KEY);
  await SecureStore.deleteItemAsync(REMEMBERED_USER_KEY);
}
