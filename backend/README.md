# Bosroller Studio - Google Drive Backend

Backend service for Google Drive integration with the Bosroller Studio video project management application.

## Features

- Google Drive API v3 integration using service account authentication
- Resumable uploads for files up to 5GB
- Project-specific folder structure creation
- File management (upload, list, delete)
- Rate limiting and security measures
- Comprehensive error handling and logging
- File type and size validation

## Prerequisites

- Node.js 18+ installed
- Google Cloud Platform account
- Service account with Drive API access

## Google Cloud Setup

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" > "New Project"
3. Enter project name (e.g., "Bosroller Studio")
4. Click "Create"

### 2. Enable Google Drive API

1. In your project, go to "APIs & Services" > "Library"
2. Search for "Google Drive API"
3. Click on it and press "Enable"

### 3. Create Service Account

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Enter service account details:
   - Name: `bosroller-drive-service`
   - Description: "Service account for Drive operations"
4. Click "Create and Continue"
5. Grant role: "Editor" (or custom role with Drive permissions)
6. Click "Done"

### 4. Create and Download Service Account Key

1. In "Credentials", click on your service account email
2. Go to "Keys" tab
3. Click "Add Key" > "Create new key"
4. Choose "JSON" format
5. Click "Create" - the key file will download automatically
6. **IMPORTANT**: Keep this file secure and never commit it to version control

### 5. Create Root Drive Folder

1. Go to [Google Drive](https://drive.google.com/)
2. Create a new folder named "Bosroller Projects"
3. Right-click the folder > "Share"
4. Add your service account email (found in credentials.json as `client_email`)
5. Give it "Editor" permissions
6. Click "Share"
7. Copy the folder ID from the URL: `https://drive.google.com/drive/folders/FOLDER_ID_HERE`

## Local Installation

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Configuration

Create a `.env` file in the backend directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
PORT=3001
NODE_ENV=development

# From your downloaded credentials.json file:
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project-id.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"

# The folder ID from step 5 above:
GOOGLE_DRIVE_ROOT_FOLDER_ID=your-root-folder-id

# Upload Configuration
MAX_FILE_SIZE=5368709120
MAX_SIMULTANEOUS_UPLOADS=3
UPLOAD_RATE_LIMIT=10

# Your frontend URL
FRONTEND_URL=http://localhost:5173
```

**Finding credentials from JSON file:**

Open your downloaded `credentials.json` and copy:
- `client_email` → `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `private_key` → `GOOGLE_PRIVATE_KEY` (keep the quotes and \n characters)

### 3. Start the Server

Development mode with auto-reload:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on port 3001.

## API Endpoints

### Health Check
```
GET /health
```

### Create Project Folder
```
POST /api/drive/create-folder
Content-Type: application/json

{
  "projectId": "uuid",
  "projectTitle": "My Video Project"
}
```

Creates a folder structure:
```
Bosroller Projects/
└── My_Video_Project_uuid/
    ├── Raw Footage/
    ├── Edited Videos/
    └── Thumbnails/
```

### Upload File
```
POST /api/drive/upload
Content-Type: multipart/form-data

{
  "file": <file>,
  "projectId": "uuid",
  "category": "raw|edited|thumbnails",
  "folderId": "google-drive-folder-id"
}
```

### List Project Files
```
GET /api/drive/files/:projectId?folderId=xxx&category=raw
```

### Delete File
```
DELETE /api/drive/file/:fileId?projectId=xxx&category=raw
```

### Get File Metadata
```
GET /api/drive/file/:fileId/metadata
```

## File Validation

### Supported File Types

**Raw Footage & Edited Videos:**
- MP4 (video/mp4)
- MOV (video/quicktime)
- AVI (video/x-msvideo)
- MKV (video/x-matroska)
- WebM (video/webm)

**Thumbnails:**
- JPEG (image/jpeg)
- PNG (image/png)
- GIF (image/gif)
- WebP (image/webp)

### File Size Limits
- Maximum: 5GB per file
- Configurable via `MAX_FILE_SIZE` environment variable

## Security Features

- Service account authentication (no OAuth required)
- CORS configuration for frontend origin
- Rate limiting (10 uploads/minute by default)
- File type validation on server side
- Filename sanitization
- Input validation using express-validator

## Error Handling

All endpoints return JSON responses:

**Success:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional details"
}
```

## Caching

File listings are cached for 5 minutes to reduce API calls. Cache is automatically invalidated when:
- New files are uploaded
- Files are deleted

## Troubleshooting

### "Error: No service account email found"
- Verify `GOOGLE_SERVICE_ACCOUNT_EMAIL` is set in `.env`
- Check the email format matches your credentials.json

### "Error: Invalid private key"
- Ensure `GOOGLE_PRIVATE_KEY` includes the full key with headers
- Keep the `\n` characters in the key
- Wrap the entire key in double quotes

### "Error: Folder not accessible"
- Verify the service account has access to `GOOGLE_DRIVE_ROOT_FOLDER_ID`
- Check folder permissions in Google Drive
- Ensure you shared the folder with the service account email

### "403 Forbidden" errors
- Verify Google Drive API is enabled in your GCP project
- Check service account permissions
- Ensure folder is shared with service account

### CORS errors
- Verify `FRONTEND_URL` matches your frontend's origin
- Check that CORS middleware is properly configured

## Production Deployment

### Environment Variables
Set all required environment variables on your hosting platform.

### Security Checklist
- [ ] Never commit `.env` or credentials files
- [ ] Use environment variables for all sensitive data
- [ ] Enable HTTPS in production
- [ ] Configure proper CORS origins
- [ ] Set up monitoring and logging
- [ ] Implement proper error tracking
- [ ] Regular security audits

### Recommended Hosting
- Railway
- Render
- Heroku
- Google Cloud Run
- AWS Elastic Beanstalk

## File Structure

```
backend/
├── server.js                 # Express app setup
├── routes/
│   └── drive.js             # API route definitions
├── controllers/
│   └── driveController.js   # Business logic
├── middleware/
│   └── upload.js            # Multer configuration
├── config/
│   └── googleDrive.js       # Drive API setup
├── utils/
│   └── fileValidation.js    # Validation utilities
├── .env.example             # Environment template
├── .env                     # Your configuration (gitignored)
├── package.json             # Dependencies
└── README.md                # This file
```

## License

MIT
