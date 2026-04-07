import { useEffect, useState } from "react";
import {
  BarChart2,
  ToggleLeft,
  ToggleRight,
  Calendar,
  Clock,
  Download,
  Play,
  Trash2,
} from "lucide-react";
import {
  loadSettings,
  saveSettings,
  loadReports,
  generateReport,
  getNextRunDate,
  downloadReport,
  saveReports,
  checkAndRun,
  type ReportSettings,
  type GeneratedReport,
} from "../reportScheduler";

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmt(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
    .format(new Date(iso))
    .replace(",", " –");
}

function fmtDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

const DAY_OPTIONS = Array.from({ length: 28 }, (_, i) => i + 1);

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// ─── component ───────────────────────────────────────────────────────────────

export function Reports() {
  const [settings, setSettings] = useState<ReportSettings>(() => loadSettings());
  const [saved, setSaved] = useState(false);
  const [reports, setReports] = useState<GeneratedReport[]>(() => loadReports());
  const [justGenerated, setJustGenerated] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  // Run auto-check on mount
  useEffect(() => {
    const result = checkAndRun();
    if (result) setReports(loadReports());

    // Poll every 60 s while the page is open
    const id = setInterval(() => {
      const r = checkAndRun();
      if (r) setReports(loadReports());
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  const nextRun = getNextRunDate(settings);

  const handleSave = () => {
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleGenerateNow = () => {
    generateReport(settings);
    setReports(loadReports());
    setJustGenerated(true);
    setDownloadError("");
    setTimeout(() => setJustGenerated(false), 2500);
  };

  const handleDeleteReport = (id: string) => {
    const updated = reports.filter((r) => r.id !== id);
    saveReports(updated);
    setReports(updated);
  };

  const handleDownloadReport = async (report: GeneratedReport) => {
    try {
      setDownloadError("");
      await downloadReport(report);
    } catch (error) {
      console.error("Failed to download Excel report:", error);
      setDownloadError("Unable to generate the Excel report. Please try again.");
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
          <BarChart2 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          Reports
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Auto-generate and manage record reports on a schedule.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 max-w-7xl">
        {/* ── Settings card ── */}
        <div className="xl:col-span-1 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 self-start">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            Auto Report Settings
          </h2>

          {/* Toggle */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                Enable Auto Report Generation
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Generates while the app is open
              </p>
            </div>
            <button
              onClick={() =>
                setSettings((s) => ({ ...s, enabled: !s.enabled }))
              }
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors"
              aria-label="Toggle auto report"
            >
              {settings.enabled ? (
                <ToggleRight className="w-10 h-10" />
              ) : (
                <ToggleLeft className="w-10 h-10 text-gray-400 dark:text-gray-600" />
              )}
            </button>
          </div>

          {/* Report type */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Report Type
            </label>
            <select
              value={settings.type}
              disabled={!settings.enabled}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  type: e.target.value as "monthly" | "quarterly",
                }))
              }
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly (Q1–Q4)</option>
            </select>

            {settings.type === "quarterly" && settings.enabled && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                Runs on the selected day of the last month of each quarter
                (Mar · Jun · Sep · Dec).
              </p>
            )}
          </div>

          {/* Day selector */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {settings.type === "monthly"
                ? "Day of Month"
                : "Day of Execution (per quarter-end month)"}
            </label>
            <select
              value={settings.dayOfMonth}
              disabled={!settings.enabled}
              onChange={(e) =>
                setSettings((s) => ({ ...s, dayOfMonth: Number(e.target.value) }))
              }
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {DAY_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  {ordinal(d)}
                </option>
              ))}
            </select>
          </div>

          {/* Next run */}
          <div
            className={`rounded-xl px-4 py-3 mb-5 flex items-start gap-2 text-sm ${
              settings.enabled
                ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200"
                : "bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400"
            }`}
          >
            <Clock className="w-4 h-4 mt-0.5 shrink-0" />
            <span>
              <span className="font-medium">Next report:</span>{" "}
              {nextRun ? fmtDate(nextRun) : "—"}
            </span>
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-2">
            <button
              onClick={handleSave}
              className="w-full px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              {saved ? "✓ Settings Saved" : "Save Settings"}
            </button>
            <button
              onClick={handleGenerateNow}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" />
              {justGenerated ? "✓ Report Generated!" : "Generate Now"}
            </button>
          </div>
        </div>

        {/* ── History card ── */}
        <div className="xl:col-span-2 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-blue-500" />
              Report History
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {reports.length} report{reports.length !== 1 ? "s" : ""}
            </span>
          </div>

          {downloadError && (
            <div className="mx-6 mt-5 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
              {downloadError}
            </div>
          )}

          {reports.length === 0 ? (
            <div className="p-12 text-center">
              <BarChart2 className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                No reports yet. Enable scheduling or click{" "}
                <span className="font-medium">Generate Now</span>.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800/70 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date Generated
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Records
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {reports.map((report) => (
                    <tr
                      key={report.id}
                      className="hover:bg-gray-50/60 dark:hover:bg-gray-800 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {fmt(report.generatedAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {report.period}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            report.type === "monthly"
                              ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                              : "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300"
                          }`}
                        >
                          {report.type === "monthly" ? "Monthly" : "Quarterly"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-gray-700 dark:text-gray-300">
                        {report.recordCount}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleDownloadReport(report)}
                            className="inline-flex items-center gap-1 rounded-md border border-gray-200 dark:border-gray-700 px-2.5 py-1.5 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            title="Download Excel report"
                          >
                            <Download className="h-3.5 w-3.5" />
                            Download
                          </button>
                          <button
                            onClick={() => handleDeleteReport(report.id)}
                            className="inline-flex items-center gap-1 rounded-md border border-red-200 dark:border-red-900 px-2.5 py-1.5 text-xs text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title="Delete report"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
