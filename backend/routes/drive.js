import express from 'express';
import { body, param, query } from 'express-validator';
import {
  createProjectFolder,
  uploadFile,
  getProjectFiles,
  deleteFile,
  getFileMetadata,
} from '../controllers/driveController.js';
import { upload, handleMulterError } from '../middleware/upload.js';

const router = express.Router();

router.post(
  '/create-folder',
  [
    body('projectId').notEmpty().withMessage('Project ID is required'),
    body('projectTitle').notEmpty().withMessage('Project title is required'),
  ],
  createProjectFolder
);

router.post(
  '/upload',
  upload.single('file'),
  handleMulterError,
  [
    body('projectId').notEmpty().withMessage('Project ID is required'),
    body('category')
      .isIn(['raw', 'edited', 'thumbnails'])
      .withMessage('Invalid category'),
    body('folderId').notEmpty().withMessage('Folder ID is required'),
  ],
  uploadFile
);

router.get(
  '/files/:projectId',
  [
    param('projectId').notEmpty().withMessage('Project ID is required'),
    query('folderId').notEmpty().withMessage('Folder ID is required'),
    query('category')
      .isIn(['raw', 'edited', 'thumbnails'])
      .withMessage('Invalid category'),
  ],
  getProjectFiles
);

router.delete(
  '/file/:fileId',
  [param('fileId').notEmpty().withMessage('File ID is required')],
  deleteFile
);

router.get(
  '/file/:fileId/metadata',
  [param('fileId').notEmpty().withMessage('File ID is required')],
  getFileMetadata
);

export default router;
