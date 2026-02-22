import { useEffect, useState, useMemo } from 'react';
import api from '../utils/api';
import TrustBadges from './TrustBadges';
import ReputationDisplay from './ReputationDisplay';
import { useToast } from '../hooks/useToast';

interface RecommendedIdea {
  _id: string;
  title: string;
  shortSummary: string;
  tags: string[];
  requiredSkills: string[];
  status: string;
  owner: {
    _id: string;
    name: string;
    avatarUrl?: string;
    reputationScore?: number;
    averageRating?: number;
    totalRatings?: number;
    trustBadges?: string[];
    completedCollaborations?: number;
  };
  matchScore: number;
  reasons: string[];
}

interface RecommendedIdeasProps {
  minDefault?: number;
}

export default function RecommendedIdeas({ minDefault = 0.3 }: RecommendedIdeasProps) {
  const [recommendations, setRecommendations] = useState<RecommendedIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [minMatchScore, setMinMatchScore] = useState(minDefault);
  const { showError } = useToast();

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/matching/user/ideas');
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

  const getMatchScoreColor = (score: number) => {
    const percentage = score * 100;
    if (percentage >= 80) return 'bg-green-100 text-green-800 border-green-200';
    if (percentage >= 60) return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    if (percentage >= 40) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getMatchScoreLabel = (score: number) => {
    const percentage = score * 100;
    if (percentage >= 80) return 'Excellent Match';
    if (percentage >= 60) return 'Great Match';
    if (percentage >= 40) return 'Good Match';
    return 'Fair Match';
  };

  if (loading) {
    return (
      <div className="text-center py-6">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <p className="text-gray-600 mt-2 text-sm">Finding ideas for you...</p>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        <p>No recommendations available at this time.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Filter Controls */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-900">Recommended Ideas</h3>
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
      <div className="text-sm text-gray-600">
        Showing {filteredRecommendations.length} of {recommendations.length} recommendations
        {minMatchScore > 0 && (
          <span> (filtered: {Math.round(minMatchScore * 100)}%+ match)</span>
        )}
      </div>

      {filteredRecommendations.length === 0 ? (
        <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
          <p>No matches found above {Math.round(minMatchScore * 100)}% threshold.</p>
          <p className="text-sm mt-1">Try lowering the minimum match score.</p>
        </div>
      ) : (
        filteredRecommendations.map((rec) => (
          <div
            key={rec._id}
            className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 pr-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-900">{rec.title}</h4>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      rec.status === 'looking_for_collaborators'
                        ? 'bg-blue-100 text-blue-800'
                        : rec.status === 'in_progress'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {rec.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{rec.shortSummary}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap text-xs text-gray-500">
                  <span className="font-medium text-gray-700">Owner:</span>
                  <span>{rec.owner?.name || 'Unknown'}</span>
                  {rec.owner?.trustBadges && rec.owner.trustBadges.length > 0 && (
                    <TrustBadges badges={rec.owner.trustBadges} size="sm" />
                  )}
                  {rec.owner?.reputationScore !== undefined && (
                    <ReputationDisplay
                      reputationScore={rec.owner.reputationScore || 0}
                      averageRating={rec.owner.averageRating || 0}
                      totalRatings={rec.owner.totalRatings || 0}
                      size="sm"
                    />
                  )}
                  {rec.owner?.completedCollaborations !== undefined &&
                    rec.owner.completedCollaborations > 0 && (
                      <span className="text-xs text-gray-500">
                        {rec.owner.completedCollaborations} collaboration
                        {rec.owner.completedCollaborations !== 1 ? 's' : ''}
                      </span>
                    )}
                </div>
              </div>
              <div className="text-right">
                <div
                  className={`${getMatchScoreColor(rec.matchScore)} px-3 py-2 rounded-lg border-2 font-semibold text-sm shadow-sm`}
                >
                  <div className="text-xs font-medium mb-0.5">{getMatchScoreLabel(rec.matchScore)}</div>
                  <div className="text-lg">{Math.round(rec.matchScore * 100)}%</div>
                  <div className="text-xs font-normal mt-0.5">Compatibility</div>
                </div>
              </div>
            </div>

            {/* Recommendation Reasons */}
            {rec.reasons && rec.reasons.length > 0 && (
              <div className="mb-3 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                <p className="text-xs font-semibold text-indigo-900 mb-2 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
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

            {/* Required Skills - Visual Tags */}
            {rec.requiredSkills.length > 0 && (
              <div className="mb-2">
                <div className="flex items-center gap-1 mb-1.5">
                  <svg className="w-3.5 h-3.5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <span className="text-xs font-semibold text-gray-700">Required Skills:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {rec.requiredSkills.slice(0, 5).map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 text-xs rounded-full font-medium border border-purple-200 flex items-center gap-1"
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {skill}
                    </span>
                  ))}
                  {rec.requiredSkills.length > 5 && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                      +{rec.requiredSkills.length - 5}
                    </span>
                  )}
                </div>
              </div>
            )}
            
            {/* Tags */}
            {rec.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {rec.tags.slice(0, 4).map((tag, idx) => (
                  <span
                    key={`tag-${idx}`}
                    className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded-full border border-indigo-100"
                  >
                    #{tag}
                  </span>
                ))}
                {rec.tags.length > 4 && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                    +{rec.tags.length - 4}
                  </span>
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

