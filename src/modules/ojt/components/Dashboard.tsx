import { Building2, GraduationCap, Printer, UserPlus, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../../../app/components/ui/button";
import { PageHeader } from "../../../shared/components/PageHeader";
import { OJT_DATA_UPDATED_EVENT, getOjtStats, loadOjtQrRecords, loadOjtStudents } from "../storage";
import type { OjtDashboardStats } from "../types";

function OjtStatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-4">
        <div className={`rounded-xl p-3 ${color}`}>{icon}</div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}

export function OjtDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<OjtDashboardStats>(() => getOjtStats(loadOjtStudents(), loadOjtQrRecords()));

  useEffect(() => {
    const sync = () => setStats(getOjtStats(loadOjtStudents(), loadOjtQrRecords()));
    window.addEventListener(OJT_DATA_UPDATED_EVENT, sync);
    return () => window.removeEventListener(OJT_DATA_UPDATED_EVENT, sync);
  }, []);

  return (
    <div className="space-y-6 p-8">
      <PageHeader
        title="OJT Module"
        description="Student-centered certificate workflow modeled after the OJT management app in your reference video."
      />
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 text-white shadow-lg">
        <div className="flex flex-col gap-6 p-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <p className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-50">
              Pangasinan State University
            </p>
            <h2 className="text-3xl font-semibold tracking-tight">OJT Management System</h2>
            <p className="max-w-2xl text-sm leading-6 text-blue-50/90">
              Manage students, generate certificates, and print reports from the same data.
            </p>
          </div>
          <div className="grid w-full gap-3 sm:grid-cols-2 lg:max-w-md">
            <Button
              type="button"
              variant="secondary"
              className="justify-start bg-white text-blue-700 hover:bg-blue-50"
              onClick={() => navigate("/ojt/students")}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Add Student
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="justify-start bg-white text-blue-700 hover:bg-blue-50"
              onClick={() => navigate("/ojt/certificates")}
            >
              <GraduationCap className="mr-2 h-4 w-4" />
              Generate Certificates
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="justify-start bg-white text-blue-700 hover:bg-blue-50 sm:col-span-2"
              onClick={() => navigate("/ojt/reports")}
            >
              <Printer className="mr-2 h-4 w-4" />
              Print Reports
            </Button>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <OjtStatCard
          title="Total Students"
          value={stats.studentCount}
          icon={<Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />}
          color="bg-blue-100 dark:bg-blue-900/30"
        />
        <OjtStatCard
          title="Schools"
          value={stats.schoolCounts.length}
          icon={<GraduationCap className="h-6 w-6 text-green-600 dark:text-green-400" />}
          color="bg-green-100 dark:bg-green-900/30"
        />
        <OjtStatCard
          title="Programs Tracked"
          value={stats.topPrograms.length}
          icon={<Building2 className="h-6 w-6 text-amber-600 dark:text-amber-400" />}
          color="bg-yellow-100 dark:bg-yellow-900/30"
        />
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.8fr_1fr]">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">School Breakdown</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Distribution of students by school.</p>
          </div>
          <div className="space-y-4">
            {stats.schoolCounts.length ? (
              stats.schoolCounts.map((entry) => {
                const total = stats.studentCount ? (entry.total / stats.studentCount) * 100 : 0;
                return (
                  <div key={entry.label} className="space-y-2">
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span className="font-medium text-gray-700 dark:text-gray-200">{entry.label}</span>
                      <span className="text-gray-500 dark:text-gray-400">
                        {entry.total} ({Math.round(total)}%)
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                      <div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.max(total, 6)}%` }} />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">No school data yet.</p>
            )}
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top Offices</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Most common student assignments.</p>
          </div>
          <div className="space-y-3">
            {stats.topOffices.length ? (
              stats.topOffices.map((entry, index) => (
                <div key={entry.label} className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3 dark:bg-gray-800/70">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-sm font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{entry.label}</p>
                  </div>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-gray-600 shadow-sm dark:bg-gray-900 dark:text-gray-300">
                    {entry.total}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">No office data yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
