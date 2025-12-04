interface ReputationDisplayProps {
  reputationScore: number;
  averageRating: number;
  totalRatings: number;
  size?: 'sm' | 'md' | 'lg';
}

export default function ReputationDisplay({
  reputationScore,
  averageRating,
  totalRatings,
  size = 'md',
}: ReputationDisplayProps) {
  const getReputationColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const getReputationLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'New';
  };

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className={`flex items-center gap-2 ${sizeClasses[size]}`}>
      <div className="flex items-center gap-1">
        <span className="text-yellow-500">⭐</span>
        <span className="font-semibold">{averageRating.toFixed(1)}</span>
        {totalRatings > 0 && (
          <span className="text-gray-500">({totalRatings})</span>
        )}
      </div>
      <div className="flex items-center gap-1">
        <span className={`font-bold ${getReputationColor(reputationScore)}`}>
          {reputationScore}
        </span>
        <span className="text-gray-500">•</span>
        <span className={`${getReputationColor(reputationScore)}`}>
          {getReputationLabel(reputationScore)}
        </span>
      </div>
    </div>
  );
}

