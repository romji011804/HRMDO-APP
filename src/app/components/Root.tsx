import { Outlet } from "react-router";
import { Sidebar } from "./Sidebar";
import { TitleBar } from "./TitleBar";
import { ThemeProvider } from "next-themes";
import { SidebarProvider } from "../contexts/SidebarContext";

export function Root() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <SidebarProvider>
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300 overflow-hidden">
          <TitleBar />
          <div className="flex flex-1 overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto">
              <Outlet />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </ThemeProvider>
  );
}
