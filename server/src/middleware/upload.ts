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
const ideasDir = path.join(process.cwd(), 'uploads', 'ideas');
if (!fs.existsSync(resumesDir)) {
  fs.mkdirSync(resumesDir, { recursive: true });
}
if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
}
if (!fs.existsSync(ideasDir)) {
  fs.mkdirSync(ideasDir, { recursive: true });
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

// File filter for idea images - only allow image files
const ideaImageFileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
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

// File filter for idea videos - only allow video files
const ideaVideoFileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo',
    'video/webm',
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(createError('Only MP4, MPEG, MOV, AVI, and WebM videos are allowed', 400) as any);
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

// Configure multer for idea images
export const uploadIdeaImages = multer({
  storage,
  fileFilter: ideaImageFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for images
  },
});

// Configure multer for idea videos
export const uploadIdeaVideos = multer({
  storage,
  fileFilter: ideaVideoFileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for videos
  },
});

// Middleware to handle single file uploads
export const singleResumeUpload = uploadResume.single('resume');
export const singleAvatarUpload = uploadAvatar.single('avatar');

// Middleware to handle multiple file uploads for ideas
export const multipleIdeaImagesUpload = uploadIdeaImages.array('images', 10); // Max 10 images
export const multipleIdeaVideosUpload = uploadIdeaVideos.array('videos', 5); // Max 5 videos

// Combined middleware for idea media uploads (handles both images and videos)
export const ideaMediaUpload = (req: any, res: any, next: any) => {
  // Use fields to handle both images and videos
  const uploadFields = multer({
    storage,
    fileFilter: (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
      const isImage = file.mimetype.startsWith('image/');
      const isVideo = file.mimetype.startsWith('video/');
      
      if (isImage) {
        return ideaImageFileFilter(req, file, cb);
      } else if (isVideo) {
        return ideaVideoFileFilter(req, file, cb);
      } else {
        cb(createError('Only images and videos are allowed', 400) as any);
      }
    },
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB limit
    },
  }).fields([
    { name: 'images', maxCount: 10 },
    { name: 'videos', maxCount: 5 },
  ]);
  
  uploadFields(req, res, next);
};

