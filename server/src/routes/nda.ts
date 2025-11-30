import express, { Request, Response, NextFunction } from 'express';
import { NdaAgreement } from '../models/NdaAgreement';
import { Idea } from '../models/Idea';
import { authMiddleware } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { validateObjectId } from '../utils/validation';

const router = express.Router();

// POST /api/nda
router.post('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw createError('User not found', 404);
    }

    const { ideaId } = req.body;

    if (!ideaId) {
      throw createError('Idea ID is required', 400);
    }

    validateObjectId(ideaId, 'Idea ID');

    // Check if idea exists
    const idea = await Idea.findById(ideaId);
    if (!idea) {
      throw createError('Idea not found', 404);
    }

    // Check if NDA already exists
    const existingNda = await NdaAgreement.findOne({
      user: req.user._id,
      idea: ideaId,
    });

    if (existingNda) {
      throw createError('NDA agreement already exists for this idea', 409);
    }

    // Get IP and user agent from request
    const ipAddress = req.ip || req.socket.remoteAddress || null;
    const userAgent = req.headers['user-agent'] || null;

    const ndaAgreement = new NdaAgreement({
      user: req.user._id,
      idea: ideaId,
      agreedAt: new Date(),
      ipAddress,
      userAgent,
    });

    await ndaAgreement.save();
    await ndaAgreement.populate('idea', 'title shortSummary');
    await ndaAgreement.populate('user', 'name email');

    res.status(201).json(ndaAgreement);
  } catch (error) {
    next(error);
  }
});

// GET /api/nda/mine
router.get('/mine', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw createError('User not found', 404);
    }

    const ndaAgreements = await NdaAgreement.find({ user: req.user._id })
      .populate('idea', 'title shortSummary owner')
      .sort({ agreedAt: -1 });

    res.json(ndaAgreements);
  } catch (error) {
    next(error);
  }
});

export default router;

