const DB_NAME = "moa-lo-files-db";
const STORE_NAME = "files";
const DB_VERSION = 1;

function newIdbKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `idb:${crypto.randomUUID()}`;
  }
  return `idb:${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function isIndexedDbAvailable(): boolean {
  return typeof indexedDB !== "undefined";
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveFileBlob(file: File | Blob): Promise<string> {
  if (!isIndexedDbAvailable()) {
    throw new Error("IndexedDB is not available in this environment.");
  }

  const key = newIdbKey();
  const db = await openDb();
  const toStore =
    file instanceof File
      ? new Blob([await file.arrayBuffer()], { type: file.type || "application/octet-stream" })
      : file;

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(toStore, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });

  db.close();
  return key;
}

export async function getFileBlob(key: string): Promise<Blob | null> {
  const db = await openDb();
  const value = await new Promise<Blob | null>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).get(key);
    request.onsuccess = () => {
      const result = request.result;
      resolve(result instanceof Blob ? result : null);
    };
    request.onerror = () => reject(request.error);
  });
  db.close();
  return value;
}

export async function hasStoredFile(key: string): Promise<boolean> {
  if (!key.startsWith("idb:")) {
    return false;
  }

  try {
    const blob = await getFileBlob(key);
    return blob instanceof Blob;
  } catch {
    return false;
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function base64ToUint8Array(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

export interface ExportableStoredFile {
  mimeType: string;
  base64Data: string;
}

export async function exportStoredFile(key: string): Promise<ExportableStoredFile | null> {
  if (!key.startsWith("idb:")) {
    return null;
  }

  const blob = await getFileBlob(key);
  if (!blob) {
    return null;
  }

  return {
    mimeType: blob.type || "application/octet-stream",
    base64Data: arrayBufferToBase64(await blob.arrayBuffer()),
  };
}

export async function importStoredFile(file: ExportableStoredFile): Promise<string> {
  const bytes = base64ToUint8Array(file.base64Data);
  const blob = new Blob([bytes], { type: file.mimeType || "application/octet-stream" });
  return saveFileBlob(blob);
}
