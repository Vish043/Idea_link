import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IIdea extends Document {
  owner: Types.ObjectId;
  title: string;
  shortSummary: string;
  description: string;
  tags: string[];
  requiredSkills: string[];
  visibility: 'public' | 'summary_with_protected_details';
  status: 'looking_for_collaborators' | 'in_progress' | 'completed';
  collaborators: Types.ObjectId[];
  // IP Protection & Trust
  ideaHash: string; // Cryptographic hash for IP proof
  versionHistory: Array<{
    version: number;
    content: string;
    timestamp: Date;
    changedBy: Types.ObjectId;
  }>;
  locked: boolean; // Lock idea from further edits
  // Rating & Feedback
  averageRating: number;
  totalRatings: number;
  ratings: Array<{
    userId: Types.ObjectId;
    rating: number;
    comment?: string;
    createdAt: Date;
  }>;
  // Matching & Discovery
  matchScore?: number; // For recommendation algorithm
  createdAt: Date;
  updatedAt: Date;
}

const IdeaSchema = new Schema<IIdea>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    shortSummary: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    requiredSkills: {
      type: [String],
      default: [],
    },
    visibility: {
      type: String,
      enum: ['public', 'summary_with_protected_details'],
      default: 'public',
    },
    status: {
      type: String,
      enum: ['looking_for_collaborators', 'in_progress', 'completed'],
      default: 'looking_for_collaborators',
    },
    collaborators: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
    // IP Protection & Trust
    ideaHash: {
      type: String,
      default: '',
    },
    versionHistory: {
      type: [
        {
          version: Number,
          content: String,
          timestamp: Date,
          changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        },
      ],
      default: [],
    },
    locked: {
      type: Boolean,
      default: false,
    },
    // Rating & Feedback
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalRatings: {
      type: Number,
      default: 0,
      min: 0,
    },
    ratings: {
      type: [
        {
          userId: { type: Schema.Types.ObjectId, ref: 'User' },
          rating: { type: Number, min: 1, max: 5 },
          comment: String,
          createdAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    // Matching & Discovery
    matchScore: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const Idea = mongoose.model<IIdea>('Idea', IdeaSchema);

