import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMessage extends Document {
  idea?: Types.ObjectId; // Optional for personal messages
  sender: Types.ObjectId;
  recipient?: Types.ObjectId; // For personal messages
  content: string;
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    idea: {
      type: Schema.Types.ObjectId,
      ref: 'Idea',
      required: false, // Not required for personal messages
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false, // For personal messages
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
MessageSchema.index({ sender: 1, recipient: 1, createdAt: -1 }); // For personal messages
MessageSchema.index({ recipient: 1, sender: 1, createdAt: -1 }); // For personal messages (reverse)

// Validation: either idea or recipient must be present
MessageSchema.pre('validate', function (next) {
  if (!this.idea && !this.recipient) {
    next(new Error('Either idea or recipient must be specified'));
  } else {
    next();
  }
});

export const Message = mongoose.model<IMessage>('Message', MessageSchema);

