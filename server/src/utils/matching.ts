/**
 * Matching Algorithm for finding the best collaborators
 * 
 * Features:
 * - Smart Recommendations: Algorithm suggests best collaborators
 * - Skill Matching: Matches required skills with user skills (40% weight)
 * - Interest Alignment: Considers user interests vs idea tags (20% weight)
 * - Reputation Weight: Prioritizes highly-rated users (20% weight)
 * - Experience: Values completed collaborations (10% weight)
 * - Trust Badges: Rewards verified and active users (10% weight)
 */

import { IUser } from '../models/User';
import { IIdea } from '../models/Idea';

export interface ScoreBreakdown {
  skillMatch: {
    score: number;
    weight: number;
    contribution: number;
    matched: string[];
    total: number;
  };
  interestMatch: {
    score: number;
    weight: number;
    contribution: number;
    matched: string[];
    total: number;
  };
  reputation: {
    score: number;
    weight: number;
    contribution: number;
    reputationScore: number;
    averageRating: number;
  };
  experience: {
    score: number;
    weight: number;
    contribution: number;
    completedCollaborations: number;
  };
  trustBadges: {
    score: number;
    weight: number;
    contribution: number;
    badges: string[];
  };
}

interface MatchResult {
  user: IUser;
  score: number;
  reasons: string[];
  breakdown: ScoreBreakdown;
}

/**
 * Calculate match score between a user and an idea
 * Returns detailed breakdown for transparent scoring
 */
export function calculateMatchScore(user: IUser, idea: IIdea): MatchResult {
  let score = 0;
  const reasons: string[] = [];

  // Define weights for each factor
  const weights = {
    skillMatch: 0.4,
    interestMatch: 0.2,
    reputation: 0.2,
    experience: 0.1,
    trustBadges: 0.1,
  };

  // 1. Skill Matching (40% weight) - Matches required skills with user skills
  const skillMatchResult = calculateSkillMatch(user.skills, idea.requiredSkills);
  const skillContribution = skillMatchResult.score * weights.skillMatch;
  score += skillContribution;
  if (skillMatchResult.matched.length > 0) {
    const skillText = skillMatchResult.matched.length === 1 ? 'skill' : 'skills';
    reasons.push(`Has ${skillMatchResult.matched.length} required ${skillText}: ${skillMatchResult.matched.slice(0, 3).join(', ')}`);
  } else if (idea.requiredSkills.length > 0) {
    reasons.push('Missing required skills');
  }

  // 2. Interest Alignment (20% weight) - Considers user interests vs idea tags
  const interestMatchResult = calculateInterestMatch(user.interests, idea.tags);
  const interestContribution = interestMatchResult.score * weights.interestMatch;
  score += interestContribution;
  if (interestMatchResult.score > 0.5) {
    reasons.push('Strong interest alignment with idea');
  } else if (interestMatchResult.score > 0.3) {
    reasons.push('Interests align with idea tags');
  } else if (interestMatchResult.score > 0) {
    reasons.push('Some shared interests');
  }

  // 3. Reputation Weight (20% weight) - Prioritizes highly-rated users
  const reputationScore = normalizeReputation(user.reputationScore, user.averageRating);
  const reputationContribution = reputationScore * weights.reputation;
  score += reputationContribution;
  if (user.averageRating >= 4.5 && user.totalRatings >= 3) {
    reasons.push('Top-rated collaborator');
  } else if (user.averageRating >= 4.0) {
    reasons.push('Highly rated collaborator');
  } else if (user.reputationScore >= 80) {
    reasons.push('High reputation score');
  } else if (user.totalRatings > 0) {
    reasons.push('Rated collaborator');
  }

  // 4. Experience (10% weight)
  const experienceScore = Math.min(user.completedCollaborations / 10, 1);
  const experienceContribution = experienceScore * weights.experience;
  score += experienceContribution;
  if (user.completedCollaborations >= 5) {
    reasons.push('Experienced collaborator');
  }

  // 5. Trust Badges (10% weight)
  const trustScoreResult = calculateTrustScore(user);
  const trustContribution = trustScoreResult.score * weights.trustBadges;
  score += trustContribution;
  if (user.verified) {
    reasons.push('Verified user');
  }

  // Build detailed breakdown for transparent scoring
  const breakdown: ScoreBreakdown = {
    skillMatch: {
      score: skillMatchResult.score,
      weight: weights.skillMatch,
      contribution: Math.round(skillContribution * 100) / 100,
      matched: skillMatchResult.matched,
      total: idea.requiredSkills.length,
    },
    interestMatch: {
      score: interestMatchResult.score,
      weight: weights.interestMatch,
      contribution: Math.round(interestContribution * 100) / 100,
      matched: interestMatchResult.matched,
      total: idea.tags.length,
    },
    reputation: {
      score: reputationScore,
      weight: weights.reputation,
      contribution: Math.round(reputationContribution * 100) / 100,
      reputationScore: user.reputationScore,
      averageRating: user.averageRating,
    },
    experience: {
      score: experienceScore,
      weight: weights.experience,
      contribution: Math.round(experienceContribution * 100) / 100,
      completedCollaborations: user.completedCollaborations,
    },
    trustBadges: {
      score: trustScoreResult.score,
      weight: weights.trustBadges,
      contribution: Math.round(trustContribution * 100) / 100,
      badges: trustScoreResult.badges,
    },
  };

  return {
    user,
    score: Math.round(score * 100) / 100, // Round to 2 decimal places
    reasons,
    breakdown,
  };
}

/**
 * Calculate skill match percentage
 * Matches required skills with user skills (case-insensitive, partial matching)
 * Enhanced with fuzzy matching for better results
 */
