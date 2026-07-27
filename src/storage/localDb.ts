import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

type CacheRow = {
  value: string;
  updated_at: string;
};

let dbPromise: Promise<SQLite.SQLiteDatabase | null> | null = null;

async function getDb() {
  if (Platform.OS === 'web') {
    return null;
  }

  dbPromise ??= SQLite.openDatabaseAsync('mds-local.db').then(async (db) => {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS api_cache (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    return db;
  });

  return dbPromise;
}

export async function readCache<T>(key: string) {
  const db = await getDb();

  if (!db) {
    return null;
  }

  const row = await db.getFirstAsync<CacheRow>('SELECT value, updated_at FROM api_cache WHERE key = ?', key);

  if (!row) {
    return null;
  }

  return JSON.parse(row.value) as T;
}

export async function writeCache(key: string, value: unknown) {
  const db = await getDb();

  if (!db) {
    return;
  }

  await db.runAsync(
    'INSERT OR REPLACE INTO api_cache (key, value, updated_at) VALUES (?, ?, ?)',
    key,
    JSON.stringify(value),
    new Date().toISOString(),
  );
}

export async function clearApiCache() {
  const db = await getDb();

  if (!db) {
    return;
  }

  await db.runAsync('DELETE FROM api_cache');
}
