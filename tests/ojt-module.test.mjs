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
  dispatchEvent: () => true,
  addEventListener: () => {},
  removeEventListener: () => {},
};
globalThis.CustomEvent = class CustomEvent {
  constructor(type, init = {}) {
    this.type = type;
    this.detail = init.detail;
  }
};

test("OJT students persist independently from MOA/LO records", async () => {
  const { loadOjtStudents, saveOjtStudents } = await import("../src/modules/ojt/storage.ts");
  localStorage.clear();
  const records = loadOjtStudents();
  assert.ok(records.length >= 2);

  saveOjtStudents([
    {
      id: "ojt-student-x",
      createdAt: "2026-04-01T00:00:00.000Z",
      firstName: "Test",
      lastName: "Student",
      program: "BSIT",
      school: "PSU Lingayen",
      office: "HRMDO",
    },
  ]);

  const saved = loadOjtStudents();
  assert.equal(saved.length, 1);
  assert.equal(saved[0].firstName, "Test");
  assert.equal(saved[0].lastName, "Student");
});

test("OJT search filters by student, office, school, and program", async () => {
  const { filterOjtStudents } = await import("../src/modules/ojt/storage.ts");
  const records = [
    {
      id: "1",
      createdAt: "2026-04-01T00:00:00.000Z",
      firstName: "Amber",
      lastName: "Infante",
      office: "ENRO",
      school: "PNHS",
      program: "STEM",
    },
    {
      id: "2",
      createdAt: "2026-04-01T00:00:00.000Z",
      firstName: "Judyl",
      lastName: "Caramat",
      office: "HRMDO",
      school: "PSU Lingayen",
      program: "BSIT",
    },
  ];

  const results = filterOjtStudents(records, { search: "HRMDO" });
  assert.equal(results.length, 1);
  assert.equal(results[0].lastName, "Caramat");
});

test("OJT stats summarize students, qr records, programs, offices, and schools", async () => {
  const { getOjtStats } = await import("../src/modules/ojt/storage.ts");
  const stats = getOjtStats([
    {
      id: "1",
      createdAt: "2026-04-01T00:00:00.000Z",
      firstName: "A",
      lastName: "Student",
      office: "ENRO",
      school: "PSU",
      program: "BSIT",
    },
    {
      id: "2",
      createdAt: "2026-04-01T00:00:00.000Z",
      firstName: "B",
      lastName: "Student",
      office: "HRMDO",
      school: "PSU",
      program: "BSIT",
    },
  ], [
    {
      id: "qr-1",
      createdAt: "2026-04-01T00:00:00.000Z",
      program: "BSIT",
      school: "PSU",
      year: 2026,
      fileUrl: "https://example.com/file",
    },
  ]);

  assert.equal(stats.studentCount, 2);
  assert.equal(stats.qrCodeCount, 1);
  assert.equal(stats.schoolCounts[0].label, "PSU");
  assert.equal(stats.schoolCounts[0].total, 2);
  assert.equal(stats.topPrograms[0].label, "BSIT");
  assert.equal(stats.topPrograms[0].total, 2);
  assert.equal(stats.topOffices.length, 2);
});

test("saved OJT certificates persist with certificate details", async () => {
  const { loadSavedOjtCertificates, saveSavedOjtCertificates } = await import("../src/modules/ojt/storage.ts");
  localStorage.clear();

  saveSavedOjtCertificates([
    {
      id: "cert-1",
      studentId: "student-1",
      savedAt: "2026-04-06T00:00:00.000Z",
      studentName: "PRINCESS QUEENCY C. GARCIA",
      school: "PHINMA - University of Pangasinan",
      hoursLabel: "500 HOURS ON THE JOB AND WORK IMMERSION TRAINING",
      dateRangeLabel: "from November 12, 2025 to February 27, 2026",
      officeLine: "at the Provincial Tourism and Cultural Affairs Office, Provincial Capitol Compound, Lingayen, Pangasinan",
      issuedLine: "Given this 6th day of April 2026.",
      templateFileName: "single_template.jpg",
      qrIncluded: true,
    },
  ]);

  const saved = loadSavedOjtCertificates();
  assert.equal(saved.length, 1);
  assert.equal(saved[0].studentName, "PRINCESS QUEENCY C. GARCIA");
  assert.equal(saved[0].templateFileName, "single_template.jpg");
  assert.equal(saved[0].qrIncluded, true);
});

test("OJT certificate subtitle includes program and school", async () => {
  const { formatCertificateSubtitle } = await import("../src/modules/ojt/documentService.ts");

  const subtitle = formatCertificateSubtitle({
    program: "Bachelor of Science in Computer Science",
    school: "Pangasinan State University - Lingayen Campus",
  });

  assert.equal(
    subtitle,
    "Bachelor of Science in Computer Science, Pangasinan State University - Lingayen Campus",
  );
});
