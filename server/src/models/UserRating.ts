import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IUserRating extends Document {
  ratedUser: Types.ObjectId; // User being rated
  ratingUser: Types.ObjectId; // User giving the rating
  collaborationId?: Types.ObjectId; // Related collaboration/idea
  rating: number; // 1-5 stars
  comment?: string;
  categories: {
    communication: number;
    reliability: number;
    skill: number;
    professionalism: number;
  };
  createdAt: Date;
}

const UserRatingSchema = new Schema<IUserRating>(
  {
    ratedUser: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    ratingUser: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    collaborationId: {
      type: Schema.Types.ObjectId,
      ref: 'Idea',
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
    },
    categories: {
      communication: { type: Number, min: 1, max: 5, default: 0 },
      reliability: { type: Number, min: 1, max: 5, default: 0 },
      skill: { type: Number, min: 1, max: 5, default: 0 },
      professionalism: { type: Number, min: 1, max: 5, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate ratings for same collaboration
UserRatingSchema.index({ ratedUser: 1, ratingUser: 1, collaborationId: 1 }, { unique: true });

export const UserRating = mongoose.model<IUserRating>('UserRating', UserRatingSchema);

