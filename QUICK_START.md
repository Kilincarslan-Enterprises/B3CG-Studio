# Quick Start Guide - Google Drive Integration

Get Google Drive integration up and running in 15 minutes.

## Prerequisites Checklist

- [ ] Google Cloud Platform account
- [ ] Node.js 18+ installed
- [ ] Backend and frontend code downloaded
- [ ] Supabase database running

## Step 1: Google Cloud (5 minutes)

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create new project: "Bosroller Studio"
3. Enable Google Drive API
4. Create service account: `bosroller-drive-service`
5. Create JSON key and download
6. Note the `client_email` from JSON

## Step 2: Google Drive (2 minutes)

1. Create folder "Bosroller Projects" in Drive
2. Share with service account email (from Step 1)
3. Give "Editor" permissions
4. Copy folder ID from URL

## Step 3: Backend Setup (3 minutes)

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:
```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-email@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_ROOT_FOLDER_ID=your-folder-id
FRONTEND_URL=http://localhost:5173
```

Start backend:
```bash
npm run dev
```

## Step 4: Test Backend (1 minute)

```bash
curl http://localhost:3001/health
```

Should return: `{"status":"ok",...}`

## Step 5: Setup Projects (2 minutes)

```bash
# In backend directory
node scripts/setup-project-drive.js --all
```

## Step 6: Use the App (2 minutes)

1. Open Bosroller Studio
2. Click any project
3. Go to "Files & Media" tab
4. Upload a file to test!

## Troubleshooting

**Backend won't start?**
- Check .env file has all variables
- Verify private key includes \n characters

**Can't upload files?**
- Verify backend is running on port 3001
- Check folder is shared with service account
- Ensure Drive API is enabled

**Need help?**
See full documentation in `GOOGLE_DRIVE_SETUP.md`

## Success!

If you can upload a file and see it in the app, you're done!

Files are stored in:
`Google Drive > Bosroller Projects > [Project]_[ID] > [Category]`
