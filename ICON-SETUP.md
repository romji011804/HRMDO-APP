# Icon Setup Instructions

## Current Status
The app icon has been provided but needs to be converted to proper formats.

## Steps to Add the Icon

### 1. Save the Icon Image
Save the shield/document icon image as `icon.png` in the project root folder.
- Recommended size: 512x512 or 1024x1024 pixels
- Format: PNG with transparency

### 2. Convert to Required Formats

#### For Windows (.ico)
Use an online converter or tool:
- https://convertio.co/png-ico/
- https://icoconvert.com/
- Upload `icon.png`
- Generate sizes: 16x16, 32x32, 48x48, 64x64, 128x128, 256x256
- Download as `icon.ico`
- Place in `build/icon.ico`

#### For Mac (.icns) - Optional
If you want Mac support later:
- Use https://cloudconvert.com/png-to-icns
- Upload `icon.png`
- Download as `icon.icns`
- Place in `build/icon.icns`

### 3. Update package.json
Once you have `build/icon.ico`, update package.json:

```json
"win": {
  "target": ["nsis"],
  "icon": "build/icon.ico",
  "publisherName": "MOA LO Tracker Team",
  "verifyUpdateCodeSignature": false
}
```

### 4. Rebuild
```bash
npm run electron:build
```

## Quick Online Conversion

1. Go to https://convertio.co/png-ico/
2. Upload your icon.png
3. Click "Convert"
4. Download the .ico file
5. Rename to `icon.ico`
6. Place in `build/` folder
7. Rebuild the app

## Icon Specifications

### Windows (.ico)
- Multiple sizes in one file
- Sizes: 16, 32, 48, 64, 128, 256 pixels
- Format: ICO
- Transparency: Supported

### Mac (.icns)
- Multiple sizes in one file
- Sizes: 16, 32, 64, 128, 256, 512, 1024 pixels
- Format: ICNS
- Transparency: Supported

## Current Icon
The beautiful shield icon with:
- Document/certificate in center
- Gold seal/badge
- Navy blue and gold colors
- Professional legal/official appearance

Perfect for MOA & Legal Opinion tracking!

## After Adding Icon

The icon will appear:
- In the taskbar
- In the title bar
- In the installer
- In Windows Start Menu
- On desktop shortcut
- In Add/Remove Programs

## Note

Currently using default Electron icon. Once you add the custom icon, the app will look much more professional!
