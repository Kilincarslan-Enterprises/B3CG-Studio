import { drive, MIME_TYPES, FOLDER_NAMES } from '../config/googleDrive.js';
import { sanitizeFileName } from '../utils/fileValidation.js';
import { logDriveError, formatDriveError } from '../utils/errorHandler.js';
import { Readable } from 'stream';

const DRIVE_ROOT_FOLDER_ID = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
const fileListCache = new Map();
const CACHE_EXPIRY = 5 * 60 * 1000;

async function createFolder(name, parentId) {
  try {
    const response = await drive.files.create({
      requestBody: {
        name,
        mimeType: MIME_TYPES.FOLDER,
        parents: [parentId],
      },
      fields: 'id, name',
    });

    await drive.permissions.create({
      fileId: response.data.id,
      requestBody: {
        role: 'writer',
        type: 'anyone',
      },
    });

    return response.data;
  } catch (error) {
    const errorInfo = logDriveError(error, `createFolder: ${name}`, {
      folderId: parentId,
    });
    throw error;
  }
}

export async function createProjectFolder(req, res) {
  try {
    const { projectId, projectTitle } = req.body;

    if (!projectId || !projectTitle) {
      return res.status(400).json({
        success: false,
        error: 'Project ID and title are required',
      });
    }

    const sanitizedTitle = sanitizeFileName(projectTitle);
    const projectFolderName = `${sanitizedTitle}_${projectId}`;

    const projectFolder = await createFolder(projectFolderName, DRIVE_ROOT_FOLDER_ID);

    const subfolders = await Promise.all([
      createFolder(FOLDER_NAMES.RAW, projectFolder.id),
      createFolder(FOLDER_NAMES.EDITED, projectFolder.id),
      createFolder(FOLDER_NAMES.THUMBNAILS, projectFolder.id),
    ]);

    const folderStructure = {
      projectFolderId: projectFolder.id,
      projectFolderName: projectFolder.name,
      subfolders: {
        raw: { id: subfolders[0].id, name: subfolders[0].name },
        edited: { id: subfolders[1].id, name: subfolders[1].name },
        thumbnails: { id: subfolders[2].id, name: subfolders[2].name },
      },
    };

    res.json({
      success: true,
      data: folderStructure,
    });
  } catch (error) {
    const errorInfo = logDriveError(error, 'createProjectFolder', {
      projectId,
      projectTitle,
    });
    res.status(500).json({
      success: false,
      error: errorInfo.userMessage,
      details: errorInfo.technicalMessage,
      errorType: errorInfo.errorType,
      suggestion: errorInfo.suggestion,
    });
  }
}

export async function uploadFile(req, res) {
  try {
    const { projectId, category, folderId } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'No file provided',
      });
    }

    if (!folderId) {
      return res.status(400).json({
        success: false,
        error: 'Folder ID is required',
      });
    }

    const sanitizedName = sanitizeFileName(file.originalname);
    const bufferStream = Readable.from(file.buffer);

    const response = await drive.files.create({
      requestBody: {
        name: sanitizedName,
        parents: [folderId],
      },
      media: {
        mimeType: file.mimetype,
        body: bufferStream,
      },
      fields: 'id, name, mimeType, size, createdTime, thumbnailLink, webViewLink, webContentLink',
    });

    await drive.permissions.create({
      fileId: response.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    fileListCache.delete(`${projectId}_${category}`);

    res.json({
      success: true,
      data: {
        fileId: response.data.id,
        name: response.data.name,
        mimeType: response.data.mimeType,
        size: response.data.size,
        createdTime: response.data.createdTime,
        thumbnailLink: response.data.thumbnailLink,
        webViewLink: response.data.webViewLink,
        webContentLink: response.data.webContentLink,
      },
    });
  } catch (error) {
    const errorInfo = logDriveError(error, 'uploadFile', {
      projectId,
      category,
      fileName: req.file?.originalname,
      fileSize: req.file?.size,
    });
    res.status(500).json({
      success: false,
      error: errorInfo.userMessage,
      details: errorInfo.technicalMessage,
      errorType: errorInfo.errorType,
      suggestion: errorInfo.suggestion,
    });
  }
}

export async function getProjectFiles(req, res) {
  try {
    const { projectId } = req.params;
    const { folderId, category } = req.query;

    if (!folderId) {
      return res.status(400).json({
        success: false,
        error: 'Folder ID is required',
      });
    }

    const cacheKey = `${projectId}_${category}`;
    const cached = fileListCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY) {
      return res.json({
        success: true,
        data: cached.files,
        cached: true,
      });
    }

    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'files(id, name, mimeType, size, createdTime, modifiedTime, thumbnailLink, webViewLink, webContentLink)',
      orderBy: 'createdTime desc',
    });

    const files = response.data.files || [];

    fileListCache.set(cacheKey, {
      files,
      timestamp: Date.now(),
    });

    res.json({
      success: true,
      data: files,
      cached: false,
    });
  } catch (error) {
    const errorInfo = logDriveError(error, 'getProjectFiles', {
      projectId,
      folderId,
      category,
    });
    res.status(500).json({
      success: false,
      error: errorInfo.userMessage,
      details: errorInfo.technicalMessage,
      errorType: errorInfo.errorType,
      suggestion: errorInfo.suggestion,
    });
  }
}

export async function deleteFile(req, res) {
  try {
    const { fileId } = req.params;
    const { projectId, category } = req.query;

    if (!fileId) {
      return res.status(400).json({
        success: false,
        error: 'File ID is required',
      });
    }

    await drive.files.delete({
      fileId,
    });

    if (projectId && category) {
      fileListCache.delete(`${projectId}_${category}`);
    }

    res.json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    const errorInfo = logDriveError(error, 'deleteFile', {
      fileId,
      projectId,
      category,
    });
    res.status(500).json({
      success: false,
      error: errorInfo.userMessage,
      details: errorInfo.technicalMessage,
      errorType: errorInfo.errorType,
      suggestion: errorInfo.suggestion,
    });
  }
}

export async function getFileMetadata(req, res) {
  try {
    const { fileId } = req.params;

    const response = await drive.files.get({
      fileId,
      fields: 'id, name, mimeType, size, createdTime, modifiedTime, thumbnailLink, webViewLink, webContentLink',
    });

    res.json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    const errorInfo = logDriveError(error, 'getFileMetadata', {
      fileId,
    });
    res.status(500).json({
      success: false,
      error: errorInfo.userMessage,
      details: errorInfo.technicalMessage,
      errorType: errorInfo.errorType,
      suggestion: errorInfo.suggestion,
    });
  }
}
