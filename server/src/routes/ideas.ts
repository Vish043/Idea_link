import express, { Request, Response, NextFunction } from 'express';
import { Idea } from '../models/Idea';
import { NdaAgreement } from '../models/NdaAgreement';
import { authMiddleware, verifyToken } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { validateObjectId } from '../utils/validation';

const router = express.Router();

// POST /api/ideas
router.post('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw createError('User not found', 404);
    }

    const { title, shortSummary, description, tags, requiredSkills, visibility, status } = req.body;

    if (!title || !shortSummary || !description) {
      throw createError('Title, short summary, and description are required', 400);
    }

    if (visibility && !['public', 'summary_with_protected_details'].includes(visibility)) {
      throw createError('Invalid visibility value', 400);
    }

    if (status && !['looking_for_collaborators', 'in_progress', 'completed'].includes(status)) {
      throw createError('Invalid status value', 400);
    }

    const idea = new Idea({
      owner: req.user._id,
      title,
      shortSummary,
      description,
      tags: tags || [],
      requiredSkills: requiredSkills || [],
      visibility: visibility || 'public',
      status: status || 'looking_for_collaborators',
    });

    await idea.save();
    await idea.populate('owner', 'name email avatarUrl');

    res.status(201).json(idea);
  } catch (error) {
    next(error);
  }
});

// GET /api/ideas
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, tags, status, requiredSkills } = req.query;

    const query: any = {};

    // Search in title, shortSummary, description
    if (search && typeof search === 'string') {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { shortSummary: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Filter by tags
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      query.tags = { $in: tagArray };
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by required skills
    if (requiredSkills) {
      const skillsArray = Array.isArray(requiredSkills) ? requiredSkills : [requiredSkills];
      query.requiredSkills = { $in: skillsArray };
    }

    const ideas = await Idea.find(query)
      .populate('owner', 'name email avatarUrl')
      .populate('collaborators', 'name email avatarUrl')
      .sort({ createdAt: -1 });

    res.json(ideas);
  } catch (error) {
    next(error);
  }
});

// GET /api/ideas/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    validateObjectId(id, 'Idea ID');

    const idea = await Idea.findById(id)
      .populate('owner', 'name email avatarUrl')
      .populate('collaborators', 'name email avatarUrl');

    if (!idea) {
      throw createError('Idea not found', 404);
    }

    // Check if idea has protected details and user needs NDA
    if (idea.visibility === 'summary_with_protected_details') {
      // If user is authenticated, check for NDA
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const decoded = verifyToken(token);

        if (decoded) {
          const hasNda = await NdaAgreement.findOne({
            user: decoded.userId,
            idea: idea._id,
          });

          if (!hasNda) {
            // Return summary only
            return res.json({
              _id: idea._id,
              owner: idea.owner,
              title: idea.title,
              shortSummary: idea.shortSummary,
              tags: idea.tags,
              requiredSkills: idea.requiredSkills,
              visibility: idea.visibility,
              status: idea.status,
              collaborators: idea.collaborators,
              createdAt: idea.createdAt,
              updatedAt: idea.updatedAt,
              requiresNda: true,
            });
          }
        } else {
          // Invalid token, return summary only
          return res.json({
            _id: idea._id,
            owner: idea.owner,
            title: idea.title,
            shortSummary: idea.shortSummary,
            tags: idea.tags,
            requiredSkills: idea.requiredSkills,
            visibility: idea.visibility,
            status: idea.status,
            collaborators: idea.collaborators,
            createdAt: idea.createdAt,
            updatedAt: idea.updatedAt,
            requiresNda: true,
          });
        }
      } else {
        // No auth, return summary only
        return res.json({
          _id: idea._id,
          owner: idea.owner,
          title: idea.title,
          shortSummary: idea.shortSummary,
          tags: idea.tags,
          requiredSkills: idea.requiredSkills,
          visibility: idea.visibility,
          status: idea.status,
          collaborators: idea.collaborators,
          createdAt: idea.createdAt,
          updatedAt: idea.updatedAt,
          requiresNda: true,
        });
      }
    }

    // Return full idea
    res.json(idea);
  } catch (error) {
    next(error);
  }
});

// PUT /api/ideas/:id
router.put('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw createError('User not found', 404);
    }

    const { id } = req.params;
    validateObjectId(id, 'Idea ID');

    const idea = await Idea.findById(id);
    if (!idea) {
      throw createError('Idea not found', 404);
    }

    // Check ownership
    if (idea.owner.toString() !== req.user._id.toString()) {
      throw createError('Only the owner can update this idea', 403);
    }

    const { title, shortSummary, description, tags, requiredSkills, visibility, status } = req.body;

    if (visibility && !['public', 'summary_with_protected_details'].includes(visibility)) {
      throw createError('Invalid visibility value', 400);
    }

    if (status && !['looking_for_collaborators', 'in_progress', 'completed'].includes(status)) {
      throw createError('Invalid status value', 400);
    }

    const updatedIdea = await Idea.findByIdAndUpdate(
      id,
      {
        ...(title && { title }),
        ...(shortSummary && { shortSummary }),
        ...(description && { description }),
        ...(tags !== undefined && { tags }),
        ...(requiredSkills !== undefined && { requiredSkills }),
        ...(visibility && { visibility }),
        ...(status && { status }),
      },
      { new: true, runValidators: true }
    )
      .populate('owner', 'name email avatarUrl')
      .populate('collaborators', 'name email avatarUrl');

    res.json(updatedIdea);
  } catch (error) {
    next(error);
  }
});

export default router;

