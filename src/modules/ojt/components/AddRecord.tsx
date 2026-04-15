import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2, UserPlus, Pin, PinOff, AlertTriangle } from "lucide-react";
import { useLocation } from "react-router";
import { Button } from "../../../app/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../../app/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../../app/components/ui/alert-dialog";
import { Input } from "../../../app/components/ui/input";
import { Label } from "../../../app/components/ui/label";
import { Textarea } from "../../../app/components/ui/textarea";
import { PageHeader } from "../../../shared/components/PageHeader";
import {
  filterOjtStudents,
  getOjtPrograms,
  getOjtSchools,
  getStudentDisplayName,
  loadOjtStudents,
  saveOjtStudents,
} from "../storage";
import type { OjtStudentRecord } from "../types";
import { OjtInputAutocomplete } from "./OjtInputAutocomplete";
import {
  formatDateForDisplay,
  initializeOjtRecentInputsFromRecords,
  parseDateFromDisplay,
  saveOjtRecentInput,
} from "../recentInputHistory";

const EMPTY_FORM = {
  firstName: "",
  middleInitial: "",
  lastName: "",
  program: "",
  school: "",
  ojtHours: "",
  startDate: "",
  endDate: "",
  office: "",
  address: "",
};

type StudentFormState = typeof EMPTY_FORM;

type SortOption =
  | "name-asc"
  | "name-desc"
  | "program-asc"
  | "program-desc"
  | "school-asc"
  | "school-desc"
  | "hours-asc"
  | "hours-desc"
  | "date-asc"
  | "date-desc"
  | "startdate-asc"
  | "startdate-desc"
  | "enddate-asc"
  | "enddate-desc"
  | "modified-asc"
  | "modified-desc";

function toFormState(student?: OjtStudentRecord): StudentFormState {
  return {
    firstName: student?.firstName ?? "",
    middleInitial: student?.middleInitial ?? "",
    lastName: student?.lastName ?? "",
    program: student?.program ?? "",
    school: student?.school ?? "",
    ojtHours: student?.ojtHours ?? "",
    startDate: student?.startDate ? formatDateForDisplay(student.startDate) : "",
    endDate: student?.endDate ? formatDateForDisplay(student.endDate) : "",
    office: student?.office ?? "",
    address: student?.address ?? "",
  };
}

