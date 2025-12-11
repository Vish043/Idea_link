import { User } from '../models/User';
import { Idea } from '../models/Idea';

// Helper function to update trust badges
export async function updateTrustBadges(userId: string) {
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

