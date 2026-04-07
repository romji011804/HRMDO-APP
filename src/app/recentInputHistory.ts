import type { RecordItem } from "./records.ts";
import { readPersistentValue, writePersistentValue } from "./persistentState.ts";

export type RecentInputFieldKey = "school" | "course";

type RecentHistoryStore = Record<`${RecentInputFieldKey}_history`, string[]>;

const STORAGE_KEY = "moa-lo-recent-input-history";
const MAX_HISTORY_ITEMS = 25;

const EMPTY_HISTORY: RecentHistoryStore = {
  school_history: [],
  course_history: [],
};

function getStorageFieldKey(field: RecentInputFieldKey): keyof RecentHistoryStore {
  return `${field}_history`;
}

function normalizeValue(value: string) {
  return value.trim().toLowerCase();
}

function uniqueValues(values: string[]) {
  const seen = new Set<string>();
  const deduped: string[] = [];

  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed) continue;

    const normalized = normalizeValue(trimmed);
    if (seen.has(normalized)) continue;

    seen.add(normalized);
    deduped.push(trimmed);
  }

  return deduped;
}

export function loadRecentInputHistory(): RecentHistoryStore {
  if (typeof window === "undefined") {
    return EMPTY_HISTORY;
  }

  try {
    const raw = readPersistentValue(STORAGE_KEY);
    if (!raw) {
      return EMPTY_HISTORY;
    }

    const parsed = JSON.parse(raw) as Partial<RecentHistoryStore>;
    return {
      school_history: Array.isArray(parsed.school_history)
        ? uniqueValues(parsed.school_history)
        : [],
      course_history: Array.isArray(parsed.course_history)
        ? uniqueValues(parsed.course_history)
        : [],
    };
  } catch {
    return EMPTY_HISTORY;
  }
}

export function saveRecentInputHistory(history: RecentHistoryStore) {
  if (typeof window === "undefined") {
    return;
  }

  writePersistentValue(STORAGE_KEY, JSON.stringify(history));
}

export function getRecentInputs(field: RecentInputFieldKey) {
  const history = loadRecentInputHistory();
  return history[getStorageFieldKey(field)];
}

export function saveRecentInput(field: RecentInputFieldKey, value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return;
  }

  const history = loadRecentInputHistory();
  const key = getStorageFieldKey(field);
  const existing = history[key].filter((item) => normalizeValue(item) !== normalizeValue(trimmed));
  history[key] = [trimmed, ...existing].slice(0, MAX_HISTORY_ITEMS);
  saveRecentInputHistory(history);
}

export function removeRecentInput(field: RecentInputFieldKey, value: string) {
  const history = loadRecentInputHistory();
  const key = getStorageFieldKey(field);
  history[key] = history[key].filter((item) => normalizeValue(item) !== normalizeValue(value));
  saveRecentInputHistory(history);
  return history[key];
}

export function getMatchingRecentInputs(field: RecentInputFieldKey, query: string) {
  const normalizedQuery = normalizeValue(query);
  const history = getRecentInputs(field);

  if (!normalizedQuery) {
    return history;
  }

  return history.filter((item) => normalizeValue(item).includes(normalizedQuery));
}

export function initializeRecentInputsFromRecords(records: RecordItem[]) {
  const history = loadRecentInputHistory();
  let changed = false;

  for (const field of ["school", "course"] as const) {
    const key = getStorageFieldKey(field);
    if (history[key].length > 0) {
      continue;
    }

    const values = uniqueValues(records.map((record) => record[field] || ""));
    if (values.length > 0) {
      history[key] = values.slice(0, MAX_HISTORY_ITEMS);
      changed = true;
    }
  }

  if (changed) {
    saveRecentInputHistory(history);
  }
}
