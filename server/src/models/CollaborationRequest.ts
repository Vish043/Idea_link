import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICollaborationRequest extends Document {
  idea: Types.ObjectId;
  sender: Types.ObjectId;
  message: string;
  resumeUrl?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const CollaborationRequestSchema = new Schema<ICollaborationRequest>(
  {
    idea: {
      type: Schema.Types.ObjectId,
      ref: 'Idea',
      required: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    resumeUrl: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
CollaborationRequestSchema.index({ idea: 1, sender: 1 });

export const CollaborationRequest = mongoose.model<ICollaborationRequest>(
  'CollaborationRequest',
  CollaborationRequestSchema
);

