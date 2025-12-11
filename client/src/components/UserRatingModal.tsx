import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useToast } from '../hooks/useToast';

interface UserRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  ratedUserId: string;
  ratedUserName: string;
  collaborationId?: string;
  onRatingSubmitted?: () => void;
}

interface ExistingRating {
  _id: string;
  rating: number;
  comment?: string;
  categories: {
    communication: number;
    reliability: number;
    skill: number;
    professionalism: number;
  };
}

export default function UserRatingModal({
  isOpen,
  onClose,
  ratedUserId,
  ratedUserName,
  collaborationId,
  onRatingSubmitted,
}: UserRatingModalProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [categories, setCategories] = useState({
    communication: 5,
    reliability: 5,
    skill: 5,
    professionalism: 5,
  });
  const [submitting, setSubmitting] = useState(false);
  const [existingRating, setExistingRating] = useState<ExistingRating | null>(null);
  const [checkingExisting, setCheckingExisting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { showError, showSuccess } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!rating || rating < 1 || rating > 5) {
      showError('Please select a rating between 1 and 5');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/ratings', {
        ratedUserId,
        collaborationId,
        rating,
        comment: comment.trim() || undefined,
        categories,
      });
      
      showSuccess('Rating submitted successfully!');
      onRatingSubmitted?.();
      handleClose();
    } catch (err: any) {
      showError(err.response?.data?.error || 'Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setRating(5);
    setComment('');
    setCategories({
      communication: 5,
      reliability: 5,
      skill: 5,
      professionalism: 5,
    });
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      checkExistingRating();
    } else {
      // Reset when modal closes
      setExistingRating(null);
      setRating(5);
      setComment('');
      setCategories({
        communication: 5,
        reliability: 5,
        skill: 5,
        professionalism: 5,
      });
    }
  }, [isOpen, ratedUserId, collaborationId]);

  const checkExistingRating = async () => {
    try {
      setCheckingExisting(true);
      const params = collaborationId ? `?collaborationId=${collaborationId}` : '';
      const response = await api.get(`/ratings/check/${ratedUserId}${params}`);
      
      if (response.data.exists && response.data.rating) {
        const existing = response.data.rating;
        setExistingRating(existing);
        setRating(existing.rating);
        setComment(existing.comment || '');
        setCategories(existing.categories || {
          communication: 5,
          reliability: 5,
          skill: 5,
          professionalism: 5,
        });
      } else {
        setExistingRating(null);
      }
    } catch (err: any) {
      // If error, assume no existing rating
      setExistingRating(null);
    } finally {
      setCheckingExisting(false);
    }
  };

  const handleDeleteRating = async () => {
    if (!existingRating) return;
    
    if (!window.confirm('Are you sure you want to delete this rating? You can then create a new rating.')) {
      return;
    }

    try {
      setDeleting(true);
      await api.delete(`/ratings/${existingRating._id}`);
      showSuccess('Rating deleted successfully. You can now create a new rating.');
      setExistingRating(null);
      // Reset to defaults
      setRating(5);
      setComment('');
      setCategories({
        communication: 5,
        reliability: 5,
        skill: 5,
        professionalism: 5,
      });
      onRatingSubmitted?.();
    } catch (err: any) {
      showError(err.response?.data?.error || 'Failed to delete rating');
    } finally {
      setDeleting(false);
    }
  };

  const handleCategoryChange = (category: keyof typeof categories, value: number) => {
    setCategories((prev) => ({ ...prev, [category]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Rate {ratedUserName}</h2>
              {existingRating && (
                <p className="text-sm text-amber-600 mt-1">
                  You have already rated this user. Delete to create a new rating.
                </p>
              )}
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 text-3xl"
            >
              ×
            </button>
          </div>

          {checkingExisting && (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
              <p className="text-sm text-gray-500 mt-2">Checking for existing rating...</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Overall Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Overall Rating <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-1 items-center">
                {[1, 2, 3, 4, 5].map((starNum) => (
                  <button
                    key={starNum}
                    type="button"
                    onClick={() => setRating(starNum)}
                    className="text-4xl transition-transform hover:scale-110"
                    title={`Set to ${starNum} star${starNum > 1 ? 's' : ''}`}
                  >
                    {starNum <= rating ? (
                      <span className="text-yellow-400">⭐</span>
                    ) : (
                      <span className="text-gray-400">☆</span>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </p>
            </div>

            {/* Category Ratings */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Category Ratings
              </label>
              <div className="space-y-4">
                {Object.entries(categories).map(([key, value]) => (
                  <div key={key}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {key}
                      </span>
                      <span className="text-sm text-gray-500">{value}/5</span>
                    </div>
                    <div className="flex gap-1 items-center">
                      {[1, 2, 3, 4, 5].map((starNum) => (
                        <button
                          key={starNum}
                          type="button"
                          onClick={() =>
                            handleCategoryChange(key as keyof typeof categories, starNum)
                          }
                          className="text-2xl transition-transform hover:scale-110"
                          title={`Set to ${starNum} star${starNum > 1 ? 's' : ''}`}
                        >
                          {starNum <= value ? (
                            <span className="text-yellow-400">⭐</span>
                          ) : (
                            <span className="text-gray-400">☆</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comment (Optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Share your experience working with this user..."
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              {existingRating && (
                <button
                  type="button"
                  onClick={handleDeleteRating}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Delete Rating'}
                </button>
              )}
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !!existingRating}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
                title={existingRating ? 'Delete existing rating first to create a new one' : ''}
              >
                {submitting ? 'Submitting...' : existingRating ? 'Delete to Re-rate' : 'Submit Rating'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

