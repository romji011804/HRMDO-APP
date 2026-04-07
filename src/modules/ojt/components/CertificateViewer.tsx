import { ArrowLeft, Printer, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  createSavedCertificateRecord,
  downloadCertificatePreviews,
  resolveCertificatePreviews,
  type ResolvedCertificatePreview,
} from "../documentService";
import {
  loadLastViewedCertificateIds,
  loadOjtQrRecords,
  loadOjtSettings,
  loadOjtStudents,
  loadSavedOjtCertificates,
  saveLastViewedCertificateIds,
  saveSavedOjtCertificates,
} from "../storage";

interface ViewerState {
  selectedIds?: string[];
}

function countWords(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function nameTextStyle(name: string) {
  const length = name.length;
  const words = countWords(name);

  if (length <= 24 && words <= 3) {
    return { fontSize: "clamp(54px, 4.2vw, 80px)", maxWidth: "76%", lineHeight: 0.98 };
  }
  if (length <= 34) {
    return { fontSize: "clamp(48px, 3.6vw, 68px)", maxWidth: "78%", lineHeight: 0.98 };
  }
  if (length <= 44) {
    return { fontSize: "clamp(42px, 3.15vw, 58px)", maxWidth: "80%", lineHeight: 1.02 };
  }
  return { fontSize: "clamp(34px, 2.7vw, 50px)", maxWidth: "82%", lineHeight: 1.04 };
}

function schoolTextStyle(school: string) {
  const length = school.length;

  if (length <= 45) {
    return { fontSize: "clamp(21px, 1.5vw, 29px)", maxWidth: "72%", lineHeight: 1.2 };
  }
  if (length <= 75) {
    return { fontSize: "clamp(18px, 1.3vw, 25px)", maxWidth: "78%", lineHeight: 1.22 };
  }
  return { fontSize: "clamp(16px, 1.15vw, 21px)", maxWidth: "82%", lineHeight: 1.24 };
}

function emphasisTextStyle(text: string) {
  const length = text.length;

  if (length <= 56) {
    return { fontSize: "clamp(22px, 1.55vw, 33px)", maxWidth: "80%", lineHeight: 1.12 };
  }
  if (length <= 92) {
    return { fontSize: "clamp(19px, 1.34vw, 28px)", maxWidth: "84%", lineHeight: 1.14 };
  }
  return { fontSize: "clamp(16px, 1.16vw, 24px)", maxWidth: "86%", lineHeight: 1.16 };
}

function supportingTextStyle(text: string) {
  const length = text.length;

  if (length <= 85) {
    return { fontSize: "clamp(18px, 1.24vw, 25px)", maxWidth: "78%", lineHeight: 1.22 };
  }
  if (length <= 130) {
    return { fontSize: "clamp(16px, 1.1vw, 22px)", maxWidth: "82%", lineHeight: 1.24 };
  }
  return { fontSize: "clamp(14px, 1vw, 19px)", maxWidth: "85%", lineHeight: 1.26 };
}

function issuedTextStyle(text: string) {
  const length = text.length;

  if (length <= 42) {
    return { fontSize: "clamp(22px, 1.45vw, 30px)", maxWidth: "70%", lineHeight: 1.16 };
  }
  if (length <= 60) {
    return { fontSize: "clamp(19px, 1.3vw, 27px)", maxWidth: "74%", lineHeight: 1.18 };
  }
  return { fontSize: "clamp(17px, 1.12vw, 23px)", maxWidth: "78%", lineHeight: 1.2 };
}

function CertificateCard({ preview }: { preview: ResolvedCertificatePreview }) {
  const completionLine = [preview.dateRangeLabel, preview.officeLine].filter(Boolean).join(" ");
  const nameStyle = nameTextStyle(preview.studentName);
  const schoolStyle = schoolTextStyle(preview.subtitle);
  const hoursStyle = emphasisTextStyle(preview.hoursLabel);
  const detailStyle = supportingTextStyle(completionLine);
  const issuedStyle = issuedTextStyle(preview.issuedLine);

  return (
    <article className="relative mx-auto aspect-[1.414/1] w-full max-w-[1400px] overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-lg">
      <img src={preview.templateSrc} alt="Certificate template" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-white/10" />
      <div className="absolute inset-x-[8%] top-[40.8%] bottom-[12.75%] px-6 text-center text-black">
        <div className="flex flex-col items-center">
          <h1 className="font-bold uppercase tracking-tight text-balance" style={nameStyle}>
            {preview.studentName}
          </h1>
          <p className="mt-8 italic text-balance text-black/90" style={schoolStyle}>
            ({preview.subtitle})
          </p>
          <p className="mt-[5.9rem] font-bold uppercase text-balance" style={hoursStyle}>
            {preview.hoursLabel}
          </p>
          <p className="mt-2 text-balance text-black/90" style={detailStyle}>
            {completionLine}
          </p>
          <div className="h-[6.6rem]" />
          <p className="text-balance text-black/90" style={issuedStyle}>
            {preview.issuedLine}
          </p>
        </div>
        {preview.qrSrc ? (
          <div className="absolute bottom-[8%] left-[6.5%] rounded-xl bg-white/90 p-2 shadow-md">
            <img src={preview.qrSrc} alt="QR code" className="h-[7vw] w-[7vw] object-contain" />
          </div>
        ) : null}
      </div>
    </article>
  );
}

export function OjtCertificateViewer() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as ViewerState | null) ?? {};
  const [previews, setPreviews] = useState<ResolvedCertificatePreview[]>([]);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    const selectedIds = state.selectedIds?.length ? state.selectedIds : loadLastViewedCertificateIds();
    const selectedStudents = loadOjtStudents().filter((student) => selectedIds.includes(student.id));

    if (!selectedStudents.length) {
      return;
    }

    saveLastViewedCertificateIds(selectedIds);

    void resolveCertificatePreviews({
      students: selectedStudents,
      qrRecords: loadOjtQrRecords(),
      settings: loadOjtSettings(),
    }).then(setPreviews);
  }, [state.selectedIds]);

  const handlePrint = () => {
    window.print();
  };

  const handleSave = () => {
    if (!previews.length) {
      return;
    }

    const existing = loadSavedOjtCertificates();
    const newRecords = previews.map(createSavedCertificateRecord);
    saveSavedOjtCertificates([...existing, ...newRecords]);
    downloadCertificatePreviews(previews);
    setSaveMessage(`Saved ${newRecords.length} certificate${newRecords.length > 1 ? "s" : ""} to Downloads.`);
    window.setTimeout(() => setSaveMessage(""), 2500);
  };

  return (
    <div className="min-h-screen space-y-6 bg-[#f6edf8] p-6 print:bg-white">
      <div className="flex items-center gap-3 text-gray-900 print:hidden">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-white"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-medium">View Certificate</h1>
      </div>

      {previews.length ? (
        <div className="space-y-8">
          {previews.map((preview) => (
            <CertificateCard key={preview.id} preview={preview} />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500 shadow-sm">
          No generated certificate to display yet.
        </div>
      )}

      {saveMessage ? (
        <div className="fixed bottom-6 left-6 rounded-xl bg-white px-4 py-3 text-sm text-gray-700 shadow-lg print:hidden">
          {saveMessage}
        </div>
      ) : null}

      <div className="fixed bottom-6 right-6 flex flex-col gap-3 print:hidden">
        <button
          type="button"
          onClick={handlePrint}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition hover:bg-green-600"
          aria-label="Print certificate"
        >
          <Printer className="h-6 w-6" />
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition hover:bg-green-600"
          aria-label="Save certificate"
        >
          <Save className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}
