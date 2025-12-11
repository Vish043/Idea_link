import { useEffect, useState } from 'react';
import { useToast } from '../hooks/useToast';
import api, { getFileUrl } from '../utils/api';
import ProfileViewModal from '../components/ProfileViewModal';
import ChatModal from '../components/ChatModal';
import PDFViewerModal from '../components/PDFViewerModal';
import UserRatingModal from '../components/UserRatingModal';
import TrustBadges from '../components/TrustBadges';
import ReputationDisplay from '../components/ReputationDisplay';
import { DashboardStatsSkeleton } from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';

interface Idea {
  _id: string;
  title: string;
  shortSummary: string;
  status: 'looking_for_collaborators' | 'in_progress' | 'completed';
  collaborators: Array<{ _id: string; name: string }>;
  owner?: { _id: string; name: string };
  createdAt: string;
}

interface CollaborationRequest {
  _id: string;
  idea: {
    _id: string;
    title: string;
    shortSummary: string;
    owner?: {
      _id: string;
      name: string;
      reputationScore?: number;
      averageRating?: number;
      totalRatings?: number;
      trustBadges?: string[];
      completedCollaborations?: number;
      emailVerified?: boolean;
    };
  };
  sender: {
    _id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    skills: string[];
    interests: string[];
    reputationScore?: number;
    averageRating?: number;
    totalRatings?: number;
    trustBadges?: string[];
    completedCollaborations?: number;
    emailVerified?: boolean;
  };
  message: string;
  resumeUrl?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [myIdeas, setMyIdeas] = useState<Idea[]>([]);
  const [collaboratedIdeas, setCollaboratedIdeas] = useState<Idea[]>([]);
  const [collabRequests, setCollabRequests] = useState<CollaborationRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<CollaborationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingRequestId, setCancellingRequestId] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string | null>(null);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [pdfViewerUrl, setPdfViewerUrl] = useState<string>('');
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatType, setChatType] = useState<'personal' | 'group'>('personal');
  const [chatUserId, setChatUserId] = useState<string | null>(null);
  const [chatIdeaId, setChatIdeaId] = useState<string | null>(null);
  const [chatIdeaTitle, setChatIdeaTitle] = useState<string | null>(null);
  const [deletingIdeaId, setDeletingIdeaId] = useState<string | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingUserId, setRatingUserId] = useState<string | null>(null);
  const [ratingUserName, setRatingUserName] = useState<string | null>(null);
  const [ratingIdeaId, setRatingIdeaId] = useState<string | null>(null);
  const { showError, showSuccess } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch current user first
      const userResponse = await api.get('/auth/me');
      const currentUser = userResponse.data;
      setUser(currentUser);

      // Fetch user's ideas
      const ideasResponse = await api.get('/ideas');
      const allIdeas = ideasResponse.data;
      const userIdeas = allIdeas.filter(
        (idea: Idea & { owner: { _id: string } }) => 
          idea.owner._id === currentUser.id
      );
      setMyIdeas(userIdeas);

      // Fetch ideas where user is a collaborator (but not owner)
      const collabIdeas = allIdeas.filter(
        (idea: Idea & { owner: { _id: string } }) => {
          const isOwner = idea.owner._id === currentUser.id;
          const isCollaborator = idea.collaborators.some(
            (collab: { _id: string }) => collab._id === currentUser.id
          );
          return !isOwner && isCollaborator;
        }
      );
      setCollaboratedIdeas(collabIdeas);

      // Fetch collaboration requests (received)
      const requestsResponse = await api.get('/collab-requests/mine');
      setCollabRequests(requestsResponse.data);

      // Fetch collaboration requests (sent)
      const sentRequestsResponse = await api.get('/collab-requests/sent');
      setSentRequests(sentRequestsResponse.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to load dashboard';
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAction = async (requestId: string, action: 'accepted' | 'rejected') => {
    try {
      await api.patch(`/collab-requests/${requestId}`, { status: action });
      showSuccess(`Request ${action} successfully`);
      fetchDashboardData();
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to update request';
      showError(errorMessage);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    if (!window.confirm('Are you sure you want to cancel this collaboration request? This action cannot be undone.')) {
      return;
    }

    try {
      setCancellingRequestId(requestId);
      await api.delete(`/collab-requests/${requestId}`);
      showSuccess('Collaboration request cancelled successfully');
      fetchDashboardData();
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to cancel request';
      showError(errorMessage);
    } finally {
      setCancellingRequestId(null);
    }
  };

  const handleDeleteIdea = async (ideaId: string) => {
    if (!window.confirm('Are you sure you want to delete this idea? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingIdeaId(ideaId);
      await api.delete(`/ideas/${ideaId}`);
      showSuccess('Idea deleted successfully');
      fetchDashboardData();
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to delete idea';
      showError(errorMessage);
    } finally {
      setDeletingIdeaId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
          </div>
          <DashboardStatsSkeleton />
        </div>
      </div>
    );
  }

  const pendingRequests = collabRequests.filter((req) => req.status === 'pending');
  const activeIdeas = myIdeas.filter((idea) => idea.status !== 'completed').length;
  const totalCollaborators = myIdeas.reduce(
    (sum, idea) => sum + idea.collaborators.length,
    0
  );
  const totalCollaboratedIdeas = collaboratedIdeas.length;

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name || 'User'}!
          </h1>
          <p className="text-sm sm:text-base text-gray-600">Here's an overview of your activity</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl shadow-md p-4 sm:p-6 border border-indigo-200 hover:shadow-lg transition-all transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-700 text-xs sm:text-sm font-medium mb-1">My Ideas</p>
                <p className="text-2xl sm:text-3xl font-bold text-indigo-900">{myIdeas.length}</p>
              </div>
              <div className="text-3xl sm:text-4xl">💡</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-md p-4 sm:p-6 border border-purple-200 hover:shadow-lg transition-all transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-700 text-xs sm:text-sm font-medium mb-1">Collaborated Ideas</p>
                <p className="text-2xl sm:text-3xl font-bold text-purple-900">{totalCollaboratedIdeas}</p>
              </div>
              <div className="text-3xl sm:text-4xl">🤝</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl shadow-md p-4 sm:p-6 border border-yellow-200 hover:shadow-lg transition-all transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-700 text-xs sm:text-sm font-medium mb-1">Active Ideas</p>
                <p className="text-2xl sm:text-3xl font-bold text-yellow-900">{activeIdeas}</p>
              </div>
              <div className="text-3xl sm:text-4xl">🚀</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-md p-4 sm:p-6 border border-green-200 hover:shadow-lg transition-all transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-700 text-xs sm:text-sm font-medium mb-1">Collaborators</p>
                <p className="text-2xl sm:text-3xl font-bold text-green-900">{totalCollaborators}</p>
              </div>
              <div className="text-3xl sm:text-4xl">👥</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
          {/* My Ideas Section */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">My Ideas</h2>
              <div className="flex gap-2">
                <a
                  href="/ideas"
                  className="text-xs sm:text-sm text-indigo-600 hover:text-indigo-700"
                >
                  View All →
                </a>
                <button
                  onClick={fetchDashboardData}
                  className="text-xs sm:text-sm text-indigo-600 hover:text-indigo-700"
                >
                  Refresh
                </button>
              </div>
            </div>

            {myIdeas.length === 0 ? (
              <EmptyState
                icon="💡"
                title="No Ideas Yet"
                description="You haven't posted any ideas yet. Start sharing your ideas with the community!"
                action={{
                  label: 'Create Your First Idea',
                  onClick: () => (window.location.href = '/ideas'),
                }}
              />
            ) : (
              <div className="space-y-4">
                {myIdeas.slice(0, 5).map((idea) => (
                  <div
                    key={idea._id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{idea.title}</h3>
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
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {idea.shortSummary}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                      <span>{idea.collaborators.length} collaborator(s)</span>
                      <span>{new Date(idea.createdAt).toLocaleDateString()}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteIdea(idea._id)}
                      disabled={deletingIdeaId === idea._id}
                      className="w-full mt-2 px-3 py-2.5 sm:py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 min-h-[44px] sm:min-h-0"
                    >
                      {deletingIdeaId === idea._id ? 'Deleting...' : 'Delete Idea'}
                    </button>
                  </div>
                ))}
                {myIdeas.length > 5 && (
                  <a
                    href="/ideas"
                    className="block text-center text-indigo-600 hover:text-indigo-700 text-sm"
                  >
                    View all ideas →
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Collaboration Requests Section */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                Collaboration Requests
              </h2>
              {pendingRequests.length > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {pendingRequests.length} new
                </span>
              )}
            </div>

            {collabRequests.length === 0 ? (
              <EmptyState
                icon="🤝"
                title="No Collaboration Requests"
                description="You haven't received any collaboration requests yet. Share your ideas to get started!"
              />
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {collabRequests.map((request) => (
                  <div
                    key={request._id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {request.idea.title}
                        </h3>
                        <div className="text-sm text-gray-600 mt-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span>From: <strong>{request.sender.name}</strong></span>
                            {request.sender.emailVerified && (
                              <span className="text-green-600 text-xs" title="Email Verified">✓</span>
                            )}
                            {request.sender.trustBadges && request.sender.trustBadges.length > 0 && (
                              <TrustBadges badges={request.sender.trustBadges} size="sm" />
                            )}
                          </div>
                          {(request.sender.reputationScore !== undefined || request.sender.completedCollaborations !== undefined) && (
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {request.sender.reputationScore !== undefined && (
                                <ReputationDisplay
                                  reputationScore={request.sender.reputationScore || 0}
                                  averageRating={request.sender.averageRating || 0}
                                  totalRatings={request.sender.totalRatings || 0}
                                  size="sm"
                                />
                              )}
                              {request.sender.completedCollaborations !== undefined && request.sender.completedCollaborations > 0 && (
                                <span className="text-xs text-gray-500">
                                  {request.sender.completedCollaborations} collaboration{request.sender.completedCollaborations !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          request.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : request.status === 'accepted'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {request.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">{request.message}</p>
                    {request.resumeUrl && (
                      <div className="mb-3">
                        <button
                          onClick={() => {
                            setPdfViewerUrl(getFileUrl(request.resumeUrl!));
                            setPdfViewerOpen(true);
                          }}
                          className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-700"
                        >
                          <svg
                            className="w-4 h-4 mr-1"
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
                      </div>
                    )}
                    {request.status === 'pending' && (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => handleRequestAction(request._id, 'accepted')}
                          className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleRequestAction(request._id, 'rejected')}
                          className="flex-1 px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                    {request.status === 'accepted' && (
                      <div className="flex flex-col gap-2 mt-2">
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            onClick={() => {
                              setSelectedUserId(request.sender._id);
                              setSelectedUserName(request.sender.name);
                              setShowProfileModal(true);
                            }}
                            className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                          >
                            View Profile
                          </button>
                          <button
                            onClick={() => {
                              setChatType('personal');
                              setChatUserId(request.sender._id);
                              setChatIdeaId(null);
                              setSelectedUserName(request.sender.name);
                              setShowChatModal(true);
                            }}
                            className="flex-1 px-3 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition-colors"
                          >
                            Chat
                          </button>
                        </div>
                        <button
                          onClick={() => {
                            setRatingUserId(request.sender._id);
                            setRatingUserName(request.sender.name);
                            setRatingIdeaId((request.idea as any)._id || request.idea);
                            setShowRatingModal(true);
                          }}
                          className="w-full px-3 py-2 bg-yellow-600 text-white text-sm rounded-md hover:bg-yellow-700 transition-colors"
                        >
                          ⭐ Rate Collaborator
                        </button>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sent Requests Section */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                Sent Requests
              </h2>
              <button
                onClick={fetchDashboardData}
                className="text-xs sm:text-sm text-indigo-600 hover:text-indigo-700"
              >
                Refresh
              </button>
            </div>

            {sentRequests.length === 0 ? (
              <EmptyState
                icon="📤"
                title="No Sent Requests"
                description="You haven't sent any collaboration requests yet. Browse ideas and send requests to collaborate!"
              />
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {sentRequests.map((request) => (
                  <div
                    key={request._id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {request.idea.title}
                        </h3>
                        <div className="text-sm text-gray-600 mt-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span>To: <strong>{(request.idea as any).owner?.name || 'Unknown'}</strong></span>
                            {(request.idea as any).owner?.emailVerified && (
                              <span className="text-green-600 text-xs" title="Email Verified">✓</span>
                            )}
                            {(request.idea as any).owner?.trustBadges && (request.idea as any).owner.trustBadges.length > 0 && (
                              <TrustBadges badges={(request.idea as any).owner.trustBadges} size="sm" />
                            )}
                          </div>
                          {((request.idea as any).owner?.reputationScore !== undefined || (request.idea as any).owner?.completedCollaborations !== undefined) && (
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {(request.idea as any).owner?.reputationScore !== undefined && (
                                <ReputationDisplay
                                  reputationScore={(request.idea as any).owner.reputationScore || 0}
                                  averageRating={(request.idea as any).owner.averageRating || 0}
                                  totalRatings={(request.idea as any).owner.totalRatings || 0}
                                  size="sm"
                                />
                              )}
                              {(request.idea as any).owner?.completedCollaborations !== undefined && (request.idea as any).owner.completedCollaborations > 0 && (
                                <span className="text-xs text-gray-500">
                                  {(request.idea as any).owner.completedCollaborations} collaboration{(request.idea as any).owner.completedCollaborations !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          request.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : request.status === 'accepted'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {request.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">{request.message}</p>
                    {request.status === 'pending' && (
                      <button
                        onClick={() => handleCancelRequest(request._id)}
                        disabled={cancellingRequestId === request._id}
                        className="w-full px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        {cancellingRequestId === request._id ? 'Cancelling...' : 'Cancel Request'}
                      </button>
                    )}
                    {request.status === 'accepted' && (
                      <div className="text-sm text-green-600 font-medium">
                        ✓ Request accepted
                      </div>
                    )}
                    {request.status === 'rejected' && (
                      <div className="text-sm text-red-600 font-medium">
                        ✗ Request rejected
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Sent on {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Collaborated Ideas and My Ideas - Group Chats Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
          {/* Collaborated Ideas Section */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                Collaborated Ideas
              </h2>
              <button
                onClick={fetchDashboardData}
                className="text-xs sm:text-sm text-indigo-600 hover:text-indigo-700"
              >
                Refresh
              </button>
            </div>

            {collaboratedIdeas.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">You haven't collaborated on any ideas yet.</p>
                <p className="text-gray-400 text-sm mt-2">
                  Accept collaboration requests to see ideas here.
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {collaboratedIdeas.map((idea) => (
                  <div
                    key={idea._id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{idea.title}</h3>
                        <div className="text-sm text-gray-600 mt-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span>Owner: <strong>{(idea as any).owner?.name || 'Unknown'}</strong></span>
                            {(idea as any).owner?.emailVerified && (
                              <span className="text-green-600 text-xs" title="Email Verified">✓</span>
                            )}
                            {(idea as any).owner?.trustBadges && (idea as any).owner.trustBadges.length > 0 && (
                              <TrustBadges badges={(idea as any).owner.trustBadges} size="sm" />
                            )}
                          </div>
                          {((idea as any).owner?.reputationScore !== undefined || (idea as any).owner?.completedCollaborations !== undefined) && (
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {(idea as any).owner?.reputationScore !== undefined && (
                                <ReputationDisplay
                                  reputationScore={(idea as any).owner.reputationScore || 0}
                                  averageRating={(idea as any).owner.averageRating || 0}
                                  totalRatings={(idea as any).owner.totalRatings || 0}
                                  size="sm"
                                />
                              )}
                              {(idea as any).owner?.completedCollaborations !== undefined && (idea as any).owner.completedCollaborations > 0 && (
                                <span className="text-xs text-gray-500">
                                  {(idea as any).owner.completedCollaborations} collaboration{(idea as any).owner.completedCollaborations !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
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
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {idea.shortSummary}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                      <span>{idea.collaborators.length} collaborator(s)</span>
                      <span>{new Date(idea.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex flex-col gap-2 mt-2">
                      <button
                        onClick={() => {
                          setChatType('group');
                          setChatIdeaId(idea._id);
                          setChatUserId(null);
                          setChatIdeaTitle(idea.title);
                          setShowChatModal(true);
                        }}
                        className="w-full px-3 py-2.5 sm:py-1.5 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition-colors min-h-[44px] sm:min-h-0"
                      >
                        Open Group Chat
                      </button>
                      {(idea as any).owner && (idea as any).owner._id && (
                        <button
                          onClick={() => {
                            setRatingUserId((idea as any).owner._id);
                            setRatingUserName((idea as any).owner.name || 'Idea Owner');
                            setRatingIdeaId(idea._id);
                            setShowRatingModal(true);
                          }}
                          className="w-full px-3 py-2 bg-yellow-600 text-white text-sm rounded-md hover:bg-yellow-700 transition-colors"
                        >
                          ⭐ Rate Idea Owner
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* My Ideas with Group Chat */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">My Ideas - Group Chats</h2>
            {myIdeas.filter((idea) => idea.collaborators.length > 0 || idea.status !== 'completed').length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No active group chats available.</p>
                <p className="text-gray-400 text-sm mt-2">
                  Group chats will appear here when you have ideas with collaborators or active ideas.
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {myIdeas
                  .filter((idea) => idea.collaborators.length > 0 || idea.status !== 'completed')
                  .map((idea) => (
                    <div
                      key={idea._id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{idea.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {idea.collaborators.length} collaborator(s)
                          </p>
                        </div>
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
                      {(idea.collaborators.length > 0 || idea.status !== 'completed') && (
                        <button
                          onClick={() => {
                            setChatType('group');
                            setChatIdeaId(idea._id);
                            setChatUserId(null);
                            setChatIdeaTitle(idea.title);
                            setShowChatModal(true);
                          }}
                          className="w-full mt-2 px-3 py-2.5 sm:py-1.5 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition-colors min-h-[44px] sm:min-h-0"
                        >
                          Open Group Chat
                        </button>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile View Modal */}
      <ProfileViewModal
        userId={selectedUserId || ''}
        isOpen={showProfileModal}
        onClose={() => {
          setShowProfileModal(false);
          setSelectedUserId(null);
          setSelectedUserName(null);
        }}
        onStartChat={(userId) => {
          setChatType('personal');
          setChatUserId(userId);
          setChatIdeaId(null);
          setShowChatModal(true);
        }}
      />

      {/* Rating Modal */}
      <UserRatingModal
        isOpen={showRatingModal}
        onClose={() => {
          setShowRatingModal(false);
          setRatingUserId(null);
          setRatingUserName(null);
          setRatingIdeaId(null);
        }}
        ratedUserId={ratingUserId || ''}
        ratedUserName={ratingUserName || ''}
        collaborationId={ratingIdeaId || undefined}
        onRatingSubmitted={() => {
          fetchDashboardData();
        }}
      />

      {/* Chat Modal */}
      <ChatModal
        isOpen={showChatModal}
        onClose={() => {
          setShowChatModal(false);
          setChatUserId(null);
          setChatIdeaId(null);
          setChatIdeaTitle(null);
        }}
        type={chatType}
        ideaId={chatIdeaId || undefined}
        userId={chatUserId || undefined}
        otherUserName={selectedUserName || undefined}
        ideaTitle={chatIdeaTitle || undefined}
      />
      
      {/* PDF Viewer Modal */}
      <PDFViewerModal
        isOpen={pdfViewerOpen}
        onClose={() => setPdfViewerOpen(false)}
        pdfUrl={pdfViewerUrl}
        filename={pdfViewerUrl.split('/').pop() || 'Resume'}
      />
    </div>
  );
}

