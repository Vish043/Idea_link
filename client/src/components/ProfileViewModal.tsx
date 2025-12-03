import { useEffect, useState } from 'react';
import api from '../utils/api';
import { useToast } from '../hooks/useToast';
import { getImageUrl } from '../utils/imageUtils';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  skills: string[];
  interests: string[];
  bio: string;
  avatarUrl: string;
  resumeUrl?: string;
}

interface ProfileViewModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onStartChat?: (userId: string) => void;
}

export default function ProfileViewModal({ userId, isOpen, onClose, onStartChat }: ProfileViewModalProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { showError } = useToast();

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserProfile();
    }
  }, [isOpen, userId]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/users/${userId}`);
      setUser(response.data);
    } catch (err: any) {
      showError(err.response?.data?.error || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">User Profile</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl sm:text-3xl"
            >
              ×
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
              <p className="text-gray-600">Loading profile...</p>
            </div>
          ) : user ? (
            <div className="space-y-6">
              {/* Avatar and Basic Info */}
              <div className="flex items-start gap-3 sm:gap-4">
                {user.avatarUrl ? (
                  <img
                    src={getImageUrl(user.avatarUrl)}
                    alt={user.name}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover flex-shrink-0"
                    onError={(e) => {
                      // Fallback to initial if image fails to load
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-indigo-100 flex items-center justify-center text-xl sm:text-2xl font-bold text-indigo-600 flex-shrink-0">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 break-words">{user.name}</h3>
                  <p className="text-sm sm:text-base text-gray-600 break-words">{user.email}</p>
                  <span className="inline-block mt-2 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs sm:text-sm">
                    {user.role}
                  </span>
                </div>
              </div>

              {/* Bio */}
              {user.bio && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">About</h4>
                  <p className="text-gray-700">{user.bio}</p>
                </div>
              )}

              {/* Skills */}
              {user.skills && user.skills.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {user.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Interests */}
              {user.interests && user.interests.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Interests</h4>
                  <div className="flex flex-wrap gap-2">
                    {user.interests.map((interest, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Resume */}
              {user.resumeUrl && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Resume</h4>
                  <a
                    href={user.resumeUrl.startsWith('http') 
                      ? user.resumeUrl 
                      : `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}${user.resumeUrl.startsWith('/') ? '' : '/'}${user.resumeUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    View Resume
                  </a>
                </div>
              )}

              {/* Actions */}
              {onStartChat && (
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      onStartChat(userId);
                      onClose();
                    }}
                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                  >
                    Start Chat
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">Failed to load profile</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

