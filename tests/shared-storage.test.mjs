import test from "node:test";
import assert from "node:assert/strict";

class MemoryStorage {
  constructor() {
    this.map = new Map();
  }
  getItem(key) {
    return this.map.has(key) ? this.map.get(key) : null;
  }
  setItem(key, value) {
    this.map.set(key, String(value));
  }
  removeItem(key) {
    this.map.delete(key);
  }
  clear() {
    this.map.clear();
  }
}

const localStorage = new MemoryStorage();
globalThis.localStorage = localStorage;
globalThis.window = {
  localStorage,
  electronAPI: undefined,
};

const persistentStorage = await import("../src/shared/storage/persistentStorageService.ts");
const storageService = await import("../src/shared/storage/storageService.ts");
const searchService = await import("../src/shared/services/searchService.ts");

test("persistentStorageService reads and writes values", () => {
  persistentStorage.clearPersistentCache();
  persistentStorage.writePersistentValue("demo", "value");
  assert.equal(persistentStorage.readPersistentValue("demo"), "value");
});

test("storageService falls back to defaults and persists arrays", () => {
  persistentStorage.clearPersistentCache();
  localStorage.clear();

  const loaded = storageService.loadJsonRecords("sample", [{ id: 1 }]);
  assert.deepEqual(loaded, [{ id: 1 }]);

  storageService.saveJsonRecords("sample", [{ id: 2 }]);
  const saved = storageService.loadJsonRecords("sample", []);
  assert.deepEqual(saved, [{ id: 2 }]);
});

test("searchService normalizes and matches values", () => {
  assert.equal(searchService.normalizeSearchText("  HeLLo "), "hello");
  assert.equal(searchService.matchesSearchQuery(["Amber Infante", "ENRO"], "amber"), true);
  assert.equal(searchService.matchesSearchQuery(["Amber Infante", "ENRO"], "hrmdo"), false);
});
