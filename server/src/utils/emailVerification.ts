import crypto from 'crypto';
import { EmailVerification } from '../models/EmailVerification';
import { User } from '../models/User';
import { updateTrustBadges } from './trustBadges';

/**
 * Generate a secure verification token
 */
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create or update email verification token for a user
 */
export async function createVerificationToken(userId: string): Promise<string> {
  const token = generateVerificationToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await EmailVerification.findOneAndUpdate(
    { userId },
    {
      token,
      expiresAt,
    },
    {
      upsert: true,
      new: true,
    }
  );

  return token;
}

/**
 * Verify email with token
 */
export async function verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
  const verification = await EmailVerification.findOne({ token });

  if (!verification) {
    return { success: false, message: 'Invalid or expired verification token' };
  }

  if (verification.expiresAt < new Date()) {
    await EmailVerification.deleteOne({ _id: verification._id });
    return { success: false, message: 'Verification token has expired' };
  }

  // Update user's emailVerified status
  const user = await User.findById(verification.userId);
  if (!user) {
    return { success: false, message: 'User not found' };
  }

  if (user.emailVerified) {
    await EmailVerification.deleteOne({ _id: verification._id });
    return { success: false, message: 'Email is already verified' };
  }

  user.emailVerified = true;
  await user.save();

  // Update trust badges
  await updateTrustBadges(user._id.toString());

  // Delete verification token
  await EmailVerification.deleteOne({ _id: verification._id });

  return { success: true, message: 'Email verified successfully' };
}

/**
 * Get verification token for a user (for sending email)
 */
export async function getVerificationToken(userId: string): Promise<string | null> {
  const verification = await EmailVerification.findOne({ userId });
  if (!verification || verification.expiresAt < new Date()) {
    return null;
  }
  return verification.token;
}

