import { useEffect, useState } from 'react';
import { useToast } from '../hooks/useToast';
import api from '../utils/api';

interface Idea {
  _id: string;
  title: string;
  shortSummary: string;
  description: string;
  tags: string[];
  requiredSkills: string[];
  visibility: 'public' | 'summary_with_protected_details';
  status: 'looking_for_collaborators' | 'in_progress' | 'completed';
  owner: {
    _id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  collaborators: Array<{
    _id: string;
    name: string;
    email: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCollabModal, setShowCollabModal] = useState(false);
  const [collabMessage, setCollabMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'my-ideas'>('all');
  const { showError, showSuccess } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    shortSummary: '',
    description: '',
    tags: [] as string[],
    requiredSkills: [] as string[],
    visibility: 'public' as 'public' | 'summary_with_protected_details',
    status: 'looking_for_collaborators' as 'looking_for_collaborators' | 'in_progress' | 'completed',
  });

  const [tagInput, setTagInput] = useState('');
  const [skillInput, setSkillInput] = useState('');

  useEffect(() => {
    // Check authentication and get user
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
    if (token) {
      fetchCurrentUser();
    }
    fetchIdeas();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/auth/me');
      setCurrentUser(response.data);
    } catch (err) {
      // User not authenticated
      setCurrentUser(null);
    }
  };

