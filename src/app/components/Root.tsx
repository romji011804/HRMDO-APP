import { Outlet } from "react-router";
import { Sidebar } from "./Sidebar";
import { TitleBar } from "./TitleBar";
import { ThemeProvider } from "next-themes";

export function Root() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
        <TitleBar />
        <div className="flex flex-1 pt-8">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}
