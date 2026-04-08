import type { OjtStudentRecord } from "./types";
import { readPersistentValue, writePersistentValue } from "../../app/persistentState";

export type OjtInputFieldKey = "program" | "school" | "ojtHours" | "startDate" | "endDate" | "office" | "address";

type OjtHistoryStore = Record<`${OjtInputFieldKey}_history`, string[]>;

const STORAGE_KEY = "ojt-recent-input-history";
const MAX_HISTORY_ITEMS = 25;

const EMPTY_HISTORY: OjtHistoryStore = {
  program_history: [],
  school_history: [],
  ojtHours_history: [],
  startDate_history: [],
  endDate_history: [],
  office_history: [],
  address_history: [],
};

function getStorageFieldKey(field: OjtInputFieldKey): keyof OjtHistoryStore {
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

export function loadOjtRecentInputHistory(): OjtHistoryStore {
  if (typeof window === "undefined") {
    return EMPTY_HISTORY;
  }

  try {
    const raw = readPersistentValue(STORAGE_KEY);
    if (!raw) {
      return EMPTY_HISTORY;
    }

    const parsed = JSON.parse(raw) as Partial<OjtHistoryStore>;
    return {
      program_history: Array.isArray(parsed.program_history) ? uniqueValues(parsed.program_history) : [],
      school_history: Array.isArray(parsed.school_history) ? uniqueValues(parsed.school_history) : [],
      ojtHours_history: Array.isArray(parsed.ojtHours_history) ? uniqueValues(parsed.ojtHours_history) : [],
      startDate_history: Array.isArray(parsed.startDate_history) ? uniqueValues(parsed.startDate_history) : [],
      endDate_history: Array.isArray(parsed.endDate_history) ? uniqueValues(parsed.endDate_history) : [],
      office_history: Array.isArray(parsed.office_history) ? uniqueValues(parsed.office_history) : [],
      address_history: Array.isArray(parsed.address_history) ? uniqueValues(parsed.address_history) : [],
    };
  } catch {
    return EMPTY_HISTORY;
  }
}

export function saveOjtRecentInputHistory(history: OjtHistoryStore) {
  if (typeof window === "undefined") {
    return;
  }

  writePersistentValue(STORAGE_KEY, JSON.stringify(history));
}

export function getOjtRecentInputs(field: OjtInputFieldKey) {
  const history = loadOjtRecentInputHistory();
  return history[getStorageFieldKey(field)];
}

export function saveOjtRecentInput(field: OjtInputFieldKey, value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return;
  }

  const history = loadOjtRecentInputHistory();
  const key = getStorageFieldKey(field);
  const existing = history[key].filter((item) => normalizeValue(item) !== normalizeValue(trimmed));
  history[key] = [trimmed, ...existing].slice(0, MAX_HISTORY_ITEMS);
  saveOjtRecentInputHistory(history);
}

export function removeOjtRecentInput(field: OjtInputFieldKey, value: string) {
  const history = loadOjtRecentInputHistory();
  const key = getStorageFieldKey(field);
  history[key] = history[key].filter((item) => normalizeValue(item) !== normalizeValue(value));
  saveOjtRecentInputHistory(history);
  return history[key];
}

export function getMatchingOjtRecentInputs(field: OjtInputFieldKey, query: string) {
  const normalizedQuery = normalizeValue(query);
  const history = getOjtRecentInputs(field);

  if (!normalizedQuery) {
    return history;
  }

  return history.filter((item) => normalizeValue(item).includes(normalizedQuery));
}

// Format date to "Month DD, YYYY" format
export function formatDateForDisplay(dateString: string): string {
  if (!dateString) return "";
  
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "2-digit",
      year: "numeric",
    }).format(date);
  } catch {
    return dateString;
  }
}

// Parse "Month DD, YYYY" back to ISO date string
export function parseDateFromDisplay(displayString: string): string {
  if (!displayString) return "";
  
  try {
    const date = new Date(displayString);
    if (isNaN(date.getTime())) return displayString;
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch {
    return displayString;
  }
}

export function initializeOjtRecentInputsFromRecords(records: OjtStudentRecord[]) {
  const history = loadOjtRecentInputHistory();
  let changed = false;

  // Initialize program history
  if (history.program_history.length === 0) {
    const programs = uniqueValues(records.map((r) => r.program || ""));
    if (programs.length > 0) {
      history.program_history = programs.slice(0, MAX_HISTORY_ITEMS);
      changed = true;
    }
  }

  // Initialize school history
  if (history.school_history.length === 0) {
    const schools = uniqueValues(records.map((r) => r.school || ""));
    if (schools.length > 0) {
      history.school_history = schools.slice(0, MAX_HISTORY_ITEMS);
      changed = true;
    }
  }

  // Initialize ojtHours history
  if (history.ojtHours_history.length === 0) {
    const hours = uniqueValues(records.map((r) => r.ojtHours || "").filter(Boolean));
    if (hours.length > 0) {
      history.ojtHours_history = hours.slice(0, MAX_HISTORY_ITEMS);
      changed = true;
    }
  }

  // Initialize startDate history (formatted)
  if (history.startDate_history.length === 0) {
    const startDates = uniqueValues(
      records.map((r) => r.startDate ? formatDateForDisplay(r.startDate) : "").filter(Boolean)
    );
    if (startDates.length > 0) {
      history.startDate_history = startDates.slice(0, MAX_HISTORY_ITEMS);
      changed = true;
    }
  }

  // Initialize endDate history (formatted)
  if (history.endDate_history.length === 0) {
    const endDates = uniqueValues(
      records.map((r) => r.endDate ? formatDateForDisplay(r.endDate) : "").filter(Boolean)
    );
    if (endDates.length > 0) {
      history.endDate_history = endDates.slice(0, MAX_HISTORY_ITEMS);
      changed = true;
    }
  }

  // Initialize office history
  if (history.office_history.length === 0) {
    const offices = uniqueValues(records.map((r) => r.office || "").filter(Boolean));
    if (offices.length > 0) {
      history.office_history = offices.slice(0, MAX_HISTORY_ITEMS);
      changed = true;
    }
  }

  // Initialize address history
  if (history.address_history.length === 0) {
    const addresses = uniqueValues(records.map((r) => r.address || "").filter(Boolean));
    if (addresses.length > 0) {
      history.address_history = addresses.slice(0, MAX_HISTORY_ITEMS);
      changed = true;
    }
  }

  if (changed) {
    saveOjtRecentInputHistory(history);
  }
}
