import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from '../models/User';
import { Idea } from '../models/Idea';
import { connectDatabase } from '../config/database';

dotenv.config();

const seedDatabase = async () => {
  try {
    // Connect to database
    await connectDatabase();

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Idea.deleteMany({});
    console.log('✅ Existing data cleared');

    // Create demo users
    console.log('👤 Creating demo users...');
    
    const passwordHash1 = await bcrypt.hash('demo123', 10);
    const user1 = new User({
      name: 'Alice Johnson',
      email: 'alice@demo.com',
      passwordHash: passwordHash1,
      role: 'founder',
      skills: ['Product Management', 'UI/UX Design', 'Marketing'],
      interests: ['SaaS', 'AI', 'Healthcare'],
      bio: 'Passionate entrepreneur with 5+ years of experience building SaaS products. Looking for technical co-founders.',
      avatarUrl: '',
    });
    await user1.save();
    console.log(`✅ Created user: ${user1.email}`);

    const passwordHash2 = await bcrypt.hash('demo123', 10);
    const user2 = new User({
      name: 'Bob Smith',
      email: 'bob@demo.com',
      passwordHash: passwordHash2,
      role: 'professional',
      skills: ['Full-Stack Development', 'Node.js', 'React', 'MongoDB'],
      interests: ['Web Development', 'Open Source', 'Startups'],
      bio: 'Full-stack developer with expertise in modern web technologies. Open to collaborating on innovative projects.',
      avatarUrl: '',
    });
    await user2.save();
    console.log(`✅ Created user: ${user2.email}`);

    // Sample ideas removed - users can create their own ideas through the platform

    console.log('\n🎉 Seed data created successfully!');
    console.log('\n📝 Demo Accounts:');
    console.log('   User 1: alice@demo.com / demo123');
    console.log('   User 2: bob@demo.com / demo123');
    console.log('\n💡 Demo users created. You can now create ideas through the platform.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();

