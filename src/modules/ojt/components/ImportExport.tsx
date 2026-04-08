import { useMemo, useState } from "react";
import {
  Download,
  Upload,
  AlertCircle,
  CheckCircle,
  Info,
  FileCheck,
  Search,
  Filter,
  GraduationCap,
  School,
  X,
  FileSpreadsheet,
} from "lucide-react";
import {
  exportOjtStudentsToJSON,
  exportOjtStudentsToCSV,
  exportOjtStudentsCSVTemplate,
  importOjtStudentsFromJSON,
  importOjtStudentsFromCSV,
  type OjtMergeResult,
} from "../mergeStudents";
import {
  loadOjtStudents,
  filterOjtStudents,
  getOjtPrograms,
  getOjtSchools,
  getStudentDisplayName,
} from "../storage";
import type { OjtStudentRecord } from "../types";

interface OjtStudentFilters {
  search: string;
  program: string;
  school: string;
}

const EMPTY_FILTERS: OjtStudentFilters = {
  search: "",
  program: "",
  school: "",
};

export function OjtImportExport() {
  const [importResult, setImportResult] = useState<OjtMergeResult | null>(null);
  const [showSelectStudents, setShowSelectStudents] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [exportFilters, setExportFilters] = useState<OjtStudentFilters>(EMPTY_FILTERS);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<"json" | "csv">("json");

  const allStudents = loadOjtStudents();
  const programs = useMemo(() => getOjtPrograms(allStudents), [allStudents]);
  const schools = useMemo(() => getOjtSchools(allStudents), [allStudents]);

  const exportableStudents = useMemo(
    () => filterOjtStudents(allStudents, exportFilters),
    [allStudents, exportFilters]
  );

  const hasActiveFilters = useMemo(
    () => Boolean(exportFilters.search || exportFilters.program || exportFilters.school),
    [exportFilters]
  );

  const handleExportAll = () => {
    setIsExporting(true);
    try {
      if (exportFormat === "csv") {
        const csv = exportOjtStudentsToCSV();
        downloadFile(csv, `ojt-students-${new Date().toISOString().split("T")[0]}.csv`, "text/csv");
      } else {
        const json = exportOjtStudentsToJSON();
        downloadFile(json, `ojt-students-${new Date().toISOString().split("T")[0]}.json`, "application/json");
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportSelected = () => {
    setExportFilters(EMPTY_FILTERS);
    setShowSelectStudents(true);
  };

  const handleConfirmExport = () => {
    const studentsToExport = allStudents.filter((student) =>
      selectedStudents.has(student.id)
    );
    setIsExporting(true);
    try {
      if (exportFormat === "csv") {
        const csv = exportOjtStudentsToCSV(studentsToExport);
        downloadFile(
          csv,
          `ojt-students-selected-${new Date().toISOString().split("T")[0]}.csv`,
          "text/csv"
        );
      } else {
        const json = exportOjtStudentsToJSON(studentsToExport);
        downloadFile(
          json,
          `ojt-students-selected-${new Date().toISOString().split("T")[0]}.json`,
          "application/json"
        );
      }
      setShowSelectStudents(false);
      setSelectedStudents(new Set());
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    const template = exportOjtStudentsCSVTemplate();
    downloadFile(template, "ojt-students-template.csv", "text/csv");
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleStudentSelection = (studentId: string) => {
    const newSelection = new Set(selectedStudents);
    if (newSelection.has(studentId)) {
      newSelection.delete(studentId);
    } else {
      newSelection.add(studentId);
    }
    setSelectedStudents(newSelection);
  };

  const toggleSelectAll = () => {
    const visibleIds = exportableStudents.map((student) => student.id);
    const allVisibleSelected =
      visibleIds.length > 0 && visibleIds.every((id) => selectedStudents.has(id));

    if (allVisibleSelected) {
      setSelectedStudents((current) => {
        const next = new Set(current);
        visibleIds.forEach((id) => next.delete(id));
        return next;
      });
      return;
    }

    setSelectedStudents((current) => {
      const next = new Set(current);
      visibleIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const updateFilter = <K extends keyof OjtStudentFilters>(
    key: K,
    value: OjtStudentFilters[K]
  ) => {
    setExportFilters((current) => ({ ...current, [key]: value }));
  };

  const clearSingleFilter = (key: keyof OjtStudentFilters) => {
    setExportFilters((current) => ({ ...current, [key]: "" }));
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setIsImporting(true);
      try {
        let result: OjtMergeResult;

        if (file.name.toLowerCase().endsWith(".csv")) {
          result = importOjtStudentsFromCSV(content);
        } else {
          result = importOjtStudentsFromJSON(content);
        }

        setImportResult(result);
      } finally {
        setIsImporting(false);
      }
    };
    reader.readAsText(file);
    event.target.value = ""; // Reset input
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-2">
          Import / Export OJT Students
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Share student records between different computers
        </p>
      </div>

      {/* Student Selection Modal */}
      {showSelectStudents && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                Select Students to Export
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Choose which students you want to export ({selectedStudents.size} selected)
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-4">
                <button
                  onClick={toggleSelectAll}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {exportableStudents.length > 0 &&
                  exportableStudents.every((student) => selectedStudents.has(student.id))
                    ? "Deselect Visible"
                    : "Select Visible"}
                </button>
              </div>

              <div className="mb-5 space-y-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/60 p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="relative">
                    <School className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <select
                      value={exportFilters.school}
                      onChange={(e) => updateFilter("school", e.target.value)}
                      className="w-full appearance-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2.5 pl-9 pr-8 text-sm text-gray-900 dark:text-white outline-none transition-all focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All schools</option>
                      {schools.map((school) => (
                        <option key={school} value={school}>
                          {school}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="relative">
                    <GraduationCap className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <select
                      value={exportFilters.program}
                      onChange={(e) => updateFilter("program", e.target.value)}
                      className="w-full appearance-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2.5 pl-9 pr-8 text-sm text-gray-900 dark:text-white outline-none transition-all focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All programs</option>
                      {programs.map((program) => (
                        <option key={program} value={program}>
                          {program}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search name, school, program..."
                      value={exportFilters.search}
                      onChange={(e) => updateFilter("search", e.target.value)}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2.5 pl-9 pr-4 text-sm text-gray-900 dark:text-white outline-none transition-all focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {hasActiveFilters && (
                  <div className="flex flex-wrap items-center gap-2">
                    {[
                      exportFilters.school
                        ? { key: "school" as const, label: "School", value: exportFilters.school }
                        : null,
                      exportFilters.program
                        ? {
                            key: "program" as const,
                            label: "Program",
                            value: exportFilters.program,
                          }
                        : null,
                      exportFilters.search
                        ? { key: "search" as const, label: "Search", value: exportFilters.search }
                        : null,
                    ]
                      .filter(Boolean)
                      .map((item) => (
                        <button
                          key={`${item!.key}-${item!.value}`}
                          onClick={() => clearSingleFilter(item!.key)}
                          className="inline-flex items-center gap-2 rounded-full border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 text-sm text-blue-800 dark:text-blue-200"
                        >
                          <span className="font-medium">{item!.label}:</span>
                          <span>{item!.value}</span>
                          <X className="h-3.5 w-3.5" />
                        </button>
                      ))}
                    <button
                      onClick={() => setExportFilters(EMPTY_FILTERS)}
                      className="text-sm text-gray-600 dark:text-gray-400 hover:underline"
                    >
                      Clear all
                    </button>
                  </div>
                )}

                <div className="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900/30 px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                  Showing <span className="font-semibold">{exportableStudents.length}</span> of{" "}
                  <span className="font-semibold">{allStudents.length}</span> students
                </div>
              </div>

              <div className="space-y-2">
                {exportableStudents.map((student) => (
                  <label
                    key={student.id}
                    className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedStudents.has(student.id)}
                      onChange={() => toggleStudentSelection(student.id)}
                      className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 dark:text-white mb-1">
                        {getStudentDisplayName(student)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {student.school} - {student.program}
                      </div>
                      {student.office && (
                        <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {student.office}
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>

              {exportableStudents.length === 0 && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  No students match the current filters
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowSelectStudents(false);
                  setSelectedStudents(new Set());
                }}
                className="px-6 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmExport}
                disabled={selectedStudents.size === 0 || isExporting}
                className="px-6 py-2.5 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                {isExporting
                  ? "Exporting..."
                  : `Export ${selectedStudents.size} Student${selectedStudents.size !== 1 ? "s" : ""}`}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Info Card */}
        <div className="lg:col-span-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                Duplicate Detection
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                OJT student records use smart duplicate detection instead of unique IDs. A student
                is considered a duplicate if their name, school, and either office or date range
                match an existing record. Duplicates are automatically skipped during import to
                keep your data clean.
              </p>
            </div>
          </div>
        </div>

        {/* Export Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <Download className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Export Students
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Save to file</p>
            </div>
          </div>

          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Export student records from this computer to a JSON or CSV file. Records can be imported on
            other computers with automatic duplicate detection.
          </p>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Export Format
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setExportFormat("json")}
                className={`flex-1 px-4 py-2 rounded-lg border-2 font-medium transition-colors ${
                  exportFormat === "json"
                    ? "border-green-600 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                    : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                JSON
              </button>
              <button
                onClick={() => setExportFormat("csv")}
                className={`flex-1 px-4 py-2 rounded-lg border-2 font-medium transition-colors ${
                  exportFormat === "csv"
                    ? "border-green-600 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                    : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                CSV
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleExportAll}
              disabled={isExporting || allStudents.length === 0}
              className="w-full px-6 py-3 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              {isExporting ? "Exporting..." : `Export All Students (${allStudents.length})`}
            </button>

            <button
              onClick={handleExportSelected}
              disabled={allStudents.length === 0}
              className="w-full px-6 py-3 rounded-lg border-2 border-green-600 text-green-600 dark:text-green-400 font-medium hover:bg-green-50 dark:hover:bg-green-900/20 disabled:border-gray-300 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <FileCheck className="w-5 h-5" />
              Export Selected Students
            </button>
          </div>
        </div>

        {/* Import Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <Upload className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Import Students
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Load from file</p>
            </div>
          </div>

          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Import student records from another computer. Supports JSON and CSV formats. Duplicate
            students are automatically detected and skipped.
          </p>

          <div className="space-y-3">
            <label className="w-full px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 cursor-pointer">
              <Upload className="w-5 h-5" />
              {isImporting ? "Importing..." : "Import Students"}
              <input
                type="file"
                accept=".json,.csv"
                onChange={handleImport}
                className="sr-only"
                disabled={isImporting}
              />
            </label>

            <button
              onClick={handleDownloadTemplate}
              className="w-full px-6 py-3 rounded-lg border-2 border-blue-600 text-blue-600 dark:text-blue-400 font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-center justify-center gap-2"
            >
              <FileSpreadsheet className="w-5 h-5" />
              Download CSV Template
            </button>
          </div>

          <div className="mt-4 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Info className="w-4 h-4" />
            <span>CSV template includes sample data and all required fields</span>
          </div>
        </div>

        {/* Import Result */}
        {importResult && (
          <div className="lg:col-span-2">
            <div
              className={`rounded-xl p-6 border ${
                importResult.errors.length > 0 || importResult.duplicates > 0
                  ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
                  : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
              }`}
            >
              <div className="flex items-start gap-3 mb-4">
                {importResult.errors.length > 0 || importResult.duplicates > 0 ? (
                  <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                ) : (
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 mt-0.5" />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Import Complete
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-700 dark:text-gray-300">
                      ✅ Imported: {importResult.imported} student
                      {importResult.imported !== 1 ? "s" : ""}
                    </p>
                    {importResult.duplicates > 0 && (
                      <p className="text-gray-700 dark:text-gray-300">
                        ⚠️ Skipped duplicates: {importResult.duplicates}
                      </p>
                    )}
                    {importResult.skipped > 0 && (
                      <p className="text-gray-700 dark:text-gray-300">
                        ❌ Skipped invalid: {importResult.skipped}
                      </p>
                    )}
                  </div>

                  {importResult.duplicateDetails.length > 0 && (
                    <details className="mt-4">
                      <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                        View duplicate details ({importResult.duplicateDetails.length})
                      </summary>
                      <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                        {importResult.duplicateDetails.map((dup, idx) => (
                          <div
                            key={idx}
                            className="text-xs bg-white/50 dark:bg-gray-800/50 rounded p-2"
                          >
                            <div className="font-medium">{dup.name}</div>
                            <div className="text-gray-600 dark:text-gray-400">{dup.school}</div>
                            <div className="text-gray-500 dark:text-gray-500 italic">
                              {dup.reason}
                            </div>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}

                  {importResult.errors.length > 0 && (
                    <details className="mt-4">
                      <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                        View error details ({importResult.errors.length})
                      </summary>
                      <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                        {importResult.errors.map((error, idx) => (
                          <div
                            key={idx}
                            className="text-xs bg-white/50 dark:bg-gray-800/50 rounded p-2 text-gray-700 dark:text-gray-300"
                          >
                            {error}
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