function calculateSkillMatch(userSkills: string[], requiredSkills: string[]): {
  score: number;
  matched: string[];
} {
  if (requiredSkills.length === 0) return { score: 1, matched: [] };

  const userSkillsLower = userSkills.map((s) => s.toLowerCase().trim());
  const requiredSkillsLower = requiredSkills.map((s) => s.toLowerCase().trim());

  const matched: string[] = [];
  
  // Find matching skills (case-insensitive, supports partial matches and synonyms)
  requiredSkillsLower.forEach((requiredSkill, index) => {
    const hasMatch = userSkillsLower.some((userSkill) => {
      // Exact match
      if (userSkill === requiredSkill) return true;
      // Partial match (contains)
      if (userSkill.includes(requiredSkill) || requiredSkill.includes(userSkill)) return true;
      // Word boundary matching for better accuracy
      const userWords = userSkill.split(/[\s\-_]+/);
      const requiredWords = requiredSkill.split(/[\s\-_]+/);
      return userWords.some(uw => requiredWords.some(rw => uw === rw || uw.includes(rw) || rw.includes(uw)));
    });
    
    if (hasMatch) {
      matched.push(requiredSkills[index]); // Keep original casing
    }
  });

  const score = matched.length / requiredSkills.length;
  return { score, matched };
}

/**
 * Calculate interest alignment - Considers user interests vs idea tags
 * Returns both score and matched interests for transparency
 */
function calculateInterestMatch(userInterests: string[], ideaTags: string[]): {
  score: number;
  matched: string[];
} {
  if (ideaTags.length === 0) return { score: 0.5, matched: [] }; // Neutral score if no tags
  if (userInterests.length === 0) return { score: 0.2, matched: [] }; // Lower score if user has no interests

  const userInterestsLower = userInterests.map((i) => i.toLowerCase().trim());
  const ideaTagsLower = ideaTags.map((t) => t.toLowerCase().trim());

  // Find matching interests (case-insensitive, supports partial matches)
  const matched: string[] = [];
  ideaTagsLower.forEach((tag, index) => {
    const hasMatch = userInterestsLower.some((interest) => {
      // Exact match
      if (interest === tag) return true;
      // Partial match
      if (interest.includes(tag) || tag.includes(interest)) return true;
      // Word boundary matching
      const interestWords = interest.split(/[\s\-_]+/);
      const tagWords = tag.split(/[\s\-_]+/);
      return interestWords.some(iw => tagWords.some(tw => iw === tw || iw.includes(tw) || tw.includes(iw)));
    });
    
    if (hasMatch) {
      matched.push(ideaTags[index]); // Keep original casing
    }
  });

  const score = matched.length / ideaTags.length;
  return { score, matched };
}

/**
 * Normalize reputation score (0-1) - Prioritizes highly-rated users
 * Combines reputation score and average rating with emphasis on ratings
 */
function normalizeReputation(reputationScore: number, averageRating: number): number {
  // Normalize components to 0-1 range
  const scoreComponent = Math.min(Math.max(reputationScore / 100, 0), 1);
  const ratingComponent = Math.min(Math.max(averageRating / 5, 0), 1);
  
  // Weight rating slightly more (60%) than reputation score (40%)
  // This prioritizes users with high ratings
  return (scoreComponent * 0.4 + ratingComponent * 0.6);
}

/**
 * Calculate trust score based on badges
 * Returns both score and badges for transparency
 */
function calculateTrustScore(user: IUser): {
  score: number;
  badges: string[];
} {
  let score = 0;
  const badges = user.trustBadges || [];
  const activeBadges: string[] = [];

  if (badges.includes('email_verified')) {
    score += 0.2;
    activeBadges.push('email_verified');
  }
  if (badges.includes('resume_uploaded')) {
    score += 0.2;
    activeBadges.push('resume_uploaded');
  }
  if (badges.includes('active_collaborator')) {
    score += 0.2;
    activeBadges.push('active_collaborator');
  }
  if (badges.includes('idea_creator')) {
    score += 0.2;
    activeBadges.push('idea_creator');
  }
  if (badges.includes('top_rated')) {
    score += 0.2;
    activeBadges.push('top_rated');
  }

  return {
    score: Math.min(score, 1),
    badges: activeBadges,
  };
}

/**
 * Get recommended collaborators for an idea
 */
export async function getRecommendedCollaborators(
  idea: IIdea,
  allUsers: IUser[],
  limit: number = 10
): Promise<MatchResult[]> {
  // Filter out owner and existing collaborators
  const availableUsers = allUsers.filter(
    (user) =>
      user._id.toString() !== idea.owner.toString() &&
      !idea.collaborators.some((collab) => collab.toString() === user._id.toString())
  );

  // Calculate match scores
  const matches = availableUsers.map((user) => calculateMatchScore(user, idea));

  // Sort by score (highest first)
  matches.sort((a, b) => b.score - a.score);

  // Update idea match score
  if (matches.length > 0) {
    idea.matchScore = matches[0].score;
  }

  return matches.slice(0, limit);
}

/**
 * Get recommended ideas for a user
 */
export async function getRecommendedIdeas(
  user: IUser,
  allIdeas: IIdea[],
  limit: number = 10
): Promise<Array<IIdea & { matchScore: number; reasons: string[]; breakdown: ScoreBreakdown }>> {
  const recommendations = allIdeas
    .filter(
      (idea) =>
        idea.owner.toString() !== user._id.toString() &&
        idea.status === 'looking_for_collaborators'
    )
    .map((idea) => {
      const match = calculateMatchScore(user, idea);
      return {
        ...idea.toObject(),
        matchScore: match.score,
        reasons: match.reasons,
        breakdown: match.breakdown, // Include breakdown for transparent scoring
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);

  return recommendations;
}

