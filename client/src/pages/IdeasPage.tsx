import { useEffect, useState } from 'react';
import { useToast } from '../hooks/useToast';
import api, { getFileUrl } from '../utils/api';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import { IdeaCardSkeleton } from '../components/LoadingSkeleton';
import TrustBadges from '../components/TrustBadges';
import ReputationDisplay from '../components/ReputationDisplay';

interface Idea {
  _id: string;
  title: string;
  shortSummary: string;
  description: string;
  tags: string[];
  requiredSkills: string[];
  images?: string[];
  videos?: string[];
  visibility: 'public' | 'summary_with_protected_details';
  status: 'looking_for_collaborators' | 'in_progress' | 'completed';
  owner: {
    _id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    reputationScore?: number;
    averageRating?: number;
    totalRatings?: number;
    trustBadges?: string[];
    completedCollaborations?: number;
    emailVerified?: boolean;
  };
  collaborators: Array<{
    _id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    reputationScore?: number;
    averageRating?: number;
    totalRatings?: number;
    trustBadges?: string[];
    completedCollaborations?: number;
    emailVerified?: boolean;
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
  const [editingIdeaId, setEditingIdeaId] = useState<string | null>(null);
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCollabModal, setShowCollabModal] = useState(false);
  const [collabMessage, setCollabMessage] = useState('');
  const [collabResumeFile, setCollabResumeFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'my-ideas'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
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
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [selectedVideos, setSelectedVideos] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [videoPreviews, setVideoPreviews] = useState<string[]>([]);

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

  // Get unique tags and skills from all ideas
  const allTags = Array.from(new Set(ideas.flatMap((idea) => idea.tags))).sort();
  const allSkills = Array.from(new Set(ideas.flatMap((idea) => idea.requiredSkills))).sort();

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + selectedImages.length > 10) {
      showError('Maximum 10 images allowed');
      return;
    }
    setSelectedImages([...selectedImages, ...files]);
    
