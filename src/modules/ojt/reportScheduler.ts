import ExcelJS, { type Row, type Worksheet } from "exceljs";
import { readPersistentValue, writePersistentValue } from "../../app/persistentState";
import { filterOjtStudents, getStudentDisplayName, loadOjtStudents, type OjtStudentRecord } from "./storage";
import { formatDateForDisplay } from "./recentInputHistory";

export interface OjtReportSettings {
  enabled: boolean;
  type: "monthly" | "quarterly";
  dayOfMonth: number;
}

export interface OjtGeneratedReport {
  id: string;
  generatedAt: string;
  type: "monthly" | "quarterly" | "custom";
  period: string;
  recordCount: number;
  content: string;
}

interface OjtReportPayload {
  generatedAt: string;
  reportTypeLabel: "Monthly" | "Quarterly" | "Custom";
  period: string;
  dateRangeLabel: string;
  filters: { search?: string; program?: string; school?: string };
  records: OjtStudentRecord[];
}

const SETTINGS_KEY = "ojt-auto-report-settings";
const REPORTS_KEY = "ojt-auto-report-history";
const OFFICE_NAME = "Human Resource Management and Development Office (HRMDO)";
const REPORT_TITLE = "OJT Certificate Management Report";

export const DEFAULT_OJT_SETTINGS: OjtReportSettings = {
  enabled: false,
  type: "monthly",
  dayOfMonth: 1,
};

export function loadOjtReportSettings(): OjtReportSettings {
  try {
    const raw = readPersistentValue(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_OJT_SETTINGS };
    return { ...DEFAULT_OJT_SETTINGS, ...(JSON.parse(raw) as Partial<OjtReportSettings>) };
  } catch {
    return { ...DEFAULT_OJT_SETTINGS };
  }
}

