interface TrustBadgesProps {
  badges: string[];
  size?: 'sm' | 'md' | 'lg';
}

const badgeConfig: Record<string, { icon: string; label: string; color: string }> = {
  email_verified: {
    icon: '✓',
    label: 'Email Verified',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  resume_uploaded: {
    icon: '📄',
    label: 'Resume Uploaded',
    color: 'bg-green-100 text-green-800 border-green-200',
  },
  active_collaborator: {
    icon: '🤝',
    label: 'Active Collaborator',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  idea_creator: {
    icon: '💡',
    label: 'Idea Creator',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  top_rated: {
    icon: '⭐',
    label: 'Top Rated',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  },
};

export default function TrustBadges({ badges, size = 'sm' }: TrustBadgesProps) {
  if (!badges || badges.length === 0) return null;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {badges.map((badge) => {
        const config = badgeConfig[badge];
        if (!config) return null;
        
        return (
          <span
            key={badge}
            className={`inline-flex items-center gap-1 rounded-full border font-medium ${config.color} ${sizeClasses[size]}`}
            title={config.label}
          >
            <span>{config.icon}</span>
            <span className="hidden sm:inline">{config.label}</span>
          </span>
        );
      })}
    </div>
  );
}

