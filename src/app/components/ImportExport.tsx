import { useMemo, useState } from "react";
import {
  Download,
  Upload,
  AlertCircle,
  CheckCircle,
  Info,
  Edit2,
  FileCheck,
  Search,
  Filter,
  GraduationCap,
  School,
  CalendarRange,
  X,
} from "lucide-react";
import {
  exportRecordsToJSON,
  importRecordsFromJSON,
  getMachineId,
  setMachineId,
  type MergeResult,
} from "../mergeRecords";
import {
  filterRecords,
  getRecordFilterOptions,
  loadRecords,
  type RecordFilters,
  type RecordItem,
} from "../records";

const EMPTY_EXPORT_FILTERS: RecordFilters = {
  school: "",
  course: "",
  search: "",
  dateFrom: "",
  dateTo: "",
};

function normalizeFilterValue(value?: string | number) {
  return typeof value === "number" ? String(value) : value?.trim() || "";
}

export function ImportExport() {
  const [importResult, setImportResult] = useState<MergeResult | null>(null);
  const [machineId, setMachineIdState] = useState(getMachineId());
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(machineId);
  const [showSelectRecords, setShowSelectRecords] = useState(false);
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set());
  const [exportFilters, setExportFilters] = useState<RecordFilters>(EMPTY_EXPORT_FILTERS);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const allRecords = loadRecords();
  const filterOptions = useMemo(() => getRecordFilterOptions(allRecords), [allRecords]);
  const availableCourses = useMemo(() => {
    if (!exportFilters.school) {
      return [];
    }
    return filterOptions.coursesBySchool[exportFilters.school.trim().toLowerCase()] ?? [];
  }, [exportFilters.school, filterOptions.coursesBySchool]);
  const exportableRecords = useMemo(
    () => filterRecords(allRecords, exportFilters),
    [allRecords, exportFilters]
  );
  const hasActiveExportFilters = useMemo(
    () =>
      Boolean(
        exportFilters.school ||
          exportFilters.course ||
          exportFilters.search ||
          exportFilters.status ||
          exportFilters.dateFrom ||
          exportFilters.dateTo ||
          typeof exportFilters.year === "number"
      ),
    [exportFilters]
  );

  const handleExportAll = async () => {
    setIsExporting(true);
    try {
      const json = await exportRecordsToJSON();
      downloadJSON(json, `moa-records-${machineId}-${new Date().toISOString().split("T")[0]}.json`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportSelected = () => {
    setExportFilters(EMPTY_EXPORT_FILTERS);
    setShowSelectRecords(true);
  };

  const handleConfirmExport = async () => {
    const recordsToExport = allRecords.filter((record) => selectedRecords.has(record.id));
    setIsExporting(true);
    try {
      const json = await exportRecordsToJSON(recordsToExport);
      downloadJSON(json, `moa-records-selected-${machineId}-${new Date().toISOString().split("T")[0]}.json`);
      setShowSelectRecords(false);
      setSelectedRecords(new Set());
    } finally {
      setIsExporting(false);
    }
  };

  const downloadJSON = (json: string, filename: string) => {
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleRecordSelection = (recordId: string) => {
    const newSelection = new Set(selectedRecords);
    if (newSelection.has(recordId)) {
      newSelection.delete(recordId);
    } else {
      newSelection.add(recordId);
    }
    setSelectedRecords(newSelection);
  };

  const toggleSelectAll = () => {
    const visibleIds = exportableRecords.map((record) => record.id);
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedRecords.has(id));

    if (allVisibleSelected) {
      setSelectedRecords((current) => {
        const next = new Set(current);
        visibleIds.forEach((id) => next.delete(id));
        return next;
      });
      return;
    }

    setSelectedRecords((current) => {
      const next = new Set(current);
      visibleIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const updateExportFilter = <K extends keyof RecordFilters>(key: K, value: RecordFilters[K]) => {
    setExportFilters((current) => ({ ...current, [key]: value }));
  };

  const clearSingleExportFilter = (key: keyof RecordFilters) => {
    setExportFilters((current) => ({
      ...current,
      [key]: key === "year" ? undefined : "",
    }));
  };

  const handleExportSchoolChange = (value: string) => {
    setExportFilters((current) => ({
      ...current,
      school: value,
      course: "",
    }));
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      setIsImporting(true);
      try {
        const result = await importRecordsFromJSON(content);
        setImportResult(result);
      } finally {
        setIsImporting(false);
      }
    };
    reader.readAsText(file);
    event.target.value = ""; // Reset input
  };

  const handleEditMachineId = () => {
    setIsEditing(true);
    setEditValue(machineId);
  };

  const handleSaveMachineId = () => {
    const cleanValue = editValue.trim();
    
    if (cleanValue.length < 2) {
      alert('Machine ID must be at least 2 characters');
      return;
    }
    
    if (cleanValue.length > 50) {
      alert('Machine ID must be 50 characters or less');
      return;
    }

    if (setMachineId(cleanValue)) {
      setMachineIdState(cleanValue);
      setIsEditing(false);
      alert('Machine ID updated! New records will use: MOA-2026-' + cleanValue + '-001');
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditValue(machineId);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-2">
          Import / Export Records
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Share records between different computers
        </p>
      </div>

      {/* Record Selection Modal */}
      {showSelectRecords && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                Select Records to Export
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Choose which records you want to export ({selectedRecords.size} selected)
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-4">
                <button
                  onClick={toggleSelectAll}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {exportableRecords.length > 0 &&
                  exportableRecords.every((record) => selectedRecords.has(record.id))
                    ? "Deselect Visible"
                    : "Select Visible"}
                </button>
              </div>

              <div className="mb-5 space-y-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/60 p-4">
                <div className="grid grid-cols-1 xl:grid-cols-5 gap-3">
                  <div className="relative">
                    <School className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <select
                      value={exportFilters.school || ""}
                      onChange={(event) => handleExportSchoolChange(event.target.value)}
                      className="w-full appearance-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2.5 pl-9 pr-8 text-sm text-gray-900 dark:text-white outline-none transition-all focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select school</option>
                      {filterOptions.schools.map((school) => (
                        <option key={school} value={school}>
                          {school}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="relative">
                    <GraduationCap className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <select
                      value={exportFilters.course || ""}
                      onChange={(event) => updateExportFilter("course", event.target.value)}
                      disabled={!exportFilters.school}
                      className="w-full appearance-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2.5 pl-9 pr-8 text-sm text-gray-900 dark:text-white outline-none transition-all focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">
                        {exportFilters.school ? "All courses under school" : "Select school first"}
                      </option>
                      {availableCourses.map((course) => (
                        <option key={course} value={course}>
                          {course}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="relative">
                    <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <select
                      value={normalizeFilterValue(exportFilters.year)}
                      onChange={(event) =>
                        updateExportFilter(
                          "year",
                          event.target.value ? Number(event.target.value) : undefined
                        )
                      }
                      className="w-full appearance-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2.5 pl-9 pr-8 text-sm text-gray-900 dark:text-white outline-none transition-all focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All years</option>
                      {filterOptions.years.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="relative">
                    <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <select
                      value={exportFilters.status || ""}
                      onChange={(event) =>
                        updateExportFilter(
                          "status",
                          (event.target.value || undefined) as RecordItem["status"] | undefined
                        )
                      }
                      className="w-full appearance-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2.5 pl-9 pr-8 text-sm text-gray-900 dark:text-white outline-none transition-all focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All statuses</option>
                      {filterOptions.statuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search control no., school, course..."
                      value={exportFilters.search || ""}
                      onChange={(event) => updateExportFilter("search", event.target.value)}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2.5 pl-9 pr-4 text-sm text-gray-900 dark:text-white outline-none transition-all focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-end">
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <CalendarRange className="h-4 w-4" />
                      Created from
                    </label>
                    <input
                      type="date"
                      value={exportFilters.dateFrom || ""}
                      onChange={(event) => updateExportFilter("dateFrom", event.target.value)}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none transition-all focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Created to
                    </label>
                    <input
                      type="date"
                      value={exportFilters.dateTo || ""}
                      min={exportFilters.dateFrom || undefined}
                      onChange={(event) => updateExportFilter("dateTo", event.target.value)}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none transition-all focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    onClick={() => setExportFilters(EMPTY_EXPORT_FILTERS)}
                    disabled={!hasActiveExportFilters}
                    className="h-[42px] rounded-lg border border-gray-300 dark:border-gray-600 px-4 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Clear Filters
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {hasActiveExportFilters ? (
                    ([
                      exportFilters.school
                        ? { key: "school" as const, label: "School", value: exportFilters.school }
                        : null,
                      exportFilters.course
                        ? { key: "course" as const, label: "Course", value: exportFilters.course }
                        : null,
                      typeof exportFilters.year === "number"
                        ? {
                            key: "year" as const,
                            label: "Year",
                            value: String(exportFilters.year),
                          }
                        : null,
                      exportFilters.status
                        ? { key: "status" as const, label: "Status", value: exportFilters.status }
                        : null,
                      exportFilters.dateFrom
                        ? { key: "dateFrom" as const, label: "From", value: exportFilters.dateFrom }
                        : null,
                      exportFilters.dateTo
                        ? { key: "dateTo" as const, label: "To", value: exportFilters.dateTo }
                        : null,
                      exportFilters.search
                        ? { key: "search" as const, label: "Search", value: exportFilters.search }
                        : null,
                    ]
                      .filter(Boolean) as Array<{
                      key: keyof RecordFilters;
                      label: string;
                      value: string;
                    }>).map((item) => (
                      <button
                        key={`${item.key}-${item.value}`}
                        onClick={() => clearSingleExportFilter(item.key)}
                        className="inline-flex items-center gap-2 rounded-full border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 text-sm text-blue-800 dark:text-blue-200"
                      >
                        <span className="font-medium">{item.label}:</span>
                        <span>{item.value}</span>
                        <X className="h-3.5 w-3.5" />
                      </button>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Use filters to quickly find the records you want to export.
                    </p>
                  )}
                </div>

                <div className="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900/30 px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                  Showing <span className="font-semibold">{exportableRecords.length}</span> of{" "}
                  <span className="font-semibold">{allRecords.length}</span> records in Selected Export
                </div>
              </div>

              <div className="space-y-2">
                {exportableRecords.map((record) => (
                  <label
                    key={record.id}
                    className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedRecords.has(record.id)}
                      onChange={() => toggleRecordSelection(record.id)}
                      className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {record.controlNumber}
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            record.status === "Completed"
                              ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                              : "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                          }`}
                        >
                          {record.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {record.school} - {record.course}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {record.workflow}
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              {exportableRecords.length === 0 && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  No records match the current export filters
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowSelectRecords(false);
                  setSelectedRecords(new Set());
                }}
                className="px-6 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmExport}
                disabled={selectedRecords.size === 0 || isExporting}
                className="px-6 py-2.5 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                {isExporting
                  ? "Exporting..."
                  : `Export ${selectedRecords.size} Record${selectedRecords.size !== 1 ? "s" : ""}`}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl">
        {/* Machine Info */}
        <div className="lg:col-span-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-medium text-blue-900 dark:text-blue-100">
                  Machine ID: {machineId}
                </h3>
                {!isEditing && (
                  <button
                    onClick={handleEditMachineId}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                    title="Change Machine ID"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {isEditing ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    placeholder="e.g., Main Office, Branch-2, Legal Dept."
                    maxLength={50}
                    className="w-full px-3 py-2 rounded-lg border border-blue-300 dark:border-blue-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveMachineId}
                      className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-4 py-1.5 rounded-lg border border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300 text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    2-50 characters, any characters allowed. Example: Main Office, Branch-2, Legal Dept.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Each computer has a unique ID to prevent duplicate control numbers.
                  Your records will have format: MOA-2026-{machineId}-001
                </p>
              )}
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
                Export Records
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Save to file
              </p>
            </div>
          </div>

          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Export records from this computer to a JSON file. Attached LO and MOA
            files are included so other computers can restore the full record.
          </p>

          <div className="space-y-3">
            <button
              onClick={handleExportAll}
              disabled={isExporting}
              className="w-full px-6 py-3 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              {isExporting ? "Exporting..." : `Export All Records (${allRecords.length})`}
            </button>

            <button
              onClick={handleExportSelected}
              disabled={allRecords.length === 0}
              className="w-full px-6 py-3 rounded-lg border-2 border-green-600 text-green-600 dark:text-green-400 font-medium hover:bg-green-50 dark:hover:bg-green-900/20 disabled:border-gray-300 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <FileCheck className="w-5 h-5" />
              Export Selected Records
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
                Import Records
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Load from file
              </p>
            </div>
          </div>

          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Import records from another computer. Embedded LO and MOA files will be
            restored together with the record data.
          </p>

          <label className="w-full px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 cursor-pointer">
            <Upload className="w-5 h-5" />
            {isImporting ? "Importing..." : "Import Records"}
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="sr-only"
              disabled={isImporting}
            />
          </label>
        </div>

        {/* Import Result */}
        {importResult && (
          <div className="lg:col-span-2">
            <div
              className={`rounded-xl p-6 border ${
                importResult.errors.length > 0
                  ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
                  : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
              }`}
            >
              <div className="flex items-start gap-3 mb-4">
                {importResult.errors.length > 0 ? (
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
                      ✅ Imported: {importResult.imported} records
                    </p>
                    {importResult.duplicates > 0 && (
                      <p className="text-gray-700 dark:text-gray-300">
                        ⚠️ Skipped duplicates: {importResult.duplicates}
                      </p>
                    )}
                    {importResult.idsRegenerated > 0 && (
                      <p className="text-gray-700 dark:text-gray-300">
                        🔄 Record IDs regenerated: {importResult.idsRegenerated}
                      </p>
                    )}
                    {importResult.controlNumbersAdjusted > 0 && (
                      <p className="text-gray-700 dark:text-gray-300">
                        🔢 Control Numbers adjusted: {importResult.controlNumbersAdjusted}
                      </p>
                    )}
                  </div>

                  {importResult.errors.length > 0 && (
                    <details className="mt-4">
                      <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
                        View Details ({importResult.errors.length} items)
                      </summary>
                      <ul className="mt-2 space-y-1 text-xs text-gray-600 dark:text-gray-400 max-h-40 overflow-y-auto">
                        {importResult.errors.map((error, index) => (
                          <li key={index} className="pl-4">
                            • {error}
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* How It Works */}
        <div className="lg:col-span-2 bg-gray-50 dark:bg-gray-800/60 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            How It Works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="font-medium text-gray-900 dark:text-white mb-2">
                1. Export from PC 1
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Click "Export All Records" to save records and attached LO/MOA files to a JSON file
              </p>
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-white mb-2">
                2. Transfer File
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Copy the JSON file to PC 2 via USB, email, or network share
              </p>
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-white mb-2">
                3. Import to PC 2
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Click "Import Records" and select the file. The records and attached
                LO/MOA files will be restored automatically
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
