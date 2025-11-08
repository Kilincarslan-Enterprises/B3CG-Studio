import { MIME_TYPES } from '../config/googleDrive.js';

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 5368709120;

export function validateFileType(mimetype, category) {
  const allowedTypes = {
    raw: MIME_TYPES.VIDEO,
    edited: MIME_TYPES.VIDEO,
    thumbnails: MIME_TYPES.IMAGE,
  };

  if (!allowedTypes[category]) {
    return { valid: false, error: 'Invalid file category' };
  }

  const isValid = allowedTypes[category].includes(mimetype);
  if (!isValid) {
    return {
      valid: false,
      error: `Invalid file type for ${category}. Expected ${allowedTypes[category].join(', ')}`,
    };
  }

  return { valid: true };
}

export function validateFileSize(size) {
  if (size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024 * 1024)}GB`,
    };
  }
  return { valid: true };
}

export function sanitizeFileName(filename) {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .slice(0, 255);
}

export function getFileExtension(filename) {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

export function isVideoFile(mimetype) {
  return MIME_TYPES.VIDEO.includes(mimetype);
}

export function isImageFile(mimetype) {
  return MIME_TYPES.IMAGE.includes(mimetype);
}
