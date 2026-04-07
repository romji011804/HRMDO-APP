import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Filter,
  Pencil,
  Trash2,
  Pin,
  PinOff,
  Link2,
  X,
  CalendarRange,
  GraduationCap,
  School,
  ArrowUpDown,
  AlertTriangle,
} from "lucide-react";
import { useNavigate } from "react-router";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import {
  filterRecords,
  getRecordFilterOptions,
  loadRecords,
  saveActiveRecordFilters,
  RECORDS_UPDATED_EVENT,
  saveRecords,
  isDocumentReferenceUsable,
  type RecordFilters,
  type RecordItem,
} from "../records";
import { getFileBlob } from "../fileStorage";

const EMPTY_FILTERS: RecordFilters = {
  school: "",
  course: "",
  search: "",
  dateFrom: "",
  dateTo: "",
};

type SortOption =
  | "updated-desc"
  | "updated-asc"
  | "control-asc"
  | "control-desc"
  | "school-asc"
  | "school-desc";

function parseControlSequence(controlNumber: string) {
  const match = controlNumber.match(/^(\d+)/);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

function normalizeFilterValue(value?: string | number) {
  return typeof value === "number" ? String(value) : value?.trim() || "";
}

export function ViewRecords() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<RecordFilters>(EMPTY_FILTERS);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [openMessage, setOpenMessage] = useState("");
  const [allRecords, setAllRecords] = useState<RecordItem[]>(() => loadRecords());
  const [sortBy, setSortBy] = useState<SortOption>("control-asc");
  const [documentHealth, setDocumentHealth] = useState<
    Record<string, { moa: boolean; lo: boolean }>
  >({});

  useEffect(() => {
    const syncRecords = () => {
      setAllRecords(loadRecords());
    };

    window.addEventListener(RECORDS_UPDATED_EVENT, syncRecords);
    window.addEventListener("focus", syncRecords);
    document.addEventListener("visibilitychange", syncRecords);

    return () => {
      window.removeEventListener(RECORDS_UPDATED_EVENT, syncRecords);
      window.removeEventListener("focus", syncRecords);
      document.removeEventListener("visibilitychange", syncRecords);
    };
  }, []);

  useEffect(() => {
    saveActiveRecordFilters(filters);
  }, [filters]);

  useEffect(() => {
    let isActive = true;

    void (async () => {
      const entries = await Promise.all(
        allRecords.map(async (record) => [
          record.id,
          {
            moa: await isDocumentReferenceUsable(record.moaType, record.moaValue),
            lo: await isDocumentReferenceUsable(
              record.legalOpinionType,
              record.legalOpinionValue
            ),
          },
        ])
      );

      if (isActive) {
        setDocumentHealth(Object.fromEntries(entries));
      }
    })();

    return () => {
      isActive = false;
    };
  }, [allRecords]);

  const filterOptions = useMemo(() => getRecordFilterOptions(allRecords), [allRecords]);
  const availableCourses = useMemo(() => {
    if (!filters.school) {
      return [];
    }

    return filterOptions.coursesBySchool[filters.school.trim().toLowerCase()] ?? [];
  }, [filterOptions.coursesBySchool, filters.school]);

  const filteredRecords = useMemo(() => filterRecords(allRecords, filters), [allRecords, filters]);

  const sortedRecords = useMemo(() => {
    return [...filteredRecords].sort((a, b) => {
      const aPinned = pinnedIds.includes(a.id);
      const bPinned = pinnedIds.includes(b.id);
      if (aPinned !== bPinned) {
        return aPinned ? -1 : 1;
      }

      const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
      const aSequence = parseControlSequence(a.controlNumber);
      const bSequence = parseControlSequence(b.controlNumber);

      switch (sortBy) {
        case "updated-asc":
          return aTime - bTime;
        case "control-asc":
          return aSequence - bSequence || a.controlNumber.localeCompare(b.controlNumber);
        case "control-desc":
          return bSequence - aSequence || b.controlNumber.localeCompare(a.controlNumber);
        case "school-asc":
          return a.school.localeCompare(b.school) || a.course.localeCompare(b.course);
        case "school-desc":
          return b.school.localeCompare(a.school) || b.course.localeCompare(a.course);
        case "updated-desc":
        default:
          return bTime - aTime;
      }
    });
  }, [filteredRecords, pinnedIds, sortBy]);

  const activeFilters = useMemo(() => {
    const items: Array<{ key: keyof RecordFilters; label: string; value: string }> = [];

    if (filters.school) items.push({ key: "school", label: "School", value: filters.school });
    if (filters.course) items.push({ key: "course", label: "Course", value: filters.course });
    if (typeof filters.year === "number") {
      items.push({ key: "year", label: "Year", value: String(filters.year) });
    }
    if (filters.status) items.push({ key: "status", label: "Status", value: filters.status });
    if (filters.dateFrom) {
      items.push({ key: "dateFrom", label: "From", value: filters.dateFrom });
    }
    if (filters.dateTo) {
      items.push({ key: "dateTo", label: "To", value: filters.dateTo });
    }
    if (filters.search) items.push({ key: "search", label: "Search", value: filters.search });

    return items;
  }, [filters]);

  const allVisibleSelected =
    sortedRecords.length > 0 && sortedRecords.every((record) => selectedIds.includes(record.id));

  const updateFilter = <K extends keyof RecordFilters>(key: K, value: RecordFilters[K]) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const clearSingleFilter = (key: keyof RecordFilters) => {
    setFilters((current) => ({
      ...current,
      [key]: key === "year" ? undefined : "",
    }));
  };

  const clearAllFilters = () => {
    setFilters(EMPTY_FILTERS);
    setOpenMessage("");
  };

  const handleSchoolChange = (value: string) => {
    setFilters((current) => ({
      ...current,
      school: value,
      course: "",
    }));
  };

  const handleCourseChange = (value: string) => {
    setFilters((current) => ({
      ...current,
      course: value,
    }));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  };

  const togglePin = (id: string) => {
    setPinnedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  };

  const deleteRecords = (ids: string[]) => {
    if (ids.length === 0) return;
    setAllRecords((current) => {
      const updated = current.filter((record) => !ids.includes(record.id));
      saveRecords(updated);
      return updated;
    });
    setSelectedIds((current) => current.filter((id) => !ids.includes(id)));
    setPinnedIds((current) => current.filter((id) => !ids.includes(id)));
  };

  const requestDelete = (ids: string[]) => {
    if (ids.length === 0) return;
    setPendingDeleteIds(ids);
    setIsDeleteDialogOpen(true);
  };

  const openDocument = async (type?: "file" | "link", value?: string) => {
    if (!value) {
      setOpenMessage("No document available.");
      return;
    }

    if (type === "link") {
      try {
        const url = new URL(value);
        window.open(url.toString(), "_blank", "noopener,noreferrer");
        setOpenMessage("");
      } catch {
        setOpenMessage("Invalid link. Unable to open document.");
      }
      return;
    }

    if (type === "file") {
      if (value.startsWith("idb:")) {
        try {
          const blob = await getFileBlob(value);
          if (!blob) {
            setOpenMessage("Saved file was not found. Please re-upload it.");
            return;
          }
          const blobUrl = URL.createObjectURL(blob);
          window.open(blobUrl, "_blank", "noopener,noreferrer");
          setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
          setOpenMessage("");
          return;
        } catch {
          setOpenMessage("Unable to open saved file.");
          return;
        }
      }

      if (value.startsWith("data:") || /^https?:\/\//i.test(value)) {
        window.open(value, "_blank", "noopener,noreferrer");
        setOpenMessage("");
        return;
      }

      setOpenMessage("Unable to open saved file.");
      return;
    }

    setOpenMessage("No document available.");
  };

  const formatTimestamp = (iso?: string) => {
    if (!iso) return "--";
    const d = new Date(iso);
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
      .format(d)
      .replace(",", " -");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300";
      case "Ongoing":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300";
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300";
    }
  };

  const hasActiveFilters = activeFilters.length > 0;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-2">
          View Records
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Narrow down MOA and Legal Opinion records with structured, progressive filters.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 space-y-5">
          {openMessage && (
            <div className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-900/20 px-4 py-2.5 text-sm text-amber-700 dark:text-amber-300">
              {openMessage}
            </div>
          )}

          {selectedIds.length > 0 && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/70 dark:bg-blue-900/20 px-4 py-3">
              <p className="text-sm text-blue-900 dark:text-blue-200">
                {selectedIds.length} record{selectedIds.length > 1 ? "s" : ""} selected
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    selectedIds.forEach((id) => {
                      if (!pinnedIds.includes(id)) {
                        togglePin(id);
                      }
                    })
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg border border-blue-300 dark:border-blue-800 px-3 py-1.5 text-sm text-blue-800 dark:text-blue-200 hover:bg-blue-100/80 dark:hover:bg-blue-900/40"
                >
                  <Pin className="h-4 w-4" />
                  Pin
                </button>
                <button
                  onClick={() => requestDelete(selectedIds)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 dark:border-red-800 px-3 py-1.5 text-sm text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
                <button
                  onClick={() => setSelectedIds([])}
                  className="rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
            <div className="relative xl:col-span-1">
              <School className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <select
                value={filters.school || ""}
                onChange={(event) => handleSchoolChange(event.target.value)}
                className="w-full pl-9 pr-8 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent outline-none transition-all appearance-none"
              >
                <option value="">Select school (required first)</option>
                {filterOptions.schools.map((school) => (
                  <option key={school} value={school}>
                    {school}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative xl:col-span-1">
              <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <select
                value={filters.course || ""}
                onChange={(event) => handleCourseChange(event.target.value)}
                disabled={!filters.school}
                className="w-full pl-9 pr-8 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent outline-none transition-all appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {filters.school ? "All courses under school" : "Select school first"}
                </option>
                {availableCourses.map((course) => (
                  <option key={course} value={course}>
                    {course}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative xl:col-span-1">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <select
                value={normalizeFilterValue(filters.year)}
                onChange={(event) =>
                  updateFilter("year", event.target.value ? Number(event.target.value) : undefined)
                }
                className="w-full pl-9 pr-8 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent outline-none transition-all appearance-none"
              >
                <option value="">All years</option>
                {filterOptions.years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative xl:col-span-1">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <select
                value={filters.status || ""}
                onChange={(event) =>
                  updateFilter(
                    "status",
                    (event.target.value || undefined) as RecordItem["status"] | undefined
                  )
                }
                className="w-full pl-9 pr-8 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent outline-none transition-all appearance-none"
              >
                <option value="">All statuses</option>
                {filterOptions.statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative xl:col-span-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search control no., name, course..."
                value={filters.search || ""}
                onChange={(event) => updateFilter("search", event.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-end">
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <CalendarRange className="w-4 h-4" />
                Created from
              </label>
              <input
                type="date"
                value={filters.dateFrom || ""}
                onChange={(event) => updateFilter("dateFrom", event.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent outline-none transition-all"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Created to
              </label>
              <input
                type="date"
                value={filters.dateTo || ""}
                min={filters.dateFrom || undefined}
                onChange={(event) => updateFilter("dateTo", event.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent outline-none transition-all"
              />
            </div>
            <button
              onClick={clearAllFilters}
              disabled={!hasActiveFilters}
              className="h-[42px] rounded-lg border border-gray-300 dark:border-gray-700 px-4 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear Filters
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {activeFilters.length > 0 ? (
              activeFilters.map((item) => (
                <button
                  key={`${item.key}-${item.value}`}
                  onClick={() => clearSingleFilter(item.key)}
                  className="inline-flex items-center gap-2 rounded-full border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 text-sm text-blue-800 dark:text-blue-200"
                >
                  <span className="font-medium">{item.label}:</span>
                  <span>{item.value}</span>
                  <X className="h-3.5 w-3.5" />
                </button>
              ))
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No active filters. Start with a school to progressively narrow results.
              </p>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/40 px-4 py-3">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Showing <span className="font-semibold">{sortedRecords.length}</span> of{" "}
              <span className="font-semibold">{allRecords.length}</span> records
            </p>
            <div className="flex items-center gap-3">
              <div className="relative">
                <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value as SortOption)}
                  className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 py-2 pl-9 pr-8 text-sm text-gray-700 dark:text-gray-300 outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                >
                  <option value="updated-desc">Newest updated</option>
                  <option value="updated-asc">Oldest updated</option>
                  <option value="control-asc">Control number ascending</option>
                  <option value="control-desc">Control number descending</option>
                  <option value="school-asc">School A-Z</option>
                  <option value="school-desc">School Z-A</option>
                </select>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Filters combine with AND logic for precise retrieval.
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/70 border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={(event) => {
                      if (event.target.checked) {
                        setSelectedIds((current) => [
                          ...new Set([...current, ...sortedRecords.map((record) => record.id)]),
                        ]);
                      } else {
                        setSelectedIds((current) =>
                          current.filter((id) => !sortedRecords.some((record) => record.id === id))
                        );
                      }
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Control Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  School/University
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Course
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Year
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Workflow Stage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date and Time
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Documents
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {sortedRecords.map((record) => (
                (() => {
                  const docState = documentHealth[record.id];
                  const hasBrokenMoa = Boolean(record.moaValue) && docState?.moa === false;
                  const hasBrokenLo =
                    Boolean(record.legalOpinionValue) && docState?.lo === false;
                  return (
                <tr
                  key={record.id}
                  onClick={() => navigate(`/record/${record.id}`)}
                  className="hover:bg-blue-50/60 dark:hover:bg-gray-800 cursor-pointer transition-colors duration-200"
                >
                  <td
                    className="px-4 py-4"
                    onClick={(event) => {
                      event.stopPropagation();
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(record.id)}
                      onChange={() => toggleSelect(record.id)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      {pinnedIds.includes(record.id) && (
                        <Pin className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      )}
                      {record.controlNumber}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {record.school}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {record.course}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {record.year || "--"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        record.status
                      )}`}
                    >
                      {record.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {record.workflow}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-gray-700 dark:text-gray-200 whitespace-nowrap">
                      {formatTimestamp(record.createdAt)}
                    </div>
                    {record.updatedAt && record.updatedAt !== record.createdAt && (
                      <div className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap mt-0.5">
                        Updated {formatTimestamp(record.updatedAt)}
                      </div>
                    )}
                  </td>
                  <td
                    className="px-6 py-4"
                    onClick={(event) => {
                      event.stopPropagation();
                    }}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openDocument(record.moaType, record.moaValue)}
                        className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 ${
                          hasBrokenMoa
                            ? "border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300"
                            : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200"
                        }`}
                        title="Open MOA"
                      >
                        <Link2 className="h-3.5 w-3.5" />
                        MOA
                        {hasBrokenMoa && <AlertTriangle className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        onClick={() =>
                          openDocument(record.legalOpinionType, record.legalOpinionValue)
                        }
                        className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 ${
                          hasBrokenLo
                            ? "border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300"
                            : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200"
                        }`}
                        title="Open Legal Opinion"
                      >
                        <Link2 className="h-3.5 w-3.5" />
                        LO
                        {hasBrokenLo && <AlertTriangle className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    {(hasBrokenMoa || hasBrokenLo) && (
                      <div className="mt-2 text-center text-[11px] text-amber-700 dark:text-amber-300">
                        Broken {hasBrokenMoa && hasBrokenLo ? "MOA/LO" : hasBrokenMoa ? "MOA" : "LO"} reference
                      </div>
                    )}
                  </td>
                  <td
                    className="px-6 py-4"
                    onClick={(event) => {
                      event.stopPropagation();
                    }}
                  >
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => navigate(`/add-record?editId=${record.id}`)}
                        className="inline-flex items-center gap-1 rounded-md border border-gray-200 dark:border-gray-700 px-2.5 py-1.5 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => togglePin(record.id)}
                        className="inline-flex items-center gap-1 rounded-md border border-gray-200 dark:border-gray-700 px-2.5 py-1.5 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        {pinnedIds.includes(record.id) ? (
                          <>
                            <PinOff className="h-3.5 w-3.5" />
                            Unpin
                          </>
                        ) : (
                          <>
                            <Pin className="h-3.5 w-3.5" />
                            Pin
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => requestDelete([record.id])}
                        className="inline-flex items-center gap-1 rounded-md border border-red-200 dark:border-red-900 px-2.5 py-1.5 text-xs text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
                  );
                })()
              ))}
            </tbody>
          </table>
        </div>

        {sortedRecords.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-lg font-medium text-gray-700 dark:text-gray-200">
              No results found
            </p>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Try adjusting the school, course, year, date range, status, or search filters.
            </p>
          </div>
        )}
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete record{pendingDeleteIds.length > 1 ? "s" : ""}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDeleteIds.length > 1
                ? `This will permanently remove ${pendingDeleteIds.length} selected records from this view. This action cannot be undone.`
                : "This will permanently remove this record from this view. This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setPendingDeleteIds([]);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 focus-visible:ring-red-500"
              onClick={() => {
                deleteRecords(pendingDeleteIds);
                setPendingDeleteIds([]);
                setIsDeleteDialogOpen(false);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
