type CacheRow = {
  value: string;
  updated_at: string;
};

const CACHE_PREFIX = 'api_cache:';

function canUseWebStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export async function readCache<T>(key: string) {
  if (!canUseWebStorage()) {
    return null;
  }

  const rawValue = window.localStorage.getItem(`${CACHE_PREFIX}${key}`);

  if (!rawValue) {
    return null;
  }

  try {
    const row = JSON.parse(rawValue) as Partial<CacheRow>;

    return row.value ? (JSON.parse(row.value) as T) : null;
  } catch {
    return null;
  }
}

export async function writeCache(key: string, value: unknown) {
  if (!canUseWebStorage()) {
    return;
  }

  window.localStorage.setItem(
    `${CACHE_PREFIX}${key}`,
    JSON.stringify({
      updated_at: new Date().toISOString(),
      value: JSON.stringify(value),
    }),
  );
}

export async function clearApiCache() {
  if (!canUseWebStorage()) {
    return;
  }

  for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
    const key = window.localStorage.key(index);

    if (key?.startsWith(CACHE_PREFIX)) {
      window.localStorage.removeItem(key);
    }
  }
}