export function saveOjtReportSettings(settings: OjtReportSettings): void {
  writePersistentValue(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadOjtReports(): OjtGeneratedReport[] {
  try {
    const raw = readPersistentValue(REPORTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveOjtReports(reports: OjtGeneratedReport[]): void {
  writePersistentValue(REPORTS_KEY, JSON.stringify(reports));
}

function quarterInfo(month: number): { label: string; startMonth: number; lastMonth: number } {
  if (month <= 2) return { label: "Q1", startMonth: 0, lastMonth: 2 };
  if (month <= 5) return { label: "Q2", startMonth: 3, lastMonth: 5 };
  if (month <= 8) return { label: "Q3", startMonth: 6, lastMonth: 8 };
  return { label: "Q4", startMonth: 9, lastMonth: 11 };
}

function periodLabel(settings: OjtReportSettings, refDate: Date): string {
  if (settings.type === "monthly") {
    return refDate.toLocaleString("en-US", { month: "long", year: "numeric" });
  }

  const { label } = quarterInfo(refDate.getMonth());
  return `${label} ${refDate.getFullYear()}`;
}

function formatDate(value?: string) {
  if (!value) return "-";
  return formatDateForDisplay(value);
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(value));
}

function formatExplicitRange(start: Date, end: Date) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  return `${formatter.format(start)} - ${formatter.format(end)}`;
}

function computeReportDateRange(
  settings: OjtReportSettings,
  filters: { search?: string; program?: string; school?: string },
  refDate: Date
) {
  if (filters.search || filters.program || filters.school) {
    return {
      type: "custom" as const,
      label: "Current filtered dataset",
    };
  }

  if (settings.type === "monthly") {
    const start = new Date(refDate.getFullYear(), refDate.getMonth(), 1);
    const end = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0);
    return { type: "monthly" as const, label: formatExplicitRange(start, end) };
  }

  const quarter = quarterInfo(refDate.getMonth());
  const start = new Date(refDate.getFullYear(), quarter.startMonth, 1);
  const end = new Date(refDate.getFullYear(), quarter.lastMonth + 1, 0);
  return { type: "quarterly" as const, label: formatExplicitRange(start, end) };
}

function buildOjtReportPayload(
  settings: OjtReportSettings,
  filters: { search?: string; program?: string; school?: string } = {}
): OjtReportPayload {
  const now = new Date();
  const records = filterOjtStudents(loadOjtStudents(), filters);
  const range = computeReportDateRange(settings, filters, now);

  return {
    generatedAt: now.toISOString(),
    reportTypeLabel:
      range.type === "custom"
        ? "Custom"
        : range.type === "quarterly"
          ? "Quarterly"
          : "Monthly",
    period: range.type === "custom" ? "Filtered Records" : periodLabel(settings, now),
    dateRangeLabel: range.label,
    filters,
    records,
  };
}

function parseOjtReportPayload(report: OjtGeneratedReport): OjtReportPayload {
  const parsed = JSON.parse(report.content) as OjtReportPayload | OjtStudentRecord[];

  if (Array.isArray(parsed)) {
    return {
      generatedAt: report.generatedAt,
      reportTypeLabel:
        report.type === "quarterly" ? "Quarterly" : report.type === "custom" ? "Custom" : "Monthly",
      period: report.period,
      dateRangeLabel: report.period,
      filters: {},
      records: parsed,
    };
  }

  return parsed;
}

function addMetadataRow(sheet: Worksheet, rowNumber: number, label: string, value: string) {
  const row = sheet.getRow(rowNumber);
  sheet.mergeCells(`A${rowNumber}:B${rowNumber}`);
  sheet.mergeCells(`C${rowNumber}:F${rowNumber}`);
  row.getCell(1).value = label;
  row.getCell(1).font = { bold: true, name: "Calibri", size: 11, color: { argb: "1F2937" } };
  row.getCell(1).alignment = { horizontal: "left", vertical: "middle" };
  row.getCell(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "F3F4F6" },
  };
  row.getCell(3).value = value;
  row.getCell(3).font = { name: "Calibri", size: 11, color: { argb: "111827" } };
  row.getCell(3).alignment = { horizontal: "left", vertical: "middle" };
  ["A", "B", "C", "D", "E", "F"].forEach((column) => {
    sheet.getCell(`${column}${rowNumber}`).border = {
      top: { style: "thin", color: { argb: "D1D5DB" } },
      left: { style: "thin", color: { argb: "D1D5DB" } },
      bottom: { style: "thin", color: { argb: "D1D5DB" } },
      right: { style: "thin", color: { argb: "D1D5DB" } },
    };
  });
  row.height = 22;
}

function styleTableHeader(row: Row) {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, name: "Calibri", size: 11 };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "1F4E78" },
    };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: false };
    cell.border = {
      top: { style: "thin", color: { argb: "D1D5DB" } },
      left: { style: "thin", color: { argb: "D1D5DB" } },
      bottom: { style: "thin", color: { argb: "D1D5DB" } },
      right: { style: "thin", color: { argb: "D1D5DB" } },
    };
  });
}

function styleSummaryCard(
  sheet: Worksheet,
  startCell: string,
  endCell: string,
  label: string,
  value: number,
  fill: string
) {
  sheet.mergeCells(`${startCell}:${endCell}`);
  const cell = sheet.getCell(startCell);
  cell.value = `${label}\n${value}`;
  cell.font = { bold: true, size: 12, name: "Calibri", color: { argb: "111827" } };
  cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  cell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: fill },
  };
  const [startColumn] = startCell.match(/[A-Z]+/) || ["A"];
  const [startRow] = startCell.match(/\d+/) || ["1"];
  const [endColumn] = endCell.match(/[A-Z]+/) || ["A"];
  const rowNumber = Number(startRow);
  for (let colCode = startColumn.charCodeAt(0); colCode <= endColumn.charCodeAt(0); colCode += 1) {
    const ref = `${String.fromCharCode(colCode)}${rowNumber}`;
    sheet.getCell(ref).border = {
      top: { style: "thin", color: { argb: "D1D5DB" } },
      left: { style: "thin", color: { argb: "D1D5DB" } },
      bottom: { style: "thin", color: { argb: "D1D5DB" } },
      right: { style: "thin", color: { argb: "D1D5DB" } },
    };
  }
  sheet.getRow(rowNumber).height = 38;
}