  const fetchIdeas = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/ideas');
      setIdeas(response.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to load ideas';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  const handleAddSkill = () => {
    if (skillInput.trim() && !formData.requiredSkills.includes(skillInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        requiredSkills: [...prev.requiredSkills, skillInput.trim()],
      }));
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      requiredSkills: prev.requiredSkills.filter((s) => s !== skill),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.shortSummary || !formData.description) {
      showError('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/ideas', formData);
      showSuccess('Idea created successfully!');
      setShowCreateModal(false);
      setFormData({
        title: '',
        shortSummary: '',
        description: '',
        tags: [],
        requiredSkills: [],
        visibility: 'public',
        status: 'looking_for_collaborators',
      });
      fetchIdeas();
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to create idea';
      showError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setFormData({
      title: '',
      shortSummary: '',
      description: '',
      tags: [],
      requiredSkills: [],
      visibility: 'public',
      status: 'looking_for_collaborators',
    });
    setTagInput('');
    setSkillInput('');
  };

  const handleViewIdea = async (ideaId: string) => {
    try {
      const response = await api.get(`/ideas/${ideaId}`);
      setSelectedIdea(response.data);
      setShowDetailModal(true);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to load idea details';
      showError(errorMessage);
    }
  };

  const handleDeleteIdea = async (ideaId: string) => {
    if (!window.confirm('Are you sure you want to delete this idea? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleting(ideaId);
      await api.delete(`/ideas/${ideaId}`);
      showSuccess('Idea deleted successfully');
      fetchIdeas();
      if (selectedIdea?._id === ideaId) {
        setShowDetailModal(false);
        setSelectedIdea(null);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to delete idea';
      showError(errorMessage);
    } finally {
      setDeleting(null);
    }
  };

  const handleSendCollabRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIdea || !collabMessage.trim()) {
      showError('Please enter a message');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/collab-requests', {
        ideaId: selectedIdea._id,
        message: collabMessage,
      });
      showSuccess('Collaboration request sent successfully!');
      setShowCollabModal(false);
      setCollabMessage('');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to send collaboration request';
      showError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const isOwner = (idea: Idea) => {
    return currentUser && idea.owner._id === currentUser.id;
  };

  const isCollaborator = (idea: Idea) => {
    return currentUser && idea.collaborators.some((c) => c._id === currentUser.id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600">Loading ideas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Ideas</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchIdeas}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Ideas</h1>
          <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
            {isAuthenticated && (
              <>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-3 sm:px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm sm:text-base flex-1 sm:flex-none"
                >
                  + Create Idea
                </button>
                <div className="flex border border-gray-300 rounded-md overflow-hidden flex-1 sm:flex-none">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors ${
                      filter === 'all'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    All Ideas
                  </button>
                  <button
                    onClick={() => setFilter('my-ideas')}
                    className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors ${
                      filter === 'my-ideas'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    My Ideas
                  </button>
                </div>
              </>
            )}
            <button
              onClick={fetchIdeas}
              className="px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm sm:text-base flex-1 sm:flex-none"
            >
              Refresh
            </button>
          </div>
        </div>

        {ideas.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">No ideas found. Be the first to share an idea!</p>
            {!isAuthenticated && (
              <p className="text-gray-400 text-sm">
                <a href="/login" className="text-indigo-600 hover:text-indigo-700">
                  Sign in
                </a> to create ideas
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ideas
              .filter((idea) => {
                if (filter === 'my-ideas' && currentUser) {
                  return idea.owner._id === currentUser.id;
                }
                return true;
              })
              .map((idea) => (
              <div
                key={idea._id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleViewIdea(idea._id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-semibold text-gray-900">{idea.title}</h3>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      idea.status === 'looking_for_collaborators'
                        ? 'bg-blue-100 text-blue-800'
                        : idea.status === 'in_progress'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {idea.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-gray-600 mb-4 line-clamp-3">{idea.shortSummary}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {idea.tags.slice(0, 3).map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>By {idea.owner.name}</span>
                  <span>{new Date(idea.createdAt).toLocaleDateString()}</span>
                </div>
                {isOwner(idea) && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteIdea(idea._id);
                      }}
                      disabled={deleting === idea._id}
                      className="w-full px-3 py-2.5 sm:py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 min-h-[44px] sm:min-h-0"
                    >
                      {deleting === idea._id ? 'Deleting...' : 'Delete Idea'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Create Idea Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
              <div className="p-4 sm:p-6">
                <div className="flex justify-between items-center mb-4 sm:mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Create New Idea</h2>
                  <button
                    onClick={handleCloseModal}
                    className="text-gray-400 hover:text-gray-600 text-2xl sm:text-3xl"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter idea title"
                    />
                  </div>

                  {/* Short Summary */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Short Summary <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.shortSummary}
                      onChange={(e) => setFormData((prev) => ({ ...prev, shortSummary: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Brief summary of your idea"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={formData.description}
                      onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Detailed description of your idea"
                    />
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tags
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Add a tag and press Enter"
                      />
                      <button
                        type="button"
                        onClick={handleAddTag}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-2 text-indigo-600 hover:text-indigo-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Required Skills */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Required Skills
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Add a skill and press Enter"
                      />
                      <button
                        type="button"
                        onClick={handleAddSkill}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.requiredSkills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(skill)}
                            className="ml-2 text-purple-600 hover:text-purple-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Visibility */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Visibility
                    </label>
                    <select
                      value={formData.visibility}
                      onChange={(e) => setFormData((prev) => ({ ...prev, visibility: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="public">Public - Anyone can see full details</option>
                      <option value="summary_with_protected_details">Protected - Summary visible, details require NDA</option>
                    </select>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="looking_for_collaborators">Looking for Collaborators</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex gap-4 pt-4">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Creating...' : 'Create Idea'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Idea Detail Modal */}
        {showDetailModal && selectedIdea && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
              <div className="p-4 sm:p-6">
                <div className="flex justify-between items-start mb-4 sm:mb-6 gap-2">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 break-words">{selectedIdea.title}</h2>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>By {selectedIdea.owner.name}</span>
                      <span>•</span>
                      <span>{new Date(selectedIdea.createdAt).toLocaleDateString()}</span>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          selectedIdea.status === 'looking_for_collaborators'
                            ? 'bg-blue-100 text-blue-800'
                            : selectedIdea.status === 'in_progress'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {selectedIdea.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      setSelectedIdea(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Summary */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Summary</h3>
                    <p className="text-gray-700">{selectedIdea.shortSummary}</p>
                  </div>

                  {/* Description */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedIdea.description}</p>
                  </div>

                  {/* Tags */}
                  {selectedIdea.tags.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedIdea.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Required Skills */}
                  {selectedIdea.requiredSkills.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Required Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedIdea.requiredSkills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Collaborators */}
                  {selectedIdea.collaborators.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Collaborators</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedIdea.collaborators.map((collab, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                          >
                            {collab.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                    {isOwner(selectedIdea) && (
                      <button
                        onClick={() => handleDeleteIdea(selectedIdea._id)}
                        disabled={deleting === selectedIdea._id}
                        className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        {deleting === selectedIdea._id ? 'Deleting...' : 'Delete Idea'}
                      </button>
                    )}
                    {isAuthenticated && !isOwner(selectedIdea) && !isCollaborator(selectedIdea) && selectedIdea.status === 'looking_for_collaborators' && (
                      <button
                        onClick={() => setShowCollabModal(true)}
                        className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                      >
                        Request Collaboration
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Collaboration Request Modal */}
        {showCollabModal && selectedIdea && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
              <div className="p-4 sm:p-6">
                <div className="flex justify-between items-center mb-4 sm:mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Request Collaboration</h2>
                  <button
                    onClick={() => {
                      setShowCollabModal(false);
                      setCollabMessage('');
                    }}
                    className="text-gray-400 hover:text-gray-600 text-2xl sm:text-3xl"
                  >
                    ×
                  </button>
                </div>

                <div className="mb-4">
                  <p className="text-gray-700 mb-2">
                    <span className="font-semibold">Idea:</span> {selectedIdea.title}
                  </p>
                  <p className="text-gray-600 text-sm">
                    Send a message to {selectedIdea.owner.name} explaining why you'd like to collaborate on this idea.
                  </p>
                </div>

                <form onSubmit={handleSendCollabRequest} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={collabMessage}
                      onChange={(e) => setCollabMessage(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Tell them about your skills, experience, and why you're interested in collaborating..."
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Sending...' : 'Send Request'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCollabModal(false);
                        setCollabMessage('');
                      }}
                      className="w-full sm:w-auto px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

