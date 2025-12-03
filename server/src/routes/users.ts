import express, { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { authMiddleware } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { validateEmail, validateObjectId } from '../utils/validation';

const router = express.Router();

// PUT /api/users/me
router.put('/me', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw createError('User not found', 404);
    }

    const { name, email, role, skills, interests, bio, avatarUrl, resumeUrl } = req.body;

    // Validate email if provided
    if (email && email !== req.user.email) {
      validateEmail(email);
      // Check if email is already taken
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw createError('Email already in use', 409);
      }
    }

    // Validate role if provided
    if (role && !['student', 'founder', 'professional', 'other'].includes(role)) {
      throw createError('Invalid role', 400);
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        ...(name && { name }),
        ...(email && { email }),
        ...(role && { role }),
        ...(skills !== undefined && { skills }),
        ...(interests !== undefined && { interests }),
      ...(bio !== undefined && { bio }),
      ...(avatarUrl !== undefined && { avatarUrl }),
      ...(resumeUrl !== undefined && { resumeUrl }),
      },
      { new: true, runValidators: true }
    ).select('-passwordHash');

    if (!user) {
      throw createError('User not found', 404);
    }

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      skills: user.skills,
      interests: user.interests,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      resumeUrl: user.resumeUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/users/:id
router.get('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    validateObjectId(id, 'User ID');

    const user = await User.findById(id).select('-passwordHash');
    if (!user) {
      throw createError('User not found', 404);
    }

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      skills: user.skills,
      interests: user.interests,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      resumeUrl: user.resumeUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

