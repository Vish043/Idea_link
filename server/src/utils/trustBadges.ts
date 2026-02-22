import { User } from '../models/User';
import { Idea } from '../models/Idea';
import { UserRating } from '../models/UserRating';

// Comprehensive trust badge system with tiered and achievement badges
export async function updateTrustBadges(userId: string) {
  const user = await User.findById(userId);
  if (!user) return;

  const badges: string[] = [];

  // ===== BASIC VERIFICATION BADGES =====
  
  // Email verified
  if (user.emailVerified) {
    badges.push('email_verified');
  }

  // Resume uploaded
  if (user.resumeUrl) {
    badges.push('resume_uploaded');
  }

  // ===== COLLABORATION BADGES =====
  
  // Active collaborator (has completed collaborations)
  if (user.completedCollaborations >= 1) {
    badges.push('active_collaborator');
  }

  // Milestone badges for collaborations
  if (user.completedCollaborations >= 10) {
    badges.push('collaboration_milestone_10');
  }
  if (user.completedCollaborations >= 25) {
    badges.push('collaboration_milestone_25');
  }
  if (user.completedCollaborations >= 50) {
    badges.push('collaboration_milestone_50');
  }
  if (user.completedCollaborations >= 100) {
    badges.push('collaboration_milestone_100');
  }

  // Veteran collaborator (50+ collaborations)
  if (user.completedCollaborations >= 50) {
    badges.push('veteran_collaborator');
  }

  // ===== IDEA CREATION BADGES =====
  
  // Idea creator (has created ideas)
  const ideaCount = await Idea.countDocuments({ owner: userId });
  if (ideaCount >= 1) {
    badges.push('idea_creator');
  }

  // Prolific creator badges
  if (ideaCount >= 5) {
    badges.push('prolific_creator');
  }
  if (ideaCount >= 10) {
    badges.push('idea_master');
  }

  // ===== RATING & REPUTATION BADGES =====
  
  // Top rated (average rating >= 4.5 with at least 3 ratings)
  if (user.averageRating >= 4.5 && user.totalRatings >= 3) {
    badges.push('top_rated');
  }

  // Tiered rating badges
  if (user.averageRating >= 4.8 && user.totalRatings >= 5) {
    badges.push('excellent_rated');
  }
  if (user.averageRating >= 4.5 && user.totalRatings >= 10) {
    badges.push('highly_rated');
  }
  if (user.averageRating >= 4.0 && user.totalRatings >= 20) {
    badges.push('well_rated');
  }

  // Rising star (new user with high ratings)
  if (user.totalRatings >= 3 && user.totalRatings <= 10 && user.averageRating >= 4.5) {
    badges.push('rising_star');
  }

  // ===== RESPONSE RATE BADGES =====
  
  // High response rate badges
  if (user.collaborationRequestsReceived >= 5) {
    if (user.responseRate >= 95) {
      badges.push('excellent_response_rate');
    } else if (user.responseRate >= 80) {
      badges.push('good_response_rate');
    }
  }

  // ===== CONSISTENCY BADGES =====
  
  // Check for consistent performance (recent ratings are good)
  if (user.totalRatings >= 5) {
    const recentRatings = await UserRating.find({ ratedUser: userId })
      .sort({ createdAt: -1 })
      .limit(5);
    
    if (recentRatings.length >= 5) {
      const recentAvg = recentRatings.reduce((sum, r) => sum + r.rating, 0) / recentRatings.length;
      if (recentAvg >= 4.5) {
        badges.push('consistent_performer');
      }
    }
  }

  // ===== REPUTATION TIER BADGES =====
  
  // Reputation tier badges
  if (user.reputationScore >= 90) {
    badges.push('reputation_elite');
  } else if (user.reputationScore >= 80) {
    badges.push('reputation_excellent');
  } else if (user.reputationScore >= 70) {
    badges.push('reputation_good');
  } else if (user.reputationScore >= 60) {
    badges.push('reputation_established');
  }

  // ===== CATEGORY EXCELLENCE BADGES =====
  
  // Check for excellence in specific categories
  if (user.totalRatings >= 3) {
    const ratings = await UserRating.find({ ratedUser: userId });
    const categoryAverages = {
      communication: ratings.reduce((sum, r) => sum + r.categories.communication, 0) / ratings.length,
      reliability: ratings.reduce((sum, r) => sum + r.categories.reliability, 0) / ratings.length,
      skill: ratings.reduce((sum, r) => sum + r.categories.skill, 0) / ratings.length,
      professionalism: ratings.reduce((sum, r) => sum + r.categories.professionalism, 0) / ratings.length,
    };

    if (categoryAverages.communication >= 4.5) {
      badges.push('excellent_communicator');
    }
    if (categoryAverages.reliability >= 4.5) {
      badges.push('highly_reliable');
    }
    if (categoryAverages.skill >= 4.5) {
      badges.push('skilled_professional');
    }
    if (categoryAverages.professionalism >= 4.5) {
      badges.push('professional');
    }
  }

  user.trustBadges = badges;
  await user.save();
}

