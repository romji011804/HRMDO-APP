import { readPersistentValue, writePersistentValue } from "./persistentStorageService.ts";

export function loadJsonRecords<T>(key: string, fallback: T[]): T[] {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = readPersistentValue(key);
    if (!raw) {
      writePersistentValue(key, JSON.stringify(fallback));
      return fallback;
    }
    const parsed = JSON.parse(raw) as T[];
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function saveJsonRecords<T>(key: string, records: T[]) {
  if (typeof window === "undefined") {
    return;
  }
  writePersistentValue(key, JSON.stringify(records));
}
