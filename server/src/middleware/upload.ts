import multer from 'multer';
import { createError } from './errorHandler';
import path from 'path';
import fs from 'fs';

// Use memory storage for flexibility (works with both local and cloud storage)
// Files will be stored in memory and then either saved locally or uploaded to cloud
const storage = multer.memoryStorage();

// Ensure uploads directories exist for local storage fallback
const resumesDir = path.join(process.cwd(), 'uploads', 'resumes');
const avatarsDir = path.join(process.cwd(), 'uploads', 'avatars');
if (!fs.existsSync(resumesDir)) {
  fs.mkdirSync(resumesDir, { recursive: true });
}
if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
}

// File filter for resumes - only allow PDF, DOC, DOCX files
const resumeFileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(createError('Only PDF, DOC, and DOCX files are allowed', 400) as any);
  }
};

// File filter for avatars - only allow image files
const avatarFileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(createError('Only JPEG, PNG, GIF, and WebP images are allowed', 400) as any);
  }
};

// Configure multer for resumes
export const uploadResume = multer({
  storage,
  fileFilter: resumeFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Configure multer for avatars
export const uploadAvatar = multer({
  storage,
  fileFilter: avatarFileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit for images
  },
});

// Middleware to handle single file uploads
export const singleResumeUpload = uploadResume.single('resume');
export const singleAvatarUpload = uploadAvatar.single('avatar');

