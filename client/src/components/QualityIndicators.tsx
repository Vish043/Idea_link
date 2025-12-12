import ReputationDisplay from './ReputationDisplay';
import TrustBadges from './TrustBadges';

interface QualityIndicatorsProps {
  reputationScore?: number;
  averageRating?: number;
  totalRatings?: number;
  completedCollaborations?: number;
  responseRate?: number;
  trustBadges?: string[];
  emailVerified?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function QualityIndicators({
  reputationScore,
  averageRating,
  totalRatings,
  completedCollaborations,
  responseRate,
  trustBadges,
  emailVerified,
  size = 'md',
}: QualityIndicatorsProps) {
  const getResponseRateColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-blue-600';
    if (rate >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getResponseRateLabel = (rate: number) => {
    if (rate >= 80) return 'Excellent';
    if (rate >= 60) return 'Good';
    if (rate >= 40) return 'Fair';
    return 'Poor';
  };

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className="space-y-2">
      {/* Reputation & Rating */}
      {(reputationScore !== undefined || averageRating !== undefined) && (
        <div>
          <ReputationDisplay
            reputationScore={reputationScore || 0}
            averageRating={averageRating || 0}
            totalRatings={totalRatings || 0}
            size={size}
          />
        </div>
      )}

      {/* Trust Badges */}
      {trustBadges && trustBadges.length > 0 && (
        <div>
          <TrustBadges badges={trustBadges} size={size} />
        </div>
      )}

      {/* Quality Metrics */}
      <div className={`flex flex-wrap gap-3 ${sizeClasses[size]}`}>
        {/* Completed Collaborations */}
        {completedCollaborations !== undefined && completedCollaborations > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-gray-600">Collaborations:</span>
            <span className="font-semibold text-indigo-600">
              {completedCollaborations}
            </span>
          </div>
        )}

        {/* Response Rate */}
        {responseRate !== undefined && (
          <div className="flex items-center gap-1">
            <span className="text-gray-600">Response Rate:</span>
            <span className={`font-semibold ${getResponseRateColor(responseRate)}`}>
              {responseRate}%
            </span>
            <span className={`text-xs ${getResponseRateColor(responseRate)}`}>
              ({getResponseRateLabel(responseRate)})
            </span>
          </div>
        )}

        {/* Email Verified */}
        {emailVerified && (
          <div className="flex items-center gap-1">
            <span className="text-green-600 font-semibold">✓ Verified</span>
          </div>
        )}
      </div>
    </div>
  );
}

