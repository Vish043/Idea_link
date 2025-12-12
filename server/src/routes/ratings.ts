import express, { Request, Response, NextFunction } from 'express';
import { UserRating } from '../models/UserRating';
import { User } from '../models/User';
import { Idea } from '../models/Idea';
import { authMiddleware } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { validateObjectId } from '../utils/validation';
import { updateTrustBadges } from '../utils/trustBadges';

const router = express.Router();

// POST /api/ratings - Rate a user after collaboration
router.post('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw createError('User not found', 404);
    }

    const currentUser = req.user; // Store for TypeScript type narrowing

    const { ratedUserId, collaborationId, rating, comment, categories } = req.body;

    if (!ratedUserId || !rating) {
      throw createError('Rated user ID and rating are required', 400);
    }

    if (rating < 1 || rating > 5) {
      throw createError('Rating must be between 1 and 5', 400);
    }

    validateObjectId(ratedUserId, 'Rated user ID');
    if (collaborationId) {
      validateObjectId(collaborationId, 'Collaboration ID');
    }

    // Can't rate yourself
    if (ratedUserId === currentUser._id.toString()) {
      throw createError('Cannot rate yourself', 400);
    }

    // Check if user exists
    const ratedUser = await User.findById(ratedUserId);
    if (!ratedUser) {
      throw createError('User not found', 404);
    }

    // If collaborationId is provided, verify the collaboration exists and both users are involved
    if (collaborationId) {
      const idea = await Idea.findById(collaborationId);
      if (!idea) {
        throw createError('Collaboration idea not found', 404);
      }

      // Verify that both users are involved in the collaboration
      const isOwner = idea.owner.toString() === currentUser._id.toString();
      const isCollaborator = idea.collaborators.some(
        (id) => id.toString() === currentUser._id.toString()
      );
      const ratedUserIsOwner = idea.owner.toString() === ratedUserId;
      const ratedUserIsCollaborator = idea.collaborators.some(
        (id) => id.toString() === ratedUserId
      );

      // The rating user must be owner or collaborator, and the rated user must be the other party
      if (!((isOwner && (ratedUserIsCollaborator || ratedUserIsOwner)) || 
            (isCollaborator && ratedUserIsOwner))) {
        throw createError('You can only rate users you have collaborated with on this idea', 403);
      }
    }

    // Check for existing rating for this collaboration
    const existingRating = await UserRating.findOne({
      ratedUser: ratedUserId,
      ratingUser: currentUser._id,
      collaborationId: collaborationId || null,
    });

    if (existingRating) {
      throw createError('You have already rated this user for this collaboration', 400);
    }

    // Create rating
    const newRating = new UserRating({
      ratedUser: ratedUserId,
      ratingUser: currentUser._id,
      collaborationId: collaborationId || undefined,
      rating,
      comment: comment || undefined,
      categories: categories || {},
    });

    await newRating.save();

    // Update rated user's reputation
    await updateUserReputation(ratedUserId);

    res.json({
      success: true,
      rating: newRating,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/ratings/user/:userId - Get all ratings for a user
router.get('/user/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    validateObjectId(userId, 'User ID');

    const ratings = await UserRating.find({ ratedUser: userId })
      .populate('ratingUser', 'name avatarUrl')
      .populate('collaborationId', 'title')
      .sort({ createdAt: -1 });

    res.json(ratings);
  } catch (error) {
    next(error);
  }
});

