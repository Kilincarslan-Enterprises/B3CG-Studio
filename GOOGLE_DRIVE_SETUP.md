# Google Drive Integration Setup Guide

Complete guide for integrating Google Drive with Bosroller Studio to enable video file uploads and management.

## Overview

This integration allows users to:
- Upload raw footage, edited videos, and thumbnails directly to Google Drive
- Organize files in project-specific folders with automatic structure
- Track upload progress in real-time
- View and manage files through the application
- Access files via Google Drive links

## Architecture

```
Frontend (React/Vite)
    ↓
Backend API (Express/Node.js)
    ↓
Google Drive API (Service Account)
    ↓
Google Drive Storage
```

## Prerequisites

- Node.js 18+ installed
- Google Cloud Platform account
- Supabase database (already configured)
- Admin access to create service accounts

## Part 1: Google Cloud Setup

### Step 1: Create Google Cloud Project

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown (top left)
3. Click "New Project"
4. Enter project details:
   - **Project Name**: `Bosroller Studio`
   - **Organization**: Leave default or select your organization
5. Click "Create"
6. Wait for project creation (usually takes 30 seconds)

### Step 2: Enable Google Drive API

1. In your new project, open the navigation menu (☰)
2. Navigate to **APIs & Services** > **Library**
3. Search for "Google Drive API"
4. Click on "Google Drive API"
5. Click the "Enable" button
6. Wait for API enablement confirmation

### Step 3: Create Service Account

1. Navigate to **APIs & Services** > **Credentials**
2. Click "Create Credentials" > "Service Account"
3. Fill in service account details:
   - **Service account name**: `bosroller-drive-service`
   - **Service account ID**: (auto-generated)
   - **Description**: "Service account for Bosroller Studio Drive operations"
4. Click "Create and Continue"
5. Grant roles:
   - Select "Project" > "Editor" (or create custom role)
   - This gives necessary permissions for Drive operations
6. Click "Continue"
7. Skip "Grant users access" (optional step)
8. Click "Done"

### Step 4: Generate Service Account Key

1. In **Credentials**, find your service account in the list
2. Click on the service account email
3. Go to the "Keys" tab
4. Click "Add Key" > "Create new key"
5. Select "JSON" as key type
6. Click "Create"
7. **IMPORTANT**: The JSON file will download automatically
   - Save it securely
   - Never commit it to version control
   - Store it in a password manager or secure location

### Step 5: Create Google Drive Root Folder