async function createOjtWorkbookBuffer(report: OjtGeneratedReport) {
  const payload = parseOjtReportPayload(report);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "OJT Certificate Manager";
  workbook.created = new Date(report.generatedAt);
  workbook.modified = new Date();

  const sheet = workbook.addWorksheet("OJT Report", {
    pageSetup: {
      paperSize: 5,
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: {
        left: 0.25,
        right: 0.25,
        top: 0.4,
        bottom: 0.4,
        header: 0.2,
        footer: 0.2,
      },
    },
  });

  sheet.properties.defaultRowHeight = 20;
  sheet.columns = [
    { key: "studentName", width: 30 },
    { key: "program", width: 32 },
    { key: "school", width: 32 },
    { key: "office", width: 28 },
    { key: "ojtHours", width: 12 },
    { key: "startDate", width: 18 },
    { key: "endDate", width: 18 },
    { key: "address", width: 24 },
  ];

  // Title rows
  sheet.mergeCells("A1:H1");
  sheet.mergeCells("A2:H2");
  sheet.mergeCells("A4:F4");
  sheet.getCell("A1").value = OFFICE_NAME;
  sheet.getCell("A2").value = REPORT_TITLE;
  sheet.getCell("A4").value = "Report Metadata";
  sheet.getCell("A1").font = { bold: true, size: 16, name: "Calibri" };
  sheet.getCell("A2").font = { bold: true, size: 14, name: "Calibri" };
  sheet.getCell("A4").font = { bold: true, size: 11, name: "Calibri", color: { argb: "1F2937" } };
  sheet.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };
  sheet.getCell("A2").alignment = { horizontal: "center", vertical: "middle" };
  sheet.getCell("A4").alignment = { horizontal: "left", vertical: "middle" };
  sheet.getCell("A4").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "E5E7EB" },
  };
  sheet.getRow(1).height = 24;
  sheet.getRow(2).height = 22;
  sheet.getRow(4).height = 20;

  // Metadata
  addMetadataRow(sheet, 5, "Report Type", payload.reportTypeLabel);
  addMetadataRow(sheet, 6, "Date Range", payload.dateRangeLabel);
  addMetadataRow(sheet, 7, "Date Generated", formatTimestamp(payload.generatedAt));

  // Summary section
  const uniquePrograms = new Set(payload.records.map((r) => r.program)).size;
  const uniqueSchools = new Set(payload.records.map((r) => r.school)).size;
  const uniqueOffices = new Set(payload.records.map((r) => r.office).filter(Boolean)).size;
  const withHours = payload.records.filter((r) => r.ojtHours).length;
  const withDates = payload.records.filter((r) => r.startDate && r.endDate).length;

  sheet.mergeCells("G4:H4");
  sheet.getCell("G4").value = "Summary";
  sheet.getCell("G4").font = { bold: true, size: 11, name: "Calibri", color: { argb: "1F2937" } };
  sheet.getCell("G4").alignment = { horizontal: "left", vertical: "middle" };
  sheet.getCell("G4").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "E5E7EB" },
  };

  styleSummaryCard(sheet, "G5", "H5", "Total Students", payload.records.length, "DBEAFE");
  styleSummaryCard(sheet, "G6", "H6", "Programs", uniquePrograms, "DCFCE7");
  styleSummaryCard(sheet, "G7", "H7", "Schools", uniqueSchools, "FEF3C7");

  // Detailed records section
  sheet.mergeCells("A9:H9");
  sheet.getCell("A9").value = "Detailed Student Records";
  sheet.getCell("A9").font = { bold: true, size: 11, name: "Calibri", color: { argb: "1F2937" } };
  sheet.getCell("A9").alignment = { horizontal: "left", vertical: "middle" };
  sheet.getCell("A9").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "E5E7EB" },
  };
  sheet.getRow(9).height = 20;

  // Table header
  const headerRow = sheet.getRow(10);
  headerRow.values = [
    "Student Name",
    "Program",
    "School",
    "Office / Assignment",
    "OJT Hours",
    "Start Date",
    "End Date",
    "Address",
  ];
  styleTableHeader(headerRow);
  headerRow.height = 24;

  // Data rows
  payload.records.forEach((record) => {
    const row = sheet.addRow({
      studentName: getStudentDisplayName(record),
      program: record.program,
      school: record.school,
      office: record.office || "-",
      ojtHours: record.ojtHours || "-",
      startDate: formatDate(record.startDate),
      endDate: formatDate(record.endDate),
      address: record.address || "-",
    });

    row.eachCell((cell, colNumber) => {
      cell.font = { name: "Calibri", size: 11 };
      cell.alignment = {
        vertical: "middle",
        horizontal: [5, 6, 7].includes(colNumber) ? "center" : "left",
        wrapText: false,
      };
      cell.border = {
        top: { style: "thin", color: { argb: "E5E7EB" } },
        left: { style: "thin", color: { argb: "E5E7EB" } },
        bottom: { style: "thin", color: { argb: "E5E7EB" } },
        right: { style: "thin", color: { argb: "E5E7EB" } },
      };
    });

    row.height = 22;

    // Highlight missing data
    if (!record.ojtHours) {
      row.getCell(5).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FEE2E2" },
      };
    }

    if (!record.startDate) {
      row.getCell(6).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FEF3C7" },
      };
    }

    if (!record.endDate) {
      row.getCell(7).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FEF3C7" },
      };
    }
  });

  return workbook.xlsx.writeBuffer();
}

