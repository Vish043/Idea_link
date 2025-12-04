/**
 * Matching Algorithm for finding the best collaborators
 * Uses skill matching, interest overlap, and reputation scores
 */

import { IUser } from '../models/User';
import { IIdea } from '../models/Idea';

interface MatchResult {
  user: IUser;
  score: number;
  reasons: string[];
}

/**
 * Calculate match score between a user and an idea
 */
export function calculateMatchScore(user: IUser, idea: IIdea): MatchResult {
  let score = 0;
  const reasons: string[] = [];

  // 1. Skill Matching (40% weight)
  const skillMatch = calculateSkillMatch(user.skills, idea.requiredSkills);
  score += skillMatch.score * 0.4;
  if (skillMatch.matched.length > 0) {
    reasons.push(`Has ${skillMatch.matched.length} required skill(s): ${skillMatch.matched.slice(0, 3).join(', ')}`);
  }

  // 2. Interest Overlap (20% weight)
  const interestMatch = calculateInterestMatch(user.interests, idea.tags);
  score += interestMatch * 0.2;
  if (interestMatch > 0.3) {
    reasons.push('Interests align with idea tags');
  }

  // 3. Reputation Score (20% weight)
  const reputationScore = normalizeReputation(user.reputationScore, user.averageRating);
  score += reputationScore * 0.2;
  if (user.averageRating >= 4.0) {
    reasons.push('Highly rated collaborator');
  }

  // 4. Experience (10% weight)
  const experienceScore = Math.min(user.completedCollaborations / 10, 1);
  score += experienceScore * 0.1;
  if (user.completedCollaborations >= 5) {
    reasons.push('Experienced collaborator');
  }

  // 5. Trust Badges (10% weight)
  const trustScore = calculateTrustScore(user);
  score += trustScore * 0.1;
  if (user.verified) {
    reasons.push('Verified user');
  }

  return {
    user,
    score: Math.round(score * 100) / 100, // Round to 2 decimal places
    reasons,
  };
}

/**
 * Calculate skill match percentage
 */
function calculateSkillMatch(userSkills: string[], requiredSkills: string[]): {
  score: number;
  matched: string[];
} {
  if (requiredSkills.length === 0) return { score: 1, matched: [] };

  const userSkillsLower = userSkills.map((s) => s.toLowerCase());
  const requiredSkillsLower = requiredSkills.map((s) => s.toLowerCase());

  const matched = requiredSkillsLower.filter((skill) =>
    userSkillsLower.some((userSkill) =>
      userSkill.includes(skill) || skill.includes(userSkill)
    )
  );

  const score = matched.length / requiredSkills.length;
  return { score, matched: matched.map((s, i) => requiredSkills[requiredSkillsLower.indexOf(s)]) };
}

/**
 * Calculate interest overlap
 */
function calculateInterestMatch(userInterests: string[], ideaTags: string[]): number {
  if (ideaTags.length === 0) return 0.5; // Neutral score if no tags

  const userInterestsLower = userInterests.map((i) => i.toLowerCase());
  const ideaTagsLower = ideaTags.map((t) => t.toLowerCase());

  const matches = ideaTagsLower.filter((tag) =>
    userInterestsLower.some((interest) => interest.includes(tag) || tag.includes(interest))
  );

  return matches.length / ideaTags.length;
}

/**
 * Normalize reputation score (0-1)
 */
function normalizeReputation(reputationScore: number, averageRating: number): number {
  // Combine reputation score and rating
  const scoreComponent = Math.min(reputationScore / 100, 1);
  const ratingComponent = averageRating / 5;
  return (scoreComponent * 0.5 + ratingComponent * 0.5);
}

/**
 * Calculate trust score based on badges
 */
function calculateTrustScore(user: IUser): number {
  let score = 0;
  const badges = user.trustBadges || [];

  if (badges.includes('email_verified')) score += 0.2;
  if (badges.includes('resume_uploaded')) score += 0.2;
  if (badges.includes('active_collaborator')) score += 0.2;
  if (badges.includes('idea_creator')) score += 0.2;
  if (badges.includes('top_rated')) score += 0.2;

  return Math.min(score, 1);
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
): Promise<Array<IIdea & { matchScore: number; reasons: string[] }>> {
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
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);

  return recommendations;
}

