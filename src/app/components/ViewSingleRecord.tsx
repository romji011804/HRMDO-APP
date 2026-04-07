import { useNavigate, useParams } from "react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  School,
  BookOpen,
  Clock,
  Calendar,
  Activity,
  Workflow,
  FileText,
  Scale,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import { isDocumentReferenceUsable, loadRecords } from "../records";
import { getFileBlob } from "../fileStorage";

interface FieldProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  isLink?: boolean;
  onClick?: () => void;
}

function Field({ icon, label, value, isLink = false, onClick }: FieldProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-gray-50 dark:bg-gray-800/60 rounded-xl p-4 border border-gray-200 dark:border-gray-700 transition-colors duration-200 ${
        isLink ? "cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-800" : ""
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {label}
        </label>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-gray-900 dark:text-white">{value}</p>
        {isLink && (
          <ExternalLink className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        )}
      </div>
    </div>
  );
}

export function ViewSingleRecord() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [openMessage, setOpenMessage] = useState("");
  const [documentHealth, setDocumentHealth] = useState({ moa: true, lo: true });

  const storedRecord = loadRecords().find((item) => item.id === id);
  const record = storedRecord
    ? {
        controlNumber: storedRecord.controlNumber,
        school: storedRecord.school,
        course: storedRecord.course,
        hours: storedRecord.hours || "-",
        dateReceived: storedRecord.dateReceived || "-",
        status: storedRecord.status,
        workflow: storedRecord.workflow,
        moa: storedRecord.moaValue || "-",
        legalOpinion: storedRecord.legalOpinionValue || "-",
      }
    : null;

  if (!record) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-8">
          <p className="text-gray-700 dark:text-gray-300 mb-4">Record not found.</p>
          <button
            onClick={() => navigate("/view-records")}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to records
          </button>
        </div>
      </div>
    );
  }

  useEffect(() => {
    let isActive = true;

    void (async () => {
      const [moa, lo] = await Promise.all([
        isDocumentReferenceUsable(storedRecord?.moaType, storedRecord?.moaValue),
        isDocumentReferenceUsable(
          storedRecord?.legalOpinionType,
          storedRecord?.legalOpinionValue
        ),
      ]);

      if (isActive) {
        setDocumentHealth({ moa, lo });
      }
    })();

    return () => {
      isActive = false;
    };
  }, [
    storedRecord?.legalOpinionType,
    storedRecord?.legalOpinionValue,
    storedRecord?.moaType,
    storedRecord?.moaValue,
  ]);

  const openDocument = async (type?: "file" | "link", value?: string, name?: string) => {
    if (!value) {
      setOpenMessage("No document available for this field.");
      return;
    }
    if (type === "link") {
      try {
        const url = new URL(value);
        window.open(url.toString(), "_blank", "noopener,noreferrer");
        setOpenMessage("");
      } catch {
        setOpenMessage("The saved link is invalid and cannot be opened.");
      }
      return;
    }
    if (type === "file") {
      if (value.startsWith("idb:")) {
        try {
          const blob = await getFileBlob(value);
          if (!blob) {
            setOpenMessage("Saved file was not found. Please re-upload.");
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
      if (value.startsWith("data:")) {
        window.open(value, "_blank", "noopener,noreferrer");
        setOpenMessage("");
        return;
      }
      if (/^https?:\/\//i.test(value)) {
        window.open(value, "_blank", "noopener,noreferrer");
        setOpenMessage("");
        return;
      }
      setOpenMessage(`Unable to open file${name ? `: ${name}` : ""}.`);
      return;
    }
    setOpenMessage("No document available for this field.");
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Control Number
            </p>
            <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
              {record.controlNumber}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Record Details
            </p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-8">
          {openMessage && (
            <p className="mb-4 text-sm text-amber-700 dark:text-amber-300">{openMessage}</p>
          )}
          {((storedRecord?.moaValue && !documentHealth.moa) ||
            (storedRecord?.legalOpinionValue && !documentHealth.lo)) && (
            <div className="mb-4 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
              <div className="flex items-center gap-2 font-medium">
                <AlertTriangle className="h-4 w-4" />
                Broken document reference detected
              </div>
              <p className="mt-1">
                {storedRecord?.moaValue && !documentHealth.moa
                  ? "MOA"
                  : ""}
                {storedRecord?.moaValue &&
                !documentHealth.moa &&
                storedRecord?.legalOpinionValue &&
                !documentHealth.lo
                  ? " and "
                  : ""}
                {storedRecord?.legalOpinionValue && !documentHealth.lo
                  ? "Legal Opinion"
                  : ""}{" "}
                needs to be re-uploaded or replaced with a working link.
              </p>
            </div>
          )}
          <div className="space-y-4">
            <Field
              icon={<School className="w-5 h-5 text-gray-600 dark:text-gray-400" />}
              label="School/University"
              value={record.school}
            />

            <Field
              icon={<BookOpen className="w-5 h-5 text-gray-600 dark:text-gray-400" />}
              label="Course"
              value={record.course}
            />

            <Field
              icon={<Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />}
              label="Hours"
              value={record.hours}
            />

            <Field
              icon={<Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />}
              label="Date Received"
              value={record.dateReceived}
            />

            <Field
              icon={<Activity className="w-5 h-5 text-gray-600 dark:text-gray-400" />}
              label="Status"
              value={record.status}
            />

            <Field
              icon={<Workflow className="w-5 h-5 text-gray-600 dark:text-gray-400" />}
              label="Workflow Stage"
              value={record.workflow}
            />

            <Field
              icon={
                documentHealth.moa ? (
                  <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                )
              }
              label="Memorandum of Agreement"
              value={`${storedRecord?.moaFileName || record.moa}${
                storedRecord?.moaValue && !documentHealth.moa ? " (Broken)" : ""
              }`}
              isLink
              onClick={() =>
                openDocument(storedRecord?.moaType, storedRecord?.moaValue, storedRecord?.moaFileName)
              }
            />
            <Field
              icon={
                documentHealth.lo ? (
                  <Scale className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                )
              }
              label="Legal Opinion"
              value={`${storedRecord?.legalOpinionFileName || record.legalOpinion}${
                storedRecord?.legalOpinionValue && !documentHealth.lo ? " (Broken)" : ""
              }`}
              isLink
              onClick={() =>
                openDocument(
                  storedRecord?.legalOpinionType,
                  storedRecord?.legalOpinionValue,
                  storedRecord?.legalOpinionFileName
                )
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
