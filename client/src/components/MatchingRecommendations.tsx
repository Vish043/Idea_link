import { useEffect, useState } from 'react';
import api from '../utils/api';
import TrustBadges from './TrustBadges';
import ReputationDisplay from './ReputationDisplay';
import { useToast } from '../hooks/useToast';

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
    trustBadges: string[];
    completedCollaborations: number;
  };
  matchScore: number;
  reasons: string[];
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
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Recommended Collaborators
      </h3>
      {recommendations.map((rec) => (
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
                  reputationScore={rec.user.reputationScore}
                  averageRating={rec.user.averageRating}
                  totalRatings={0}
                  size="sm"
                />
                {rec.user.bio && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{rec.user.bio}</p>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full font-semibold text-sm">
                {Math.round(rec.matchScore * 100)}% Match
              </div>
            </div>
          </div>

          {rec.reasons.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-1">Why this match:</p>
              <ul className="text-sm text-gray-700 space-y-1">
                {rec.reasons.slice(0, 3).map((reason, idx) => (
                  <li key={idx} className="flex items-start gap-1">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap gap-2 mb-3">
            {rec.user.skills.slice(0, 5).map((skill, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
              >
                {skill}
              </span>
            ))}
          </div>

          {onSelectUser && (
            <button
              onClick={() => onSelectUser(rec.user._id)}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium"
            >
              View Profile
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

