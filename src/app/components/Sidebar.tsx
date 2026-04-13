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
  Users,
  Info,
  Upload,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { ENABLE_OJT_MODULE } from "../../shared/config/featureFlags";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { useSidebar } from "../contexts/SidebarContext";

export function Sidebar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [aboutDialogOpen, setAboutDialogOpen] = useState(false);
  const { isCollapsed, hideSidebar } = useSidebar();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleNavClick = () => {
    // Auto-hide sidebar after navigation
    hideSidebar();
  };

  const moduleGroups = [
    {
      title: "MOA / LO",
      items: [
        { path: "/", label: "MOA / LO Dashboard", icon: LayoutDashboard },
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
              { path: "/ojt/view-students", label: "View Students", icon: Users },
              { path: "/ojt/certificates", label: "Create Certificate", icon: FileText },
              { path: "/ojt/import-export", label: "Import / Export", icon: Upload },
              { path: "/ojt/reports", label: "OJT Reports", icon: BarChart2 },
            ],
          },
        ]
      : []),
  ];

  return (
    <aside 
      className={`shrink-0 bg-white/95 dark:bg-gray-900/95 border-r border-gray-200 dark:border-gray-800 flex flex-col shadow-sm backdrop-blur transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-0 border-r-0' : 'w-72'
      }`}
    >
      <div className={`flex flex-col h-full transition-opacity duration-300 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
        <div className="p-7 pb-6 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <h1 className="text-lg font-semibold leading-snug text-gray-900 dark:text-white">
            Platform for Agreements, Tracking, and Records of Internship and Certification
          </h1>
        </div>

        <nav className="flex-1 space-y-5 px-4 py-5 overflow-y-auto">
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
                  onClick={handleNavClick}
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

        <div className="p-4 border-t border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex items-center gap-3 px-4 py-3 rounded-xl border border-transparent flex-1 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-200 dark:hover:border-gray-700 transition-all duration-200"
            >
              {mounted && theme === "dark" ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
              <span className="whitespace-nowrap">{mounted && theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
            </button>
            <button
              onClick={() => setAboutDialogOpen(true)}
              className="flex items-center justify-center px-4 py-3 rounded-xl border border-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-200 dark:hover:border-gray-700 transition-all duration-200"
              title="About Application"
            >
              <Info className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <Dialog open={aboutDialogOpen} onOpenChange={setAboutDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">About Application</DialogTitle>
            <DialogDescription className="sr-only">
              Information about the MOA & LO Tracking System application
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            <p>
              This application, titled <span className="font-semibold">MOA & LO Tracking System</span>, was developed by{" "}
              <span className="font-semibold">Juel Jerome C. De Castro</span> in response to the request of{" "}
              <span className="font-semibold">Ms. Patrice Ysabel P. Gayaban</span>, to streamline and manage the tracking of Memorandum of Agreement (MOA) and Legal Opinion (LO) documents within the office. The system is designed to improve record organization, monitoring, and reporting efficiency through a structured and user-friendly interface.
            </p>
            <p>
              The <span className="font-semibold">OJT Certificate Management System</span> component was originally developed by{" "}
              <span className="font-semibold">John Paul S. Baybayan</span> under the supervision of{" "}
              <span className="font-semibold">Ms. May M. Orteo</span>, with the purpose of managing, generating, and organizing On-the-Job Training (OJT) certificates.
            </p>
            <p>
              To further enhance operational efficiency and eliminate redundancy between systems,{" "}
              <span className="font-semibold">Ms. Philine Pioquinto</span> initiated the integration of both applications into a single, optimized platform.
            </p>
            <p>
              This unified system aims to centralize document tracking and certificate management, providing a more streamlined workflow, improved data consistency, and a more effective user experience.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
