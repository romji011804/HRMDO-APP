import { useEffect, useState } from "react";
import { FileText, Clock, CheckCircle, AlertCircle, FileWarning } from "lucide-react";
import { useNavigate } from "react-router";
import {
  RECORDS_UPDATED_EVENT,
  getRecordDocumentStats,
  getValidatedRecordDocumentStats,
  loadRecords,
  type RecordItem,
} from "../records";

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-5 hover:shadow-md transition-all duration-200">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl ${color}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-3xl font-semibold text-gray-900 dark:text-white mt-1 tracking-tight">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

interface AlertCardProps {
  title: string;
  count: number;
  icon: React.ReactNode;
  color: string;
}

function AlertCard({ title, count, icon, color }: AlertCardProps) {
  return (
    <div className={`rounded-2xl p-4 border ${color} shadow-sm`}>
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">{title}</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">
            {count}
          </p>
        </div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<RecordItem[]>(() => loadRecords());
  const [validatedStats, setValidatedStats] = useState(() => getRecordDocumentStats(loadRecords()));

  useEffect(() => {
    const syncRecords = () => {
      setRecords(loadRecords());
    };

    window.addEventListener(RECORDS_UPDATED_EVENT, syncRecords);
    window.addEventListener("focus", syncRecords);
    document.addEventListener("visibilitychange", syncRecords);

    return () => {
      window.removeEventListener(RECORDS_UPDATED_EVENT, syncRecords);
      window.removeEventListener("focus", syncRecords);
      document.removeEventListener("visibilitychange", syncRecords);
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    void getValidatedRecordDocumentStats(records).then((stats) => {
      if (isActive) {
        setValidatedStats(stats);
      }
    });

    return () => {
      isActive = false;
    };
  }, [records]);

  const totalRecords = records.length;
  const ongoingRecords = records.filter((record) => record.status === "Ongoing").length;
  const completedRecords = records.filter((record) => record.status === "Completed").length;
  const { missingLegalOpinion, missingMoa, completeRecords } = validatedStats;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300";
      case "Ongoing":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300";
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300";
    }
  };

  return (
    <div className="p-8 space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-2">
          MOA & LO Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Memorandum of Agreement and Legal Opinion overview only
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <StatCard
          title="Total Records"
          value={totalRecords}
          icon={<FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
          color="bg-blue-100 dark:bg-blue-900/30"
        />
        <StatCard
          title="Ongoing Records"
          value={ongoingRecords}
          icon={<Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />}
          color="bg-orange-100 dark:bg-orange-900/30"
        />
        <StatCard
          title="Completed Records"
          value={completedRecords}
          icon={<CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />}
          color="bg-green-100 dark:bg-green-900/30"
        />
        <StatCard
          title="Missing Legal Opinion"
          value={missingLegalOpinion}
          icon={<AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />}
          color="bg-red-100 dark:bg-red-900/30"
        />
        <StatCard
          title="Missing MOA"
          value={missingMoa}
          icon={<FileWarning className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />}
          color="bg-yellow-100 dark:bg-yellow-900/30"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-1 space-y-4">
          <AlertCard
            title="Missing Legal Opinion"
            count={missingLegalOpinion}
            icon={<AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />}
            color="border-red-200 dark:border-red-900 bg-red-50/80 dark:bg-red-900/20"
          />
          <AlertCard
            title="Missing MOA"
            count={missingMoa}
            icon={<FileWarning className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />}
            color="border-yellow-200 dark:border-yellow-900 bg-yellow-50/80 dark:bg-yellow-900/20"
          />
          <AlertCard
            title="Complete Records"
            count={completeRecords}
            icon={<CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />}
            color="border-green-200 dark:border-green-900 bg-green-50/80 dark:bg-green-900/20"
          />
        </div>

        <div className="xl:col-span-3">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800/70 border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Control Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      School/University
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Course
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Workflow Stage
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {records.map((record) => (
                    <tr
                      key={record.id}
                      onClick={() => navigate(`/record/${record.id}`)}
                      className="hover:bg-blue-50/60 dark:hover:bg-gray-800 cursor-pointer transition-colors duration-200"
                    >
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {record.controlNumber}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {record.school}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {record.course}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            record.status
                          )}`}
                        >
                          {record.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {record.workflow}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
