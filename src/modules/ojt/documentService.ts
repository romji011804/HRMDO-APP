import { getFileBlob } from "../../shared/storage/fileStorageService.ts";
import type { OjtQrRecord, OjtSavedCertificateRecord, OjtSettings, OjtStudentRecord } from "./types";

export interface ResolvedCertificatePreview {
  id: string;
  studentId: string;
  studentName: string;
  subtitle: string;
  hoursLabel: string;
  dateRangeLabel: string;
  officeLine: string;
  issuedLine: string;
  templateSrc: string;
  templateFileName?: string;
  qrSrc: string | null;
}

interface CertificateLayoutMetrics {
  nameFontSize: number;
  schoolFontSize: number;
  hoursFontSize: number;
  detailsFontSize: number;
  issuedFontSize: number;
  nameWidth: number;
  schoolWidth: number;
  hoursWidth: number;
  detailsWidth: number;
  issuedWidth: number;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Unable to read file."));
    reader.readAsDataURL(blob);
  });
}

async function getStoredFileDataUrl(key?: string) {
  if (!key) return null;
  const blob = await getFileBlob(key);
  return blob ? blobToDataUrl(blob) : null;
}

async function getBundledTemplateDataUrl() {
  const response = await fetch("/templates/ojt-certificate-template.jpg");
  if (!response.ok) throw new Error("Unable to load the bundled certificate template.");
  return blobToDataUrl(await response.blob());
}

async function resolveTemplateSource(settings: OjtSettings) {
  return (await getStoredFileDataUrl(settings.templateFile)) ?? (await getBundledTemplateDataUrl());
}

function formatCertificateName(student: OjtStudentRecord) {
  const middleInitial = student.middleInitial?.trim();
  return [student.firstName.trim(), middleInitial ? `${middleInitial}.` : "", student.lastName.trim()]
    .filter(Boolean)
    .join(" ")
    .toUpperCase();
}

function formatLongDate(value?: string) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function dayWithSuffix(day: number) {
  const mod10 = day % 10;
  const mod100 = day % 100;
  if (mod10 === 1 && mod100 !== 11) return `${day}st`;
  if (mod10 === 2 && mod100 !== 12) return `${day}nd`;
  if (mod10 === 3 && mod100 !== 13) return `${day}rd`;
  return `${day}th`;
}

function certificateIssuedLine() {
  const parsed = new Date();
  if (Number.isNaN(parsed.getTime())) return "";
  return `Given this ${dayWithSuffix(parsed.getDate())} day of ${parsed.toLocaleDateString("en-US", { month: "long" })} ${parsed.getFullYear()}.`;
}

export async function resolveCertificatePreviews({ students, qrRecords, settings }: {
  students: OjtStudentRecord[];
  qrRecords: OjtQrRecord[];
  settings: OjtSettings;
}) {
  const templateSrc = await resolveTemplateSource(settings);
  const qrSources = new Map<string, string | null>();
  for (const qrRecord of qrRecords) {
    qrSources.set(`${qrRecord.program}|||${qrRecord.school}`, await getStoredFileDataUrl(qrRecord.qrImageFile));
  }
  return students.map<ResolvedCertificatePreview>((student) => {
    const numericHours = Number(student.ojtHours ?? 0);
    const formattedHours = Number.isFinite(numericHours) && numericHours > 0 ? String(Math.round(numericHours)) : "0";
    const hasStartAndEndDate = Boolean(student.startDate && student.endDate);
    return {
      id: student.id,
      studentId: student.id,
      studentName: formatCertificateName(student),
      subtitle: student.school,
      hoursLabel: `${formattedHours} HOURS ON THE JOB AND WORK IMMERSION TRAINING`,
      dateRangeLabel: hasStartAndEndDate ? `from ${formatLongDate(student.startDate)} to ${formatLongDate(student.endDate)}` : "",
      officeLine: `at the ${student.office?.trim() || "Provincial Government Office"}${student.address?.trim() ? `, ${student.address.trim()}` : ""}`,
      issuedLine: certificateIssuedLine(),
      templateSrc,
      templateFileName: settings.templateFileName,
      qrSrc: qrSources.get(`${student.program}|||${student.school}`) ?? null,
    };
  });
}

