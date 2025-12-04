import express, { Request, Response, NextFunction } from 'express';
import { UserRating } from '../models/UserRating';
import { User } from '../models/User';
import { Idea } from '../models/Idea';
import { authMiddleware } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { validateObjectId } from '../utils/validation';

const router = express.Router();

// POST /api/ratings - Rate a user after collaboration
router.post('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw createError('User not found', 404);
    }

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
    if (ratedUserId === req.user._id.toString()) {
      throw createError('Cannot rate yourself', 400);
    }

    // Check if user exists
    const ratedUser = await User.findById(ratedUserId);
    if (!ratedUser) {
      throw createError('User not found', 404);
    }

    // Check for existing rating for this collaboration
    const existingRating = await UserRating.findOne({
      ratedUser: ratedUserId,
      ratingUser: req.user._id,
      collaborationId: collaborationId || null,
    });

    if (existingRating) {
      throw createError('You have already rated this user for this collaboration', 400);
    }

    // Create rating
    const newRating = new UserRating({
      ratedUser: ratedUserId,
      ratingUser: req.user._id,
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
async function updateUserReputation(userId: string) {
  const ratings = await UserRating.find({ ratedUser: userId });
  
  if (ratings.length === 0) return;

  const totalRatings = ratings.length;
  const sumRatings = ratings.reduce((sum, r) => sum + r.rating, 0);
  const averageRating = sumRatings / totalRatings;

  // Calculate reputation score (0-100)
  // Based on: average rating, number of ratings, category scores
  let reputationScore = averageRating * 10; // Base score from rating (0-50)
  
  // Bonus for number of ratings (up to 30 points)
  const ratingBonus = Math.min(totalRatings * 2, 30);
  reputationScore += ratingBonus;

  // Bonus for category scores (up to 20 points)
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
  const categoryBonus = Math.min((categoryScores / totalRatings / 5) * 20, 20);
  reputationScore += categoryBonus;

  // Update user
  await User.findByIdAndUpdate(userId, {
    averageRating,
    totalRatings,
    reputationScore: Math.round(reputationScore),
  });

  // Update trust badges
  await updateTrustBadges(userId);
}

// Helper function to update trust badges
async function updateTrustBadges(userId: string) {
  const user = await User.findById(userId);
  if (!user) return;

  const badges: string[] = [];

  // Email verified
  if (user.emailVerified) {
    badges.push('email_verified');
  }

  // Resume uploaded
  if (user.resumeUrl) {
    badges.push('resume_uploaded');
  }

  // Active collaborator (has completed collaborations)
  if (user.completedCollaborations >= 1) {
    badges.push('active_collaborator');
  }

  // Idea creator (has created ideas)
  const ideaCount = await Idea.countDocuments({ owner: userId });
  if (ideaCount >= 1) {
    badges.push('idea_creator');
  }

  // Top rated (average rating >= 4.5 with at least 3 ratings)
  if (user.averageRating >= 4.5 && user.totalRatings >= 3) {
    badges.push('top_rated');
  }

  user.trustBadges = badges;
  await user.save();
}

export default router;