function downloadBlob(buffer: ArrayBuffer, filename: string) {
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

async function saveWorkbookInElectron(buffer: ArrayBuffer, filename: string) {
  const electronAPI = window.electronAPI;
  if (!electronAPI?.showSaveDialog || !electronAPI.saveBinaryFile) {
    return false;
  }

  const filePath = await electronAPI.showSaveDialog({
    title: "Save Excel Report",
    defaultPath: filename,
    filters: [{ name: "Excel Workbook", extensions: ["xlsx"] }],
  });

  if (!filePath) {
    return true;
  }

  await electronAPI.saveBinaryFile(filePath, Array.from(new Uint8Array(buffer)));
  return true;
}

export function getOjtNextRunDate(settings: OjtReportSettings): Date | null {
  if (!settings.enabled) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (settings.type === "monthly") {
    const candidate = new Date(today.getFullYear(), today.getMonth(), settings.dayOfMonth);
    if (candidate >= today) return candidate;
    return new Date(today.getFullYear(), today.getMonth() + 1, settings.dayOfMonth);
  }

  const quarters = [
    new Date(today.getFullYear(), 2, settings.dayOfMonth),
    new Date(today.getFullYear(), 5, settings.dayOfMonth),
    new Date(today.getFullYear(), 8, settings.dayOfMonth),
    new Date(today.getFullYear(), 11, settings.dayOfMonth),
  ];

  const future = quarters.find((date) => date >= today);
  if (future) return future;
  return new Date(today.getFullYear() + 1, 2, settings.dayOfMonth);
}

export function generateOjtReport(
  settings: OjtReportSettings,
  filters: { search?: string; program?: string; school?: string } = {}
): OjtGeneratedReport {
  const payload = buildOjtReportPayload(settings, filters);
  const report: OjtGeneratedReport = {
    id: String(Date.now()),
    generatedAt: payload.generatedAt,
    type: payload.reportTypeLabel.toLowerCase() as OjtGeneratedReport["type"],
    period: payload.period,
    recordCount: payload.records.length,
    content: JSON.stringify(payload),
  };

  const history = loadOjtReports();
  saveOjtReports([report, ...history]);
  return report;
}

export function checkAndRunOjt(): OjtGeneratedReport | null {
  const settings = loadOjtReportSettings();
  if (!settings.enabled) return null;

  const next = getOjtNextRunDate(settings);
  if (!next) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextDay = new Date(next);
  nextDay.setHours(0, 0, 0, 0);

  if (nextDay.getTime() !== today.getTime()) return null;

  const history = loadOjtReports();
  const todayStr = today.toISOString().split("T")[0];
  const alreadyRan = history.some(
    (report) => report.generatedAt.startsWith(todayStr) && report.type === settings.type
  );
  if (alreadyRan) return null;

  return generateOjtReport(settings);
}

export async function downloadOjtReport(report: OjtGeneratedReport): Promise<void> {
  const buffer = await createOjtWorkbookBuffer(report);
  const safePeriod = report.period.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "");
  const filename = `ojt-report-${report.type}-${safePeriod || "records"}-${report.generatedAt.split("T")[0]}.xlsx`;
  const arrayBuffer = buffer as ArrayBuffer;
  const savedInElectron = await saveWorkbookInElectron(arrayBuffer, filename);

  if (!savedInElectron) {
    downloadBlob(arrayBuffer, filename);
  }
}
