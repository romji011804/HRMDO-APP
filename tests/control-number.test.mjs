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
globalThis.document = {
  addEventListener: () => {},
  removeEventListener: () => {},
};
globalThis.CustomEvent = class CustomEvent {
  constructor(type, init = {}) {
    this.type = type;
    this.detail = init.detail;
  }
};

const recordsModule = await import("../src/app/records.ts");
const mergeModule = await import("../src/app/mergeRecords.ts");
const persistentStateModule = await import("../src/app/persistentState.ts");

function resetState() {
  localStorage.clear();
  persistentStateModule.clearPersistentCache();
  localStorage.setItem("moa-lo-records", "[]");
}

function record(id, controlNumber) {
  return {
    id,
    controlNumber,
    school: "PSU Lingayen",
    course: "BS Computer Science",
    year: 2026,
    status: "Ongoing",
    workflow: "For Review",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

test("add uses the lowest missing yearly sequence for the current machine", () => {
  resetState();
  mergeModule.setMachineId("JEROME");

  const existing = [
    record("a", "001-2026-JEROME-a"),
    record("b", "004-2026-JEROME-b"),
  ];

  const next = mergeModule.generateControlNumber(existing, "newrec");
  assert.equal(next, "002-2026-JEROME-newrec");
});

test("save/load keeps existing records stable after a deletion gap", () => {
  resetState();
  mergeModule.setMachineId("JEROME");

  const records = [
    record("a", "001-2026-JEROME-a"),
    record("b", "002-2026-JEROME-b"),
    record("d", "004-2026-JEROME-d"),
  ];

  recordsModule.saveRecords(records);
  const loaded = recordsModule.loadRecords();

  assert.deepEqual(
    loaded.map((item) => item.controlNumber),
    ["001-2026-JEROME-a", "002-2026-JEROME-b", "004-2026-JEROME-d"]
  );

  const next = mergeModule.generateControlNumber(loaded, "gapfill");
  assert.equal(next, "003-2026-JEROME-gapfill");
});

test("control numbers stay globally unique even across different years", () => {
  resetState();
  mergeModule.setMachineId("MAIN");

  recordsModule.saveRecords([
    {
      ...record("first", "001-2026-MAIN-a1b2c3d"),
      year: 2026,
    },
    {
      ...record("second", "002-2026-MAIN-b2c3d4e"),
      year: 2026,
    },
    {
      ...record("older", "003-2025-MAIN-c3d4e5f"),
      year: 2025,
      createdAt: "2025-01-01T00:00:00.000Z",
      updatedAt: "2025-01-01T00:00:00.000Z",
    },
    {
      ...record("newer", "003-2026-OL9Z-emc0hau"),
      year: 2026,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
  ]);

  const loaded = recordsModule.loadRecords();
  assert.deepEqual(
    loaded.map((item) => item.controlNumber),
    [
      "001-2026-MAIN-a1b2c3d",
      "002-2026-MAIN-b2c3d4e",
      "003-2025-MAIN-c3d4e5f",
      "004-2026-OL9Z-emc0hau",
    ]
  );
});

test("import rebalances duplicate yearly sequences while preserving imported machine IDs", async () => {
  resetState();
  mergeModule.setMachineId("JEROME");

  recordsModule.saveRecords([
    record("jer-1", "001-2026-JEROME-oojtwfb"),
    record("jer-2", "004-2026-JEROME-hf8lufd"),
  ]);

  const result = await mergeModule.importRecordsFromJSON(
    JSON.stringify([
    record("imp-1", "005-2026-3PUQ-sme11sk"),
    record("imp-2", "002-2026-3PUQ-nkuy9gp"),
    record("imp-3", "001-2026-3PUQ-a99wtt9"),
  ])
  );

  assert.equal(result.imported, 3);

  const loaded = recordsModule.loadRecords();
  assert.deepEqual(
    loaded.map((item) => item.controlNumber),
    [
      "001-2026-JEROME-oojtwfb",
      "004-2026-JEROME-hf8lufd",
      "005-2026-3PUQ-sme11sk",
      "002-2026-3PUQ-nkuy9gp",
      "003-2026-3PUQ-a99wtt9",
    ]
  );
});

test("duplicate import regenerates control numbers but keeps imported machine ID", async () => {
  resetState();
  mergeModule.setMachineId("JEROME");

  const firstImport = [record("imp-1", "001-2026-3PUQ-alpha")];
  await mergeModule.importRecordsFromJSON(JSON.stringify(firstImport));
  const second = await mergeModule.importRecordsFromJSON(JSON.stringify(firstImport));

  assert.equal(second.idsRegenerated, 1);
  assert.equal(second.controlNumbersAdjusted, 1);

  const loaded = recordsModule.loadRecords();
  assert.equal(loaded.length, 2);
  assert.equal(loaded[0].controlNumber, "001-2026-3PUQ-alpha");
  assert.match(loaded[1].controlNumber, /^002-2026-3PUQ-/);
});

test("legacy imported control numbers preserve machine ID during normalization", () => {
  resetState();
  mergeModule.setMachineId("JEROME");

  recordsModule.saveRecords([
    record("jer-1", "001-2026-JEROME-local"),
    record("legacy-1", "MOA-2026-3PUQ-001"),
  ]);

  const loaded = recordsModule.loadRecords();
  assert.equal(loaded[0].controlNumber, "001-2026-JEROME-local");
  assert.equal(loaded[1].controlNumber, "002-2026-3PUQ-legacy-1");
});
