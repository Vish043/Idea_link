import mongoose, { Schema, Document, Types } from 'mongoose';

export interface INdaAgreement extends Document {
  user: Types.ObjectId;
  idea: Types.ObjectId;
  agreedAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
}

const NdaAgreementSchema = new Schema<INdaAgreement>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    idea: {
      type: Schema.Types.ObjectId,
      ref: 'Idea',
      required: true,
    },
    agreedAt: {
      type: Date,
      default: Date.now,
    },
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: false,
  }
);

// Ensure one agreement per user-idea pair
NdaAgreementSchema.index({ user: 1, idea: 1 }, { unique: true });

export const NdaAgreement = mongoose.model<INdaAgreement>(
  'NdaAgreement',
  NdaAgreementSchema
);

