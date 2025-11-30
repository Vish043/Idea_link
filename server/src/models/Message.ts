import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMessage extends Document {
  idea: Types.ObjectId;
  sender: Types.ObjectId;
  content: string;
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>(
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
    content: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Index for efficient queries
MessageSchema.index({ idea: 1, createdAt: -1 });

export const Message = mongoose.model<IMessage>('Message', MessageSchema);

