# Multi-PC Setup Guide

## Problem Solved

When using the app on multiple computers, each PC would generate the same control numbers (MOA-2026-001, MOA-2026-002, etc.), causing duplicates when trying to merge records.

## Solution Implemented

### 1. Unique Machine IDs
Each computer gets a unique 4-character ID (e.g., A1B2, X7Y9) that's automatically generated and stored.

### 2. New Control Number Format
**Old Format:** `MOA-2026-001`
**New Format:** `MOA-2026-A1B2-001`

- `MOA` = Prefix
- `2026` = Year
- `A1B2` = Machine ID (unique per PC)
- `001` = Sequential number

### 3. Import/Export Feature
New menu option to share records between computers with automatic duplicate detection.

## How It Works

### Scenario: 3 Computers

**PC 1 (Machine ID: A1B2)**
- Creates: MOA-2026-A1B2-001
- Creates: MOA-2026-A1B2-002
- Creates: MOA-2026-A1B2-003

**PC 2 (Machine ID: X7Y9)**
- Creates: MOA-2026-X7Y9-001
- Creates: MOA-2026-X7Y9-002

**PC 3 (Machine ID: K3M5)**
- Creates: MOA-2026-K3M5-001

**Result:** No duplicates! Each control number is unique.

## Sharing Records Between PCs

### Step 1: Export from PC 1
1. Open the app on PC 1
2. Go to "Import / Export" in the sidebar
3. Click "Export All Records"
4. Save file: `moa-records-A1B2-2026-03-26.json`

### Step 2: Transfer File
Copy the JSON file to PC 2 using:
- USB drive
- Email
- Network share
- Cloud storage (Dropbox, Google Drive, etc.)

### Step 3: Import to PC 2
1. Open the app on PC 2
2. Go to "Import / Export"
3. Click "Import Records"
4. Select the JSON file
5. See results:
   - ✅ Imported: 3 records
   - ⚠️ Skipped duplicates: 0

### Step 4: Repeat for Other PCs
Repeat the process to share records with PC 3, PC 4, etc.

## Duplicate Detection

The system automatically detects and skips duplicates:

**Example:**
- PC 1 exports records including MOA-2026-A1B2-001
- PC 2 already has MOA-2026-A1B2-001 (imported earlier)
- When importing again, the system skips it
- Result: "Skipped duplicates: 1"

## Best Practices

### 1. Regular Exports
Export records regularly to keep all PCs in sync:
- Daily for active use
- Weekly for moderate use
- Monthly for light use

### 2. Naming Convention
Use descriptive filenames:
- `moa-records-OFFICE1-2026-03-26.json`
- `moa-records-BRANCH2-2026-03-26.json`

### 3. Central Collection
Designate one PC as the "master" that collects all records:
1. Each PC exports their records
2. Master PC imports all files
3. Master PC has complete database
4. Master PC exports and distributes to all

### 4. Backup Strategy
- Keep exported JSON files as backups
- Store in multiple locations
- Include date in filename

## Troubleshooting

### Q: What if I reinstall the app?
A: The machine ID is stored in browser localStorage. If you clear browser data or reinstall, you'll get a new machine ID. Export your records first!

### Q: Can I manually set the machine ID?
A: Yes, but not recommended. The auto-generated ID prevents conflicts.

### Q: What happens if two PCs have the same machine ID?
A: Very unlikely (1 in 1.6 million chance), but if it happens, you'll see duplicate warnings during import.

### Q: Can I merge records from 10+ computers?
A: Yes! The system handles unlimited computers. Just import each export file one by one.

### Q: Do I need internet to share records?
A: No! Use USB drives or local network. The app works completely offline.

## Technical Details

### Machine ID Generation
- 4 random alphanumeric characters (A-Z, 0-9)
- Stored in localStorage as 'machine-id'
- Generated once per browser/installation
- Probability of collision: 0.00006%

### Control Number Regex
```
MOA-YYYY-XXXX-NNN
```
- YYYY = 4-digit year
- XXXX = 4-character machine ID
- NNN = 3-digit sequential number (001-999)

### JSON Export Format
```json
[
  {
    "id": "1234567890",
    "controlNumber": "MOA-2026-A1B2-001",
    "school": "University Name",
    "course": "Course Name",
    "status": "Ongoing",
    "workflow": "For Review",
    ...
  }
]
```

## Migration from Old Format

If you have existing records with old format (MOA-2026-001):
1. They will continue to work
2. New records use new format
3. No action required
4. Both formats coexist peacefully

## Summary

✅ **Problem:** Duplicate control numbers across PCs
✅ **Solution:** Unique machine IDs + Import/Export
✅ **Result:** No duplicates, easy sharing, offline capable

Each PC maintains its own records while allowing easy merging with other PCs through simple file export/import.
