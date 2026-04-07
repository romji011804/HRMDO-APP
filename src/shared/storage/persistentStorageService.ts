const persistentCache = new Map<string, string | null>();

function getElectronAPI() {
  return typeof window !== "undefined" ? window.electronAPI : undefined;
}

export function readPersistentValue(key: string): string | null {
  if (persistentCache.has(key)) {
    return persistentCache.get(key) ?? null;
  }

  let value: string | null = null;
  const electronAPI = getElectronAPI();

  if (electronAPI?.readPersistentStorageSync) {
    try {
      const stored = electronAPI.readPersistentStorageSync(key);
      value = typeof stored === "string" ? stored : null;
    } catch {
      value = null;
    }
  }

  if (value === null && typeof window !== "undefined") {
    try {
      value = window.localStorage.getItem(key);
    } catch {
      value = null;
    }
  }

  if (value !== null && typeof window !== "undefined") {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Ignore local cache write failures.
    }
  }

  persistentCache.set(key, value);
  return value;
}

export function writePersistentValue(key: string, value: string) {
  persistentCache.set(key, value);

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Ignore local cache write failures.
    }
  }

  const electronAPI = getElectronAPI();
  if (electronAPI?.writePersistentStorage) {
    void electronAPI.writePersistentStorage(key, value);
  }
}

export function removePersistentValue(key: string) {
  persistentCache.set(key, null);

  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignore local cache removal failures.
    }
  }

  const electronAPI = getElectronAPI();
  if (electronAPI?.removePersistentStorage) {
    void electronAPI.removePersistentStorage(key);
  }
}

export function clearPersistentCache() {
  persistentCache.clear();
}
