import { matchesSearchQuery } from "../../shared/services/searchService.ts";
import { loadJsonRecords, saveJsonRecords } from "../../shared/storage/storageService.ts";
import type { OjtDashboardStats, OjtQrRecord, OjtSavedCertificateRecord, OjtSettings, OjtStudentRecord } from "./types";

const OJT_STUDENTS_KEY = "ojt-students";
const OJT_QR_RECORDS_KEY = "ojt-qr-records";
const OJT_SETTINGS_KEY = "ojt-settings";
const OJT_SAVED_CERTIFICATES_KEY = "ojt-saved-certificates";
const OJT_LAST_VIEWED_CERTIFICATE_IDS_KEY = "ojt-last-viewed-certificate-ids";
export const OJT_DATA_UPDATED_EVENT = "ojt-data-updated";

const DEFAULT_OJT_STUDENTS: OjtStudentRecord[] = [
  {
    id: "ojt-student-1",
    createdAt: "2026-03-01T09:00:00.000Z",
    firstName: "Amber Mikaela",
    lastName: "Infante",
    program: "BS Information Technology",
    school: "Pangasinan State University - Lingayen",
    ojtHours: "486",
    startDate: "2026-01-15",
    endDate: "2026-03-30",
    office: "Provincial Government - ENRO",
    address: "Lingayen, Pangasinan",
  },
  {
    id: "ojt-student-2",
    createdAt: "2026-03-02T10:00:00.000Z",
    firstName: "Judyl",
    lastName: "Camat",
    program: "BS Office Administration",
    school: "Pangasinan State University - Urdaneta",
    ojtHours: "300",
    office: "Provincial Government - HRMDO",
    address: "Urdaneta City, Pangasinan",
  },
];

const DEFAULT_OJT_SETTINGS: OjtSettings = {};

function dispatchOjtUpdate(detail: unknown) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(OJT_DATA_UPDATED_EVENT, { detail }));
  }
}

export function loadOjtStudents() {
  return loadJsonRecords<OjtStudentRecord>(OJT_STUDENTS_KEY, DEFAULT_OJT_STUDENTS);
}

export function saveOjtStudents(records: OjtStudentRecord[]) {
  saveJsonRecords(OJT_STUDENTS_KEY, records);
  dispatchOjtUpdate(records);
}

export function loadOjtQrRecords() {
  return loadJsonRecords<OjtQrRecord>(OJT_QR_RECORDS_KEY, []);
}

export function saveOjtQrRecords(records: OjtQrRecord[]) {
  saveJsonRecords(OJT_QR_RECORDS_KEY, records);
  dispatchOjtUpdate(records);
}

export function loadOjtSettings(): OjtSettings {
  const [settings] = loadJsonRecords<OjtSettings>(OJT_SETTINGS_KEY, [DEFAULT_OJT_SETTINGS]);
  return settings ?? DEFAULT_OJT_SETTINGS;
}

export function saveOjtSettings(settings: OjtSettings) {
  saveJsonRecords(OJT_SETTINGS_KEY, [settings]);
  dispatchOjtUpdate(settings);
}

export function loadSavedOjtCertificates() {
  return loadJsonRecords<OjtSavedCertificateRecord>(OJT_SAVED_CERTIFICATES_KEY, []);
}

export function saveSavedOjtCertificates(records: OjtSavedCertificateRecord[]) {
  saveJsonRecords(OJT_SAVED_CERTIFICATES_KEY, records);
  dispatchOjtUpdate(records);
}

export function loadLastViewedCertificateIds() {
  const [record] = loadJsonRecords<{ ids: string[] }>(OJT_LAST_VIEWED_CERTIFICATE_IDS_KEY, [{ ids: [] }]);
  return Array.isArray(record?.ids) ? record.ids : [];
}

export function saveLastViewedCertificateIds(ids: string[]) {
  saveJsonRecords(OJT_LAST_VIEWED_CERTIFICATE_IDS_KEY, [{ ids }]);
}

export function getStudentDisplayName(student: OjtStudentRecord) {
  const middle = student.middleInitial?.trim();
  return [student.firstName, middle, student.lastName].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

export function filterOjtStudents(
  records: OjtStudentRecord[],
  filters: { search?: string; program?: string; school?: string },
) {
  const normalizedProgram = filters.program?.trim();
  const normalizedSchool = filters.school?.trim();

  return records.filter((record) => {
    if (normalizedProgram && record.program !== normalizedProgram) {
      return false;
    }

    if (normalizedSchool && record.school !== normalizedSchool) {
      return false;
    }

    return matchesSearchQuery(
      [
        getStudentDisplayName(record),
        record.program,
        record.school,
        record.office,
        record.address,
        record.ojtHours,
        record.startDate,
        record.endDate,
      ],
      filters.search ?? "",
    );
  });
}

export function getOjtPrograms(records: OjtStudentRecord[]) {
  return Array.from(
    new Set(records.map((record) => record.program.trim()).filter(Boolean)),
  ).sort((left, right) => left.localeCompare(right));
}

export function getOjtSchools(records: OjtStudentRecord[]) {
  return Array.from(
    new Set(records.map((record) => record.school.trim()).filter(Boolean)),
  ).sort((left, right) => left.localeCompare(right));
}

function rankCounts(values: Array<string | undefined>, limit = 5) {
  const counts = new Map<string, number>();

  for (const value of values) {
    const label = value?.trim();
    if (!label) {
      continue;
    }
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([label, total]) => ({ label, total }))
    .sort((left, right) => right.total - left.total || left.label.localeCompare(right.label))
    .slice(0, limit);
}

export function getOjtStats(students: OjtStudentRecord[], qrRecords: OjtQrRecord[]): OjtDashboardStats {
  return {
    studentCount: students.length,
    qrCodeCount: qrRecords.length,
    schoolCounts: rankCounts(students.map((student) => student.school), Number.MAX_SAFE_INTEGER),
    topPrograms: rankCounts(students.map((student) => student.program)),
    topOffices: rankCounts(students.map((student) => student.office)),
  };
}

export function getLatestQrRecordByKey(records: OjtQrRecord[]) {
  const latestByKey = new Map<string, OjtQrRecord>();

  for (const record of records) {
    const key = `${record.program}|||${record.school}`;
    const current = latestByKey.get(key);
    if (!current || record.year > current.year || record.createdAt > current.createdAt) {
      latestByKey.set(key, record);
    }
  }

  return latestByKey;
}
