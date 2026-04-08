import { loadOjtStudents, saveOjtStudents, getStudentDisplayName } from "./storage";
import type { OjtStudentRecord } from "./types";

export interface OjtMergeResult {
  imported: number;
  duplicates: number;
  skipped: number;
  errors: string[];
  duplicateDetails: Array<{
    name: string;
    school: string;
    reason: string;
  }>;
}

interface PortableOjtExport {
  version: 1;
  students: OjtStudentRecord[];
}

/**
 * Check if two OJT student records are duplicates based on key fields
 */
function isDuplicateStudent(
  existing: OjtStudentRecord,
  incoming: OjtStudentRecord
): boolean {
  const nameMatch =
    existing.firstName.trim().toLowerCase() === incoming.firstName.trim().toLowerCase() &&
    existing.lastName.trim().toLowerCase() === incoming.lastName.trim().toLowerCase() &&
    (existing.middleInitial?.trim().toLowerCase() || "") ===
      (incoming.middleInitial?.trim().toLowerCase() || "");

  const schoolMatch =
    existing.school.trim().toLowerCase() === incoming.school.trim().toLowerCase();

  const officeMatch =
    (existing.office?.trim().toLowerCase() || "") ===
    (incoming.office?.trim().toLowerCase() || "");

  const startDateMatch =
    (existing.startDate?.trim() || "") === (incoming.startDate?.trim() || "");

  const endDateMatch =
    (existing.endDate?.trim() || "") === (incoming.endDate?.trim() || "");

  // A record is a duplicate if name + school + office match
  // OR if name + school + dates match
  return (
    nameMatch &&
    schoolMatch &&
    (officeMatch || (startDateMatch && endDateMatch && startDateMatch !== ""))
  );
}

/**
 * Generate a new unique ID for OJT student
 */
