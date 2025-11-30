import express, { Request, Response, NextFunction } from 'express';
import { Message } from '../models/Message';
import { Idea } from '../models/Idea';
import { authMiddleware } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { validateObjectId } from '../utils/validation';

const router = express.Router();

// GET /api/messages
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

    const isOwner = idea.owner.toString() === req.user._id.toString();
    const isCollaborator = idea.collaborators.some(
      (id) => id.toString() === req.user._id.toString()
    );

    if (!isOwner && !isCollaborator) {
      throw createError('Only owners and collaborators can view messages', 403);
    }

    const messages = await Message.find({ idea: ideaId })
      .populate('sender', 'name email avatarUrl')
      .sort({ createdAt: 1 }); // Oldest first for chat

    res.json(messages);
  } catch (error) {
    next(error);
  }
});

export default router;

