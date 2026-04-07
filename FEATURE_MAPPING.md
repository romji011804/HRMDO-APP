# Feature Mapping Strategy

## Shared Features
- Dashboard metrics and alerts
- Sidebar navigation
- Local JSON metadata persistence
- IndexedDB file storage
- Search and filter behavior
- File upload/download handling
- Reports and export surfaces

## MOA/LO-Specific Features
- Control number generation
- MOA upload/link management
- Legal opinion upload/link management
- Workflow stages: `For Review`, `Approved`, `Missing Legal Opinion`, `Missing MOA`
- Import/export and record merge flows
- Existing single-record detail pages

## OJT-Specific Features
- OJT certificate records
- Certificate status tracking: `complete` / `missing`
- Student/company certificate metadata
- Certificate file upload and retrieval
- OJT QR reference management
- OJT-specific reporting and dashboard stats

## Integration Rules
- Preserve all MOA/LO flows exactly as they are
- Add OJT as a separate module under `/modules/ojt`
- Centralize persistence, file storage, and search helpers under `/shared`
- Keep module-specific validation inside each module
- Route dashboard and sidebar through a unified shell
