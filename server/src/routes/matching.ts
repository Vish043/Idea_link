import express, { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { Idea } from '../models/Idea';
import { authMiddleware } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { validateObjectId } from '../utils/validation';
import { getRecommendedCollaborators, getRecommendedIdeas } from '../utils/matching';

const router = express.Router();

// GET /api/matching/idea/:ideaId/collaborators - Get recommended collaborators for an idea
router.get(
  '/idea/:ideaId/collaborators',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw createError('User not found', 404);
      }

      const { ideaId } = req.params;
      validateObjectId(ideaId, 'Idea ID');

      const idea = await Idea.findById(ideaId).populate('owner');
      if (!idea) {
        throw createError('Idea not found', 404);
      }

      // Check if user is the owner
      if (idea.owner._id.toString() !== req.user._id.toString()) {
        throw createError('Only idea owners can view recommendations', 403);
      }

      // Get all users
      const allUsers = await User.find({ _id: { $ne: req.user._id } });

      // Get recommendations
      const recommendations = await getRecommendedCollaborators(idea, allUsers, 20);

      res.json({
        success: true,
        recommendations: recommendations.map((r) => ({
          user: {
            _id: r.user._id,
            name: r.user.name,
            email: r.user.email,
            avatarUrl: r.user.avatarUrl,
            skills: r.user.skills,
            interests: r.user.interests,
            bio: r.user.bio,
            averageRating: r.user.averageRating,
            reputationScore: r.user.reputationScore,
            trustBadges: r.user.trustBadges,
            completedCollaborations: r.user.completedCollaborations,
          },
          matchScore: r.score,
          reasons: r.reasons,
        })),
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/matching/user/ideas - Get recommended ideas for current user
router.get(
  '/user/ideas',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw createError('User not found', 404);
      }

      const user = await User.findById(req.user._id);
      if (!user) {
        throw createError('User not found', 404);
      }

      // Get all ideas looking for collaborators
      const allIdeas = await Idea.find({ status: 'looking_for_collaborators' })
        .populate('owner', 'name avatarUrl')
        .populate('collaborators', 'name');

      // Get recommendations
      const recommendations = await getRecommendedIdeas(user, allIdeas, 20);

      res.json({
        success: true,
        recommendations: recommendations.map((idea) => ({
          _id: idea._id,
          title: idea.title,
          shortSummary: idea.shortSummary,
          tags: idea.tags,
          requiredSkills: idea.requiredSkills,
          status: idea.status,
          owner: idea.owner,
          collaborators: idea.collaborators,
          averageRating: idea.averageRating,
          matchScore: idea.matchScore,
          reasons: idea.reasons,
          createdAt: idea.createdAt,
        })),
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

