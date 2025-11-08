import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/drive.file'],
});

export const drive = google.drive({ version: 'v3', auth });

export const MIME_TYPES = {
  FOLDER: 'application/vnd.google-apps.folder',
  VIDEO: [
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-matroska',
    'video/webm',
  ],
  IMAGE: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
  ],
};

export const FOLDER_NAMES = {
  RAW: 'Raw Footage',
  EDITED: 'Edited Videos',
  THUMBNAILS: 'Thumbnails',
};

export async function getAuthClient() {
  return await auth.getClient();
}

export default drive;
