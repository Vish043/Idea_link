import { v2 as cloudinary } from 'cloudinary';
import { createError } from './errorHandler';
import multer from 'multer';
import { Readable } from 'stream';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Memory storage for multer (we'll upload to Cloudinary)
const storage = multer.memoryStorage();

// File filter - only allow PDF, DOC, DOCX files
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
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

// Configure multer
export const uploadResume = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Middleware to handle single file upload
export const singleResumeUpload = uploadResume.single('resume');

// Upload file to Cloudinary
export const uploadToCloudinary = (file: Express.Multer.File): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      reject(new Error('Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.'));
      return;
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw', // For PDF/DOC files
        folder: 'resumes', // Organize files in a folder
        allowed_formats: ['pdf', 'doc', 'docx'],
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve(result.secure_url); // Return the public URL
        } else {
          reject(new Error('Upload failed'));
        }
      }
    );

    // Convert buffer to stream
    const bufferStream = new Readable();
    bufferStream.push(file.buffer);
    bufferStream.push(null);

    bufferStream.pipe(uploadStream);
  });
};

