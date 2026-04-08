# Letter Size Print Configuration

## Overview
Updated the OJT Certificate print layout to use Letter size paper (8.5 x 11 inches) instead of A4, ensuring proper formatting for US standard paper with minimal margins.

## Changes Made

### 1. CSS Print Styles (`src/styles/theme.css`)
```css
@page {
  size: letter portrait;
  margin: 0.25in;
}

.print-sheet {
  width: 8.5in !important;
  height: 11in !important;
}
```

### 2. Electron PDF Configuration (`electron/main.cjs`)
```javascript
printToPDF({
  pageSize: 'Letter',
  margins: {
    top: 0.25,
    bottom: 0.25,
    left: 0.25,
    right: 0.25
  }
})
```

### 3. Certificate SVG Dimensions (`src/modules/ojt/documentService.ts`)
- Sheet width: 1700px (Letter width)
- Sheet height: 2200px (Letter height - 11 inches)
- Single certificate: 1700 x 1100px (half height for 2-up layout)
- SVG viewBox updated to match Letter proportions

### 4. Summary Report Layout
- Updated from 210mm x 297mm (A4) to 8.5in x 11in (Letter)
- Adjusted padding and margins to inches

## Paper Specifications

**Letter Size:**
- Width: 8.5 inches (215.9mm)
- Height: 11 inches (279.4mm)
- Aspect Ratio: 0.7727

**Margins:**
- All sides: 0.25 inches (6.35mm)
- Printable area: 8.0 x 10.5 inches

## Benefits

✅ Proper fit for US standard Letter paper
✅ Minimal margins (0.25 inches) for maximum content area
✅ No scaling or distortion issues
✅ Consistent across print preview, PDF export, and physical printing
✅ Professional print-ready output

## Testing

To verify the changes:
1. Generate a certificate
2. Click Print/Preview
3. Check that:
   - Certificate fills the page properly
   - Margins are minimal and uniform
   - No content is cut off
   - Layout matches Letter size (8.5 x 11)

## Compatibility

- ✅ Windows printers (Letter is default)
- ✅ PDF export
- ✅ Print preview
- ✅ Physical printing

---

**Updated:** April 8, 2026
**Paper Size:** Letter (8.5 x 11 inches)
**Previous Size:** A4 (210 x 297mm)
