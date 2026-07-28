import { deleteSecureValue, readSecureValue, writeSecureValue } from '../storage/secureValueStorage';

const AUTH_TOKEN_KEY = 'auth_token';

export async function getAuthToken() {
  return readSecureValue(AUTH_TOKEN_KEY);
}

export async function setAuthToken(token: string) {
  await writeSecureValue(AUTH_TOKEN_KEY, token);
}

export async function clearAuthToken() {
  await deleteSecureValue(AUTH_TOKEN_KEY);
}
