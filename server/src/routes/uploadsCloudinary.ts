import express, { Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { singleResumeUpload, uploadToCloudinary } from '../middleware/uploadCloudinary';

const router = express.Router();

// POST /api/uploads/resume - Upload a resume file to Cloudinary
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
      // Upload to Cloudinary
      const fileUrl = await uploadToCloudinary(req.file);
      
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

export default router;