export function OjtStudentsScreen() {
  const location = useLocation();
  const [students, setStudents] = useState<OjtStudentRecord[]>(() => loadOjtStudents());
  const [search, setSearch] = useState("");
  const [programFilter, setProgramFilter] = useState("");
  const [schoolFilter, setSchoolFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [form, setForm] = useState<StudentFormState>(EMPTY_FORM);
  const [error, setError] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<OjtStudentRecord | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("modified-desc"); // Default: Date Modified Descending

  // Initialize autocomplete history from existing records
  useEffect(() => {
    initializeOjtRecentInputsFromRecords(students);
  }, [students]);

  const isAddMode = location.pathname === "/ojt/add-student";
  const pageTitle = isAddMode ? "Add Student" : "View Students";
  const pageDescription = isAddMode
    ? "Create the student records used later in QR generation and certificate creation."
    : "Review and manage the student records used in the certificate workflow.";

  const filteredStudents = useMemo(
    () => filterOjtStudents(students, { search, program: programFilter, school: schoolFilter }),
    [programFilter, schoolFilter, search, students],
  );
  
  const sortedStudents = useMemo(() => {
    return [...filteredStudents].sort((a, b) => {
      const aPinned = pinnedIds.includes(a.id);
      const bPinned = pinnedIds.includes(b.id);
      if (aPinned !== bPinned) {
        return aPinned ? -1 : 1;
      }

      // Apply sorting within pinned/unpinned groups
      const aName = getStudentDisplayName(a).toLowerCase();
      const bName = getStudentDisplayName(b).toLowerCase();
      const aFirstName = a.firstName.toLowerCase().trim();
      const bFirstName = b.firstName.toLowerCase().trim();
      const aLastName = a.lastName.toLowerCase().trim();
      const bLastName = b.lastName.toLowerCase().trim();
      const aProgram = a.program.toLowerCase();
      const bProgram = b.program.toLowerCase();
      const aSchool = a.school.toLowerCase();
      const bSchool = b.school.toLowerCase();
      const aHours = Number(a.ojtHours) || 0;
      const bHours = Number(b.ojtHours) || 0;
      const aStartDate = new Date(a.startDate || 0).getTime();
      const bStartDate = new Date(b.startDate || 0).getTime();
      const aEndDate = new Date(a.endDate || 0).getTime();
      const bEndDate = new Date(b.endDate || 0).getTime();
      const aModified = new Date(a.createdAt || 0).getTime();
      const bModified = new Date(b.createdAt || 0).getTime();

      switch (sortBy) {
        case "name-asc":
          return aFirstName.localeCompare(bFirstName);
        case "name-desc":
          return bFirstName.localeCompare(aFirstName);
        case "program-asc":
          return aProgram.localeCompare(bProgram);
        case "program-desc":
          return bProgram.localeCompare(aProgram);
        case "school-asc":
          return aSchool.localeCompare(bSchool);
        case "school-desc":
          return bSchool.localeCompare(aSchool);
        case "hours-asc":
          return aHours - bHours;
        case "hours-desc":
          return bHours - aHours;
        case "startdate-asc":
          return aStartDate - bStartDate;
        case "startdate-desc":
          return bStartDate - aStartDate;
        case "enddate-asc":
          return aEndDate - bEndDate;
        case "enddate-desc":
          return bEndDate - aEndDate;
        case "modified-asc":
          return aModified - bModified;
        case "modified-desc":
          return bModified - aModified;
        case "date-asc":
          return aEndDate - bEndDate;
        case "date-desc":
          return bEndDate - aEndDate;
        default:
          return 0;
      }
    });
  }, [filteredStudents, pinnedIds, sortBy]);
  
  const programs = useMemo(() => getOjtPrograms(students), [students]);
  const schools = useMemo(() => getOjtSchools(students), [students]);

  const openCreateDialog = () => {
    setEditingStudentId(null);
    setForm(EMPTY_FORM);
    setError("");
    setDialogOpen(true);
  };

  const openEditDialog = (student: OjtStudentRecord) => {
    setEditingStudentId(student.id);
    setForm(toFormState(student));
    setError("");
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.program.trim() || !form.school.trim()) {
      setError("First name, last name, program, and school are required.");
      return;
    }

    const now = new Date().toISOString();
    
    // Parse dates from display format to ISO format for storage
    const startDateISO = form.startDate ? parseDateFromDisplay(form.startDate) : undefined;
    const endDateISO = form.endDate ? parseDateFromDisplay(form.endDate) : undefined;
    
    const nextStudent: OjtStudentRecord = {
      id: editingStudentId ?? crypto.randomUUID(),
      createdAt: students.find((student) => student.id === editingStudentId)?.createdAt ?? now,
      firstName: form.firstName.trim(),
      middleInitial: form.middleInitial.trim() || undefined,
      lastName: form.lastName.trim(),
      program: form.program.trim(),
      school: form.school.trim(),
      ojtHours: form.ojtHours.trim() || undefined,
      startDate: startDateISO,
      endDate: endDateISO,
      office: form.office.trim() || undefined,
      address: form.address.trim() || undefined,
    };

    // Save to recent inputs history
    if (nextStudent.program) saveOjtRecentInput("program", nextStudent.program);
    if (nextStudent.school) saveOjtRecentInput("school", nextStudent.school);
    if (nextStudent.ojtHours) saveOjtRecentInput("ojtHours", nextStudent.ojtHours);
    if (form.startDate) saveOjtRecentInput("startDate", form.startDate); // Save display format
    if (form.endDate) saveOjtRecentInput("endDate", form.endDate); // Save display format
    if (nextStudent.office) saveOjtRecentInput("office", nextStudent.office);
    if (nextStudent.address) saveOjtRecentInput("address", nextStudent.address);

    const nextStudents = editingStudentId
      ? students.map((student) => (student.id === editingStudentId ? nextStudent : student))
      : [...students, nextStudent];

    saveOjtStudents(nextStudents);
    setStudents(nextStudents);
    setDialogOpen(false);
    setEditingStudentId(null);
    setForm(EMPTY_FORM);
    setError("");
  };

  const handleDelete = (studentId: string) => {
    const nextStudents = students.filter((student) => student.id !== studentId);
    saveOjtStudents(nextStudents);
    setStudents(nextStudents);
    setDeleteDialogOpen(false);
    setStudentToDelete(null);
  };

  const openDeleteDialog = (student: OjtStudentRecord) => {
    setStudentToDelete(student);
    setDeleteDialogOpen(true);
  };

  const togglePin = (id: string) => {
    setPinnedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === sortedStudents.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(sortedStudents.map((s) => s.id));
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    setBulkDeleteDialogOpen(true);
  };

  const confirmBulkDelete = () => {
    const nextStudents = students.filter((s) => !selectedIds.includes(s.id));
    saveOjtStudents(nextStudents);
    setStudents(nextStudents);
    setSelectedIds([]);
    setPinnedIds((current) => current.filter((id) => !selectedIds.includes(id)));
    setBulkDeleteDialogOpen(false);
  };

  const handlePinSelected = () => {
    selectedIds.forEach((id) => {
      if (!pinnedIds.includes(id)) {
        togglePin(id);
      }
    });
  };

  const handleSort = (column: 'name' | 'program' | 'school' | 'hours' | 'date' | 'startdate' | 'enddate' | 'modified') => {
    const currentSort = sortBy;
    const ascOption = `${column}-asc` as SortOption;
    const descOption = `${column}-desc` as SortOption;

    if (currentSort === ascOption) {
      setSortBy(descOption);
    } else {
      setSortBy(ascOption);
    }
  };

  const getSortIcon = (column: 'name' | 'program' | 'school' | 'hours' | 'date' | 'startdate' | 'enddate' | 'modified') => {
    const ascOption = `${column}-asc`;
    const descOption = `${column}-desc`;
    
    if (sortBy === ascOption) {
      return "↑";
    } else if (sortBy === descOption) {
      return "↓";
    }
    return "";
  };

  return (
    <div className="space-y-6 p-8">
      <PageHeader
        title={pageTitle}
        description={pageDescription}
        action={
          <div className="flex gap-2">
            {selectedIds.length > 0 && (
              <>
                <Button type="button" variant="outline" onClick={handlePinSelected}>
                  <Pin className="mr-2 h-4 w-4" />
                  Pin Selected ({selectedIds.length})
                </Button>
                <Button type="button" variant="destructive" onClick={handleBulkDelete}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Selected ({selectedIds.length})
                </Button>
              </>
            )}
            <Button type="button" onClick={openCreateDialog}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Student
            </Button>
          </div>
        }
      />
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, program, school, or office"
            className="pl-9"
          />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <select
            value={programFilter}
            onChange={(event) => setProgramFilter(event.target.value)}
            className="h-10 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200"
          >
            <option value="">All programs</option>
            {programs.map((program) => (
              <option key={program} value={program}>
                {program}
              </option>
            ))}
          </select>
          <select
            value={schoolFilter}
            onChange={(event) => setSchoolFilter(event.target.value)}
            className="h-10 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200"
          >
            <option value="">All schools</option>
            {schools.map((school) => (
              <option key={school} value={school}>
                {school}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Scrollable table container */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 400px)', minHeight: '400px' }}>
            <table className="w-full min-w-[960px]">
              <thead className="bg-gray-50 dark:bg-gray-800/70 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10 backdrop-blur-sm">
                <tr>
                  <th className="px-5 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={sortedStudents.length > 0 && selectedIds.length === sortedStudents.length}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-gray-300 text-violet-600"
                    />
                  </th>
                  <th 
                    className="px-5 py-3 text-left text-xs uppercase tracking-wider text-gray-500 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors select-none"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-1">
                      Name {getSortIcon('name')}
                    </div>
                  </th>
                  <th 
                    className="px-5 py-3 text-left text-xs uppercase tracking-wider text-gray-500 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors select-none"
                    onClick={() => handleSort('program')}
                  >
                    <div className="flex items-center gap-1">
                      Program {getSortIcon('program')}
                    </div>
                  </th>
                  <th 
                    className="px-5 py-3 text-left text-xs uppercase tracking-wider text-gray-500 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors select-none"
                    onClick={() => handleSort('school')}
                  >
                    <div className="flex items-center gap-1">
                      School {getSortIcon('school')}
                    </div>
                  </th>
                  <th className="px-5 py-3 text-left text-xs uppercase tracking-wider text-gray-500">Office</th>
                  <th 
                    className="px-5 py-3 text-left text-xs uppercase tracking-wider text-gray-500 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors select-none"
                    onClick={() => handleSort('hours')}
                  >
                    <div className="flex items-center gap-1">
                      OJT Hours {getSortIcon('hours')}
                    </div>
                  </th>
                  <th 
                    className="px-5 py-3 text-left text-xs uppercase tracking-wider text-gray-500 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors select-none"
                    onClick={() => handleSort('startdate')}
                  >
                    <div className="flex items-center gap-1">
                      Start Date {getSortIcon('startdate')}
                    </div>
                  </th>
                  <th 
                    className="px-5 py-3 text-left text-xs uppercase tracking-wider text-gray-500 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors select-none"
                    onClick={() => handleSort('enddate')}
                  >
                    <div className="flex items-center gap-1">
                      End Date {getSortIcon('enddate')}
                    </div>
                  </th>
                  <th 
                    className="px-5 py-3 text-left text-xs uppercase tracking-wider text-gray-500 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors select-none"
                    onClick={() => handleSort('modified')}
                  >
                    <div className="flex items-center gap-1">
                      Date Modified {getSortIcon('modified')}
                    </div>
                  </th>
                  <th className="px-5 py-3 text-right text-xs uppercase tracking-wider text-gray-500">Actions</th>
                </tr>
              </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {sortedStudents.length ? (
              sortedStudents.map((student) => {
                const startDateDisplay = student.startDate ? formatDateForDisplay(student.startDate) : "?";
                const endDateDisplay = student.endDate ? formatDateForDisplay(student.endDate) : "?";
                const isSelected = selectedIds.includes(student.id);
                const isPinned = pinnedIds.includes(student.id);
                
                return (
                <tr key={student.id} className={isSelected ? "bg-violet-50 dark:bg-violet-900/10" : ""}>
                  <td className="px-5 py-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelection(student.id)}
                      className="h-4 w-4 rounded border-gray-300 text-violet-600"
                    />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      {isPinned && (
                        <Pin className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                      )}
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{getStudentDisplayName(student)}</div>
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{student.address || "No address saved"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">{student.program}</td>
                  <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">{student.school}</td>
                  <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">{student.office || "No office assigned"}</td>
                  <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">{student.ojtHours || "N/A"}</td>
                  <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">{startDateDisplay}</td>
                  <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">{endDateDisplay}</td>
                  <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {student.createdAt ? formatDateForDisplay(student.createdAt) : "N/A"}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => togglePin(student.id)}
                        className="inline-flex items-center gap-1 rounded-md border border-gray-200 dark:border-gray-700 px-2.5 py-1.5 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        {isPinned ? (
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
                      <Button type="button" variant="outline" size="sm" onClick={() => openEditDialog(student)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => openDeleteDialog(student)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={10} className="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                  No students match the current search and filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{editingStudentId ? "Edit Student" : "Add Student"}</DialogTitle>
            <DialogDescription>Capture the same student details used by the video workflow before generating certificates.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="ojt-first-name">First name</Label>
              <Input id="ojt-first-name" value={form.firstName} onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ojt-middle-initial">Middle initial</Label>
              <Input id="ojt-middle-initial" value={form.middleInitial} onChange={(event) => setForm((current) => ({ ...current, middleInitial: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ojt-last-name">Last name</Label>
              <Input id="ojt-last-name" value={form.lastName} onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ojt-program">Program</Label>
              <OjtInputAutocomplete
                id="ojt-program"
                field="program"
                value={form.program}
                placeholder="e.g., BS Information Technology"
                onChange={(value) => setForm((current) => ({ ...current, program: value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ojt-school">School</Label>
              <OjtInputAutocomplete
                id="ojt-school"
                field="school"
                value={form.school}
                placeholder="e.g., Pangasinan State University"
                onChange={(value) => setForm((current) => ({ ...current, school: value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ojt-hours">OJT hours</Label>
              <OjtInputAutocomplete
                id="ojt-hours"
                field="ojtHours"
                value={form.ojtHours}
                placeholder="e.g., 486"
                onChange={(value) => setForm((current) => ({ ...current, ojtHours: value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ojt-start-date">Start date</Label>
              <OjtInputAutocomplete
                id="ojt-start-date"
                field="startDate"
                value={form.startDate}
                placeholder="e.g., April 08, 2026"
                onChange={(value) => setForm((current) => ({ ...current, startDate: value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ojt-end-date">End date</Label>
              <OjtInputAutocomplete
                id="ojt-end-date"
                field="endDate"
                value={form.endDate}
                placeholder="e.g., April 08, 2026"
                onChange={(value) => setForm((current) => ({ ...current, endDate: value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ojt-office">Office / assignment</Label>
              <OjtInputAutocomplete
                id="ojt-office"
                field="office"
                value={form.office}
                placeholder="e.g., Provincial Government - ENRO"
                onChange={(value) => setForm((current) => ({ ...current, office: value }))}
              />
            </div>
            <div className="space-y-2 md:col-span-3">
              <Label htmlFor="ojt-address">Address</Label>
              <OjtInputAutocomplete
                id="ojt-address"
                field="address"
                value={form.address}
                placeholder="e.g., Lingayen, Pangasinan"
                onChange={(value) => setForm((current) => ({ ...current, address: value }))}
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleSave}>
                {editingStudentId ? (
                  <>
                    <Pencil className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Save Student
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md rounded-[28px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Delete Student
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this student record? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {studentToDelete && (
            <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
              <p className="font-medium text-gray-900 dark:text-white">
                {getStudentDisplayName(studentToDelete)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {studentToDelete.program} - {studentToDelete.school}
              </p>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="button" 
              variant="destructive" 
              onClick={() => studentToDelete && handleDelete(studentToDelete.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Student
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent className="max-w-md rounded-[28px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Delete Multiple Students
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedIds.length} student{selectedIds.length > 1 ? 's' : ''}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBulkDelete} className="bg-red-600 hover:bg-red-700">
              Delete {selectedIds.length} Student{selectedIds.length > 1 ? 's' : ''}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function AddOjtRecord() {
  return <OjtStudentsScreen />;
}
