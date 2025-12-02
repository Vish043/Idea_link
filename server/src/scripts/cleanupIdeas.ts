import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Idea } from '../models/Idea';
import { connectDatabase } from '../config/database';

dotenv.config();

const ideasToRemove = [
  'Community Gardening App',
  'Blockchain-Based Supply Chain Tracker',
  'AI-Powered Health Monitoring App',
  'Sustainable E-Commerce Platform',
  'Open Source Learning Management System',
];

const cleanupIdeas = async () => {
  try {
    // Connect to database
    await connectDatabase();

    console.log('🗑️  Removing specified ideas...');

    // Find and delete ideas by title
    const result = await Idea.deleteMany({
      title: { $in: ideasToRemove },
    });

    console.log(`✅ Removed ${result.deletedCount} idea(s)`);
    console.log(`📋 Ideas removed: ${ideasToRemove.join(', ')}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error cleaning up ideas:', error);
    process.exit(1);
  }
};

cleanupIdeas();

