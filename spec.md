# Private Files Vault

## Current State
New project with no existing features.

## Requested Changes (Diff)

### Add
- User authentication and authorization (login/logout, role-based access)
- Private file collection per user: upload, list, view, download, delete files
- File metadata: name, size, type, upload date
- Blob storage for actual file data (images, documents, videos, etc.)
- Dashboard showing all user's files in a grid/list view
- Upload UI with drag-and-drop support
- File detail/preview where applicable (images, PDFs)

### Modify
- N/A

### Remove
- N/A

## Implementation Plan
1. Select `authorization` and `blob-storage` components
2. Generate Motoko backend with file metadata storage, per-user file ownership, CRUD operations
3. Build frontend: auth flow, file dashboard, upload modal, file list/grid, delete confirmation
