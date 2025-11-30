import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITask extends Document {
  idea: Types.ObjectId;
  title: string;
  description: string;
  assignee: Types.ObjectId | null;
  status: 'todo' | 'in_progress' | 'done';
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    idea: {
      type: Schema.Types.ObjectId,
      ref: 'Idea',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    assignee: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'done'],
      default: 'todo',
    },
    dueDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
TaskSchema.index({ idea: 1 });

export const Task = mongoose.model<ITask>('Task', TaskSchema);

