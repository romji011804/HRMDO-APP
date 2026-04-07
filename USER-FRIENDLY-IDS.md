# User-Friendly Machine IDs - Updated Feature

## What Changed

Instead of random 4-character IDs (A1B2, X7Y9), users can now set their own meaningful identifiers!

## New Features

### 1. Custom Machine IDs
Users can choose their own identifier when first creating a record:
- **Examples:** OFFICE1, BRANCH2, ADMIN, MAIN, HQ, LEGAL, etc.
- **Length:** 2-10 characters
- **Format:** Letters and numbers only (A-Z, 0-9)

### 2. First-Time Setup
When a user creates their first record, they'll see a prompt:
```
Enter a unique identifier for this computer
(e.g., OFFICE1, BRANCH2, ADMIN):

This will be used in control numbers like: MOA-2026-OFFICE1-001

Use 2-10 characters (letters and numbers only)
```

### 3. Change Anytime
Users can change their machine ID later:
1. Go to "Import / Export" page
2. Click the edit icon next to Machine ID
3. Enter new identifier
4. Click Save

**Note:** Existing records keep their old ID, new records use the new ID.

## Control Number Examples

### Before (Random IDs)
- PC 1: MOA-2026-A1B2-001
- PC 2: MOA-2026-X7Y9-001
- PC 3: MOA-2026-K3M5-001

### After (User-Friendly IDs)
- Main Office: MOA-2026-MAIN-001
- Branch 1: MOA-2026-BRANCH1-001
- Branch 2: MOA-2026-BRANCH2-001
- Legal Dept: MOA-2026-LEGAL-001
- Admin: MOA-2026-ADMIN-001

## Benefits

✅ **Meaningful** - Know which office created each record
✅ **Memorable** - Easy to remember and communicate
✅ **Flexible** - Can be changed if needed
✅ **Professional** - Looks better in reports
✅ **Organized** - Clear tracking by department/location

## Real-World Example

### Company with Multiple Locations

**Head Office (MAIN)**
- MOA-2026-MAIN-001
- MOA-2026-MAIN-002
- MOA-2026-MAIN-003

**Manila Branch (MNL)**
- MOA-2026-MNL-001
- MOA-2026-MNL-002

**Cebu Branch (CEBU)**
- MOA-2026-CEBU-001
- MOA-2026-CEBU-002

**Legal Department (LEGAL)**
- MOA-2026-LEGAL-001

Now you can instantly see which office created each record!

## Validation Rules

The system automatically:
- Converts to UPPERCASE
- Removes spaces and special characters
- Limits to 10 characters
- Requires minimum 2 characters

**Examples:**
- Input: "Office 1" → Saved as: "OFFICE1"
- Input: "branch-2" → Saved as: "BRANCH2"
- Input: "Main HQ" → Saved as: "MAINHQ"

## Fallback Behavior

If user:
- Cancels the prompt → Random ID generated (A1B2)
- Enters invalid input → Random ID generated
- Enters too short → Random ID generated

This ensures the system always works even if user makes a mistake.

## Changing Machine ID

### When to Change
- Moving app to different department
- Reorganizing office structure
- Correcting initial setup mistake
- Standardizing naming across offices

### How to Change
1. Open app
2. Go to "Import / Export"
3. Click edit icon (✏️) next to Machine ID
4. Enter new identifier
5. Click "Save"

### What Happens
- ✅ New records use new ID
- ✅ Old records keep old ID
- ✅ Both IDs work together
- ✅ No data loss

### Example
```
Before: MOA-2026-TEMP-001, MOA-2026-TEMP-002
Change ID from "TEMP" to "OFFICE1"
After: MOA-2026-TEMP-001, MOA-2026-TEMP-002, MOA-2026-OFFICE1-003
```

## Best Practices

### Naming Conventions

**By Location:**
- MAIN, HQ, BRANCH1, BRANCH2, MNL, CEBU, DAVAO

**By Department:**
- ADMIN, LEGAL, HR, IT, FINANCE, OPS

**By Function:**
- RECORDS, ARCHIVE, FILING, TRACKING

**Hybrid:**
- MNLADMIN (Manila Admin)
- CEBUHR (Cebu HR)
- HQLEGAL (HQ Legal)

### Tips
1. Keep it short but meaningful
2. Use consistent format across offices
3. Document your naming scheme
4. Avoid similar names (OFFICE1 vs OFFICE01)
5. Consider future expansion

## Technical Details

### Storage
- Stored in browser localStorage
- Key: 'machine-id'
- Persists across sessions
- Cleared if browser data cleared

### Validation
```typescript
const cleanId = input
  .trim()
  .toUpperCase()
  .replace(/[^A-Z0-9]/g, '')
  .substring(0, 10);

if (cleanId.length < 2) {
  // Use random fallback
}
```

### Control Number Regex
```
MOA-YYYY-IDENTIFIER-NNN
```
- YYYY = 4-digit year
- IDENTIFIER = 2-10 character user ID
- NNN = 3-digit sequential number

## Migration

### From Random IDs
If you already have records with random IDs (A1B2, X7Y9):
1. They continue to work normally
2. Change your machine ID to something meaningful
3. New records use the new ID
4. Both coexist peacefully

### Example Migration
```
Existing records:
- MOA-2026-A1B2-001
- MOA-2026-A1B2-002

Change ID to "OFFICE1"

New records:
- MOA-2026-OFFICE1-003
- MOA-2026-OFFICE1-004

All records work together!
```

## FAQ

**Q: Can two offices use the same ID?**
A: Technically yes, but not recommended. Use unique IDs to avoid confusion.

**Q: What if I forget my machine ID?**
A: Check the Import/Export page - it's displayed at the top.

**Q: Can I use spaces?**
A: No, spaces are automatically removed. Use "OFFICE1" not "OFFICE 1".

**Q: Can I use lowercase?**
A: Input is automatically converted to uppercase.

**Q: Maximum length?**
A: 10 characters maximum, 2 minimum.

**Q: Can I use special characters?**
A: No, only letters (A-Z) and numbers (0-9).

**Q: What happens if I reinstall?**
A: You'll be prompted to set a new ID. Use the same one to maintain consistency.

## Summary

✅ **User-friendly** - Choose your own meaningful identifier
✅ **Flexible** - Change anytime
✅ **Professional** - Better than random codes
✅ **Organized** - Track by office/department
✅ **Simple** - Easy to set up and use

Your control numbers now look like:
**MOA-2026-OFFICE1-001** instead of **MOA-2026-A1B2-001**

Much better! 🎉
