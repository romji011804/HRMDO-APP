# MOA & Legal Opinion Tracker - Desktop App

## Features
- ✅ Works completely offline
- ✅ Desktop application (Windows)
- ✅ All data stored locally on your computer
- ✅ File uploads stored in IndexedDB
- ✅ No internet required

## Installation

1. Install dependencies:
```bash
npm install
```

## Running the Desktop App

### Development Mode
Run the app in development mode with hot reload:
```bash
npm run electron:dev
```

Or use the batch file:
```bash
electron-start.bat
```

### Build Desktop Installer
Create a Windows installer:
```bash
npm run electron:build
```

Or use the batch file:
```bash
electron-build.bat
```

The installer will be created in the `release` folder.

## How It Works

- **Offline First**: All data is stored locally using browser storage APIs (localStorage + IndexedDB)
- **No Server Required**: The app runs entirely on your computer
- **File Storage**: Documents are stored in IndexedDB within the Electron app
- **Data Location**: All data is stored in your user data folder

## Scripts

- `npm run dev` - Run web version in browser
- `npm run electron:dev` - Run desktop app in development mode
- `npm run build` - Build web version
- `npm run electron:build` - Build desktop installer
- `npm run electron` - Run desktop app (production mode)

## Notes

- The app uses Electron to wrap the web application
- All features work offline
- Data persists between app restarts
- Windows installer will be created in the `release` folder
