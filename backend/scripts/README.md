# Backend Scripts

Utility scripts for managing Google Drive integration.

## Setup Project Drive Folders

This script automatically creates Google Drive folder structures for projects and updates the database.

### Prerequisites

Before running the script:
1. Backend server must be running (`npm run dev` in backend directory)
2. Environment variables must be configured
3. Google Drive API must be enabled and configured

### Required Environment Variables

Add to `backend/.env`:

```env
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
BACKEND_URL=http://localhost:3001
```

Get `SUPABASE_SERVICE_ROLE_KEY` from your Supabase project dashboard:
1. Go to Project Settings > API
2. Copy the `service_role` key (not the `anon` key)

### Usage

#### Setup a Specific Project

```bash
cd backend
node scripts/setup-project-drive.js <project-id>
```

Example:
```bash
node scripts/setup-project-drive.js 123e4567-e89b-12d3-a456-426614174000
```

#### Setup All Projects

This will create Drive folders for all projects that don't have them yet:

```bash
node scripts/setup-project-drive.js --all
```

### What the Script Does

1. Fetches project details from Supabase
2. Calls backend API to create Drive folder structure
3. Updates project record with folder IDs
4. Displays confirmation and folder IDs

### Example Output

```
Setting up Drive for project: My Awesome Video

✓ Drive setup completed successfully!
Main folder ID: 1abc123xyz
Raw footage: 1def456uvw
Edited videos: 1ghi789rst
Thumbnails: 1jkl012mno
```

### Troubleshooting

**Error: "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set"**
- Add required environment variables to `backend/.env`

**Error: "Project not found"**
- Verify the project ID is correct
- Check project exists in database

**Error: "Failed to create Drive folder"**
- Ensure backend server is running
- Check Google Drive API configuration
- Verify service account permissions

**Error: "Project already has Drive setup"**
- The project already has folder IDs configured
- To reset, manually clear `drive_folder_id` in database

### Manual Database Update

If you need to manually update a project with Drive IDs:

```sql
UPDATE projects
SET
  drive_folder_id = 'main-folder-id',
  drive_subfolders = '{
    "raw": "raw-folder-id",
    "edited": "edited-folder-id",
    "thumbnails": "thumbnails-folder-id"
  }'::jsonb
WHERE id = 'project-uuid';
```
