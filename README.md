# MOA & LO Tracking System
This system is designed to assist the office in organizing, tracking, and generating reports for important documents and OJT records. It simplifies workflows and reduces manual tracking through a structured and user-friendly interface.

## 📋 What This Application Does
1. MOA & LO Tracking
- Track and manage MOA and Legal Opinion documents
- Store document details and attachments
- Generate monthly and quarterly reports
- Import/Export records between computers
- Search and filter documents

2. OJT Certificate Management
- Manage OJT student records
- Generate certificates with QR codes
- Create monthly and quarterly reports
- Import/Export student data (JSON and CSV)
- Track student progress

## Installation
1. Run `MOA LO Tracker Setup 0.0.1.exe`
2. Follow the installation wizard
3. Launch the application

## For Developers
### Setup
```bash
npm install
```

### Run Development Mode
```bash
npm run electron:dev
```

### Build Application
```bash
npm run build
npm run electron:build
```

The installer will be created in the `release/` folder.

## Data Storage

All data is stored locally on your computer at:
```
%APPDATA%\moa-lo-tracker\
```

## Sharing Data Between Computers

### Export Data
1. Go to Import/Export page
2. Click "Export All" or "Export Selected"
3. Save the JSON file

### Import Data
1. Go to Import/Export page
2. Click "Import"
3. Select the JSON file
4. Duplicates are automatically skipped

## Key Features

- **Dark/Light Theme** - Switch themes using the button in the sidebar
- **Auto Reports** - Schedule monthly or quarterly reports
- **Duplicate Detection** - Prevents duplicate entries automatically
- **Offline** - Works completely offline, no internet required
- **Fullscreen** - Launches in maximized window for better workspace

## Technology Stack

- **Electron** - Desktop application framework
- **React** - User interface
- **TypeScript** - Programming language
- **Vite** - Build tool
- **Tailwind CSS** - Styling

## Credits

**Developed by:** Juel Jerome De Castro

**Requested by:** Ms. Patrice Ysabel P. Gayaban

**OJT System by:** Previous OJT under Ms. May M. Orteo

**Integration Initiative:** Ms. Philine Pioquinto

## Support

For issues or questions, contact the IT Department at Human Resource Management and Development Office - Pangasinan.

## Version

Current Version: 0.0.1

---

© 2026 Human Resource Management and Development Office (HRMDO)
