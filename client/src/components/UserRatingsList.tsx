import { useEffect, useState } from 'react';
import api from '../utils/api';
import { useToast } from '../hooks/useToast';
import { getImageUrl } from '../utils/imageUtils';

interface Rating {
  _id: string;
  rating: number;
  comment?: string;
  categories: {
    communication: number;
    reliability: number;
    skill: number;
    professionalism: number;
  };
  ratingUser: {
    _id: string;
    name: string;
    avatarUrl?: string;
  };
  collaborationId?: {
    _id: string;
    title: string;
  };
  createdAt: string;
}

interface UserRatingsListProps {
  userId: string;
  maxDisplay?: number;
  onRatingDeleted?: () => void;
}

export default function UserRatingsList({ userId, maxDisplay, onRatingDeleted }: UserRatingsListProps) {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [deletingRatingId, setDeletingRatingId] = useState<string | null>(null);
  const { showError, showSuccess } = useToast();

  useEffect(() => {
    fetchRatings();
    fetchCurrentUser();
  }, [userId]);

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/auth/me');
      setCurrentUserId(response.data._id || response.data.id);
    } catch (err) {
      // User not logged in or error - that's okay
    }
  };

  const fetchRatings = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/ratings/user/${userId}`);
      setRatings(response.data || []);
    } catch (err: any) {
      showError(err.response?.data?.error || 'Failed to load ratings');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRating = async (ratingId: string) => {
    if (!window.confirm('Are you sure you want to delete this rating? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingRatingId(ratingId);
      await api.delete(`/ratings/${ratingId}`);
      showSuccess('Rating deleted successfully');
      fetchRatings();
      onRatingDeleted?.();
    } catch (err: any) {
      showError(err.response?.data?.error || 'Failed to delete rating');
    } finally {
      setDeletingRatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (ratings.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No ratings yet.</p>
      </div>
    );
  }

  const displayedRatings = maxDisplay && !showAll ? ratings.slice(0, maxDisplay) : ratings;

  return (
    <div className="space-y-4">
      {displayedRatings.map((rating) => (
        <div
          key={rating._id}
          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start gap-3 mb-3">
            {rating.ratingUser.avatarUrl ? (
              <img
                src={getImageUrl(rating.ratingUser.avatarUrl)}
                alt={rating.ratingUser.name}
                className="w-10 h-10 rounded-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold">
                {rating.ratingUser.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-semibold text-gray-900">{rating.ratingUser.name}</h4>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-500">⭐</span>
                    <span className="font-semibold">{rating.rating}</span>
                    <span className="text-gray-400">/5</span>
                  </div>
                  {currentUserId && rating.ratingUser._id === currentUserId && (
                    <button
                      onClick={() => handleDeleteRating(rating._id)}
                      disabled={deletingRatingId === rating._id}
                      className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50"
                      title="Delete your rating"
                    >
                      {deletingRatingId === rating._id ? 'Deleting...' : 'Delete'}
                    </button>
                  )}
                </div>
              </div>
              {rating.collaborationId && (
                <p className="text-xs text-gray-500 mb-1">
                  Collaboration: {rating.collaborationId.title}
                </p>
              )}
              <p className="text-xs text-gray-500">
                {new Date(rating.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Category Ratings */}
          <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Communication:</span>
              <span className="font-medium">{rating.categories.communication}/5</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Reliability:</span>
              <span className="font-medium">{rating.categories.reliability}/5</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Skill:</span>
              <span className="font-medium">{rating.categories.skill}/5</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Professionalism:</span>
              <span className="font-medium">{rating.categories.professionalism}/5</span>
            </div>
          </div>

          {/* Comment */}
          {rating.comment && (
            <div className="pt-3 border-t border-gray-100">
              <p className="text-sm text-gray-700">{rating.comment}</p>
            </div>
          )}
        </div>
      ))}

      {maxDisplay && ratings.length > maxDisplay && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full py-2 text-indigo-600 hover:text-indigo-700 text-sm font-medium"
        >
          Show all {ratings.length} ratings →
        </button>
      )}
    </div>
  );
}

