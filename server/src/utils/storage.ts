/**
 * Storage utility that automatically uses cloud storage in production
 * and local storage in development
 */

import fs from 'fs';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

// Check if Cloudinary is configured
const isCloudinaryConfigured = 
  !!process.env.CLOUDINARY_CLOUD_NAME && 
  !!process.env.CLOUDINARY_API_KEY && 
  !!process.env.CLOUDINARY_API_SECRET;

// Use cloud storage only if Cloudinary is configured
// In production without Cloudinary, it will still use local storage (which won't persist)
// So Cloudinary should be configured for production deployments
export const USE_CLOUD_STORAGE = isCloudinaryConfigured;

// Initialize Cloudinary if configured
if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

/**
 * Upload file to storage (cloud or local based on configuration)
 */
export async function uploadFile(file: Express.Multer.File, folder: 'resumes' | 'avatars' = 'resumes'): Promise<string> {
  if (USE_CLOUD_STORAGE && isCloudinaryConfigured) {
    // Upload to Cloudinary
    return uploadToCloudinary(file, folder);
  } else {
    // Save to local filesystem
    return saveToLocal(file, folder);
  }
}

/**
 * Upload to Cloudinary
 */
async function uploadToCloudinary(file: Express.Multer.File, folder: 'resumes' | 'avatars' = 'resumes'): Promise<string> {
  return new Promise((resolve, reject) => {
    const isImage = file.mimetype.startsWith('image/');
    
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: isImage ? 'image' : 'raw', // Images vs documents
        folder: folder,
        allowed_formats: isImage 
          ? ['jpg', 'jpeg', 'png', 'gif', 'webp']
          : ['pdf', 'doc', 'docx'],
        transformation: isImage ? [
          { width: 400, height: 400, crop: 'fill', gravity: 'face' }, // Optimize avatar images
        ] : undefined,
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve(result.secure_url);
        } else {
          reject(new Error('Upload failed'));
        }
      }
    );

    const bufferStream = new Readable();
    bufferStream.push(file.buffer);
    bufferStream.push(null);
    bufferStream.pipe(uploadStream);
  });
}

/**
 * Save to local filesystem
 */
async function saveToLocal(file: Express.Multer.File, folder: 'resumes' | 'avatars' = 'resumes'): Promise<string> {
  const uploadsDir = path.join(process.cwd(), 'uploads', folder);
  
  // Ensure directory exists
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Generate unique filename
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const ext = path.extname(file.originalname);
  const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '-');
  const filename = `${name}-${uniqueSuffix}${ext}`;
  const filePath = path.join(uploadsDir, filename);

  // Write file
  fs.writeFileSync(filePath, file.buffer);

  // Return relative URL for local storage (without /api prefix)
  // Frontend will prepend the base URL which already includes /api
  // Static serving at /api/uploads serves from 'uploads' folder
  // So file at uploads/resumes/filename.pdf -> accessible at /api/uploads/resumes/filename.pdf
  return `/uploads/${folder}/${filename}`;
}

/**
 * Get file URL (handles both cloud and local URLs)
 */
export function getFileUrl(storedUrl: string): string {
  // If it's already a full URL (cloud storage), return as is
  if (storedUrl.startsWith('http://') || storedUrl.startsWith('https://')) {
    return storedUrl;
  }
  
  // If it's a relative URL (local storage), construct full URL
  const baseUrl = process.env.API_BASE_URL || process.env.VITE_API_URL || 'http://localhost:5000/api';
  return `${baseUrl}${storedUrl}`;
}

