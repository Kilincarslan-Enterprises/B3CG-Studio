import multer from 'multer';
import { validateFileType, validateFileSize } from '../utils/fileValidation.js';

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 5368709120;

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const category = req.body.category || req.query.category;

  if (!category) {
    return cb(new Error('File category is required'), false);
  }

  const typeValidation = validateFileType(file.mimetype, category);
  if (!typeValidation.valid) {
    return cb(new Error(typeValidation.error), false);
  }

  cb(null, true);
};

export const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter,
});

export function handleMulterError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024 * 1024)}GB`,
      });
    }
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }

  if (err) {
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }

  next();
}
