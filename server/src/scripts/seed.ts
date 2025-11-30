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

    // Create sample ideas
    console.log('💡 Creating sample ideas...');

    const idea1 = new Idea({
      owner: user1._id,
      title: 'AI-Powered Health Monitoring App',
      shortSummary: 'A mobile app that uses AI to monitor health metrics and provide personalized health insights.',
      description: 'This app will use machine learning algorithms to analyze user health data from wearables and provide actionable insights. Features include real-time monitoring, predictive health alerts, and integration with healthcare providers. We\'re looking for developers with experience in mobile app development, AI/ML, and healthcare APIs.',
      tags: ['AI', 'Healthcare', 'Mobile App', 'Machine Learning'],
      requiredSkills: ['Mobile Development', 'AI/ML', 'Healthcare APIs'],
      visibility: 'public',
      status: 'looking_for_collaborators',
      collaborators: [],
    });
    await idea1.save();
    console.log(`✅ Created idea: ${idea1.title}`);

    const idea2 = new Idea({
      owner: user1._id,
      title: 'Sustainable E-Commerce Platform',
      shortSummary: 'An e-commerce platform focused on sustainable and eco-friendly products with carbon footprint tracking.',
      description: 'This platform will connect eco-conscious consumers with sustainable product vendors. Key features include carbon footprint calculation for each purchase, sustainability ratings, and a marketplace for verified eco-friendly products. We need developers with experience in e-commerce platforms, payment processing, and sustainability metrics.',
      tags: ['E-Commerce', 'Sustainability', 'Green Tech'],
      requiredSkills: ['E-Commerce Development', 'Payment Integration', 'Backend Development'],
      visibility: 'summary_with_protected_details',
      status: 'looking_for_collaborators',
      collaborators: [],
    });
    await idea2.save();
    console.log(`✅ Created idea: ${idea2.title}`);

    const idea3 = new Idea({
      owner: user2._id,
      title: 'Open Source Learning Management System',
      shortSummary: 'A modern, open-source LMS designed for online education with interactive features.',
      description: 'This LMS will provide a comprehensive platform for online learning with features like video conferencing, interactive quizzes, progress tracking, and gamification. Built with modern web technologies and designed to be accessible and customizable. Looking for contributors with experience in education technology, video streaming, and open-source development.',
      tags: ['Education', 'Open Source', 'LMS', 'EdTech'],
      requiredSkills: ['Full-Stack Development', 'Video Streaming', 'Database Design'],
      visibility: 'public',
      status: 'in_progress',
      collaborators: [],
    });
    await idea3.save();
    console.log(`✅ Created idea: ${idea3.title}`);

    const idea4 = new Idea({
      owner: user1._id,
      title: 'Blockchain-Based Supply Chain Tracker',
      shortSummary: 'A transparent supply chain tracking system using blockchain technology.',
      description: 'This system will enable companies to track products through the entire supply chain with immutable blockchain records. Features include real-time tracking, authenticity verification, and transparency reports. We need blockchain developers, supply chain experts, and backend engineers.',
      tags: ['Blockchain', 'Supply Chain', 'Transparency'],
      requiredSkills: ['Blockchain Development', 'Smart Contracts', 'Supply Chain Knowledge'],
      visibility: 'summary_with_protected_details',
      status: 'looking_for_collaborators',
      collaborators: [],
    });
    await idea4.save();
    console.log(`✅ Created idea: ${idea4.title}`);

    const idea5 = new Idea({
      owner: user2._id,
      title: 'Community Gardening App',
      shortSummary: 'A mobile app connecting local gardeners to share resources, knowledge, and harvests.',
      description: 'This app will help local communities organize gardening activities, share tools and seeds, exchange knowledge, and coordinate harvest sharing. Features include location-based matching, resource sharing, event organization, and a knowledge base. Looking for mobile developers and community engagement experts.',
      tags: ['Community', 'Gardening', 'Mobile App', 'Social'],
      requiredSkills: ['Mobile Development', 'Location Services', 'Community Management'],
      visibility: 'public',
      status: 'completed',
      collaborators: [],
    });
    await idea5.save();
    console.log(`✅ Created idea: ${idea5.title}`);

    console.log('\n🎉 Seed data created successfully!');
    console.log('\n📝 Demo Accounts:');
    console.log('   User 1: alice@demo.com / demo123');
    console.log('   User 2: bob@demo.com / demo123');
    console.log('\n💡 Created 5 sample ideas with different statuses and visibility settings.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();

