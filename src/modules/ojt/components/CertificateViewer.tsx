import { ArrowLeft, Printer, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  buildCertificateSvg,
  buildSheetSvg,
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

function CertificateCard({ preview }: { preview: ResolvedCertificatePreview }) {
  const [svgDataUrl, setSvgDataUrl] = useState<string>("");

  useEffect(() => {
    // Import the buildSheetSvg function or create the SVG here
    const completionLine = [preview.dateRangeLabel, preview.officeLine].filter(Boolean).join(" ");
    
    // Generate the same SVG that will be downloaded
    const svg = buildCertificateSvg(preview);
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    setSvgDataUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [preview]);

  return (
    <article className="relative mx-auto aspect-[1600/1035] w-full max-w-[1400px] overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-lg">
      {svgDataUrl ? (
        <img src={svgDataUrl} alt={`Certificate for ${preview.studentName}`} className="h-full w-full object-contain" />
      ) : (
        <div className="flex h-full items-center justify-center text-gray-500">Loading certificate...</div>
      )}
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

  const handlePrint = async () => {
    // For printing, we need to generate 2-up sheets (2 certificates per page)
    // Create a temporary container with 2-up layout
    const printContainer = document.createElement('div');
    printContainer.style.display = 'none';
    printContainer.className = 'print-sheets';
    
    // Generate 2-up sheets
    for (let i = 0; i < previews.length; i += 2) {
      const top = previews[i];
      const bottom = previews[i + 1];
      
      // Build the 2-up sheet SVG
      const svg = buildSheetSvg(top, bottom);
      const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      // Create an img element for the sheet
      const img = document.createElement('img');
      img.src = url;
      img.className = 'print-sheet';
      img.style.pageBreakAfter = i + 2 < previews.length ? 'always' : 'auto';
      img.style.display = 'block';
      
      printContainer.appendChild(img);
    }
    
    document.body.appendChild(printContainer);
    
    // Wait for images to load
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check if running in Electron
    if (window.electronAPI?.print) {
      await window.electronAPI.print();
    } else {
      // Fallback to browser print
      window.print();
    }
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(printContainer);
    }, 1000);
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
