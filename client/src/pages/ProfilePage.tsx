import { useEffect, useState } from 'react';
import { useToast } from '../hooks/useToast';
import api, { getFileUrl } from '../utils/api';
import { getImageUrl } from '../utils/imageUtils';
import PDFViewerModal from '../components/PDFViewerModal';
import TrustBadges from '../components/TrustBadges';
import ReputationDisplay from '../components/ReputationDisplay';
import UserRatingsList from '../components/UserRatingsList';
import QualityIndicators from '../components/QualityIndicators';

interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: 'student' | 'founder' | 'professional' | 'other';
  skills: string[];
  interests: string[];
  bio: string;
  avatarUrl: string;
  resumeUrl: string;
  reputationScore?: number;
  totalRatings?: number;
  averageRating?: number;
  trustBadges?: string[];
  completedCollaborations?: number;
  responseRate?: number;
  emailVerified?: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({});
  const [newSkill, setNewSkill] = useState('');
  const [newInterest, setNewInterest] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [pdfViewerUrl, setPdfViewerUrl] = useState<string>('');
  const [sendingVerification, setSendingVerification] = useState(false);
  const { showError, showSuccess } = useToast();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/me');
      setUser(response.data);
      setFormData(response.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to load profile';
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !formData.skills?.includes(newSkill.trim())) {
      setFormData((prev) => ({
        ...prev,
        skills: [...(prev.skills || []), newSkill.trim()],
      }));
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills?.filter((s) => s !== skill) || [],
    }));
  };

  const handleAddInterest = () => {
    if (newInterest.trim() && !formData.interests?.includes(newInterest.trim())) {
      setFormData((prev) => ({
        ...prev,
        interests: [...(prev.interests || []), newInterest.trim()],
      }));
      setNewInterest('');
    }
  };

  const handleRemoveInterest = (interest: string) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests?.filter((i) => i !== interest) || [],
    }));
  };

  const handleResumeUpload = async (file: File): Promise<string | null> => {
    try {
      setUploadingResume(true);
      const uploadFormData = new FormData();
      uploadFormData.append('resume', file);

      const token = localStorage.getItem('token');
      const response = await api.post('/uploads/resume', uploadFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data.fileUrl;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to upload resume';
      showError(errorMessage);
      return null;
    } finally {
      setUploadingResume(false);
    }
  };

  const handleAvatarUpload = async (file: File): Promise<string | null> => {
    try {
      setUploadingAvatar(true);
      const uploadFormData = new FormData();
      uploadFormData.append('avatar', file);

      const token = localStorage.getItem('token');
      const response = await api.post('/uploads/avatar', uploadFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data.fileUrl;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to upload avatar';
      showError(errorMessage);
      return null;
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Upload avatar file if selected
      let avatarUrl = formData.avatarUrl;
      if (avatarFile) {
        const uploadedUrl = await handleAvatarUpload(avatarFile);
        if (uploadedUrl) {
          avatarUrl = uploadedUrl;
        } else {
          return; // Stop if upload failed
        }
      }

      // Upload resume file if selected
      let resumeUrl = formData.resumeUrl;
      if (resumeFile) {
        const uploadedUrl = await handleResumeUpload(resumeFile);
        if (uploadedUrl) {
          resumeUrl = uploadedUrl;
        } else {
          return; // Stop if upload failed
        }
      }

      // Update profile with avatar and resume URLs
      const updateData = { ...formData, avatarUrl, resumeUrl };
      const response = await api.put('/users/me', updateData);
      setUser(response.data);
      setEditing(false);
      setResumeFile(null);
      setAvatarFile(null);
      setAvatarPreview(null);
      showSuccess('Profile updated successfully');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to update profile';
      showError(errorMessage);
    }
  };

  const handleCancel = () => {
    setFormData(user || {});
    setEditing(false);
    setResumeFile(null);
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  const handleRequestEmailVerification = async () => {
    try {
      setSendingVerification(true);
      const response = await api.post('/email-verification/send');
      
      if (response.data.token && process.env.NODE_ENV === 'development') {
        // In development, show the token
        showSuccess(`Verification link: ${response.data.verificationLink || 'Check console'}`);
        console.log('Verification Token:', response.data.token);
        console.log('Verification Link:', response.data.verificationLink);
      } else {
        showSuccess(response.data.message || 'Verification email sent! Please check your inbox.');
      }
      
      // Refresh profile to get updated status
      fetchProfile();
    } catch (err: any) {
      showError(err.response?.data?.error || 'Failed to send verification email');
    } finally {
      setSendingVerification(false);
    }
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (2MB limit)
      if (file.size > 2 * 1024 * 1024) {
        showError('Image size must be less than 2MB');
        e.target.value = '';
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        showError('Please select an image file');
        e.target.value = '';
        return;
      }

      setAvatarFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Failed to load profile</p>
          <button
            onClick={fetchProfile}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Profile</h1>
              {!editing && user && (
                <div className="mt-2">
                  <QualityIndicators
                    reputationScore={user.reputationScore}
                    averageRating={user.averageRating}
                    totalRatings={user.totalRatings}
                    completedCollaborations={user.completedCollaborations}
                    responseRate={user.responseRate}
                    trustBadges={user.trustBadges}
                    emailVerified={user.emailVerified}
                    size="md"
                  />
                </div>
              )}
            </div>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm sm:text-base w-full sm:w-auto"
              >
                Edit Profile
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name || ''}
                      onChange={handleInputChange}
                      disabled={!editing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email || ''}
                      onChange={handleInputChange}
                      disabled={!editing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <select
                      name="role"
                      value={formData.role || 'other'}
                      onChange={handleInputChange}
                      disabled={!editing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                    >
                      <option value="student">Student</option>
                      <option value="founder">Founder</option>
                      <option value="professional">Professional</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Profile Photo
                    </label>
                    {editing ? (
                      <>
                        <div className="mb-3">
                          <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                            onChange={handleAvatarFileChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                            disabled={uploadingAvatar}
                          />
                          {uploadingAvatar && (
                            <p className="text-xs text-blue-600 mt-1">Uploading photo...</p>
                          )}
                          {avatarFile && (
                            <p className="text-xs text-gray-600 mt-1">
                              Selected: {avatarFile.name} ({(avatarFile.size / 1024).toFixed(1)} KB)
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            Upload JPEG, PNG, GIF, or WebP image (max 2MB)
                          </p>
                        </div>
                        {(avatarPreview || formData.avatarUrl) && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-600 mb-1">Preview:</p>
                            <img
                              src={avatarPreview || getImageUrl(formData.avatarUrl)}
                              alt="Avatar preview"
                              className="w-20 h-20 rounded-full object-cover border-2 border-gray-300"
                            />
                          </div>
                        )}
                        {formData.avatarUrl && !avatarFile && (
                          <p className="text-xs text-gray-500 mt-2">
                            Or enter URL: <input
                              type="url"
                              name="avatarUrl"
                              value={formData.avatarUrl}
                              onChange={handleInputChange}
                              placeholder="https://example.com/avatar.jpg"
                              className="mt-1 w-full px-2 py-1 border border-gray-300 rounded text-xs"
                            />
                          </p>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center gap-3">
                        {formData.avatarUrl ? (
                          <img
                            src={getImageUrl(formData.avatarUrl)}
                            alt="Avatar"
                            className="w-16 h-16 rounded-full object-cover border-2 border-gray-300"
                            onError={(e) => {
                              // Fallback to initial if image fails to load
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-600">
                            {formData.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                        )}
                        {!formData.avatarUrl && (
                          <p className="text-sm text-gray-500">No photo uploaded</p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Resume
                    </label>
                    {editing ? (
                      <>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              // Check file size (5MB limit)
                              if (file.size > 5 * 1024 * 1024) {
                                showError('File size must be less than 5MB');
                                e.target.value = '';
                                return;
                              }
                              setResumeFile(file);
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                          disabled={uploadingResume}
                        />
                        {resumeFile && (
                          <p className="text-xs text-gray-600 mt-1">
                            New file: {resumeFile.name} ({(resumeFile.size / 1024).toFixed(1)} KB)
                          </p>
                        )}
                        {formData.resumeUrl && !resumeFile && (
                          <p className="text-xs text-gray-600 mt-1">
                            Current resume: <button
                              onClick={() => {
                                setPdfViewerUrl(getFileUrl(formData.resumeUrl));
                                setPdfViewerOpen(true);
                              }}
                              className="text-indigo-600 hover:text-indigo-700 underline"
                            >
                              View current resume
                            </button>
                          </p>
                        )}
                        {uploadingResume && (
                          <p className="text-xs text-blue-600 mt-1">Uploading resume...</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          Upload PDF, DOC, or DOCX file (max 5MB)
                        </p>
                      </>
                    ) : (
                      <>
                        {formData.resumeUrl ? (
                          <button
                            onClick={() => {
                              setPdfViewerUrl(getFileUrl(formData.resumeUrl));
                              setPdfViewerOpen(true);
                            }}
                            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm"
                          >
                            <svg
                              className="w-4 h-4 mr-2"
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
                          </button>
                        ) : (
                          <p className="text-sm text-gray-500">No resume uploaded</p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={formData.bio || ''}
                  onChange={handleInputChange}
                  disabled={!editing}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                  placeholder="Tell us about yourself..."
                />
              </div>

              {/* Skills */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Skills
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.skills?.map((skill, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm"
                    >
                      {skill}
                      {editing && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="ml-2 text-indigo-600 hover:text-indigo-800"
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ))}
                </div>
                {editing && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                      placeholder="Add a skill"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddSkill}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>

              {/* Interests */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interests
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.interests?.map((interest, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                    >
                      {interest}
                      {editing && (
                        <button
                          type="button"
                          onClick={() => handleRemoveInterest(interest)}
                          className="ml-2 text-purple-600 hover:text-purple-800"
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ))}
                </div>
                {editing && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newInterest}
                      onChange={(e) => setNewInterest(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddInterest())}
                      placeholder="Add an interest"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddInterest}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>

              {/* Account Info */}
              {!editing && (
                <div className="pt-4 border-t border-gray-200 space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Member since:</span>{' '}
                        {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="font-medium">Last updated:</span>{' '}
                        {new Date(user.updatedAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Email:</span>
                        {user.emailVerified ? (
                          <span className="text-green-600">✓ Verified</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-amber-600">Not Verified</span>
                            <button
                              onClick={handleRequestEmailVerification}
                              disabled={sendingVerification}
                              className="text-xs px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                            >
                              {sendingVerification ? 'Sending...' : 'Verify Email'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Ratings Section */}
                  {user && (user._id || user.id) && (
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-4">Ratings & Reviews</h2>
                      <UserRatingsList 
                        userId={user._id || user.id} 
                        maxDisplay={5}
                        onRatingDeleted={() => {
                          // Refresh user profile to update reputation
                          fetchProfile();
                        }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              {editing && (
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="w-full sm:w-auto px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
      
      {/* PDF Viewer Modal */}
      <PDFViewerModal
        isOpen={pdfViewerOpen}
        onClose={() => setPdfViewerOpen(false)}
        pdfUrl={pdfViewerUrl}
        filename={formData.resumeUrl ? formData.resumeUrl.split('/').pop() || 'Resume' : 'Resume'}
      />
    </div>
  );
}

