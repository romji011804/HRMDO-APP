import { loadRecords, saveRecords } from "./records.ts";
import type { RecordItem } from "./records.ts";
import { readPersistentValue, writePersistentValue } from "./persistentState.ts";
import {
  exportStoredFile,
  importStoredFile,
  type ExportableStoredFile,
} from "./fileStorage.ts";

export interface MergeResult {
  imported: number;
  duplicates: number;
  idsRegenerated: number;
  controlNumbersAdjusted: number;
  errors: string[];
}

interface PortableRecordExport {
  version: 2;
  records: Array<
    RecordItem & {
      embeddedFiles?: {
        moa?: ExportableStoredFile;
        legalOpinion?: ExportableStoredFile;
      };
    }
  >;
}

function normalizeMachineId(id: string): string {
  return id.trim().replace(/\s+/g, "").toUpperCase().substring(0, 50);
}

export function getMachineId(): string {
  let machineId = readPersistentValue("machine-id");
  if (!machineId) {
    machineId = Math.random().toString(36).substring(2, 6).toUpperCase();
    writePersistentValue("machine-id", machineId);
  }
  return normalizeMachineId(machineId);
}

export function setMachineId(newId: string): boolean {
  const normalized = normalizeMachineId(newId);
  if (normalized.length < 2) return false;
  writePersistentValue("machine-id", normalized);
  return true;
}

export function isFromThisMachine(controlNumber: string): boolean {
  const machineId = getMachineId();
  const escapedId = machineId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`^\\d+-\\d{4}-(${escapedId})-`);
  return regex.test(controlNumber);
}

export function generateRecordId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function counterKey(): string {
  return "cn-seq-global";
}

function readCounter(key: string): number {
  return parseInt(readPersistentValue(key) ?? "0", 10) || 0;
}

function writeCounter(key: string, value: number): void {
  writePersistentValue(key, String(value));
}

function getLowestAvailableSequence(usedSequences: Set<number>) {
  let candidate = 1;
  while (usedSequences.has(candidate)) {
    candidate += 1;
  }
  return candidate;
}

function parseControlNumber(controlNumber: string) {
  const currentFormat = controlNumber.match(/^(\d+)-(\d{4})-([^-]+)-(.+)$/);
  if (currentFormat) {
    return {
      sequence: parseInt(currentFormat[1], 10),
      year: parseInt(currentFormat[2], 10),
      machineId: normalizeMachineId(currentFormat[3]),
      recordId: currentFormat[4],
    };
  }

  const legacyFormat = controlNumber.match(/^MOA-(\d{4})-([^-]+)-(\d+)$/i);
  if (legacyFormat) {
    return {
      sequence: parseInt(legacyFormat[3], 10),
      year: parseInt(legacyFormat[1], 10),
      machineId: normalizeMachineId(legacyFormat[2]),
      recordId: "legacy",
    };
  }

  return null;
}

function generateControlNumberForScope(
  records: RecordItem[],
  recordId: string,
  year: number,
  machineId: string
): string {
  const key = counterKey();
  const usedSequences = new Set<number>();
  const maxFromRecords = records.reduce((max, record) => {
    const parsed = parseControlNumber(record.controlNumber);
    if (!parsed) {
      return max;
    }
    usedSequences.add(parsed.sequence);
    return Math.max(max, parsed.sequence);
  }, 0);

  const next = getLowestAvailableSequence(usedSequences);
  writeCounter(key, Math.max(readCounter(key), maxFromRecords, next));

  return `${String(next).padStart(3, "0")}-${year}-${machineId}-${recordId}`;
}

export function generateControlNumber(records: RecordItem[], recordId: string): string {
  const machineId = getMachineId();
  const year = new Date().getFullYear();
  return generateControlNumberForScope(records, recordId, year, machineId);
}

export function syncSequenceCounters(importedRecords: RecordItem[]): void {
  for (const record of importedRecords) {
    const parsed = parseControlNumber(record.controlNumber);
    if (!parsed) continue;
    const key = counterKey();
    const seq = parsed.sequence;
    if (seq > readCounter(key)) {
      writeCounter(key, seq);
    }
  }
}

