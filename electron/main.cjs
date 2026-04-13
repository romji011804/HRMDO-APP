const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let autoUpdater = null;
const APP_STORAGE_FILE = 'app-storage.json';

// Try to load electron-updater, but don't fail if it's not available
try {
  autoUpdater = require('electron-updater').autoUpdater;
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;
} catch (error) {
  console.log('electron-updater not available:', error.message);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: 'Platform for Agreements, Tracking, and Records of Internship and Certification',
    show: false, // Don't show until ready to prevent flicker
  });

  // Remove menu bar completely
  mainWindow.setMenuBarVisibility(false);
  mainWindow.setMenu(null);

  // Maximize window on startup for fullscreen experience
  mainWindow.maximize();

  // Show window after it's ready and maximized
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5174');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    
    // Check for updates in production only if autoUpdater is available
    if (autoUpdater) {
      autoUpdater.checkForUpdatesAndNotify();
    }
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();
  
  // Setup auto-updater events only if available
  if (autoUpdater) {
    setupAutoUpdater();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Auto-updater setup
function setupAutoUpdater() {
  if (!autoUpdater) return;

  autoUpdater.on('checking-for-update', () => {
    sendStatusToWindow('Checking for updates...');
  });

  autoUpdater.on('update-available', (info) => {
    sendStatusToWindow('Update available.');
    if (mainWindow) {
      mainWindow.webContents.send('update-available', info);
    }
  });

  autoUpdater.on('update-not-available', (info) => {
    sendStatusToWindow('App is up to date.');
  });

  autoUpdater.on('error', (err) => {
    sendStatusToWindow('Error in auto-updater: ' + err);
  });

  autoUpdater.on('download-progress', (progressObj) => {
    let message = `Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}%`;
    sendStatusToWindow(message);
    if (mainWindow) {
      mainWindow.webContents.send('download-progress', progressObj);
    }
  });

  autoUpdater.on('update-downloaded', (info) => {
    sendStatusToWindow('Update downloaded. Will install on quit.');
    if (mainWindow) {
      mainWindow.webContents.send('update-downloaded', info);
    }
  });
}

function sendStatusToWindow(text) {
  console.log(text);
  if (mainWindow) {
    mainWindow.webContents.send('update-status', text);
  }
}

function getAppStoragePath() {
  return path.join(app.getPath('userData'), APP_STORAGE_FILE);
}

function readAppStorage() {
  try {
    const filePath = getAppStoragePath();
    if (!fs.existsSync(filePath)) {
      return {};
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    if (!raw.trim()) {
      return {};
    }
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    console.error('Failed to read app storage:', error);
    return {};
  }
}

function writeAppStorage(data) {
  const filePath = getAppStoragePath();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// IPC Handlers
ipcMain.handle('app:getVersion', () => {
  return app.getVersion();
});

ipcMain.handle('app:getDataPath', () => {
  return app.getPath('userData');
});

ipcMain.on('storage:readSync', (event, key) => {
  const storage = readAppStorage();
  event.returnValue = Object.prototype.hasOwnProperty.call(storage, key)
    ? storage[key]
    : null;
});

ipcMain.handle('storage:write', async (event, { key, value }) => {
  const storage = readAppStorage();
  storage[key] = value;
  writeAppStorage(storage);
  return { success: true };
});

ipcMain.handle('storage:remove', async (event, key) => {
  const storage = readAppStorage();
  delete storage[key];
  writeAppStorage(storage);
  return { success: true };
});

ipcMain.handle('dialog:showSaveDialog', async (event, options = {}) => {
  const window = BrowserWindow.fromWebContents(event.sender) || mainWindow;
  const result = await dialog.showSaveDialog(window, options);
  return result.canceled ? null : result.filePath;
});

ipcMain.handle('file:saveBinary', async (event, { filePath, data }) => {
  if (!filePath) {
    throw new Error('No file path provided.');
  }

  const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
  await fs.promises.writeFile(filePath, buffer);
  return { success: true, filePath };
});

// Window control handlers
ipcMain.on('window:minimize', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.on('window:maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('window:close', () => {
  if (mainWindow) {
    mainWindow.close();
  }
});

// Auto-updater IPC handlers
ipcMain.handle('updater:checkForUpdates', async () => {
  if (!autoUpdater) {
    return { error: 'Auto-updater not available' };
  }
  try {
    const result = await autoUpdater.checkForUpdates();
    return result;
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('updater:downloadUpdate', async () => {
  if (!autoUpdater) {
    return { error: 'Auto-updater not available' };
  }
  try {
    await autoUpdater.downloadUpdate();
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('updater:quitAndInstall', () => {
  if (autoUpdater) {
    autoUpdater.quitAndInstall();
  }
});

// Print handler with PDF preview
ipcMain.handle('window:print', async (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (!window) return { success: false, error: 'No window found' };
  
  try {
    // Generate PDF for preview - Letter size (8.5 x 11 inches) - full bleed
    const pdfData = await window.webContents.printToPDF({
      printBackground: true,
      pageSize: 'Letter',
      margins: {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0
      },
      landscape: false,
      preferCSSPageSize: true
    });
    
    // Create a temporary file for the PDF
    const tempPath = path.join(app.getPath('temp'), `certificate-preview-${Date.now()}.pdf`);
    await fs.promises.writeFile(tempPath, pdfData);
    
    // Open the PDF in default viewer for preview and printing
    const { shell } = require('electron');
    await shell.openPath(tempPath);
    
    return { success: true };
  } catch (error) {
    console.error('Print error:', error);
    return { success: false, error: error.message };
  }
});
