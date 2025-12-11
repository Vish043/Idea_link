import express, { Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { createVerificationToken, verifyEmail, getVerificationToken } from '../utils/emailVerification';
import { sendVerificationEmail } from '../utils/emailService';
import { User } from '../models/User';

const router = express.Router();

// POST /api/email-verification/send - Request email verification
router.post('/send', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw createError('User not found', 404);
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      throw createError('User not found', 404);
    }

    if (user.emailVerified) {
      return res.json({
        success: true,
        message: 'Email is already verified',
        verified: true,
      });
    }

    // Generate verification token
    const token = await createVerificationToken(user._id.toString());

    const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${token}`;

    // Try to send verification email
    const emailSent = await sendVerificationEmail(user.email, verificationLink, user.name);

    if (emailSent) {
      res.json({
        success: true,
        message: 'Verification email sent successfully! Please check your inbox.',
      });
    } else {
      // Email service not configured - return token for development
      res.json({
        success: true,
        message: 'Email service not configured. Use the verification link below:',
        token: process.env.NODE_ENV === 'development' ? token : undefined,
        verificationLink: process.env.NODE_ENV === 'development' ? verificationLink : undefined,
        note: 'Configure EMAIL_* environment variables to enable email sending',
      });
    }
  } catch (error) {
    next(error);
  }
});

// GET /api/email-verification/verify/:token - Verify email with token
router.get('/verify/:token', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.params;

    if (!token) {
      throw createError('Verification token is required', 400);
    }

    const result = await verifyEmail(token);

    // If accessed via browser, show HTML page, otherwise return JSON
    const acceptHeader = req.headers.accept || '';
    const isBrowserRequest = acceptHeader.includes('text/html');

    if (result.success) {
      if (isBrowserRequest) {
        // Return HTML page for browser requests
        res.send(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <title>Email Verified - IdeaConnect</title>
              <style>
                body { 
                  font-family: Arial, sans-serif; 
                  display: flex; 
                  justify-content: center; 
                  align-items: center; 
                  min-height: 100vh; 
                  margin: 0; 
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                }
                .container { 
                  background: white; 
                  padding: 40px; 
                  border-radius: 10px; 
                  text-align: center; 
                  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                  max-width: 500px;
                }
                .success-icon { 
                  font-size: 80px; 
                  color: #10b981; 
                  margin-bottom: 20px;
                }
                h1 { color: #10b981; margin-bottom: 10px; }
                p { color: #666; margin: 10px 0; }
                .button { 
                  display: inline-block; 
                  margin-top: 20px; 
                  padding: 12px 30px; 
                  background: #667eea; 
                  color: white; 
                  text-decoration: none; 
                  border-radius: 5px; 
                }
                .button:hover { background: #5568d3; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="success-icon">✓</div>
                <h1>Email Verified Successfully!</h1>
                <p>Your email has been verified. You can now close this window.</p>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/profile" class="button">Go to Profile</a>
              </div>
            </body>
          </html>
        `);
      } else {
        // Return JSON for API requests
        res.json({
          success: true,
          message: result.message,
        });
      }
    } else {
      if (isBrowserRequest) {
        // Return HTML error page
        res.status(400).send(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <title>Verification Failed - IdeaConnect</title>
              <style>
                body { 
                  font-family: Arial, sans-serif; 
                  display: flex; 
                  justify-content: center; 
                  align-items: center; 
                  min-height: 100vh; 
                  margin: 0; 
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                }
                .container { 
                  background: white; 
                  padding: 40px; 
                  border-radius: 10px; 
                  text-align: center; 
                  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                  max-width: 500px;
                }
                .error-icon { 
                  font-size: 80px; 
                  color: #ef4444; 
                  margin-bottom: 20px;
                }
                h1 { color: #ef4444; margin-bottom: 10px; }
                p { color: #666; margin: 10px 0; }
                .button { 
                  display: inline-block; 
                  margin-top: 20px; 
                  padding: 12px 30px; 
                  background: #667eea; 
                  color: white; 
                  text-decoration: none; 
                  border-radius: 5px; 
                }
                .button:hover { background: #5568d3; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="error-icon">✗</div>
                <h1>Verification Failed</h1>
                <p>${result.message}</p>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/profile" class="button">Go to Profile</a>
              </div>
            </body>
          </html>
        `);
      } else {
        res.status(400).json({
          success: false,
          message: result.message,
        });
      }
    }
  } catch (error) {
    next(error);
  }
});

// GET /api/email-verification/status - Check verification status
router.get('/status', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw createError('User not found', 404);
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      throw createError('User not found', 404);
    }

    const hasToken = !!(await getVerificationToken(user._id.toString()));

    res.json({
      verified: user.emailVerified,
      hasPendingVerification: hasToken && !user.emailVerified,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

