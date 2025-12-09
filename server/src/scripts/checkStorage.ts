/**
 * Diagnostic script to check which storage method is configured
 */
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

console.log('\n📦 Storage Configuration Check\n');
console.log('='.repeat(50));

// Check Cloudinary configuration
const isCloudinaryConfigured = !!(cloudName && apiKey && apiSecret);

if (isCloudinaryConfigured) {
  console.log('✅ CLOUDINARY (Cloud Storage) is CONFIGURED');
  console.log('\nStorage Location: Cloudinary Cloud Storage');
  console.log(`Cloud Name: ${cloudName}`);
  console.log(`API Key: ${apiKey ? '***' + apiKey.slice(-4) : 'NOT SET'}`);
  console.log(`API Secret: ${apiSecret ? '***' + apiSecret.slice(-4) : 'NOT SET'}`);
  console.log('\n📁 Files will be stored in:');
  console.log('   - Cloudinary cloud storage');
  console.log('   - Folder: ideas/');
  console.log('   - URL format: https://res.cloudinary.com/[cloud-name]/...');
} else {
  console.log('❌ CLOUDINARY is NOT CONFIGURED');
  console.log('\nStorage Location: Local Filesystem');
  console.log('\nMissing Environment Variables:');
  if (!cloudName) console.log('   ❌ CLOUDINARY_CLOUD_NAME');
  if (!apiKey) console.log('   ❌ CLOUDINARY_API_KEY');
  if (!apiSecret) console.log('   ❌ CLOUDINARY_API_SECRET');
  
  const uploadsDir = path.join(process.cwd(), 'uploads', 'ideas');
  const exists = fs.existsSync(uploadsDir);
  
  console.log('\n📁 Files will be stored in:');
  console.log(`   - Local path: ${uploadsDir}`);
  console.log(`   - Directory exists: ${exists ? '✅ Yes' : '❌ No (will be created on first upload)'}`);
  console.log(`   - Accessible via: /api/uploads/ideas/[filename]`);
}

console.log('\n' + '='.repeat(50));
console.log('\n💡 To use Cloudinary, add these to server/.env:');
console.log('   CLOUDINARY_CLOUD_NAME=your_cloud_name');
console.log('   CLOUDINARY_API_KEY=your_api_key');
console.log('   CLOUDINARY_API_SECRET=your_api_secret');
console.log('\n');
