import { useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Filter, GraduationCap, Search, Upload } from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "../../../app/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../../app/components/ui/dialog";
import { PageHeader } from "../../../shared/components/PageHeader";
import {
  filterOjtStudents,
  getLatestQrRecordByKey,
  getOjtPrograms,
  getStudentDisplayName,
  loadOjtQrRecords,
  loadOjtSettings,
  loadOjtStudents,
  saveLastViewedCertificateIds,
  saveOjtSettings,
} from "../storage";
import { saveFileBlob } from "../../../shared/storage/fileStorageService";
import type { OjtSettings, OjtStudentRecord } from "../types";

const TEMPLATE_ACCEPT = ".png,.jpg,.jpeg,image/png,image/jpeg";

export function OjtCertificatesScreen() {
  const navigate = useNavigate();
  const templateInputRef = useRef<HTMLInputElement | null>(null);
  const [students] = useState<OjtStudentRecord[]>(() => loadOjtStudents());
  const [settings, setSettings] = useState<OjtSettings>(() => loadOjtSettings());
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [programFilter, setProgramFilter] = useState("");
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showMissingQrDialog, setShowMissingQrDialog] = useState(false);
  const [pendingNavigationIds, setPendingNavigationIds] = useState<string[]>([]);
  const qrRecords = useMemo(() => loadOjtQrRecords(), []);
  const qrRecordMap = useMemo(() => getLatestQrRecordByKey(qrRecords), [qrRecords]);
  const programs = useMemo(() => getOjtPrograms(students), [students]);
  const filteredStudents = useMemo(
    () => filterOjtStudents(students, { search, program: programFilter }),
    [programFilter, search, students],
  );

  const selectedStudents = useMemo(
    () => students.filter((student) => selectedIds.includes(student.id)),
    [selectedIds, students],
  );

  const toggleStudent = (studentId: string) => {
    setSelectedIds((current) =>
      current.includes(studentId) ? current.filter((id) => id !== studentId) : [...current, studentId],
    );
  };

  const handleTemplateUpload = async (file?: File) => {
    if (!file) {
      return;
    }

    const templateFile = await saveFileBlob(file);
    const nextSettings = {
      ...settings,
      templateFile,
      templateFileName: file.name,
    };
    saveOjtSettings(nextSettings);
    setSettings(nextSettings);
    setShowTemplateDialog(true);
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

    const missingQrStudents = selectedStudents.filter(
      (student) => !qrRecordMap.get(`${student.program}|||${student.school}`),
    );

    if (missingQrStudents.length) {
      setPendingNavigationIds(selectedStudents.map((student) => student.id));
      setShowMissingQrDialog(true);
      return;
    }

    navigateToViewer(selectedStudents.map((student) => student.id));
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredStudents.map((student) => student.id));
      return;
    }

    setSelectedIds([]);
  };

  return (
    <div className="space-y-6 p-8">
      <PageHeader
        title="Generate Certificate"
        description="Search students, select who to include, upload the certificate template, then generate the certificate view."
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
              checked={filteredStudents.length > 0 && filteredStudents.every((student) => selectedIds.includes(student.id))}
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

        <div className="mt-6 space-y-3">
          {filteredStudents.length ? (
            filteredStudents.map((student) => {
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
                      {!qrRecord ? (
                        <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-amber-700">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Missing QR Code
                        </p>
                      ) : null}
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

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <input
            ref={templateInputRef}
            type="file"
            accept={TEMPLATE_ACCEPT}
            className="hidden"
            onChange={(event) => void handleTemplateUpload(event.target.files?.[0])}
          />
          <Button type="button" className="self-end" variant="outline" onClick={() => templateInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            {settings.templateFileName ? "Replace Template" : "Upload Template"}
          </Button>
          <Button type="button" className="self-end" onClick={handleGenerate} disabled={!selectedStudents.length}>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Generate Certificate
          </Button>
        </div>
      </div>

      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-sm rounded-[28px]">
          <DialogHeader>
            <DialogTitle>Template Uploaded</DialogTitle>
            <DialogDescription>Your certificate template was uploaded successfully.</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      <Dialog open={showMissingQrDialog} onOpenChange={setShowMissingQrDialog}>
        <DialogContent className="max-w-2xl rounded-[28px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Missing QR Codes
            </DialogTitle>
            <DialogDescription>
              Some students are missing QR codes. Their certificates will still be generated, but without QR links.
              Make sure to generate QR codes first to have QR codes for the following students:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm text-gray-700 dark:text-gray-200">
            {selectedStudents
              .filter((student) => !qrRecordMap.get(`${student.program}|||${student.school}`))
              .map((student) => (
                <p key={student.id}>
                  {student.program} | {student.school} | {student.endDate ? new Date(student.endDate).getFullYear() : new Date().getFullYear()}
                </p>
              ))}
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={() => {
                setShowMissingQrDialog(false);
                navigateToViewer(pendingNavigationIds);
              }}
            >
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function ViewOjtRecords() {
  return <OjtCertificatesScreen />;
}
