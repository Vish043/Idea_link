import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: 'student' | 'founder' | 'professional' | 'other';
  skills: string[];
  interests: string[];
  bio: string;
  avatarUrl: string;
  resumeUrl: string;
  // Trust & Reputation System
  reputationScore: number;
  totalRatings: number;
  averageRating: number;
  verified: boolean;
  trustBadges: string[];
  completedCollaborations: number;
  collaborationRequestsReceived: number;
  collaborationRequestsResponded: number;
  responseRate: number;
  // IP Protection
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['student', 'founder', 'professional', 'other'],
      default: 'other',
    },
    skills: {
      type: [String],
      default: [],
    },
    interests: {
      type: [String],
      default: [],
    },
    bio: {
      type: String,
      default: '',
    },
    avatarUrl: {
      type: String,
      default: '',
    },
    resumeUrl: {
      type: String,
      default: '',
    },
    // Trust & Reputation System
    reputationScore: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalRatings: {
      type: Number,
      default: 0,
      min: 0,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    trustBadges: {
      type: [String],
      default: [],
      enum: ['email_verified', 'resume_uploaded', 'active_collaborator', 'idea_creator', 'top_rated'],
    },
    completedCollaborations: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Response rate tracking for collaboration requests
    collaborationRequestsReceived: {
      type: Number,
      default: 0,
      min: 0,
    },
    collaborationRequestsResponded: {
      type: Number,
      default: 0,
      min: 0,
    },
    responseRate: {
      type: Number,
      default: 100, // Default to 100% (no requests = perfect response)
      min: 0,
      max: 100,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model<IUser>('User', UserSchema);

