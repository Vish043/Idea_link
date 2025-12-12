import express, { Request, Response, NextFunction } from 'express';
import { Idea } from '../models/Idea';
import { NdaAgreement } from '../models/NdaAgreement';
import { authMiddleware, verifyToken } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { validateObjectId } from '../utils/validation';
import { generateIdeaHash, createVersionEntry, generateIPCertificate } from '../utils/ipProtection';
import { ideaMediaUpload } from '../middleware/upload';
import { uploadFile } from '../utils/storage';
import { updateTrustBadges } from '../utils/trustBadges';

const router = express.Router();

// POST /api/ideas
router.post('/', authMiddleware, ideaMediaUpload, async (req: Request, res: Response, next: NextFunction) => {
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

    const now = new Date();
    
    // Generate IP protection hash
    const ideaHash = generateIdeaHash(title, description, req.user._id.toString(), now);

    // Handle image uploads
    const imageUrls: string[] = [];
    if (req.files && typeof req.files === 'object' && 'images' in req.files && Array.isArray(req.files.images)) {
      for (const file of req.files.images) {
        try {
          const url = await uploadFile(file, 'ideas');
          imageUrls.push(url);
        } catch (error: any) {
          return next(createError(`Failed to upload image: ${error.message}`, 500));
        }
      }
    }

    // Handle video uploads
    const videoUrls: string[] = [];
    if (req.files && typeof req.files === 'object' && 'videos' in req.files && Array.isArray(req.files.videos)) {
      for (const file of req.files.videos) {
        try {
          const url = await uploadFile(file, 'ideas');
          videoUrls.push(url);
        } catch (error: any) {
          return next(createError(`Failed to upload video: ${error.message}`, 500));
        }
      }
    }

    const idea = new Idea({
      owner: req.user._id,
      title,
      shortSummary,
      description,
      tags: tags || [],
      requiredSkills: requiredSkills || [],
      images: imageUrls,
      videos: videoUrls,
      visibility: visibility || 'public',
      status: status || 'looking_for_collaborators',
      ideaHash,
      versionHistory: [
        createVersionEntry(description, req.user._id.toString(), 1),
      ],
    });

    await idea.save();
    await idea.populate('owner', 'name email avatarUrl reputationScore averageRating totalRatings trustBadges completedCollaborations responseRate emailVerified');
    await idea.populate('versionHistory.changedBy', 'name email');

    // Update trust badges for idea creator
    await updateTrustBadges(req.user._id.toString());

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
      .populate('owner', 'name email avatarUrl reputationScore averageRating totalRatings trustBadges completedCollaborations responseRate emailVerified')
      .populate('collaborators', 'name email avatarUrl reputationScore averageRating totalRatings trustBadges completedCollaborations responseRate emailVerified')
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
      .populate('collaborators', 'name email avatarUrl')
      .populate('versionHistory.changedBy', 'name email');

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
router.put('/:id', authMiddleware, ideaMediaUpload, async (req: Request, res: Response, next: NextFunction) => {
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

    // Check if idea is locked
    if (idea.locked) {
      throw createError('This idea is locked and cannot be edited', 403);
    }

    const { title, shortSummary, description, tags, requiredSkills, visibility, status } = req.body;

    if (visibility && !['public', 'summary_with_protected_details'].includes(visibility)) {
      throw createError('Invalid visibility value', 400);
    }

    if (status && !['looking_for_collaborators', 'in_progress', 'completed'].includes(status)) {
      throw createError('Invalid status value', 400);
    }

    // Handle image uploads - append new images to existing ones
    let imageUrls: string[] = idea.images ? [...idea.images] : [];
    if (req.files && typeof req.files === 'object' && 'images' in req.files && Array.isArray(req.files.images)) {
      for (const file of req.files.images) {
        try {
          const url = await uploadFile(file, 'ideas');
          imageUrls.push(url);
        } catch (error: any) {
          return next(createError(`Failed to upload image: ${error.message}`, 500));
        }
      }
    }

    // Handle video uploads - append new videos to existing ones
    let videoUrls: string[] = idea.videos ? [...idea.videos] : [];
    if (req.files && typeof req.files === 'object' && 'videos' in req.files && Array.isArray(req.files.videos)) {
      for (const file of req.files.videos) {
        try {
          const url = await uploadFile(file, 'ideas');
          videoUrls.push(url);
        } catch (error: any) {
          return next(createError(`Failed to upload video: ${error.message}`, 500));
        }
      }
    }

    // Update version history if description changed
    const updateData: any = {
      ...(title && { title }),
      ...(shortSummary && { shortSummary }),
      ...(description && { description }),
      ...(tags !== undefined && { tags }),
      ...(requiredSkills !== undefined && { requiredSkills }),
      ...(visibility && { visibility }),
      ...(status && { status }),
      images: imageUrls,
      videos: videoUrls,
    };

    // If description changed, add new version entry
    if (description && description !== idea.description) {
      const versionHistory = idea.versionHistory || [];
      let newVersionNumber = 1;
      
      if (versionHistory.length > 0) {
        const versions = versionHistory
          .map((v: any) => typeof v.version === 'number' ? v.version : 0)
          .filter((v: number) => !isNaN(v) && v > 0);
        
        if (versions.length > 0) {
          newVersionNumber = Math.max(...versions) + 1;
        }
      }
      
      updateData.versionHistory = [
        ...versionHistory,
        createVersionEntry(description, req.user._id.toString(), newVersionNumber),
      ];
    }

    const updatedIdea = await Idea.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('owner', 'name email avatarUrl reputationScore averageRating totalRatings trustBadges completedCollaborations responseRate emailVerified')
      .populate('collaborators', 'name email avatarUrl reputationScore averageRating totalRatings trustBadges completedCollaborations responseRate emailVerified')
      .populate('versionHistory.changedBy', 'name email');

    res.json(updatedIdea);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/ideas/:id
router.delete('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
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
      throw createError('Only the owner can delete this idea', 403);
    }

    await Idea.findByIdAndDelete(id);

    res.json({ message: 'Idea deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/ideas/:id/lock - Lock or unlock an idea
router.patch('/:id/lock', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw createError('User not found', 404);
    }

    const { id } = req.params;
    validateObjectId(id, 'Idea ID');

    const { locked } = req.body;

    if (typeof locked !== 'boolean') {
      throw createError('locked field must be a boolean', 400);
    }

    const idea = await Idea.findById(id);
    if (!idea) {
      throw createError('Idea not found', 404);
    }

    // Check ownership
    if (idea.owner.toString() !== req.user._id.toString()) {
      throw createError('Only the owner can lock/unlock this idea', 403);
    }

    idea.locked = locked;
    await idea.save();

    res.json({
      message: `Idea ${locked ? 'locked' : 'unlocked'} successfully`,
      locked: idea.locked,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/ideas/:id/certificate
router.get('/:id/certificate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    validateObjectId(id, 'Idea ID');

    const idea = await Idea.findById(id)
      .populate('owner', 'name email');

    if (!idea) {
      throw createError('Idea not found', 404);
    }

    const certificate = generateIPCertificate({
      title: idea.title,
      ideaHash: idea.ideaHash,
      createdAt: idea.createdAt,
      owner: {
        name: (idea.owner as any).name || 'Unknown',
        email: (idea.owner as any).email || 'Unknown',
      },
    });

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="idea-certificate-${idea._id}.txt"`);
    res.send(certificate);
  } catch (error) {
    next(error);
  }
});

export default router;

