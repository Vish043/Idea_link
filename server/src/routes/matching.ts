import express, { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { Idea } from '../models/Idea';
import { authMiddleware } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { validateObjectId } from '../utils/validation';
import { getRecommendedCollaborators, getRecommendedIdeas } from '../utils/matching';

const router = express.Router();

// GET /api/matching/idea/:ideaId/collaborators - Get recommended collaborators for an idea
// Query params: minScore (optional) - Minimum match score threshold (0-1)
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

      // Optional filtering: minimum match score (0-1)
      const minScore = req.query.minScore ? parseFloat(req.query.minScore as string) : 0;
      if (isNaN(minScore) || minScore < 0 || minScore > 1) {
        throw createError('Invalid minScore parameter. Must be between 0 and 1', 400);
      }

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
      let recommendations = await getRecommendedCollaborators(idea, allUsers, 20);

      // Filtered Results: Only show relevant matches above threshold
      if (minScore > 0) {
        recommendations = recommendations.filter((r) => r.score >= minScore);
      }

      res.json({
        success: true,
        totalCount: recommendations.length,
        filtered: minScore > 0,
        minScore: minScore > 0 ? minScore : undefined,
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
            totalRatings: r.user.totalRatings,
            trustBadges: r.user.trustBadges,
            completedCollaborations: r.user.completedCollaborations,
          },
          matchScore: r.score,
          reasons: r.reasons,
          breakdown: r.breakdown, // Transparent scoring breakdown
        })),
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/matching/user/ideas - Get recommended ideas for current user
// Query params: minScore (optional) - Minimum match score threshold (0-1)
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

      // Optional filtering: minimum match score (0-1)
      const minScore = req.query.minScore ? parseFloat(req.query.minScore as string) : 0;
      if (isNaN(minScore) || minScore < 0 || minScore > 1) {
        throw createError('Invalid minScore parameter. Must be between 0 and 1', 400);
      }

      // Get all ideas looking for collaborators
      const allIdeas = await Idea.find({ status: 'looking_for_collaborators' })
        .populate('owner', 'name avatarUrl')
        .populate('collaborators', 'name');

      // Get recommendations
      let recommendations = await getRecommendedIdeas(user, allIdeas, 20);

      // Filtered Results: Only show relevant matches above threshold
      if (minScore > 0) {
        recommendations = recommendations.filter((idea) => idea.matchScore >= minScore);
      }

      res.json({
        success: true,
        totalCount: recommendations.length,
        filtered: minScore > 0,
        minScore: minScore > 0 ? minScore : undefined,
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
          breakdown: idea.breakdown, // Transparent scoring breakdown
          createdAt: idea.createdAt,
        })),
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

