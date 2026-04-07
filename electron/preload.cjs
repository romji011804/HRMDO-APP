// Electron Preload Script
// Exposes safe IPC APIs to renderer process
// Implements Requirements 1.4, 9.1, 12.4, 12.5

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  readPersistentStorageSync: (key) => ipcRenderer.sendSync('storage:readSync', key),
  writePersistentStorage: (key, value) => ipcRenderer.invoke('storage:write', { key, value }),
  removePersistentStorage: (key) => ipcRenderer.invoke('storage:remove', key),
  // ============================================
  // Record Operations
  // ============================================
  
  /**
   * Get all records from the database
   * @returns {Promise<RecordItem[]>}
   */
  getAllRecords: () => ipcRenderer.invoke('records:getAll'),
  
  /**
   * Get a single record by ID
   * @param {string} id - Record ID
   * @returns {Promise<RecordItem>}
   */
  getRecordById: (id) => ipcRenderer.invoke('records:getById', id),
  
  /**
   * Create a new record
   * @param {object} record - Record data
   * @returns {Promise<RecordItem>}
   */
  createRecord: (record) => ipcRenderer.invoke('records:create', record),
  
  /**
   * Update an existing record
   * @param {string} id - Record ID
   * @param {object} updates - Fields to update
   * @returns {Promise<RecordItem>}
   */
  updateRecord: (id, updates) => ipcRenderer.invoke('records:update', { id, updates }),
  
  /**
   * Delete a record
   * @param {string} id - Record ID
   * @returns {Promise<void>}
   */
  deleteRecord: (id) => ipcRenderer.invoke('records:delete', id),
  
  /**
   * Mark a record as synced to cloud
   * @param {string} id - Record ID
   * @returns {Promise<void>}
   */
  markRecordAsSynced: (id) => ipcRenderer.invoke('records:markSynced', id),

  // ============================================
  // File Operations
  // ============================================
  
  /**
   * Save a file to local storage
   * @param {string} controlNumber - Control number for organizing files
   * @param {string} fileName - Name of the file
   * @param {string} fileData - Base64 encoded file data
   * @param {string} mimeType - MIME type of the file
   * @returns {Promise<{ id: string, fileName: string, uniqueFileName: string, filePath: string }>}
   */
  saveFile: (controlNumber, fileName, fileData, mimeType) => 
    ipcRenderer.invoke('files:save', { controlNumber, fileName, fileData, mimeType }),
  
  /**
   * Get a file from local storage
   * @param {string} id - File ID
   * @returns {Promise<{ data: string, mimeType: string, fileName: string }>}
   */
  getFile: (id) => ipcRenderer.invoke('files:get', id),
  
  /**
   * Delete a file from local storage
   * @param {string} id - File ID
   * @returns {Promise<void>}
   */
  deleteFile: (id) => ipcRenderer.invoke('files:delete', id),

  // ============================================
  // Cloud Sync Operations
  // ============================================
  
  /**
   * Check if Firebase is configured
   * @returns {Promise<boolean>}
   */
  isFirebaseConfigured: () => ipcRenderer.invoke('cloud:isConfigured'),
  
  /**
   * Check internet connectivity
   * @returns {Promise<boolean>}
   */
  checkConnection: () => ipcRenderer.invoke('cloud:checkConnection'),
  
  /**
   * Sync all unsynced records to cloud
   * @returns {Promise<{ synced: number, failed: number, errors: string[] }>}
   */
  syncToCloud: () => ipcRenderer.invoke('cloud:sync'),
  
  /**
   * Load all records from Firestore
   * @returns {Promise<CloudRecord[]>}
   */
  loadCloudRecords: () => ipcRenderer.invoke('cloud:loadRecords'),
  
  /**
   * Push a record to Firestore
   * @param {object} record - Record to push
   * @returns {Promise<string>} - Firestore document ID
   */
  pushRecordToCloud: (record) => ipcRenderer.invoke('cloud:pushRecord', { record }),
  
  /**
   * Delete a record from Firestore
   * @param {string} firestoreId - Firestore document ID
   * @returns {Promise<void>}
   */
  deleteCloudRecord: (firestoreId) => ipcRenderer.invoke('cloud:deleteRecord', firestoreId),
  
  /**
   * Listen for cloud upload progress events
   * @param {Function} callback - Callback function (controlNumber, progress)
   */
  onCloudUploadProgress: (callback) => {
    ipcRenderer.on('cloud:uploadProgress', (event, { controlNumber, progress }) => {
      callback(controlNumber, progress);
    });
  },

  // ============================================
  // App Operations
  // ============================================
  
  /**
   * Get the application version
   * @returns {Promise<string>}
   */
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
  
  /**
   * Get the application data path
   * @returns {Promise<string>}
   */
  getDataPath: () => ipcRenderer.invoke('app:getDataPath'),

  /**
   * Minimize the window
   */
  minimizeWindow: () => ipcRenderer.send('window:minimize'),

  /**
   * Maximize/restore the window
   */
  maximizeWindow: () => ipcRenderer.send('window:maximize'),

  /**
   * Close the window
   */
  closeWindow: () => ipcRenderer.send('window:close'),

  // ============================================
  // Data Migration Operations
  // ============================================
  
  /**
   * Export all data to JSON file
   * @returns {Promise<string>} - Path to exported file
   */
  exportData: () => ipcRenderer.invoke('data:export'),
  
  /**
   * Import data from JSON file
   * @param {string} filePath - Path to import file
   * @returns {Promise<{ imported: number, failed: number, errors: string[] }>}
   */
  importData: (filePath) => ipcRenderer.invoke('data:import', filePath),
  
  /**
   * Show open file dialog
   * @param {object} options - Dialog options
   * @returns {Promise<string[]>} - Selected file paths
   */
  showOpenDialog: (options) => ipcRenderer.invoke('dialog:showOpenDialog', options),

  /**
   * Show save file dialog
   * @param {object} options - Dialog options
   * @returns {Promise<string | null>} - Selected file path
   */
  showSaveDialog: (options) => ipcRenderer.invoke('dialog:showSaveDialog', options),

  /**
   * Save binary data to a file
   * @param {string} filePath - Absolute file path
   * @param {Uint8Array | number[]} data - Binary file data
   * @returns {Promise<{ success: boolean, filePath: string }>}
   */
  saveBinaryFile: (filePath, data) => ipcRenderer.invoke('file:saveBinary', { filePath, data }),
});