// GET /api/ratings/check/:ratedUserId - Check if current user has rated a user
router.get('/check/:ratedUserId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw createError('User not found', 404);
    }

    const { ratedUserId } = req.params;
    const { collaborationId } = req.query;

    validateObjectId(ratedUserId, 'Rated user ID');
    if (collaborationId) {
      validateObjectId(collaborationId as string, 'Collaboration ID');
    }

    const existingRating = await UserRating.findOne({
      ratedUser: ratedUserId,
      ratingUser: req.user._id,
      collaborationId: collaborationId || null,
    });

    res.json({
      exists: !!existingRating,
      rating: existingRating || null,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/ratings/:ratingId - Delete a rating
router.delete('/:ratingId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw createError('User not found', 404);
    }

    const { ratingId } = req.params;
    validateObjectId(ratingId, 'Rating ID');

    const rating = await UserRating.findById(ratingId);
    if (!rating) {
      throw createError('Rating not found', 404);
    }

    // Check if the current user is the one who gave the rating
    if (rating.ratingUser.toString() !== req.user._id.toString()) {
      throw createError('You can only delete your own ratings', 403);
    }

    const ratedUserId = rating.ratedUser.toString();
    await rating.deleteOne();

    // Update rated user's reputation after deletion
    await updateUserReputation(ratedUserId);

    res.json({
      success: true,
      message: 'Rating deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/ratings/idea/:ideaId - Rate an idea
router.post('/idea/:ideaId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw createError('User not found', 404);
    }

    const currentUser = req.user; // Store for TypeScript type narrowing
    const { ideaId } = req.params;
    const { rating, comment } = req.body;

    validateObjectId(ideaId, 'Idea ID');

    if (!rating || rating < 1 || rating > 5) {
      throw createError('Rating must be between 1 and 5', 400);
    }

    const idea = await Idea.findById(ideaId);
    if (!idea) {
      throw createError('Idea not found', 404);
    }

    // Check if user already rated this idea
    const existingRating = idea.ratings.find(
      (r) => r.userId.toString() === currentUser._id.toString()
    );

    if (existingRating) {
      throw createError('You have already rated this idea', 400);
    }

    // Add rating
    idea.ratings.push({
      userId: currentUser._id,
      rating,
      comment: comment || undefined,
      createdAt: new Date(),
    });

    // Update average rating
    const totalRatings = idea.ratings.length;
    const sumRatings = idea.ratings.reduce((sum, r) => sum + r.rating, 0);
    idea.averageRating = sumRatings / totalRatings;
    idea.totalRatings = totalRatings;

    await idea.save();

    res.json({
      success: true,
      idea,
    });
  } catch (error) {
    next(error);
  }
});

// Helper function to update user reputation
// Reputation is automatically recalculated after each rating
// Score components: ratings, number of collaborations, category scores
export async function updateUserReputation(userId: string) {
  const user = await User.findById(userId);
  if (!user) return;

  const ratings = await UserRating.find({ ratedUser: userId });
  
  let averageRating = 0;
  let totalRatings = 0;
  let reputationScore = 0;

  // Component 1: Rating-based score (0-50 points)
  if (ratings.length > 0) {
    totalRatings = ratings.length;
    const sumRatings = ratings.reduce((sum, r) => sum + r.rating, 0);
    averageRating = sumRatings / totalRatings;
    reputationScore = averageRating * 10; // Base score from rating (0-50)
    
    // Component 2: Number of ratings bonus (up to 20 points)
    // More ratings = more reliable reputation
    const ratingBonus = Math.min(totalRatings * 1.5, 20);
    reputationScore += ratingBonus;

    // Component 3: Category scores bonus (up to 15 points)
    // Average of all category ratings
    const categoryScores = ratings.reduce(
      (sum, r) =>
        sum +
        (r.categories.communication +
          r.categories.reliability +
          r.categories.skill +
          r.categories.professionalism) /
          4,
      0
    );
    const avgCategoryScore = categoryScores / totalRatings;
    const categoryBonus = Math.min((avgCategoryScore / 5) * 15, 15);
    reputationScore += categoryBonus;
  }

  // Component 4: Completed collaborations bonus (up to 15 points)
  // More collaborations = more experience and trust
  const collaborationBonus = Math.min(user.completedCollaborations * 1.5, 15);
  reputationScore += collaborationBonus;

  // Ensure score is within 0-100 range
  reputationScore = Math.min(Math.max(reputationScore, 0), 100);

  // Update user
  await User.findByIdAndUpdate(userId, {
    averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
    totalRatings,
    reputationScore: Math.round(reputationScore),
  });

  // Update trust badges (rewards good behavior)
  await updateTrustBadges(userId);
}

export default router;

