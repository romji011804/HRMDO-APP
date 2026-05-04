import { createContext, useContext, useState, type ReactNode } from "react";

interface SidebarContextType {
  isCollapsed: boolean;
  isLocked: boolean;
  toggleSidebar: () => void;
  hideSidebar: () => void;
  showSidebar: () => void;
  toggleLock: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isLocked, setIsLocked] = useState(() => {
    try {
      return localStorage.getItem("sidebar-locked") === "true";
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    setIsCollapsed((prev) => !prev);
  };

  // Respects lock — if locked, sidebar cannot be hidden
  const hideSidebar = () => {
    if (!isLocked) setIsCollapsed(true);
  };

  const showSidebar = () => {
    setIsCollapsed(false);
  };

  const toggleLock = () => {
    setIsLocked((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("sidebar-locked", String(next));
      } catch {}
      if (next) setIsCollapsed(false);
      return next;
    });
  };

  return (
    <SidebarContext.Provider value={{ isCollapsed, isLocked, toggleSidebar, hideSidebar, showSidebar, toggleLock }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}
