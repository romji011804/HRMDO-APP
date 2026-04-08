import { useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2, UserPlus } from "lucide-react";
import { useLocation } from "react-router";
import { Button } from "../../../app/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../../app/components/ui/dialog";
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

function toFormState(student?: OjtStudentRecord): StudentFormState {
  return {
    firstName: student?.firstName ?? "",
    middleInitial: student?.middleInitial ?? "",
    lastName: student?.lastName ?? "",
    program: student?.program ?? "",
    school: student?.school ?? "",
    ojtHours: student?.ojtHours ?? "",
    startDate: student?.startDate ?? "",
    endDate: student?.endDate ?? "",
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

  const isAddMode = location.pathname === "/ojt/add-student";
  const pageTitle = isAddMode ? "Add Student" : "View Students";
  const pageDescription = isAddMode
    ? "Create the student records used later in QR generation and certificate creation."
    : "Review and manage the student records used in the certificate workflow.";

  const filteredStudents = useMemo(
    () => filterOjtStudents(students, { search, program: programFilter, school: schoolFilter }),
    [programFilter, schoolFilter, search, students],
  );
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
    const nextStudent: OjtStudentRecord = {
      id: editingStudentId ?? crypto.randomUUID(),
      createdAt: students.find((student) => student.id === editingStudentId)?.createdAt ?? now,
      firstName: form.firstName.trim(),
      middleInitial: form.middleInitial.trim() || undefined,
      lastName: form.lastName.trim(),
      program: form.program.trim(),
      school: form.school.trim(),
      ojtHours: form.ojtHours.trim() || undefined,
      startDate: form.startDate.trim() || undefined,
      endDate: form.endDate.trim() || undefined,
      office: form.office.trim() || undefined,
      address: form.address.trim() || undefined,
    };

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
  };

  return (
    <div className="space-y-6 p-8">
      <PageHeader
        title={pageTitle}
        description={pageDescription}
        action={
          <Button type="button" onClick={openCreateDialog}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Student
          </Button>
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
                  <th className="px-5 py-3 text-left text-xs uppercase tracking-wider text-gray-500">Student</th>
                  <th className="px-5 py-3 text-left text-xs uppercase tracking-wider text-gray-500">Program</th>
                  <th className="px-5 py-3 text-left text-xs uppercase tracking-wider text-gray-500">School</th>
                  <th className="px-5 py-3 text-left text-xs uppercase tracking-wider text-gray-500">Office</th>
                  <th className="px-5 py-3 text-left text-xs uppercase tracking-wider text-gray-500">OJT Dates</th>
                  <th className="px-5 py-3 text-right text-xs uppercase tracking-wider text-gray-500">Actions</th>
                </tr>
              </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {filteredStudents.length ? (
              filteredStudents.map((student) => (
                <tr key={student.id}>
                  <td className="px-5 py-4">
                    <div className="font-medium text-gray-900 dark:text-white">{getStudentDisplayName(student)}</div>
                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{student.address || "No address saved"}</div>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">{student.program}</td>
                  <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">{student.school}</td>
                  <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">{student.office || "No office assigned"}</td>
                  <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {student.startDate || student.endDate
                      ? `${student.startDate || "?"} - ${student.endDate || "?"}`
                      : `Hours: ${student.ojtHours || "N/A"}`}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => openEditDialog(student)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => handleDelete(student.id)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
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
              <Input id="ojt-program" value={form.program} onChange={(event) => setForm((current) => ({ ...current, program: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ojt-school">School</Label>
              <Input id="ojt-school" value={form.school} onChange={(event) => setForm((current) => ({ ...current, school: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ojt-hours">OJT hours</Label>
              <Input id="ojt-hours" value={form.ojtHours} onChange={(event) => setForm((current) => ({ ...current, ojtHours: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ojt-start-date">Start date</Label>
              <Input id="ojt-start-date" value={form.startDate} onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))} placeholder="YYYY-MM-DD" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ojt-end-date">End date</Label>
              <Input id="ojt-end-date" value={form.endDate} onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))} placeholder="YYYY-MM-DD" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ojt-office">Office / assignment</Label>
              <Input id="ojt-office" value={form.office} onChange={(event) => setForm((current) => ({ ...current, office: event.target.value }))} />
            </div>
            <div className="space-y-2 md:col-span-3">
              <Label htmlFor="ojt-address">Address</Label>
              <Textarea id="ojt-address" value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} rows={3} />
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
    </div>
  );
}

export function AddOjtRecord() {
  return <OjtStudentsScreen />;
}