    // Create previews
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + selectedVideos.length > 5) {
      showError('Maximum 5 videos allowed');
      return;
    }
    setSelectedVideos([...selectedVideos, ...files]);
    
    // Create previews
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setVideoPreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const removeVideo = (index: number) => {
    setSelectedVideos(selectedVideos.filter((_, i) => i !== index));
    setVideoPreviews(videoPreviews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.shortSummary || !formData.description) {
      showError('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      
      // Create FormData for file uploads
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('shortSummary', formData.shortSummary);
      submitData.append('description', formData.description);
      submitData.append('visibility', formData.visibility);
      submitData.append('status', formData.status);
      
      formData.tags.forEach((tag) => {
        submitData.append('tags', tag);
      });
      
      formData.requiredSkills.forEach((skill) => {
        submitData.append('requiredSkills', skill);
      });
      
      selectedImages.forEach((image) => {
        submitData.append('images', image);
      });
      
      selectedVideos.forEach((video) => {
        submitData.append('videos', video);
      });

      // Use axios directly for FormData (api instance sets JSON header)
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const isEdit = editingIdeaId !== null;
      const url = isEdit ? `${apiUrl}/ideas/${editingIdeaId}` : `${apiUrl}/ideas`;
      
      const response = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: submitData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${isEdit ? 'update' : 'create'} idea`);
      }

      showSuccess(`Idea ${isEdit ? 'updated' : 'created'} successfully!`);
      setShowCreateModal(false);
      setEditingIdeaId(null);
      setFormData({
        title: '',
        shortSummary: '',
        description: '',
        tags: [],
        requiredSkills: [],
        visibility: 'public',
        status: 'looking_for_collaborators',
      });
      setSelectedImages([]);
      setSelectedVideos([]);
      setImagePreviews([]);
      setVideoPreviews([]);
      fetchIdeas();
      if (isEdit && selectedIdea?._id === editingIdeaId) {
        setShowDetailModal(false);
        setSelectedIdea(null);
      }
    } catch (err: any) {
      const errorMessage = err.message || `Failed to ${editingIdeaId ? 'update' : 'create'} idea`;
      showError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingIdeaId(null);
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
    setSelectedImages([]);
    setSelectedVideos([]);
    setImagePreviews([]);
    setVideoPreviews([]);
  };

  const handleEditIdea = async (ideaId: string) => {
    try {
      const response = await api.get(`/ideas/${ideaId}`);
      const idea = response.data;
      
      setEditingIdeaId(ideaId);
      setFormData({
        title: idea.title || '',
        shortSummary: idea.shortSummary || '',
        description: idea.description || '',
        tags: idea.tags || [],
        requiredSkills: idea.requiredSkills || [],
        visibility: idea.visibility || 'public',
        status: idea.status || 'looking_for_collaborators',
      });
      
      // Set existing images/videos as previews
      if (idea.images && idea.images.length > 0) {
        setImagePreviews(idea.images.map((url: string) => getFileUrl(url)));
      }
      if (idea.videos && idea.videos.length > 0) {
        setVideoPreviews(idea.videos.map((url: string) => getFileUrl(url)));
      }
      
      setShowCreateModal(true);
      setShowDetailModal(false);
    } catch (err: any) {
      showError(err.response?.data?.error || 'Failed to load idea for editing');
    }
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
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('ideaId', selectedIdea._id);
      formData.append('message', collabMessage);
      if (collabResumeFile) {
        formData.append('resume', collabResumeFile);
      }

      // Use axios with FormData (will automatically set Content-Type to multipart/form-data)
      const token = localStorage.getItem('token');
      await api.post('/collab-requests', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      
      showSuccess('Collaboration request sent successfully!');
      setShowCollabModal(false);
      setCollabMessage('');
      setCollabResumeFile(null);
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
      <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <div className="h-8 bg-gray-200 rounded w-48 mb-4 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <IdeaCardSkeleton key={i} />
            ))}
          </div>
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
            {/* Search Bar */}
            <div className="relative flex-1 sm:flex-none sm:w-64">
              <input
                type="text"
                placeholder="Search ideas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <svg
                className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
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
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 sm:px-4 py-2 rounded-md transition-colors text-sm sm:text-base flex-1 sm:flex-none ${
                showFilters || statusFilter !== 'all' || selectedTags.length > 0 || selectedSkills.length > 0
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {showFilters ? 'Hide Filters' : 'Filters'}
              {(statusFilter !== 'all' || selectedTags.length > 0 || selectedSkills.length > 0) && (
                <span className="ml-1 bg-white text-indigo-600 rounded-full px-1.5 py-0.5 text-xs">
                  {[statusFilter !== 'all' ? 1 : 0, selectedTags.length, selectedSkills.length].reduce((a, b) => a + b, 0)}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
              <button
                onClick={() => {
                  setStatusFilter('all');
                  setSelectedTags([]);
                  setSelectedSkills([]);
                }}
                className="text-sm text-indigo-600 hover:text-indigo-700"
              >
                Clear All
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="looking_for_collaborators">Looking for Collaborators</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* Tags Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Type to filter by tags..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                        const tag = e.currentTarget.value.trim();
                        if (!selectedTags.includes(tag)) {
                          setSelectedTags([...selectedTags, tag]);
                        }
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  {allTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                      {allTags
                        .filter((tag) => !selectedTags.includes(tag))
                        .slice(0, 10)
                        .map((tag) => (
                          <button
                            key={tag}
                            onClick={() => {
                              if (!selectedTags.includes(tag)) {
                                setSelectedTags([...selectedTags, tag]);
                              }
                            }}
                            className="px-2 py-1 text-xs rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                          >
                            + {tag}
                          </button>
                        ))}
                    </div>
                  )}
                  {selectedTags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedTags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                        >
                          {tag}
                          <button
                            onClick={() => setSelectedTags(selectedTags.filter((t) => t !== tag))}
                            className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-indigo-400 hover:bg-indigo-200 hover:text-indigo-500"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Required Skills Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Required Skills
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Type to filter by skills..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                        const skill = e.currentTarget.value.trim();
                        if (!selectedSkills.includes(skill)) {
                          setSelectedSkills([...selectedSkills, skill]);
                        }
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  {allSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                      {allSkills
                        .filter((skill) => !selectedSkills.includes(skill))
                        .slice(0, 10)
                        .map((skill) => (
                          <button
                            key={skill}
                            onClick={() => {
                              if (!selectedSkills.includes(skill)) {
                                setSelectedSkills([...selectedSkills, skill]);
                              }
                            }}
                            className="px-2 py-1 text-xs rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                          >
                            + {skill}
                          </button>
                        ))}
                    </div>
                  )}
                  {selectedSkills.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedSkills.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                        >
                          {skill}
                          <button
                            onClick={() => setSelectedSkills(selectedSkills.filter((s) => s !== skill))}
                            className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-green-400 hover:bg-green-200 hover:text-green-500"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {ideas.length === 0 ? (
          <EmptyState
            icon="💡"
            title="No Ideas Yet"
            description={
              isAuthenticated
                ? "Be the first to share an idea! Click 'Create Idea' to get started."
                : "No ideas found. Sign in to create and share your ideas with the community."
            }
            action={
              isAuthenticated
                ? {
                    label: 'Create Your First Idea',
                    onClick: () => setShowCreateModal(true),
                  }
                : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ideas
              .filter((idea) => {
                // Filter by my ideas
                if (filter === 'my-ideas' && currentUser) {
                  if (idea.owner._id !== currentUser.id) return false;
                }
                // Filter by status
                if (statusFilter !== 'all') {
                  if (idea.status !== statusFilter) return false;
                }
                // Filter by tags
                if (selectedTags.length > 0) {
                  const hasMatchingTag = selectedTags.some((tag) =>
                    idea.tags.some((ideaTag) => ideaTag.toLowerCase() === tag.toLowerCase())
                  );
                  if (!hasMatchingTag) return false;
                }
                // Filter by required skills
                if (selectedSkills.length > 0) {
                  const hasMatchingSkill = selectedSkills.some((skill) =>
                    idea.requiredSkills.some((ideaSkill) => ideaSkill.toLowerCase() === skill.toLowerCase())
                  );
                  if (!hasMatchingSkill) return false;
                }
                // Filter by search query
                if (searchQuery.trim()) {
                  const query = searchQuery.toLowerCase();
                  return (
                    idea.title.toLowerCase().includes(query) ||
                    idea.shortSummary.toLowerCase().includes(query) ||
                    idea.description.toLowerCase().includes(query) ||
                    idea.tags.some((tag) => tag.toLowerCase().includes(query)) ||
                    idea.requiredSkills.some((skill) => skill.toLowerCase().includes(query))
                  );
                }
                return true;
              })
              .map((idea) => (
              <div
                key={idea._id}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 border border-gray-100"
                onClick={() => handleViewIdea(idea._id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900 flex-1 pr-2 line-clamp-2">{idea.title}</h3>
                  <StatusBadge status={idea.status} size="sm" />
                </div>
                <p className="text-gray-600 mb-4 line-clamp-3 text-sm leading-relaxed">{idea.shortSummary}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {idea.tags.slice(0, 3).map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 text-xs rounded-full font-medium border border-indigo-100"
                    >
                      #{tag}
                    </span>
                  ))}
                  {idea.tags.length > 3 && (
                    <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      +{idea.tags.length - 3} more
                    </span>
                  )}
                </div>
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="h-6 w-6 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 flex items-center justify-center text-white text-xs font-semibold">
                        {idea.owner.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{idea.owner.name}</span>
                        {idea.owner.emailVerified && (
                          <span className="text-green-600 text-xs" title="Email Verified">✓</span>
                        )}
                        {idea.owner.trustBadges && idea.owner.trustBadges.length > 0 && (
                          <TrustBadges badges={idea.owner.trustBadges} size="sm" />
                        )}
                      </div>
                    </div>
                    <span className="text-gray-400">{new Date(idea.createdAt).toLocaleDateString()}</span>
                  </div>
                  {(idea.owner.reputationScore !== undefined || idea.owner.completedCollaborations !== undefined) && (
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      {idea.owner.reputationScore !== undefined && (
                        <ReputationDisplay
                          reputationScore={idea.owner.reputationScore || 0}
                          averageRating={idea.owner.averageRating || 0}
                          totalRatings={idea.owner.totalRatings || 0}
                          size="sm"
                        />
                      )}
                      {idea.owner.completedCollaborations !== undefined && idea.owner.completedCollaborations > 0 && (
                        <span className="text-gray-500">
                          {idea.owner.completedCollaborations} collaboration{idea.owner.completedCollaborations !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                {idea.collaborators.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <span>🤝</span>
                      <span>{idea.collaborators.length} collaborator{idea.collaborators.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                )}
                {isOwner(idea) && (
                  <div className="mt-3 pt-3 border-t border-gray-200 flex flex-col gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditIdea(idea._id);
                      }}
                      className="w-full px-3 py-2.5 sm:py-1.5 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition-colors min-h-[44px] sm:min-h-0"
                    >
                      Edit Idea
                    </button>
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
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                    {editingIdeaId ? 'Edit Idea' : 'Create New Idea'}
                  </h2>
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

                  {/* Images Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Images (Optional, max 10)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Supported formats: JPEG, PNG, GIF, WebP (max 10MB per image)
                    </p>
                    {imagePreviews.length > 0 && (
                      <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {imagePreviews.map((preview, idx) => (
                          <div key={idx} className="relative group">
                            <img
                              src={preview}
                              alt={`Preview ${idx + 1}`}
                              className="w-full h-32 object-cover rounded-md border border-gray-200"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(idx)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Videos Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Videos (Optional, max 5)
                    </label>
                    <input
                      type="file"
                      accept="video/*"
                      multiple
                      onChange={handleVideoChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Supported formats: MP4, MPEG, MOV, AVI, WebM (max 100MB per video)
                    </p>
                    {videoPreviews.length > 0 && (
                      <div className="mt-3 space-y-3">
                        {videoPreviews.map((preview, idx) => (
                          <div key={idx} className="relative group">
                            <video
                              src={preview}
                              controls
                              className="w-full h-48 rounded-md border border-gray-200"
                            />
                            <button
                              type="button"
                              onClick={() => removeVideo(idx)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
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
                      {submitting 
                        ? (editingIdeaId ? 'Updating...' : 'Creating...') 
                        : (editingIdeaId ? 'Update Idea' : 'Create Idea')}
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
                    <div className="space-y-2">
                      <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span>By <strong>{selectedIdea.owner.name}</strong></span>
                          {selectedIdea.owner.emailVerified && (
                            <span className="text-green-600 text-xs" title="Email Verified">✓</span>
                          )}
                          {selectedIdea.owner.trustBadges && selectedIdea.owner.trustBadges.length > 0 && (
                            <TrustBadges badges={selectedIdea.owner.trustBadges} size="sm" />
                          )}
                        </div>
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
                      {(selectedIdea.owner.reputationScore !== undefined || selectedIdea.owner.completedCollaborations !== undefined) && (
                        <div className="flex items-center gap-3 flex-wrap text-xs">
                          {selectedIdea.owner.reputationScore !== undefined && (
                            <ReputationDisplay
                              reputationScore={selectedIdea.owner.reputationScore || 0}
                              averageRating={selectedIdea.owner.averageRating || 0}
                              totalRatings={selectedIdea.owner.totalRatings || 0}
                              size="sm"
                            />
                          )}
                          {selectedIdea.owner.completedCollaborations !== undefined && selectedIdea.owner.completedCollaborations > 0 && (
                            <span className="text-gray-500">
                              {selectedIdea.owner.completedCollaborations} completed collaboration{selectedIdea.owner.completedCollaborations !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      )}
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

                  {/* Images */}
                  {selectedIdea.images && selectedIdea.images.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Images</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {selectedIdea.images.map((imageUrl, idx) => (
                          <div key={idx} className="relative">
                            <img
                              src={getFileUrl(imageUrl)}
                              alt={`Idea image ${idx + 1}`}
                              className="w-full h-auto rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => window.open(getFileUrl(imageUrl), '_blank')}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Videos */}
                  {selectedIdea.videos && selectedIdea.videos.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Videos</h3>
                      <div className="space-y-4">
                        {selectedIdea.videos.map((videoUrl, idx) => (
                          <div key={idx} className="relative">
                            <video
                              src={getFileUrl(videoUrl)}
                              controls
                              className="w-full h-auto rounded-lg border border-gray-200"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

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
                      <div className="space-y-3">
                        {selectedIdea.collaborators.map((collab, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-green-400 to-emerald-400 flex items-center justify-center text-white font-semibold">
                              {collab.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-gray-900">{collab.name}</span>
                                {collab.emailVerified && (
                                  <span className="text-green-600 text-xs" title="Email Verified">✓</span>
                                )}
                                {collab.trustBadges && collab.trustBadges.length > 0 && (
                                  <TrustBadges badges={collab.trustBadges} size="sm" />
                                )}
                              </div>
                              {(collab.reputationScore !== undefined || collab.completedCollaborations !== undefined) && (
                                <div className="flex items-center gap-2 mt-1 flex-wrap text-xs">
                                  {collab.reputationScore !== undefined && (
                                    <ReputationDisplay
                                      reputationScore={collab.reputationScore || 0}
                                      averageRating={collab.averageRating || 0}
                                      totalRatings={collab.totalRatings || 0}
                                      size="sm"
                                    />
                                  )}
                                  {collab.completedCollaborations !== undefined && collab.completedCollaborations > 0 && (
                                    <span className="text-gray-500">
                                      {collab.completedCollaborations} collaboration{collab.completedCollaborations !== 1 ? 's' : ''}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                    {isOwner(selectedIdea) && (
                      <>
                        <button
                          onClick={() => handleEditIdea(selectedIdea._id)}
                          className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                        >
                          Edit Idea
                        </button>
                        <button
                          onClick={() => handleDeleteIdea(selectedIdea._id)}
                          disabled={deleting === selectedIdea._id}
                          className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          {deleting === selectedIdea._id ? 'Deleting...' : 'Delete Idea'}
                        </button>
                      </>
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
                      setCollabResumeFile(null);
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Resume (Optional)
                    </label>
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
                          setCollabResumeFile(file);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                    {collabResumeFile && (
                      <p className="text-xs text-gray-600 mt-1">
                        Selected: {collabResumeFile.name} ({(collabResumeFile.size / 1024).toFixed(1)} KB)
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Upload PDF, DOC, or DOCX file (max 5MB)
                    </p>
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

