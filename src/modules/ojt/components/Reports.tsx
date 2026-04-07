import { Printer } from "lucide-react";
import { useMemo } from "react";
import { Button } from "../../../app/components/ui/button";
import { PageHeader } from "../../../shared/components/PageHeader";
import { generateSummaryReportDocument } from "../documentService";
import { getOjtStats, loadOjtQrRecords, loadOjtStudents } from "../storage";

export function OjtReports() {
  const stats = useMemo(() => getOjtStats(loadOjtStudents(), loadOjtQrRecords()), []);

  const handleGenerate = () => {
    generateSummaryReportDocument({
      generatedAt: new Date().toLocaleString(),
      studentCount: stats.studentCount,
      qrCodeCount: stats.qrCodeCount,
      schoolCount: stats.schoolCounts.length,
      topPrograms: stats.topPrograms,
      topOffices: stats.topOffices,
      schoolCounts: stats.schoolCounts,
    });
  };

  return (
    <div className="space-y-6 p-8">
      <PageHeader
        title="OJT Reports"
        description="Preview the same student, office, and school breakdowns used by the printable report workflow."
        action={
          <Button type="button" onClick={handleGenerate}>
            <Printer className="mr-2 h-4 w-4" />
            Generate Summary PDF
          </Button>
        }
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm text-gray-600 dark:text-gray-400">Students</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{stats.studentCount}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm text-gray-600 dark:text-gray-400">QR Codes</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{stats.qrCodeCount}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm text-gray-600 dark:text-gray-400">Schools</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{stats.schoolCounts.length}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Top Programs</h2>
          <div className="mt-4 space-y-3">
            {stats.topPrograms.length ? (
              stats.topPrograms.map((entry) => (
                <div key={entry.label} className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 dark:bg-gray-800/70">
                  <span className="text-sm text-gray-700 dark:text-gray-200">{entry.label}</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{entry.total}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">No program data yet.</p>
            )}
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Top Offices</h2>
          <div className="mt-4 space-y-3">
            {stats.topOffices.length ? (
              stats.topOffices.map((entry) => (
                <div key={entry.label} className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 dark:bg-gray-800/70">
                  <span className="text-sm text-gray-700 dark:text-gray-200">{entry.label}</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{entry.total}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">No office data yet.</p>
            )}
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">School Breakdown</h2>
          <div className="mt-4 space-y-3">
            {stats.schoolCounts.length ? (
              stats.schoolCounts.map((entry) => (
                <div key={entry.label} className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 dark:bg-gray-800/70">
                  <span className="text-sm text-gray-700 dark:text-gray-200">{entry.label}</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{entry.total}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">No school data yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
