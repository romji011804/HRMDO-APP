import { NavLink } from "react-router";
import {
  LayoutDashboard,
  Plus,
  FileText,
  Moon,
  Sun,
  ArrowLeftRight,
  BarChart2,
  GraduationCap,
  QrCode,
  Users,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { ENABLE_OJT_MODULE } from "../../shared/config/featureFlags";

export function Sidebar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const moduleGroups = [
    {
      title: "Shared",
      items: [{ path: "/", label: "MOA / LO Dashboard", icon: LayoutDashboard }],
    },
    {
      title: "MOA / LO",
      items: [
        { path: "/moa-lo/add-record", label: "Add Record", icon: Plus },
        { path: "/moa-lo/view-records", label: "View Records", icon: FileText },
        { path: "/moa-lo/import-export", label: "Import / Export", icon: ArrowLeftRight },
        { path: "/moa-lo/reports", label: "Reports", icon: BarChart2 },
      ],
    },
    ...(ENABLE_OJT_MODULE
      ? [
          {
            title: "OJT",
            items: [
              { path: "/ojt", label: "Home", icon: GraduationCap },
              { path: "/ojt/add-student", label: "Add Student", icon: Plus },
              { path: "/ojt/view-students", label: "View Students", icon: Users },
              { path: "/ojt/qr-codes", label: "Generate QR Code", icon: QrCode },
              { path: "/ojt/certificates", label: "Create Certificate", icon: FileText },
              { path: "/ojt/reports", label: "OJT Reports", icon: BarChart2 },
            ],
          },
        ]
      : []),
  ];

  return (
    <aside className="w-72 shrink-0 bg-white/95 dark:bg-gray-900/95 border-r border-gray-200 dark:border-gray-800 flex flex-col shadow-sm backdrop-blur">
      <div className="p-7 pb-6 border-b border-gray-100 dark:border-gray-800">
        <h1 className="text-lg font-semibold leading-snug text-gray-900 dark:text-white">
          MOA & LO Tracking System
        </h1>
      </div>

      <nav className="flex-1 space-y-5 px-4 py-5">
        {moduleGroups.map((group) => (
          <div key={group.title}>
            <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
              {group.title}
            </p>
            {group.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/" || item.path === "/ojt"}
                className={({ isActive }) =>
                  `mb-1.5 flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-200 ${
                    isActive
                      ? "border-blue-200 bg-blue-50 text-blue-700 shadow-sm dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                      : "border-transparent text-gray-700 hover:border-gray-200 hover:bg-gray-50 dark:text-gray-300 dark:hover:border-gray-700 dark:hover:bg-gray-800"
                  }`
                }
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100 dark:border-gray-800">
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex items-center gap-3 px-4 py-3 rounded-xl border border-transparent w-full text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-200 dark:hover:border-gray-700 transition-all duration-200"
        >
          {mounted && theme === "dark" ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
          <span>{mounted && theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
        </button>
      </div>
    </aside>
  );
}
