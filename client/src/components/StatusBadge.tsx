interface StatusBadgeProps {
  status: 'looking_for_collaborators' | 'in_progress' | 'completed';
  size?: 'sm' | 'md' | 'lg';
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = {
    looking_for_collaborators: {
      label: 'Looking for Collaborators',
      className: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: '🔍',
    },
    in_progress: {
      label: 'In Progress',
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: '🚀',
    },
    completed: {
      label: 'Completed',
      className: 'bg-green-100 text-green-800 border-green-200',
      icon: '✅',
    },
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  const { label, className, icon } = config[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${className} ${sizeClasses[size]}`}
    >
      <span>{icon}</span>
      {label}
    </span>
  );
}

