import express, { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { Task } from '../models/Task';
import { Idea } from '../models/Idea';
import { authMiddleware } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { validateObjectId } from '../utils/validation';

const router = express.Router();

// POST /api/tasks
router.post('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw createError('User not found', 404);
    }

    const { ideaId, title, description, assignee, dueDate } = req.body;

    if (!ideaId || !title) {
      throw createError('Idea ID and title are required', 400);
    }

    validateObjectId(ideaId, 'Idea ID');

    // Check if idea exists
    const idea = await Idea.findById(ideaId);
    if (!idea) {
      throw createError('Idea not found', 404);
    }

    // Check if user is owner or collaborator
    const userId = req.user._id.toString();
    const isOwner = idea.owner.toString() === userId;
    const isCollaborator = idea.collaborators.some(
      (id: Types.ObjectId) => id.toString() === userId
    );

    if (!isOwner && !isCollaborator) {
      throw createError('Only owners and collaborators can create tasks', 403);
    }

    // Validate assignee if provided
    if (assignee) {
      validateObjectId(assignee, 'Assignee ID');
      // Check if assignee is owner or collaborator
      const assigneeIsOwner = idea.owner.toString() === assignee;
      const assigneeIsCollaborator = idea.collaborators.some(
        (id: Types.ObjectId) => id.toString() === assignee
      );
      if (!assigneeIsOwner && !assigneeIsCollaborator) {
        throw createError('Assignee must be the owner or a collaborator', 400);
      }
    }

    const task = new Task({
      idea: ideaId,
      title,
      description: description || '',
      assignee: assignee || null,
      status: 'todo',
      dueDate: dueDate || null,
    });

    await task.save();
    await task.populate('idea', 'title');
    await task.populate('assignee', 'name email avatarUrl');

    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
});

// GET /api/tasks
router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw createError('User not found', 404);
    }

    const { ideaId } = req.query;

    if (!ideaId) {
      throw createError('Idea ID is required', 400);
    }

    validateObjectId(ideaId as string, 'Idea ID');

    // Check if idea exists and user has access
    const idea = await Idea.findById(ideaId);
    if (!idea) {
      throw createError('Idea not found', 404);
    }

    const userId = req.user._id.toString();
    const isOwner = idea.owner.toString() === userId;
    const isCollaborator = idea.collaborators.some(
      (id: Types.ObjectId) => id.toString() === userId
    );

    if (!isOwner && !isCollaborator) {
      throw createError('Only owners and collaborators can view tasks', 403);
    }

    const tasks = await Task.find({ idea: ideaId })
      .populate('assignee', 'name email avatarUrl')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/tasks/:id
router.patch('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw createError('User not found', 404);
    }

    const { id } = req.params;
    validateObjectId(id, 'Task ID');

    const { title, description, assignee, status, dueDate } = req.body;

    const task = await Task.findById(id).populate('idea');
    if (!task) {
      throw createError('Task not found', 404);
    }

    const idea = task.idea as any;

    // Check if user is owner or collaborator
    const userId = req.user._id.toString();
    const isOwner = idea.owner.toString() === userId;
    const isCollaborator = idea.collaborators.some(
      (id: Types.ObjectId) => id.toString() === userId
    );

    if (!isOwner && !isCollaborator) {
      throw createError('Only owners and collaborators can update tasks', 403);
    }

    // Validate status if provided
    if (status && !['todo', 'in_progress', 'done'].includes(status)) {
      throw createError('Invalid status value', 400);
    }

    // Validate assignee if provided
    if (assignee) {
      validateObjectId(assignee, 'Assignee ID');
      const assigneeIsOwner = idea.owner.toString() === assignee;
      const assigneeIsCollaborator = idea.collaborators.some(
        (id: Types.ObjectId) => id.toString() === assignee
      );
      if (!assigneeIsOwner && !assigneeIsCollaborator) {
        throw createError('Assignee must be the owner or a collaborator', 400);
      }
    }

    const updatedTask = await Task.findByIdAndUpdate(
      id,
      {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(assignee !== undefined && { assignee }),
        ...(status && { status }),
        ...(dueDate !== undefined && { dueDate }),
      },
      { new: true, runValidators: true }
    )
      .populate('idea', 'title')
      .populate('assignee', 'name email avatarUrl');

    res.json(updatedTask);
  } catch (error) {
    next(error);
  }
});

export default router;

