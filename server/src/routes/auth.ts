import express, { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { generateToken, authMiddleware } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { validateEmail, validatePassword } from '../utils/validation';

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, role, skills, interests, bio } = req.body;

    if (!name || !email || !password) {
      throw createError('Name, email, and password are required', 400);
    }

    validateEmail(email);
    validatePassword(password);

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw createError('User with this email already exists', 409);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      name,
      email,
      passwordHash,
      role: role || 'other',
      skills: skills || [],
      interests: interests || [],
      bio: bio || '',
    });

    await user.save();

    // Generate token
    const token = generateToken({ userId: user._id.toString(), email: user.email });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        skills: user.skills,
        interests: user.interests,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        resumeUrl: user.resumeUrl,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw createError('Email and password are required', 400);
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      throw createError('Invalid email or password', 401);
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw createError('Invalid email or password', 401);
    }

    // Generate token
    const token = generateToken({ userId: user._id.toString(), email: user.email });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        skills: user.skills,
        interests: user.interests,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        resumeUrl: user.resumeUrl,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw createError('User not found', 404);
    }

    res.json({
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      skills: req.user.skills,
      interests: req.user.interests,
      bio: req.user.bio,
      avatarUrl: req.user.avatarUrl,
      resumeUrl: req.user.resumeUrl,
      createdAt: req.user.createdAt,
      updatedAt: req.user.updatedAt,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