export function createSavedCertificateRecord(preview: ResolvedCertificatePreview): OjtSavedCertificateRecord {
  return {
    id: crypto.randomUUID(),
    studentId: preview.studentId,
    savedAt: new Date().toISOString(),
    studentName: preview.studentName,
    school: preview.subtitle,
    hoursLabel: preview.hoursLabel,
    dateRangeLabel: preview.dateRangeLabel,
    officeLine: preview.officeLine,
    issuedLine: preview.issuedLine,
    templateFileName: preview.templateFileName,
    qrIncluded: Boolean(preview.qrSrc),
  };
}

function sanitizeFileName(value: string) {
  return value.replace(/[<>:"/\\|?*\x00-\x1F]/g, "").replace(/\s+/g, "_").slice(0, 120) || "certificate";
}

function certificateLayoutMetrics(preview: ResolvedCertificatePreview, completionLine: string): CertificateLayoutMetrics {
  const nameLength = preview.studentName.length;
  const schoolLength = preview.subtitle.length;
  const hoursLength = preview.hoursLabel.length;
  const detailsLength = completionLine.length;
  const issuedLength = preview.issuedLine.length;
  return {
    nameFontSize: nameLength <= 20 ? 90 : nameLength <= 28 ? 78 : nameLength <= 36 ? 66 : nameLength <= 44 ? 58 : nameLength <= 52 ? 50 : nameLength <= 60 ? 44 : 38,
    schoolFontSize: schoolLength <= 45 ? 31 : schoolLength <= 75 ? 26 : 22,
    hoursFontSize: hoursLength <= 56 ? 34 : hoursLength <= 92 ? 29 : 25,
    detailsFontSize: detailsLength <= 85 ? 26 : detailsLength <= 130 ? 22 : 19,
    issuedFontSize: issuedLength <= 42 ? 30 : issuedLength <= 60 ? 26 : 22,
    nameWidth: nameLength <= 20 ? 1280 : nameLength <= 28 ? 1310 : nameLength <= 36 ? 1340 : nameLength <= 44 ? 1360 : nameLength <= 52 ? 1380 : 1400,
    schoolWidth: schoolLength <= 45 ? 1120 : schoolLength <= 75 ? 1180 : 1240,
    hoursWidth: hoursLength <= 56 ? 1220 : hoursLength <= 92 ? 1280 : 1320,
    detailsWidth: detailsLength <= 85 ? 1180 : detailsLength <= 130 ? 1240 : 1290,
    issuedWidth: issuedLength <= 42 ? 980 : issuedLength <= 60 ? 1040 : 1100,
  };
}

function certificateNameLineHeight(name: string) {
  return 0.95;
}

export function buildSheetSvg(top: ResolvedCertificatePreview, bottom?: ResolvedCertificatePreview) {
  // Letter size: 8.5 x 11 inches - fill entire page
  const sheetW = 1700;
  const sheetH = 2200;
  const slotH = Math.floor(sheetH / 2);
  
  // Template fills entire page - no scaling, no offset
  const templateW = sheetW;
  const templateH = sheetH;
  const templateX = 0;
  const templateY = 0;

  function topSlotOverlays(preview: ResolvedCertificatePreview, offsetY: number) {
    const completionLine = [preview.dateRangeLabel, preview.officeLine].filter(Boolean).join(" ");
    const metrics = certificateLayoutMetrics(preview, completionLine);
    
    // TOP certificate positions
    const nameY = offsetY + 420;
    const schoolY = offsetY + 540;
    const hoursY = offsetY + 635;
    const issuedY = offsetY + 800;
    const qrY = offsetY + 850;
    
    const qrImage = preview.qrSrc ? `<image href="${preview.qrSrc}" x="92" y="${qrY}" width="110" height="110" preserveAspectRatio="xMidYMid meet" />` : "";
    return `
      <foreignObject x="${Math.round((sheetW - metrics.nameWidth) / 2)}" y="${nameY}" width="${metrics.nameWidth}" height="90">
        <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:'Times New Roman',serif;font-size:${metrics.nameFontSize}px;font-weight:700;line-height:0.95;letter-spacing:-0.015em;text-align:center;text-transform:uppercase;color:#111;word-break:break-word;">
            ${escapeHtml(preview.studentName)}
        </div>
      </foreignObject>
      <foreignObject x="${Math.round((sheetW - metrics.schoolWidth) / 2)}" y="${schoolY}" width="${metrics.schoolWidth}" height="70">
        <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:'Times New Roman',serif;font-size:${metrics.schoolFontSize}px;font-style:italic;line-height:1.2;text-align:center;color:rgba(17,17,17,0.92);word-break:break-word;">
            (${escapeHtml(preview.subtitle)})
        </div>
      </foreignObject>
      <foreignObject x="${Math.round((sheetW - 1300) / 2)}" y="${hoursY}" width="1300" height="150">
        <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:'Times New Roman',serif;font-size:${metrics.hoursFontSize}px;line-height:1.25;text-align:center;color:rgba(17,17,17,0.92);">
            <div style="font-weight:700;text-transform:uppercase;color:#111;margin:0 0 6px 0;padding:0;line-height:1.2;">${escapeHtml(preview.hoursLabel)}</div>
            <div style="font-weight:400;margin:0;padding:0;line-height:1.3;">${escapeHtml(completionLine)}</div>
        </div>
      </foreignObject>
      <foreignObject x="${Math.round((sheetW - metrics.issuedWidth) / 2)}" y="${issuedY}" width="${metrics.issuedWidth}" height="70">
        <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:'Times New Roman',serif;font-size:${metrics.issuedFontSize}px;line-height:1.2;text-align:center;color:rgba(17,17,17,0.92);word-break:break-word;">
            ${escapeHtml(preview.issuedLine)}
        </div>
      </foreignObject>
      ${qrImage}`;
  }

  function bottomSlotOverlays(preview: ResolvedCertificatePreview, offsetY: number) {
    const completionLine = [preview.dateRangeLabel, preview.officeLine].filter(Boolean).join(" ");
    const metrics = certificateLayoutMetrics(preview, completionLine);
    
    // BOTTOM certificate positions
    const nameY = offsetY + 400;
    const schoolY = offsetY + 520;
    const hoursY = offsetY + 615;
    const issuedY = offsetY + 800;
    const qrY = offsetY + 850;
    
    const qrImage = preview.qrSrc ? `<image href="${preview.qrSrc}" x="92" y="${qrY}" width="110" height="110" preserveAspectRatio="xMidYMid meet" />` : "";
    return `
      <foreignObject x="${Math.round((sheetW - metrics.nameWidth) / 2)}" y="${nameY}" width="${metrics.nameWidth}" height="90">
        <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:'Times New Roman',serif;font-size:${metrics.nameFontSize}px;font-weight:700;line-height:0.95;letter-spacing:-0.015em;text-align:center;text-transform:uppercase;color:#111;word-break:break-word;">
            ${escapeHtml(preview.studentName)}
        </div>
      </foreignObject>
      <foreignObject x="${Math.round((sheetW - metrics.schoolWidth) / 2)}" y="${schoolY}" width="${metrics.schoolWidth}" height="70">
        <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:'Times New Roman',serif;font-size:${metrics.schoolFontSize}px;font-style:italic;line-height:1.2;text-align:center;color:rgba(17,17,17,0.92);word-break:break-word;">
            (${escapeHtml(preview.subtitle)})
        </div>
      </foreignObject>
      <foreignObject x="${Math.round((sheetW - 1300) / 2)}" y="${hoursY}" width="1300" height="150">
        <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:'Times New Roman',serif;font-size:${metrics.hoursFontSize}px;line-height:1.25;text-align:center;color:rgba(17,17,17,0.92);">
            <div style="font-weight:700;text-transform:uppercase;color:#111;margin:0 0 6px 0;padding:0;line-height:1.2;">${escapeHtml(preview.hoursLabel)}</div>
            <div style="font-weight:400;margin:0;padding:0;line-height:1.3;">${escapeHtml(completionLine)}</div>
        </div>
      </foreignObject>
      <foreignObject x="${Math.round((sheetW - metrics.issuedWidth) / 2)}" y="${issuedY}" width="${metrics.issuedWidth}" height="70">
        <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:'Times New Roman',serif;font-size:${metrics.issuedFontSize}px;line-height:1.2;text-align:center;color:rgba(17,17,17,0.92);word-break:break-word;">
            ${escapeHtml(preview.issuedLine)}
        </div>
      </foreignObject>
      ${qrImage}`;
  }

  const topOverlays = topSlotOverlays(top, 0);
  const bottomOverlays = bottom ? bottomSlotOverlays(bottom, slotH) : "";
  const separator = bottom ? `<line x1="0" y1="${slotH}" x2="${sheetW}" y2="${slotH}" stroke="#e0e0e0" stroke-width="2" stroke-dasharray="10,5" />` : "";

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="8.5in" height="11in" viewBox="0 0 ${sheetW} ${sheetH}" preserveAspectRatio="xMidYMid meet">
      <image href="${top.templateSrc}" x="${templateX}" y="${templateY}" width="${templateW}" height="${templateH}" preserveAspectRatio="none" />
      <rect x="0" y="0" width="${sheetW}" height="${sheetH}" fill="rgba(255,255,255,0.10)" />
      ${topOverlays}
      ${separator}
      ${bottomOverlays}
    </svg>
  `.trim();
}

export function buildCertificateSvg(preview: ResolvedCertificatePreview) {
  // Single certificate SVG - fills one space only (used for downloads)
  const certW = 1700;
  const certH = 1100; // Single certificate space height
  
  const completionLine = [preview.dateRangeLabel, preview.officeLine].filter(Boolean).join(" ");
  const metrics = certificateLayoutMetrics(preview, completionLine);
  
  // Vertical flow structure anchored to template text
  const nameY = 400;      // Below "is awarded to"
  const schoolY = 395;    // Tight below name
  const hoursY = 500;     // Below "for having successfully completed"
  const issuedY = 660;    // Below message block
  const qrY = 750;        // QR code position
  
  const qrImage = preview.qrSrc ? `<image href="${preview.qrSrc}" x="92" y="${qrY}" width="110" height="110" preserveAspectRatio="xMidYMid meet" />` : "";
  
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="1700" height="1100" viewBox="0 0 ${certW} ${certH}">
      <rect x="0" y="0" width="${certW}" height="${certH}" fill="white" />
      <foreignObject x="${Math.round((certW - metrics.nameWidth) / 2)}" y="${nameY}" width="${metrics.nameWidth}" height="90">
        <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:'Times New Roman',serif;font-size:${metrics.nameFontSize}px;font-weight:700;line-height:0.95;letter-spacing:-0.015em;text-align:center;text-transform:uppercase;color:#111;word-break:break-word;">
            ${escapeHtml(preview.studentName)}
        </div>
      </foreignObject>
      <foreignObject x="${Math.round((certW - metrics.schoolWidth) / 2)}" y="${schoolY}" width="${metrics.schoolWidth}" height="70">
        <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:'Times New Roman',serif;font-size:${metrics.schoolFontSize}px;font-style:italic;line-height:1.2;text-align:center;color:rgba(17,17,17,0.92);word-break:break-word;">
            (${escapeHtml(preview.subtitle)})
        </div>
      </foreignObject>
      <foreignObject x="${Math.round((certW - 1300) / 2)}" y="${hoursY}" width="1300" height="150">
        <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:'Times New Roman',serif;font-size:${metrics.hoursFontSize}px;line-height:1.25;text-align:center;color:rgba(17,17,17,0.92);">
            <div style="font-weight:700;text-transform:uppercase;color:#111;margin:0 0 6px 0;padding:0;line-height:1.2;">${escapeHtml(preview.hoursLabel)}</div>
            <div style="font-weight:400;margin:0;padding:0;line-height:1.3;">${escapeHtml(completionLine)}</div>
        </div>
      </foreignObject>
      <foreignObject x="${Math.round((certW - metrics.issuedWidth) / 2)}" y="${issuedY}" width="${metrics.issuedWidth}" height="70">
        <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:'Times New Roman',serif;font-size:${metrics.issuedFontSize}px;line-height:1.2;text-align:center;color:rgba(17,17,17,0.92);word-break:break-word;">
            ${escapeHtml(preview.issuedLine)}
        </div>
      </foreignObject>
      ${qrImage}
    </svg>
  `.trim();
}

function svgToBlob(svg: string) {
  return new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
}

function triggerBrowserDownload(fileName: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadCertificatePreview(preview: ResolvedCertificatePreview) {
  const fileName = `${sanitizeFileName(preview.studentName)}_certificate.svg`;
  triggerBrowserDownload(fileName, svgToBlob(buildSheetSvg(preview)));
  return fileName;
}

export function downloadCertificatePreviews(previews: ResolvedCertificatePreview[]) {
  for (let i = 0; i < previews.length; i += 2) {
    const top = previews[i];
    const bottom = previews[i + 1];
    const fileName = bottom
      ? `${sanitizeFileName(top.studentName)}_${sanitizeFileName(bottom.studentName)}_certificate.svg`
      : `${sanitizeFileName(top.studentName)}_certificate.svg`;
    triggerBrowserDownload(fileName, svgToBlob(buildSheetSvg(top, bottom)));
  }
}

export function generateSummaryReportDocument({
  generatedAt,
  studentCount,
  qrCodeCount,
  schoolCount,
  topPrograms,
  topOffices,
  schoolCounts,
}: {
  generatedAt: string;
  studentCount: number;
  qrCodeCount: number;
  schoolCount: number;
  topPrograms: Array<{ label: string; total: number }>;
  topOffices: Array<{ label: string; total: number }>;
  schoolCounts: Array<{ label: string; total: number }>;
}) {
  const renderRows = (items: Array<{ label: string; total: number }>, emptyLabel = "No data") => {
    if (!items.length) return `<div class="report__row"><span>${emptyLabel}</span></div>`;
    return items.map(item => `<div class="report__row"><span>${escapeHtml(item.label)}</span><span>${item.total}</span></div>`).join("");
  };

  const printWindow = window.open("", "_blank", "width=1200,height=900");
  if (!printWindow) throw new Error("The print window was blocked by the browser.");

  printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>OJT Summary Report</title>
        <style>
          * { box-sizing: border-box; }
          body { margin: 0; font-family: "Segoe UI", Tahoma, sans-serif; background: #eef3f8; color: #0f172a; }
          .print-shell { width: 8.5in; min-height: 11in; margin: 0 auto; padding: 0.5in 0; }
          .sheet { width: 8.5in; min-height: 11in; background: white; margin: 0 auto 0.3in; padding: 0.4in; box-shadow: 0 12px 40px rgba(15, 23, 42, 0.14); page-break-after: always; }
          .sheet:last-child { page-break-after: auto; }
          .report { padding: 0.6in; }
          .report h1 { margin: 0 0 4mm; font-size: 28px; }
          .report__subtle { color: #475569; font-size: 13px; }
          .report__stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4mm; margin: 8mm 0 10mm; }
          .report__stat { border: 1px solid #cbd5e1; border-radius: 4mm; padding: 4mm; }
          .report__stat strong { display: block; font-size: 24px; margin-top: 2mm; }
          .report__grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 5mm; }
          .report__card { border: 1px solid #cbd5e1; border-radius: 4mm; padding: 4mm; }
          .report__card h2 { margin: 0 0 4mm; font-size: 16px; }
          .report__row { display: flex; justify-content: space-between; gap: 8px; padding: 2mm 0; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
          .report__row:last-child { border-bottom: 0; padding-bottom: 0; }
          @media print { body { background: white; } .sheet { margin: 0; box-shadow: none; } }
        </style>
      </head>
      <body>
        <div class="print-shell">
          <div class="sheet">
            <div class="report">
              <h1>OJT Summary Report</h1>
              <p class="report__subtle">Generated on ${escapeHtml(generatedAt)}</p>
              <div class="report__stats">
                <div class="report__stat"><div>Total Students</div><strong>${studentCount}</strong></div>
                <div class="report__stat"><div>QR Codes</div><strong>${qrCodeCount}</strong></div>
                <div class="report__stat"><div>Schools</div><strong>${schoolCount}</strong></div>
              </div>
              <div class="report__grid">
                <div class="report__card"><h2>Top Programs</h2>${renderRows(topPrograms)}</div>
                <div class="report__card"><h2>Top Offices</h2>${renderRows(topOffices)}</div>
                <div class="report__card"><h2>Schools</h2>${renderRows(schoolCounts)}</div>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.addEventListener("load", () => {
    window.setTimeout(() => printWindow.print(), 500);
  });
}