function generateOjtStudentId(): string {
  return `ojt-student-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Merge imported OJT student records with existing ones
 */
export function mergeOjtStudents(importedStudents: OjtStudentRecord[]): OjtMergeResult {
  const existingStudents = loadOjtStudents();
  const result: OjtMergeResult = {
    imported: 0,
    duplicates: 0,
    skipped: 0,
    errors: [],
    duplicateDetails: [],
  };

  const studentsToAdd: OjtStudentRecord[] = [];

  for (const incoming of importedStudents) {
    try {
      // Validate required fields
      if (!incoming.firstName?.trim() || !incoming.lastName?.trim()) {
        result.skipped += 1;
        result.errors.push(
          `Skipped: Missing required name fields (${incoming.firstName || "?"} ${incoming.lastName || "?"})`
        );
        continue;
      }

      if (!incoming.school?.trim()) {
        result.skipped += 1;
        result.errors.push(
          `Skipped: Missing school for ${getStudentDisplayName(incoming)}`
        );
        continue;
      }

      // Check for duplicates
      const duplicate = existingStudents.find((existing) =>
        isDuplicateStudent(existing, incoming)
      );

      if (duplicate) {
        result.duplicates += 1;
        result.duplicateDetails.push({
          name: getStudentDisplayName(incoming),
          school: incoming.school,
          reason: "Matching name, school, and office/dates",
        });
        continue;
      }

      // Also check against records we're about to add
      const duplicateInBatch = studentsToAdd.find((existing) =>
        isDuplicateStudent(existing, incoming)
      );

      if (duplicateInBatch) {
        result.duplicates += 1;
        result.duplicateDetails.push({
          name: getStudentDisplayName(incoming),
          school: incoming.school,
          reason: "Duplicate within import batch",
        });
        continue;
      }

      // Generate new ID and timestamp
      const newStudent: OjtStudentRecord = {
        ...incoming,
        id: generateOjtStudentId(),
        createdAt: new Date().toISOString(),
      };

      studentsToAdd.push(newStudent);
      result.imported += 1;
    } catch (error) {
      result.errors.push(
        `Error processing student ${incoming.firstName} ${incoming.lastName}: ${error}`
      );
      result.skipped += 1;
    }
  }

  if (studentsToAdd.length > 0) {
    saveOjtStudents([...existingStudents, ...studentsToAdd]);
  }

  return result;
}

/**
 * Export a CSV template with headers for easy data entry
 */
export function exportOjtStudentsCSVTemplate(): string {
  const headers = [
    "firstName",
    "middleInitial",
    "lastName",
    "program",
    "school",
    "ojtHours",
    "startDate",
    "endDate",
    "office",
    "address",
  ];

  const sampleRow = [
    "Juan",
    "D",
    "Cruz",
    "BS Information Technology",
    "Pangasinan State University",
    "486",
    "2026-01-15",
    "2026-03-30",
    "Provincial Government - IT Department",
    "Lingayen, Pangasinan",
  ];

  return [headers.join(","), sampleRow.join(",")].join("\n");
}

/**
 * Export OJT students to CSV format
 */
export function exportOjtStudentsToCSV(students: OjtStudentRecord[] = loadOjtStudents()): string {
  const headers = [
    "firstName",
    "middleInitial",
    "lastName",
    "program",
    "school",
    "ojtHours",
    "startDate",
    "endDate",
    "office",
    "address",
  ];

  const rows = students.map((student) => [
    student.firstName || "",
    student.middleInitial || "",
    student.lastName || "",
    student.program || "",
    student.school || "",
    student.ojtHours || "",
    student.startDate || "",
    student.endDate || "",
    student.office || "",
    student.address || "",
  ]);

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
}

/**
 * Export OJT students to JSON format
 */
export function exportOjtStudentsToJSON(students: OjtStudentRecord[] = loadOjtStudents()): string {
  // Remove IDs from export - they will be regenerated on import
  const exportStudents = students.map((student) => {
    const { id, createdAt, ...rest } = student;
    return rest;
  });

  const payload: PortableOjtExport = {
    version: 1,
    students: exportStudents as OjtStudentRecord[],
  };

  return JSON.stringify(payload, null, 2);
}

/**
 * Import OJT students from JSON
 */
export function importOjtStudentsFromJSON(jsonString: string): OjtMergeResult {
  try {
    const parsed = JSON.parse(jsonString) as PortableOjtExport | OjtStudentRecord[];

    let importedStudents: OjtStudentRecord[];

    if (Array.isArray(parsed)) {
      // Legacy format: direct array
      importedStudents = parsed;
    } else if (parsed.version === 1 && Array.isArray(parsed.students)) {
      // New format with version
      importedStudents = parsed.students;
    } else {
      return {
        imported: 0,
        duplicates: 0,
        skipped: 0,
        errors: ["Invalid JSON format: expected an array of students or versioned export"],
        duplicateDetails: [],
      };
    }

    if (!Array.isArray(importedStudents)) {
      return {
        imported: 0,
        duplicates: 0,
        skipped: 0,
        errors: ["Invalid JSON format: students data is not an array"],
        duplicateDetails: [],
      };
    }

    return mergeOjtStudents(importedStudents);
  } catch (error) {
    return {
      imported: 0,
      duplicates: 0,
      skipped: 0,
      errors: [`Failed to parse JSON: ${error}`],
      duplicateDetails: [],
    };
  }
}

/**
 * Parse CSV content and convert to OJT student records
 */
export function parseOjtStudentsFromCSV(csvContent: string): OjtStudentRecord[] {
  const lines = csvContent.split(/\r?\n/).filter((line) => line.trim());

  if (lines.length === 0) {
    throw new Error("CSV file is empty");
  }

  // Parse header
  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());

  // Map common header variations to our field names
  const fieldMap: Record<string, keyof OjtStudentRecord> = {
    firstname: "firstName",
    "first name": "firstName",
    "first_name": "firstName",
    lastname: "lastName",
    "last name": "lastName",
    "last_name": "lastName",
    middleinitial: "middleInitial",
    "middle initial": "middleInitial",
    "middle_initial": "middleInitial",
    mi: "middleInitial",
    program: "program",
    course: "program",
    school: "school",
    university: "school",
    ojthours: "ojtHours",
    "ojt hours": "ojtHours",
    "ojt_hours": "ojtHours",
    hours: "ojtHours",
    startdate: "startDate",
    "start date": "startDate",
    "start_date": "startDate",
    enddate: "endDate",
    "end date": "endDate",
    "end_date": "endDate",
    office: "office",
    company: "office",
    address: "address",
    location: "address",
  };

  const students: OjtStudentRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(",").map((v) => v.trim());
    const student: Partial<OjtStudentRecord> = {};

    for (let j = 0; j < header.length && j < values.length; j++) {
      const fieldName = fieldMap[header[j]];
      if (fieldName && values[j]) {
        (student as Record<string, string>)[fieldName] = values[j];
      }
    }

    // Only add if we have minimum required fields
    if (student.firstName && student.lastName && student.school) {
      students.push(student as OjtStudentRecord);
    }
  }

  return students;
}

/**
 * Import OJT students from CSV
 */
export function importOjtStudentsFromCSV(csvContent: string): OjtMergeResult {
  try {
    const students = parseOjtStudentsFromCSV(csvContent);

    if (students.length === 0) {
      return {
        imported: 0,
        duplicates: 0,
        skipped: 0,
        errors: ["No valid student records found in CSV"],
        duplicateDetails: [],
      };
    }

    return mergeOjtStudents(students);
  } catch (error) {
    return {
      imported: 0,
      duplicates: 0,
      skipped: 0,
      errors: [`Failed to parse CSV: ${error}`],
      duplicateDetails: [],
    };
  }
}
