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
  open: () => {},
};
globalThis.document = {
  addEventListener: () => {},
  removeEventListener: () => {},
  body: { appendChild: () => {}, removeChild: () => {} },
  createElement: () => ({ click: () => {} }),
};
globalThis.CustomEvent = class CustomEvent {
  constructor(type, init = {}) {
    this.type = type;
    this.detail = init.detail;
  }
};
globalThis.URL.createObjectURL = () => "blob:test";
globalThis.URL.revokeObjectURL = () => {};

const persistentStateModule = await import("../src/app/persistentState.ts");
const recordsModule = await import("../src/app/records.ts");
const mergeModule = await import("../src/app/mergeRecords.ts");
const reportModule = await import("../src/app/reportScheduler.ts");

function resetState() {
  localStorage.clear();
  persistentStateModule.clearPersistentCache();
  localStorage.setItem("moa-lo-records", "[]");
}

function record({
  id,
  controlNumber,
  school = "PSU Lingayen",
  course = "BS Computer Science",
  year = 2026,
  status = "Ongoing",
  workflow = "For Review",
  createdAt = "2026-01-01T00:00:00.000Z",
  updatedAt = "2026-01-01T00:00:00.000Z",
  legalOpinionType,
  legalOpinionValue,
  moaType,
  moaValue,
} = {}) {
  return {
    id,
    controlNumber,
    school,
    course,
    year,
    status,
    workflow,
    createdAt,
    updatedAt,
    legalOpinionType,
    legalOpinionValue,
    moaType,
    moaValue,
  };
}

function buildLargeDataset(count) {
  const schools = ["PSU Lingayen", "PSU Binmaley", "PSU Urdaneta"];
  const courses = ["BS Computer Science", "BS Education", "BS Engineering"];
  const machineIds = ["MAIN", "3PUQ", "JEROME", "OL9Z"];
  const records = [];

  for (let index = 1; index <= count; index += 1) {
    const year = 2024 + (index % 3);
    const machineId = machineIds[index % machineIds.length];
    const school = schools[index % schools.length];
    const course = courses[index % courses.length];
    const status = index % 2 === 0 ? "Completed" : "Ongoing";
    const isoDate = `${year}-${String((index % 12) + 1).padStart(2, "0")}-${String(
      (index % 28) + 1
    ).padStart(2, "0")}T08:00:00.000Z`;

    records.push(
      record({
        id: `bulk-${index}`,
        controlNumber: `${String(index).padStart(3, "0")}-${year}-${machineId}-bulk${index}`,
        school,
        course,
        year,
        status,
        workflow: status === "Completed" ? "Approved" : "For Review",
        createdAt: isoDate,
        updatedAt: isoDate,
      })
    );
  }

  return records;
}

test("filterRecords combines school, course, year, status, date, and search with AND logic", () => {
  resetState();

  const records = [
    record({
      id: "1",
      controlNumber: "001-2026-MAIN-alpha",
      school: "PSU Lingayen",
      course: "BS Computer Science",
      year: 2026,
      status: "Completed",
      createdAt: "2026-02-01T00:00:00.000Z",
      updatedAt: "2026-02-01T00:00:00.000Z",
    }),
    record({
      id: "2",
      controlNumber: "002-2026-MAIN-beta",
      school: "PSU Lingayen",
      course: "BS Education",
      year: 2026,
      status: "Completed",
      createdAt: "2026-02-01T00:00:00.000Z",
      updatedAt: "2026-02-01T00:00:00.000Z",
    }),
    record({
      id: "3",
      controlNumber: "003-2025-MAIN-gamma",
      school: "PSU Urdaneta",
      course: "BS Computer Science",
      year: 2025,
      status: "Ongoing",
      createdAt: "2025-02-01T00:00:00.000Z",
      updatedAt: "2025-02-01T00:00:00.000Z",
    }),
  ];

  const results = recordsModule.filterRecords(records, {
    school: "PSU Lingayen",
    course: "BS Computer Science",
    year: 2026,
    status: "Completed",
    dateFrom: "2026-01-01",
    dateTo: "2026-12-31",
    search: "alpha",
  });

  assert.equal(results.length, 1);
  assert.equal(results[0].id, "1");
});

test("validated document stats count invalid links and missing values as missing", async () => {
  resetState();

  const stats = await recordsModule.getValidatedRecordDocumentStats([
    record({
      id: "1",
      controlNumber: "001-2026-MAIN-a",
      legalOpinionType: "link",
      legalOpinionValue: "https://example.com/lo.pdf",
      moaType: "link",
      moaValue: "not-a-url",
    }),
    record({
      id: "2",
      controlNumber: "002-2026-MAIN-b",
      legalOpinionType: "link",
      legalOpinionValue: "",
      moaType: "link",
      moaValue: "https://example.com/moa.pdf",
    }),
  ]);

  assert.deepEqual(stats, {
    missingLegalOpinion: 1,
    missingMoa: 1,
    completeRecords: 0,
  });
});

test("generateReport uses active filters and stores filtered records in report content", () => {
  resetState();
  mergeModule.setMachineId("MAIN");

  recordsModule.saveRecords([
    record({
      id: "1",
      controlNumber: "001-2026-MAIN-a",
      school: "PSU Lingayen",
      course: "BS Computer Science",
      year: 2026,
    }),
    record({
      id: "2",
      controlNumber: "002-2026-MAIN-b",
      school: "PSU Binmaley",
      course: "BS Education",
      year: 2026,
    }),
  ]);

  recordsModule.saveActiveRecordFilters({ school: "PSU Lingayen" });
  const report = reportModule.generateReport(reportModule.DEFAULT_SETTINGS);
  const payload = JSON.parse(report.content);

  assert.equal(report.recordCount, 1);
  assert.equal(payload.records.length, 1);
  assert.equal(payload.records[0].school, "PSU Lingayen");
  assert.equal(payload.reportTypeLabel, "Custom");
});

test("importRecordsFromJSON reports malformed files without crashing", async () => {
  resetState();

  const result = await mergeModule.importRecordsFromJSON("{bad json");
  assert.equal(result.imported, 0);
  assert.equal(result.controlNumbersAdjusted, 0);
  assert.equal(result.errors.length, 1);
  assert.match(result.errors[0], /Failed to parse JSON/);
});

test("importRecordsFromJSON handles 1000 records while keeping control numbers globally unique", async () => {
  resetState();
  mergeModule.setMachineId("MAIN");

  const largeDataset = buildLargeDataset(1000);
  const result = await mergeModule.importRecordsFromJSON(JSON.stringify(largeDataset));

  assert.equal(result.imported, 1000);

  const loaded = recordsModule.loadRecords();
  assert.equal(loaded.length, 1000);

  const sequences = loaded.map((item) => Number(item.controlNumber.split("-")[0]));
  assert.equal(new Set(sequences).size, 1000);
  assert.equal(Math.min(...sequences), 1);
  assert.equal(Math.max(...sequences), 1000);

  const filtered = recordsModule.filterRecords(loaded, {
    school: "PSU Lingayen",
    course: "BS Computer Science",
    year: 2026,
    status: "Ongoing",
    search: "bulk",
  });

  const expected = largeDataset.filter(
    (item) =>
      item.school === "PSU Lingayen" &&
      item.course === "BS Computer Science" &&
      item.year === 2026 &&
      item.status === "Ongoing"
  ).length;

  assert.equal(filtered.length, expected);
});
