import express, { Request, Response, NextFunction } from 'express';
import { CollaborationRequest } from '../models/CollaborationRequest';
import { Idea } from '../models/Idea';
import { authMiddleware } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { validateObjectId } from '../utils/validation';
import { singleResumeUpload } from '../middleware/upload';
import { uploadFile } from '../utils/storage';

const router = express.Router();

// POST /api/collab-requests
router.post('/', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  singleResumeUpload(req, res, async (err: any) => {
    try {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(createError('File size exceeds 5MB limit', 400));
        }
        return next(err);
      }

      if (!req.user) {
        throw createError('User not found', 404);
      }

      // Parse form data (multer handles file, body parser handles JSON)
      const { ideaId, message } = req.body;
      
      // Upload file if provided (cloud or local based on configuration)
      let resumeUrl = '';
      if (req.file) {
        try {
          resumeUrl = await uploadFile(req.file);
        } catch (error: any) {
          return next(createError(error.message || 'Failed to upload resume', 500));
        }
      }

      if (!ideaId || !message) {
        throw createError('Idea ID and message are required', 400);
      }

      validateObjectId(ideaId, 'Idea ID');

      // Check if idea exists
      const idea = await Idea.findById(ideaId);
      if (!idea) {
        throw createError('Idea not found', 404);
      }

      // Check if user is the owner
      if (idea.owner.toString() === req.user._id.toString()) {
        throw createError('Cannot send collaboration request to your own idea', 400);
      }

      // Check if already a collaborator
      if (idea.collaborators.some((id) => id.toString() === req.user!._id.toString())) {
        throw createError('You are already a collaborator on this idea', 400);
      }

      // Check if request already exists
      const existingRequest = await CollaborationRequest.findOne({
        idea: ideaId,
        sender: req.user._id,
        status: 'pending',
      });

      if (existingRequest) {
        throw createError('You already have a pending request for this idea', 409);
      }

      const collabRequest = new CollaborationRequest({
        idea: ideaId,
        sender: req.user._id,
        message,
        resumeUrl: resumeUrl || '',
        status: 'pending',
      });

    await collabRequest.save();
      await collabRequest.populate('idea', 'title owner');
      await collabRequest.populate('sender', 'name email avatarUrl');

      res.status(201).json(collabRequest);
    } catch (error) {
      next(error);
    }
  });
});

// GET /api/collab-requests/mine
router.get('/mine', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw createError('User not found', 404);
    }

    // Get ideas owned by user
    const myIdeas = await Idea.find({ owner: req.user._id }).select('_id');

    const ideaIds = myIdeas.map((idea) => idea._id);

    const requests = await CollaborationRequest.find({
      idea: { $in: ideaIds },
    })
      .populate('idea', 'title shortSummary')
      .populate('sender', 'name email avatarUrl skills interests')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/collab-requests/:id
router.patch('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw createError('User not found', 404);
    }

    const { id } = req.params;
    validateObjectId(id, 'Request ID');

    const { status } = req.body;

    if (!status || !['accepted', 'rejected'].includes(status)) {
      throw createError('Status must be "accepted" or "rejected"', 400);
    }

    const collabRequest = await CollaborationRequest.findById(id).populate('idea');

    if (!collabRequest) {
      throw createError('Collaboration request not found', 404);
    }

    const idea = collabRequest.idea as any;

    // Check if user is the owner of the idea
    if (idea.owner.toString() !== req.user._id.toString()) {
      throw createError('Only the idea owner can accept/reject requests', 403);
    }

    // Check if request is already processed
    if (collabRequest.status !== 'pending') {
      throw createError('Request has already been processed', 400);
    }

    // Update request status
    collabRequest.status = status;
    await collabRequest.save();

    // If accepted, add sender to idea collaborators
    if (status === 'accepted') {
      const ideaDoc = await Idea.findById(idea._id);
      if (ideaDoc) {
        const senderId = collabRequest.sender.toString();
        if (!ideaDoc.collaborators.some((id) => id.toString() === senderId)) {
          ideaDoc.collaborators.push(collabRequest.sender);
          await ideaDoc.save();
        }
      }
    }

    await collabRequest.populate('idea', 'title shortSummary');
    await collabRequest.populate('sender', 'name email avatarUrl');

    res.json(collabRequest);
  } catch (error) {
    next(error);
  }
});

export default router;