1. Open [Google Drive](https://drive.google.com/)
2. Click "New" > "Folder"
3. Name it: `Bosroller Projects`
4. Click "Create"
5. Right-click the new folder > "Share"
6. Click "Add people and groups"
7. Enter your service account email:
   - Found in downloaded JSON as `client_email`
   - Format: `name@project-id.iam.gserviceaccount.com`
8. Set permission level to "Editor"
9. **Uncheck** "Notify people" (service accounts don't receive emails)
10. Click "Share"
11. Copy the folder ID from the URL:
    - URL format: `https://drive.google.com/drive/folders/FOLDER_ID_HERE`
    - Example: If URL is `https://drive.google.com/drive/folders/1abc123xyz`
    - Folder ID is: `1abc123xyz`

## Part 2: Backend Setup

### Step 1: Install Backend Dependencies

```bash
cd backend
npm install
```

This installs:
- Express (web server)
- Google APIs (Drive integration)
- Multer (file upload handling)
- CORS (cross-origin requests)
- Express Rate Limit (security)

### Step 2: Configure Environment Variables

Create `.env` file in the `backend` directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
PORT=3001
NODE_ENV=development

# Google Service Account Configuration
# Get these from your downloaded credentials.json file
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project-id.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"

# Google Drive Root Folder
# The folder ID you copied in Part 1, Step 5
GOOGLE_DRIVE_ROOT_FOLDER_ID=1abc123xyz

# Upload Configuration
MAX_FILE_SIZE=5368709120
MAX_SIMULTANEOUS_UPLOADS=3
UPLOAD_RATE_LIMIT=10

# Frontend URL (update in production)
FRONTEND_URL=http://localhost:5173
```

#### Finding Credentials from JSON File

Open your downloaded `credentials.json`:

```json
{
  "type": "service_account",
  "project_id": "your-project",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "name@project.iam.gserviceaccount.com",
  ...
}
```

Copy values:
- `client_email` → `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `private_key` → `GOOGLE_PRIVATE_KEY`
  - **IMPORTANT**: Keep all `\n` characters
  - Keep the quotes around the entire key

### Step 3: Start Backend Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

Server should start on port 3001. You'll see:
```
Backend server running on port 3001
Environment: development
```

### Step 4: Test Backend Health

Open browser or use curl:
```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-11-06T21:00:00.000Z"
}
```

## Part 3: Frontend Setup

### Step 1: Update Environment Variables

The frontend `.env` file should already have:

```env
VITE_SUPABASE_ANON_KEY=your-key
VITE_SUPABASE_URL=your-url
VITE_BACKEND_URL=http://localhost:3001
```

### Step 2: Apply Database Migration

The migration has been applied automatically, but to verify:

```bash
# Check if drive fields exist in projects table
```

The migration adds:
- `drive_folder_id` (TEXT): Main project folder ID
- `drive_subfolders` (JSONB): Subfolder IDs for raw, edited, thumbnails

## Part 4: Using the Integration

### Creating Project Folders

When you want to enable Drive for a project:

1. Use the backend API to create folder structure:

```bash
curl -X POST http://localhost:3001/api/drive/create-folder \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "uuid-of-project",
    "projectTitle": "My Video Project"
  }'
```

2. Response will contain folder IDs:

```json
{
  "success": true,
  "data": {
    "projectFolderId": "main-folder-id",
    "projectFolderName": "My_Video_Project_uuid",
    "subfolders": {
      "raw": { "id": "raw-folder-id", "name": "Raw Footage" },
      "edited": { "id": "edited-folder-id", "name": "Edited Videos" },
      "thumbnails": { "id": "thumb-folder-id", "name": "Thumbnails" }
    }
  }
}
```

3. Update project in Supabase:

```sql
UPDATE projects
SET
  drive_folder_id = 'main-folder-id',
  drive_subfolders = '{
    "raw": "raw-folder-id",
    "edited": "edited-folder-id",
    "thumbnails": "thumb-folder-id"
  }'::jsonb
WHERE id = 'project-uuid';
```

### Using the UI

Once a project has Drive setup:

1. Open the project in the Projects page
2. Click on the project card to open details
3. Switch to "Files & Media" tab
4. You'll see three tabs: Raw Footage, Edited Videos, Thumbnails
5. Upload files by:
   - Clicking "Browse Files" button
   - Dragging and dropping files onto the upload area
6. Monitor upload progress in real-time
7. View uploaded files with thumbnails
8. Click "View" to open file in Google Drive
9. Delete files when no longer needed

## Troubleshooting

### Backend Won't Start

**Error: "No service account email found"**
- Check `GOOGLE_SERVICE_ACCOUNT_EMAIL` is set in `.env`
- Verify email format matches `credentials.json`

**Error: "Invalid private key"**
- Ensure entire private key is copied including headers
- Keep `\n` characters in the key
- Wrap key in double quotes

### Upload Failures

**Error: "Folder not accessible"**
- Verify folder is shared with service account
- Check folder ID is correct
- Ensure service account has Editor permissions

**Error: "403 Forbidden"**
- Verify Drive API is enabled in Google Cloud
- Check service account has proper permissions
- Ensure folder sharing is configured correctly

**Error: "File too large"**
- Default maximum is 5GB per file
- Check `MAX_FILE_SIZE` in backend `.env`
- For larger files, increase the limit

### CORS Errors

**Error: "CORS policy blocked"**
- Verify `FRONTEND_URL` in backend `.env` matches your frontend
- Check CORS middleware is configured
- Ensure backend is running on expected port

### Rate Limiting

**Error: "Too many requests"**
- Default limit is 10 uploads per minute
- Adjust `UPLOAD_RATE_LIMIT` in backend `.env`
- Wait and retry after cooldown period

## File Type Support

### Accepted Video Formats

- MP4 (video/mp4)
- MOV (video/quicktime)
- AVI (video/x-msvideo)
- MKV (video/x-matroska)
- WebM (video/webm)

### Accepted Image Formats (Thumbnails)

- JPEG (image/jpeg)
- PNG (image/png)
- GIF (image/gif)
- WebP (image/webp)

### File Size Limits

- Maximum: 5GB per file (configurable)
- Resumable uploads for files over 5MB
- Upload queue supports 3 simultaneous uploads

## Security Best Practices

### Service Account Security

- Never commit `.env` or `credentials.json` to git
- Store credentials in secure password manager
- Rotate service account keys periodically
- Use principle of least privilege for permissions

### API Security

- Rate limiting enabled by default
- CORS configured for specific origins
- File type validation on upload
- Filename sanitization to prevent exploits

### Production Deployment

- Set `NODE_ENV=production`
- Use HTTPS for all connections
- Configure proper CORS origins
- Enable monitoring and logging
- Set up error tracking (Sentry, etc.)
- Regular security audits

## Production Deployment

### Backend Hosting Options

**Railway** (Recommended)
1. Connect GitHub repository
2. Configure environment variables
3. Deploy automatically on push

**Render**
1. Create new Web Service
2. Connect repository
3. Add environment variables
4. Deploy

**Google Cloud Run**
1. Build Docker container
2. Push to Container Registry
3. Deploy to Cloud Run
4. Configure environment variables

### Environment Variables for Production

```env
PORT=3001
NODE_ENV=production
GOOGLE_SERVICE_ACCOUNT_EMAIL=...
GOOGLE_PRIVATE_KEY=...
GOOGLE_DRIVE_ROOT_FOLDER_ID=...
MAX_FILE_SIZE=5368709120
MAX_SIMULTANEOUS_UPLOADS=3
UPLOAD_RATE_LIMIT=10
FRONTEND_URL=https://your-production-domain.com
```

## Monitoring and Maintenance

### Logging

Backend logs include:
- API requests (Morgan middleware)
- Upload progress
- Error details
- File operations

### Metrics to Monitor

- Upload success rate
- Average upload time
- API response times
- Error rates
- Storage usage

### Regular Maintenance

- Review and clean old files
- Monitor Drive storage quota
- Rotate service account keys
- Update dependencies
- Review access logs

## API Reference

### Create Project Folder

```http
POST /api/drive/create-folder
Content-Type: application/json

{
  "projectId": "string",
  "projectTitle": "string"
}
```

### Upload File

```http
POST /api/drive/upload
Content-Type: multipart/form-data

file: <binary>
projectId: string
category: "raw" | "edited" | "thumbnails"
folderId: string
```

### List Files

```http
GET /api/drive/files/:projectId?folderId=xxx&category=raw
```

### Delete File

```http
DELETE /api/drive/file/:fileId?projectId=xxx&category=raw
```

### Get File Metadata

```http
GET /api/drive/file/:fileId/metadata
```

## Support

For issues or questions:
1. Check this documentation
2. Review backend/README.md
3. Check console logs for errors
4. Verify all environment variables
5. Test API endpoints directly

## Additional Resources

- [Google Drive API Documentation](https://developers.google.com/drive/api/v3/about-sdk)
- [Service Account Authentication](https://cloud.google.com/iam/docs/service-accounts)
- [Multer Documentation](https://github.com/expressjs/multer)
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