export function mergeRecords(importedRecords: RecordItem[]): MergeResult {
  const existingRecords = loadRecords();
  const result: MergeResult = {
    imported: 0,
    duplicates: 0,
    idsRegenerated: 0,
    controlNumbersAdjusted: 0,
    errors: [],
  };

  const existingIdSet = new Set(existingRecords.map((r) => r.id));
  const existingCnSet = new Set(existingRecords.map((r) => r.controlNumber));
  const running: RecordItem[] = [...existingRecords];
  const recordsToAdd: RecordItem[] = [];

  for (const raw of importedRecords) {
    try {
      if (!raw.controlNumber) {
        result.errors.push(`Skipped: missing control number (id=${raw.id ?? "?"})`);
        continue;
      }

      let record: RecordItem = { ...raw };
      const importedScope = parseControlNumber(record.controlNumber);

      const hasValidId = typeof record.id === "string" && record.id.trim() !== "";
      if (!hasValidId || existingIdSet.has(record.id)) {
        const originalId = record.id;
        let newId = generateRecordId();
        while (existingIdSet.has(newId)) {
          newId = generateRecordId();
        }

        const newCn = importedScope
          ? generateControlNumberForScope(
              running,
              newId,
              importedScope.year,
              importedScope.machineId
            )
          : generateControlNumber(running, newId);

        result.idsRegenerated += 1;
        result.controlNumbersAdjusted += 1;
        result.errors.push(
          `ID conflict: "${originalId}" -> "${newId}" | CN: "${record.controlNumber}" -> "${newCn}"`
        );
        record = { ...record, id: newId, controlNumber: newCn };
      }
      existingIdSet.add(record.id);

      if (existingCnSet.has(record.controlNumber)) {
        const originalCn = record.controlNumber;
        const currentScope = parseControlNumber(record.controlNumber);
        const newCn = currentScope
          ? generateControlNumberForScope(
              running,
              record.id,
              currentScope.year,
              currentScope.machineId
            )
          : generateControlNumber(running, record.id);

        result.controlNumbersAdjusted += 1;
        result.errors.push(
          `CN conflict: "${originalCn}" -> "${newCn}" (id: ${record.id})`
        );
        record = { ...record, controlNumber: newCn };
      }

      existingCnSet.add(record.controlNumber);
      recordsToAdd.push(record);
      running.push(record);
      result.imported += 1;
    } catch (error) {
      result.errors.push(`Error processing record (id=${raw.id ?? "?"}): ${error}`);
    }
  }

  if (recordsToAdd.length > 0) {
    saveRecords([...existingRecords, ...recordsToAdd]);
    syncSequenceCounters(recordsToAdd);
  }

  return result;
}

async function embedRecordFiles(record: RecordItem) {
  const embeddedFiles: {
    moa?: ExportableStoredFile;
    legalOpinion?: ExportableStoredFile;
  } = {};

  if (record.moaType === "file" && record.moaValue?.startsWith("idb:")) {
    const exportedMoa = await exportStoredFile(record.moaValue);
    if (exportedMoa) {
      embeddedFiles.moa = exportedMoa;
    }
  }

  if (
    record.legalOpinionType === "file" &&
    record.legalOpinionValue?.startsWith("idb:")
  ) {
    const exportedLo = await exportStoredFile(record.legalOpinionValue);
    if (exportedLo) {
      embeddedFiles.legalOpinion = exportedLo;
    }
  }

  return Object.keys(embeddedFiles).length > 0
    ? { ...record, embeddedFiles }
    : record;
}

export async function exportRecordsToJSON(records: RecordItem[] = loadRecords()): Promise<string> {
  const exportedRecords = await Promise.all(records.map(embedRecordFiles));
  const payload: PortableRecordExport = {
    version: 2,
    records: exportedRecords,
  };
  return JSON.stringify(payload, null, 2);
}

async function hydrateImportedRecords(
  importedRecords: Array<
    RecordItem & {
      embeddedFiles?: {
        moa?: ExportableStoredFile;
        legalOpinion?: ExportableStoredFile;
      };
    }
  >
) {
  return Promise.all(
    importedRecords.map(async (record) => {
      let hydratedRecord: RecordItem = { ...record };

      if (record.embeddedFiles?.moa) {
        hydratedRecord = {
          ...hydratedRecord,
          moaType: "file",
          moaValue: await importStoredFile(record.embeddedFiles.moa),
        };
      }

      if (record.embeddedFiles?.legalOpinion) {
        hydratedRecord = {
          ...hydratedRecord,
          legalOpinionType: "file",
          legalOpinionValue: await importStoredFile(record.embeddedFiles.legalOpinion),
        };
      }

      delete (hydratedRecord as Record<string, unknown>).embeddedFiles;
      return hydratedRecord;
    })
  );
}

export async function importRecordsFromJSON(jsonString: string): Promise<MergeResult> {
  try {
    const parsed = JSON.parse(jsonString) as PortableRecordExport | RecordItem[];
    const importedRecords = Array.isArray(parsed) ? parsed : parsed.records;

    if (!Array.isArray(importedRecords)) {
      return {
        imported: 0,
        duplicates: 0,
        idsRegenerated: 0,
        controlNumbersAdjusted: 0,
        errors: ["Invalid JSON format: expected an array of records"],
      };
    }

    const hydratedRecords = await hydrateImportedRecords(importedRecords);
    return mergeRecords(hydratedRecords);
  } catch (error) {
    return {
      imported: 0,
      duplicates: 0,
      idsRegenerated: 0,
      controlNumbersAdjusted: 0,
      errors: [`Failed to parse JSON: ${error}`],
    };
  }
}
