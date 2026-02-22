import { useEffect, useState, useMemo } from 'react';
import api from '../utils/api';
import TrustBadges from './TrustBadges';
import ReputationDisplay from './ReputationDisplay';
import { useToast } from '../hooks/useToast';

interface ScoreBreakdown {
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

interface Recommendation {
  user: {
    _id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    skills: string[];
    interests: string[];
    bio: string;
    averageRating: number;
    reputationScore: number;
    totalRatings?: number;
    trustBadges: string[];
    completedCollaborations: number;
  };
  matchScore: number;
  reasons: string[];
  breakdown?: ScoreBreakdown; // Transparent scoring breakdown
}

interface MatchingRecommendationsProps {
  ideaId: string;
  onSelectUser?: (userId: string) => void;
}

export default function MatchingRecommendations({
  ideaId,
  onSelectUser,
}: MatchingRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [minMatchScore, setMinMatchScore] = useState(0.3); // Default 30% minimum
  const [expandedBreakdown, setExpandedBreakdown] = useState<Set<string>>(new Set());
  const { showError } = useToast();

  useEffect(() => {
    fetchRecommendations();
  }, [ideaId]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/matching/idea/${ideaId}/collaborators`);
      setRecommendations(response.data.recommendations || []);
    } catch (err: any) {
      showError(err.response?.data?.error || 'Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  // Filtered Results: Only show relevant matches above threshold
  const filteredRecommendations = useMemo(() => {
    return recommendations.filter((rec) => rec.matchScore >= minMatchScore);
  }, [recommendations, minMatchScore]);

  // Get match score color based on percentage
  const getMatchScoreColor = (score: number) => {
    const percentage = score * 100;
    if (percentage >= 80) return 'bg-green-100 text-green-800 border-green-200';
    if (percentage >= 60) return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    if (percentage >= 40) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Get match score label
  const getMatchScoreLabel = (score: number) => {
    const percentage = score * 100;
    if (percentage >= 80) return 'Excellent Match';
    if (percentage >= 60) return 'Great Match';
    if (percentage >= 40) return 'Good Match';
    return 'Fair Match';
  };

  // Toggle breakdown expansion
  const toggleBreakdown = (userId: string) => {
    const newExpanded = new Set(expandedBreakdown);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedBreakdown(newExpanded);
  };

  // Get badge display name
  const getBadgeName = (badge: string) => {
    const names: Record<string, string> = {
      email_verified: 'Email Verified',
      resume_uploaded: 'Resume Uploaded',
      active_collaborator: 'Active Collaborator',
      idea_creator: 'Idea Creator',
      top_rated: 'Top Rated',
    };
    return names[badge] || badge;
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <p className="text-gray-600 mt-2">Finding best matches...</p>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No recommendations available at this time.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Filter Controls */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Recommended Collaborators
        </h3>
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600 flex items-center gap-2">
            <span>Min Match:</span>
            <select
              value={minMatchScore}
              onChange={(e) => setMinMatchScore(parseFloat(e.target.value))}
              className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value={0}>All (0%)</option>
              <option value={0.2}>20%</option>
              <option value={0.3}>30%</option>
              <option value={0.4}>40%</option>
              <option value={0.5}>50%</option>
              <option value={0.6}>60%</option>
              <option value={0.7}>70%</option>
            </select>
          </label>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600 mb-2">
        Showing {filteredRecommendations.length} of {recommendations.length} recommendations
        {minMatchScore > 0 && (
          <span> (filtered: {Math.round(minMatchScore * 100)}%+ match)</span>
        )}
      </div>

      {filteredRecommendations.length === 0 ? (
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
          <p>No matches found above {Math.round(minMatchScore * 100)}% threshold.</p>
          <p className="text-sm mt-1">Try lowering the minimum match score.</p>
        </div>
      ) : (
        filteredRecommendations.map((rec) => (
        <div
          key={rec.user._id}
          className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start gap-3 flex-1">
              <div className="h-12 w-12 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 flex items-center justify-center text-white font-semibold">
                {rec.user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-gray-900">{rec.user.name}</h4>
                  <TrustBadges badges={rec.user.trustBadges || []} size="sm" />
                </div>
                <ReputationDisplay
                  reputationScore={rec.user.reputationScore || 0}
                  averageRating={rec.user.averageRating || 0}
                  totalRatings={rec.user.totalRatings || 0}
                  size="sm"
                />
                {rec.user.bio && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{rec.user.bio}</p>
                )}
              </div>
            </div>
            <div className="text-right">
              {/* Match Scores: Shows compatibility percentage with visual indicators */}
              <div className={`${getMatchScoreColor(rec.matchScore)} px-4 py-2 rounded-lg border-2 font-semibold text-sm shadow-sm`}>
                <div className="text-xs font-medium mb-0.5">{getMatchScoreLabel(rec.matchScore)}</div>
                <div className="text-lg">{Math.round(rec.matchScore * 100)}%</div>
                <div className="text-xs font-normal mt-0.5">Compatibility</div>
              </div>
            </div>
          </div>

          {/* Recommendation Reasons: Explains why users are matched */}
          {rec.reasons.length > 0 && (
            <div className="mb-3 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
              <p className="text-xs font-semibold text-indigo-900 mb-2 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Why this match:
              </p>
              <ul className="text-sm text-gray-700 space-y-1.5">
                {rec.reasons.map((reason, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5 font-bold">✓</span>
                    <span className="flex-1">{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Transparent Scoring Breakdown */}
          {rec.breakdown && (
            <div className="mb-3">
              <button
                onClick={() => toggleBreakdown(rec.user._id)}
                className="w-full flex items-center justify-between p-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Score Breakdown
                </span>
                <svg
                  className={`w-4 h-4 transition-transform ${expandedBreakdown.has(rec.user._id) ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {expandedBreakdown.has(rec.user._id) && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                  {/* Skill Match */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-700">Skills Match</span>
                      <span className="text-gray-600">
                        {Math.round(rec.breakdown.skillMatch.score * 100)}% ({rec.breakdown.skillMatch.matched.length}/{rec.breakdown.skillMatch.total})
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${rec.breakdown.skillMatch.score * 100}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-600">
                      Weight: {Math.round(rec.breakdown.skillMatch.weight * 100)}% • 
                      Contribution: +{Math.round(rec.breakdown.skillMatch.contribution * 100)}%
                    </div>
                    {rec.breakdown.skillMatch.matched.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {rec.breakdown.skillMatch.matched.map((skill, idx) => (
                          <span key={idx} className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Interest Match */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-700">Interest Alignment</span>
                      <span className="text-gray-600">
                        {Math.round(rec.breakdown.interestMatch.score * 100)}% ({rec.breakdown.interestMatch.matched.length}/{rec.breakdown.interestMatch.total})
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full transition-all"
                        style={{ width: `${rec.breakdown.interestMatch.score * 100}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-600">
                      Weight: {Math.round(rec.breakdown.interestMatch.weight * 100)}% • 
                      Contribution: +{Math.round(rec.breakdown.interestMatch.contribution * 100)}%
                    </div>
                    {rec.breakdown.interestMatch.matched.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {rec.breakdown.interestMatch.matched.map((interest, idx) => (
                          <span key={idx} className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
                            {interest}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Reputation */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-700">Reputation</span>
                      <span className="text-gray-600">
                        {Math.round(rec.breakdown.reputation.score * 100)}% 
                        (Rating: {rec.breakdown.reputation.averageRating.toFixed(1)}/5.0)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${rec.breakdown.reputation.score * 100}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-600">
                      Weight: {Math.round(rec.breakdown.reputation.weight * 100)}% • 
                      Contribution: +{Math.round(rec.breakdown.reputation.contribution * 100)}% • 
                      Reputation Score: {rec.breakdown.reputation.reputationScore}
                    </div>
                  </div>

                  {/* Experience */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-700">Experience</span>
                      <span className="text-gray-600">
                        {Math.round(rec.breakdown.experience.score * 100)}% 
                        ({rec.breakdown.experience.completedCollaborations} collaborations)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-500 h-2 rounded-full transition-all"
                        style={{ width: `${rec.breakdown.experience.score * 100}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-600">
                      Weight: {Math.round(rec.breakdown.experience.weight * 100)}% • 
                      Contribution: +{Math.round(rec.breakdown.experience.contribution * 100)}%
                    </div>
                  </div>

                  {/* Trust Badges */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-700">Trust Badges</span>
                      <span className="text-gray-600">
                        {Math.round(rec.breakdown.trustBadges.score * 100)}% 
                        ({rec.breakdown.trustBadges.badges.length} badges)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-500 h-2 rounded-full transition-all"
                        style={{ width: `${rec.breakdown.trustBadges.score * 100}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-600">
                      Weight: {Math.round(rec.breakdown.trustBadges.weight * 100)}% • 
                      Contribution: +{Math.round(rec.breakdown.trustBadges.contribution * 100)}%
                    </div>
                    {rec.breakdown.trustBadges.badges.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {rec.breakdown.trustBadges.badges.map((badge, idx) => (
                          <span key={idx} className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded">
                            {getBadgeName(badge)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Total Score Summary */}
                  <div className="pt-2 mt-2 border-t border-gray-300">
                    <div className="flex items-center justify-between text-sm font-semibold">
                      <span className="text-gray-700">Total Match Score</span>
                      <span className="text-indigo-600">{Math.round(rec.matchScore * 100)}%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Skills - Visual Tags */}
          {rec.user.skills.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center gap-1 mb-2">
                <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span className="text-xs font-semibold text-gray-700">Skills:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {rec.user.skills.slice(0, 6).map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-700 text-xs rounded-full font-medium border border-indigo-100 flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {skill}
                  </span>
                ))}
                {rec.user.skills.length > 6 && (
                  <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                    +{rec.user.skills.length - 6} more
                  </span>
                )}
              </div>
            </div>
          )}

          {onSelectUser && (
            <button
              onClick={() => onSelectUser(rec.user._id)}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium"
            >
              View Profile
            </button>
          )}
        </div>
      )))}
    </div>
  );
}

