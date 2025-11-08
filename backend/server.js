import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import driveRoutes from './routes/drive.js';
import { validateGoogleDriveConfig } from './utils/validateConfig.js';

dotenv.config();

let validationPassed = false;

const app = express();
const PORT = process.env.PORT || 3001;

const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(process.env.UPLOAD_RATE_LIMIT) || 10,
  message: 'Too many upload requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    googleDrive: {
      configured: validationPassed,
      folderIdSet: !!process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID,
      serviceAccountSet: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    },
  });
});

app.use('/api/drive', uploadLimiter, driveRoutes);

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

async function startServer() {
  try {
    if (process.env.NODE_ENV !== 'test') {
      await validateGoogleDriveConfig();
      validationPassed = true;
    }

    app.listen(PORT, () => {
      console.log(`Backend server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();

export default app;
