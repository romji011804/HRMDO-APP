import { useEffect, useState } from "react";
import { Eye, QrCode, Trash2 } from "lucide-react";
import { Button } from "../../../app/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../../app/components/ui/dialog";
import { Input } from "../../../app/components/ui/input";
import { Label } from "../../../app/components/ui/label";
import { PageHeader } from "../../../shared/components/PageHeader";
import { getFileBlob, saveFileBlob } from "../../../shared/storage/fileStorageService";
import { generateQrImageBlob } from "../qrService";
import { loadOjtQrRecords, saveOjtQrRecords } from "../storage";
import type { OjtQrRecord } from "../types";

function QrPreview({ fileKey }: { fileKey?: string }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;

    const load = async () => {
      if (!fileKey) {
        setSrc(null);
        return;
      }

      const blob = await getFileBlob(fileKey);
      if (!blob || !active) {
        return;
      }

      objectUrl = URL.createObjectURL(blob);
      setSrc(objectUrl);
    };

    void load();

    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [fileKey]);

  return src ? (
    <img src={src} alt="QR preview" className="h-12 w-12 rounded-lg border border-gray-200 object-cover dark:border-gray-700" />
  ) : (
    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
      <QrCode className="h-5 w-5" />
    </div>
  );
}

export function OjtQrCodes() {
  const [records, setRecords] = useState<OjtQrRecord[]>(() => loadOjtQrRecords());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [program, setProgram] = useState("");
  const [school, setSchool] = useState("");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [fileUrl, setFileUrl] = useState("");
  const [message, setMessage] = useState("");

  const handleSave = async () => {
    if (!program.trim() || !school.trim() || !fileUrl.trim()) {
      setMessage("Program, school, and file URL are required.");
      return;
    }

    const qrImageBlob = await generateQrImageBlob(fileUrl.trim());
    const qrImageFile = await saveFileBlob(qrImageBlob);
    const nextRecords = [
      ...records,
      {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      program: program.trim(),
      school: school.trim(),
      year: Number(year) || new Date().getFullYear(),
      fileUrl: fileUrl.trim(),
      qrImageFile,
      qrImageFileName: `${program.trim()}-${year}.png`,
    },
    ];
    saveOjtQrRecords(nextRecords);
    setRecords(nextRecords);
    setProgram("");
    setSchool("");
    setYear(String(new Date().getFullYear()));
    setFileUrl("");
    setMessage("");
    setDialogOpen(false);
  };

  const handleDelete = (recordId: string) => {
    const nextRecords = records.filter((record) => record.id !== recordId);
    saveOjtQrRecords(nextRecords);
    setRecords(nextRecords);
  };

  const handleOpen = async (fileKey?: string) => {
    if (!fileKey) {
      return;
    }

    const blob = await getFileBlob(fileKey);
    if (!blob) {
      return;
    }

    const objectUrl = URL.createObjectURL(blob);
    window.open(objectUrl, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
  };

  return (
    <div className="space-y-6 p-8">
      <PageHeader
        title="QR Codes"
        description="Generate QR references keyed by program and school so certificate batches can reuse them automatically."
        action={
          <Button type="button" onClick={() => setDialogOpen(true)}>
            <QrCode className="mr-2 h-4 w-4" />
            Generate QR
          </Button>
        }
      />
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <table className="w-full min-w-[860px]">
          <thead className="bg-gray-50 dark:bg-gray-800/70">
            <tr>
              <th className="px-5 py-3 text-left text-xs uppercase tracking-wider text-gray-500">Preview</th>
              <th className="px-5 py-3 text-left text-xs uppercase tracking-wider text-gray-500">Program</th>
              <th className="px-5 py-3 text-left text-xs uppercase tracking-wider text-gray-500">School</th>
              <th className="px-5 py-3 text-left text-xs uppercase tracking-wider text-gray-500">Year</th>
              <th className="px-5 py-3 text-left text-xs uppercase tracking-wider text-gray-500">File URL</th>
              <th className="px-5 py-3 text-right text-xs uppercase tracking-wider text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {records.length ? (
              records.map((record) => (
                <tr key={record.id}>
                  <td className="px-5 py-4">
                    <QrPreview fileKey={record.qrImageFile} />
                  </td>
                  <td className="px-5 py-4 text-sm font-medium text-gray-900 dark:text-white">{record.program}</td>
                  <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">{record.school}</td>
                  <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">{record.year}</td>
                  <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">{record.fileUrl}</td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <Button type="button" size="sm" variant="outline" onClick={() => void handleOpen(record.qrImageFile)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Open
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => handleDelete(record.id)}>
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
                  No QR records yet. Generate one to attach it automatically to certificates with the same program and school.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Generate QR Code</DialogTitle>
            <DialogDescription>Save the latest drive or file URL for a program and school pair.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="qrProgram">Program</Label>
              <Input id="qrProgram" value={program} onChange={(event) => setProgram(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qrSchool">School</Label>
              <Input id="qrSchool" value={school} onChange={(event) => setSchool(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qrYear">Year</Label>
              <Input id="qrYear" value={year} onChange={(event) => setYear(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qrUrl">File URL / Drive link</Label>
              <Input id="qrUrl" value={fileUrl} onChange={(event) => setFileUrl(event.target.value)} />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-red-600 dark:text-red-400">{message}</p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={() => void handleSave()}>
                Save QR
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
