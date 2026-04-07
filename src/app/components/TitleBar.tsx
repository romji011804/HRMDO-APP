import { Minus, Square, X } from "lucide-react";

export function TitleBar() {
  const handleMinimize = () => {
    const win = window as any;
    if (win.electronAPI) {
      win.electronAPI.minimizeWindow();
    }
  };

  const handleMaximize = () => {
    const win = window as any;
    if (win.electronAPI) {
      win.electronAPI.maximizeWindow();
    }
  };

  const handleClose = () => {
    const win = window as any;
    if (win.electronAPI) {
      win.electronAPI.closeWindow();
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 h-8 bg-gradient-to-r from-blue-900 to-blue-800 dark:from-gray-900 dark:to-gray-800 flex items-center justify-between px-4 z-50 select-none" style={{ WebkitAppRegion: 'drag' } as any}>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-blue-600 dark:bg-blue-500 rounded-sm flex items-center justify-center">
          <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
            <path d="M14 2v6h6"/>
          </svg>
        </div>
        <span className="text-xs font-medium text-white">MOA & Legal Opinion Tracker</span>
      </div>
      
      <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <button
          onClick={handleMinimize}
          className="w-8 h-8 flex items-center justify-center hover:bg-blue-700 dark:hover:bg-gray-700 transition-colors rounded"
          title="Minimize"
        >
          <Minus className="w-4 h-4 text-white" />
        </button>
        <button
          onClick={handleMaximize}
          className="w-8 h-8 flex items-center justify-center hover:bg-blue-700 dark:hover:bg-gray-700 transition-colors rounded"
          title="Maximize"
        >
          <Square className="w-3.5 h-3.5 text-white" />
        </button>
        <button
          onClick={handleClose}
          className="w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-colors rounded"
          title="Close"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
}
