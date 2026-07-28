import { deleteSecureValue, readSecureValue, writeSecureValue } from '../storage/secureValueStorage';

const REMEMBERED_EMAIL_KEY = 'remembered_email';
const REMEMBERED_USER_KEY = 'remembered_user';

export type RememberedUser = {
  avatar_color?: string | null;
  avatar_initials?: string | null;
  avatar_url?: string | null;
  email: string;
  name: string;
};

export async function getRememberedEmail() {
  return readSecureValue(REMEMBERED_EMAIL_KEY);
}

export async function getRememberedUser(): Promise<RememberedUser | null> {
  const storedValue = await readSecureValue(REMEMBERED_USER_KEY);

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
  await writeSecureValue(REMEMBERED_EMAIL_KEY, email);
}

export async function setRememberedUser(user: RememberedUser) {
  const value = JSON.stringify(user);

  await writeSecureValue(REMEMBERED_EMAIL_KEY, user.email);
  await writeSecureValue(REMEMBERED_USER_KEY, value);
}

export async function clearRememberedEmail() {
  await deleteSecureValue(REMEMBERED_EMAIL_KEY);
  await deleteSecureValue(REMEMBERED_USER_KEY);
}
