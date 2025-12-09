import express, { Request, Response, NextFunction } from 'express';
import { Idea } from '../models/Idea';
import { User } from '../models/User';
import { CollaborationRequest } from '../models/CollaborationRequest';
import { createError } from '../middleware/errorHandler';

const router = express.Router();

// GET /api/stats (public endpoint - no auth required)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get total counts
    const [totalIdeas, totalUsers, totalCollaborations] = await Promise.all([
      Idea.countDocuments(),
      User.countDocuments(),
      CollaborationRequest.countDocuments({ status: 'accepted' }),
    ]);

    res.json({
      ideas: totalIdeas,
      users: totalUsers,
      collaborations: totalCollaborations,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
