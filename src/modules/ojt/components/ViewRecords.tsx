import { useMemo, useState } from "react";
import { CheckCircle2, Filter, GraduationCap, Search, ArrowUpDown } from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "../../../app/components/ui/button";
import { PageHeader } from "../../../shared/components/PageHeader";
import {
  filterOjtStudents,
  getLatestQrRecordByKey,
  getOjtPrograms,
  getStudentDisplayName,
  loadOjtQrRecords,
  loadOjtStudents,
  saveLastViewedCertificateIds,
} from "../storage";
import type { OjtStudentRecord } from "../types";

type SortOption = "name-asc" | "name-desc" | "surname-asc" | "surname-desc" | "date-asc" | "date-desc" | "none";

export function OjtCertificatesScreen() {
  const navigate = useNavigate();
  const [students] = useState<OjtStudentRecord[]>(() => loadOjtStudents());
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [programFilter, setProgramFilter] = useState("");
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");
  const qrRecords = useMemo(() => loadOjtQrRecords(), []);
  const qrRecordMap = useMemo(() => getLatestQrRecordByKey(qrRecords), [qrRecords]);
  const programs = useMemo(() => getOjtPrograms(students), [students]);
  const filteredStudents = useMemo(
    () => filterOjtStudents(students, { search, program: programFilter }),
    [programFilter, search, students],
  );

  const sortedStudents = useMemo(() => {
    if (sortBy === "none") return filteredStudents;

    return [...filteredStudents].sort((a, b) => {
      const aFirstName = a.firstName.toLowerCase().trim();
      const bFirstName = b.firstName.toLowerCase().trim();
      const aLastName = a.lastName.toLowerCase().trim();
      const bLastName = b.lastName.toLowerCase().trim();
      const aDate = new Date(a.createdAt || 0).getTime();
      const bDate = new Date(b.createdAt || 0).getTime();

      switch (sortBy) {
        case "name-asc":
          return aFirstName.localeCompare(bFirstName);
        case "name-desc":
          return bFirstName.localeCompare(aFirstName);
        case "surname-asc":
          return aLastName.localeCompare(bLastName);
        case "surname-desc":
          return bLastName.localeCompare(aLastName);
        case "date-asc":
          return aDate - bDate;
        case "date-desc":
          return bDate - aDate;
        default:
          return 0;
      }
    });
  }, [filteredStudents, sortBy]);

  const selectedStudents = useMemo(
    () => students.filter((student) => selectedIds.includes(student.id)),
    [selectedIds, students],
  );

  const toggleStudent = (studentId: string) => {
    setSelectedIds((current) =>
      current.includes(studentId) ? current.filter((id) => id !== studentId) : [...current, studentId],
    );
  };

  const navigateToViewer = (ids: string[]) => {
    saveLastViewedCertificateIds(ids);
    navigate("/ojt/certificates/view", {
      state: { selectedIds: ids },
    });
  };

  const handleGenerate = () => {
    if (!selectedStudents.length) {
      return;
    }

    // Navigate directly without showing missing QR warning
    navigateToViewer(selectedStudents.map((student) => student.id));
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(sortedStudents.map((student) => student.id));
      return;
    }

    setSelectedIds([]);
  };

  const handleSort = (field: 'name' | 'surname' | 'date') => {
    const ascOption = `${field}-asc` as SortOption;
    const descOption = `${field}-desc` as SortOption;

    if (sortBy === ascOption) {
      setSortBy(descOption);
    } else if (sortBy === descOption) {
      setSortBy("none");
    } else {
      setSortBy(ascOption);
    }
  };

  const getSortIcon = (field: 'name' | 'surname' | 'date') => {
    const ascOption = `${field}-asc`;
    const descOption = `${field}-desc`;
    
    if (sortBy === ascOption) return " ↑";
    if (sortBy === descOption) return " ↓";
    return "";
  };

  return (
    <div className="space-y-6 p-8">
      <PageHeader
        title="Generate Certificate"
        description="Search students, select who to include, then generate the certificate view."
        action={
          <Button type="button" onClick={handleGenerate} disabled={!selectedStudents.length}>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Generate Certificate
          </Button>
        }
      />
      <div className="rounded-[28px] border border-gray-200 bg-[#fbf3ff] p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-3 rounded-xl border border-gray-300 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-950">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search Student or Program"
              className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFilterPanel((current) => !current)}
            className="rounded-xl p-3 text-gray-600 transition hover:bg-white dark:text-gray-300 dark:hover:bg-gray-800"
            aria-label="Toggle filters"
          >
            <Filter className="h-5 w-5" />
          </button>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
            <input
              type="checkbox"
              checked={sortedStudents.length > 0 && sortedStudents.every((student) => selectedIds.includes(student.id))}
              onChange={(event) => handleSelectAll(event.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-violet-600"
            />
            Select All
          </label>
        </div>

        {showFilterPanel ? (
          <div className="mt-4 flex max-w-sm items-center gap-3">
            <select
              value={programFilter}
              onChange={(event) => setProgramFilter(event.target.value)}
              className="h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-950"
            >
              <option value="">All Programs</option>
              {programs.map((program) => (
                <option key={program} value={program}>
                  {program}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleSort('name')}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            Sort by Name{getSortIcon('name')}
          </button>
          <button
            type="button"
            onClick={() => handleSort('surname')}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            Sort by Surname{getSortIcon('surname')}
          </button>
          <button
            type="button"
            onClick={() => handleSort('date')}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            Sort by Date Modified{getSortIcon('date')}
          </button>
        </div>

        <div className="mt-6 space-y-3">
          {sortedStudents.length ? (
            sortedStudents.map((student) => {
              const checked = selectedIds.includes(student.id);
              const qrRecord = qrRecordMap.get(`${student.program}|||${student.school}`);

              return (
                <label
                  key={student.id}
                  className="flex items-start justify-between gap-4 rounded-2xl border border-[#eadff3] bg-white px-5 py-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                      <GraduationCap className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-gray-900">{getStudentDisplayName(student)}</p>
                      <p className="text-sm text-gray-600">
                        {student.program} - {student.endDate ? new Date(student.endDate).getFullYear() : new Date().getFullYear()}
                      </p>
                      <p className="text-sm text-gray-500">{student.school}</p>
                      <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-violet-700">
                        {student.ojtHours ? `${student.ojtHours} Hours on the Job Training` : "0 Hours"}
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleStudent(student.id)}
                    className="mt-2 h-5 w-5 rounded border-gray-300 text-violet-600"
                  />
                </label>
              );
            })
          ) : (
            <div className="rounded-2xl bg-white px-5 py-10 text-center text-sm text-gray-500 shadow-sm">
              No students found for the current search.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ViewOjtRecords() {
  return <OjtCertificatesScreen />;
}
