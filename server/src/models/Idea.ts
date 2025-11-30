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
  },
  {
    timestamps: true,
  }
);

export const Idea = mongoose.model<IIdea>('Idea', IdeaSchema);

