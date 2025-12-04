import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { authMiddleware } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { singleResumeUpload, singleAvatarUpload } from '../middleware/upload';
import { uploadFile } from '../utils/storage';

const router = express.Router();

// POST /api/uploads/resume - Upload a resume file (keep singular for consistency with frontend)
router.post('/resume', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  singleResumeUpload(req, res, async (err: any) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(createError('File size exceeds 5MB limit', 400));
      }
      return next(err);
    }

    if (!req.file) {
      return next(createError('No file uploaded', 400));
    }

    try {
      // Upload file (cloud or local based on configuration)
      const fileUrl = await uploadFile(req.file, 'resumes');
      
      res.json({
        success: true,
        fileUrl,
        filename: req.file.originalname,
      });
    } catch (error: any) {
      next(createError(error.message || 'Failed to upload file', 500));
    }
  });
});

// POST /api/uploads/avatar - Upload an avatar image
router.post('/avatar', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  singleAvatarUpload(req, res, async (err: any) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(createError('File size exceeds 2MB limit', 400));
      }
      return next(err);
    }

    if (!req.file) {
      return next(createError('No file uploaded', 400));
    }

    try {
      // Upload file (cloud or local based on configuration)
      const fileUrl = await uploadFile(req.file, 'avatars');
      
      res.json({
        success: true,
        fileUrl,
        filename: req.file.originalname,
      });
    } catch (error: any) {
      next(createError(error.message || 'Failed to upload file', 500));
    }
  });
});

// Shared handler function for serving resume files
const serveResumeFile = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(process.cwd(), 'uploads', 'resumes', filename);

    // Security: Check if file exists and is within uploads directory
    if (!fs.existsSync(filePath)) {
      throw createError('File not found', 404);
    }

    // Check if path is within uploads directory (prevent directory traversal)
    const resolvedPath = path.resolve(filePath);
    const uploadsDir = path.resolve(path.join(process.cwd(), 'uploads', 'resumes'));
    if (!resolvedPath.startsWith(uploadsDir)) {
      throw createError('Invalid file path', 403);
    }

    // Set appropriate headers
    const ext = path.extname(filename).toLowerCase();
    const contentType =
      ext === '.pdf'
        ? 'application/pdf'
        : ext === '.doc'
        ? 'application/msword'
        : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    // Get file stats for Content-Length header
    const stats = fs.statSync(filePath);
    
    // Set headers to display PDF inline in browser
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    
    // For PDFs, use inline without filename to prevent download
    // For other files, include filename for proper download
    if (ext === '.pdf') {
      res.setHeader('Content-Disposition', 'inline');
      res.setHeader('X-Content-Type-Options', 'nosniff');
    } else {
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(filename)}"`);
    }

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    next(error);
  }
};

// GET /api/uploads/resume/:filename - Download/view a resume file (singular, for backward compatibility)
router.get('/resume/:filename', authMiddleware, serveResumeFile);

// GET /api/uploads/resumes/:filename - Download/view a resume file (plural, matches folder structure)
router.get('/resumes/:filename', authMiddleware, serveResumeFile);

// GET /api/uploads/avatar/:filename - View an avatar image
router.get('/avatar/:filename', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(process.cwd(), 'uploads', 'avatars', filename);

    // Security: Check if file exists and is within uploads directory
    if (!fs.existsSync(filePath)) {
      throw createError('File not found', 404);
    }

    // Check if path is within uploads directory (prevent directory traversal)
    const resolvedPath = path.resolve(filePath);
    const uploadsDir = path.resolve(path.join(process.cwd(), 'uploads', 'avatars'));
    if (!resolvedPath.startsWith(uploadsDir)) {
      throw createError('Invalid file path', 403);
    }

    // Set appropriate headers for images
    const ext = path.extname(filename).toLowerCase();
    const contentType =
      ext === '.jpg' || ext === '.jpeg'
        ? 'image/jpeg'
        : ext === '.png'
        ? 'image/png'
        : ext === '.gif'
        ? 'image/gif'
        : ext === '.webp'
        ? 'image/webp'
        : 'image/jpeg';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    next(error);
  }
});

export default router;

