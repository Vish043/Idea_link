import { useEffect, useState } from 'react';
import { useToast } from '../hooks/useToast';
import api from '../utils/api';

interface Idea {
  _id: string;
  title: string;
  shortSummary: string;
  status: 'looking_for_collaborators' | 'in_progress' | 'completed';
  collaborators: Array<{ _id: string; name: string }>;
  createdAt: string;
}

interface CollaborationRequest {
  _id: string;
  idea: {
    _id: string;
    title: string;
    shortSummary: string;
  };
  sender: {
    _id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    skills: string[];
    interests: string[];
  };
  message: string;
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
  const [collabRequests, setCollabRequests] = useState<CollaborationRequest[]>([]);
  const [loading, setLoading] = useState(true);
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

      // Fetch collaboration requests
      const requestsResponse = await api.get('/collab-requests/mine');
      setCollabRequests(requestsResponse.data);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name || 'User'}!
          </h1>
          <p className="text-gray-600">Here's an overview of your activity</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">My Ideas</p>
                <p className="text-3xl font-bold text-gray-900">{myIdeas.length}</p>
              </div>
              <div className="text-4xl">💡</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Active Ideas</p>
                <p className="text-3xl font-bold text-gray-900">{activeIdeas}</p>
              </div>
              <div className="text-4xl">🚀</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Collaborators</p>
                <p className="text-3xl font-bold text-gray-900">{totalCollaborators}</p>
              </div>
              <div className="text-4xl">👥</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* My Ideas Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">My Ideas</h2>
              <button
                onClick={fetchDashboardData}
                className="text-sm text-indigo-600 hover:text-indigo-700"
              >
                Refresh
              </button>
            </div>

            {myIdeas.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">You haven't posted any ideas yet.</p>
                <a
                  href="/ideas"
                  className="mt-2 text-indigo-600 hover:text-indigo-700 text-sm"
                >
                  Browse ideas →
                </a>
              </div>
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
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{idea.collaborators.length} collaborator(s)</span>
                      <span>{new Date(idea.createdAt).toLocaleDateString()}</span>
                    </div>
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
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Collaboration Requests
              </h2>
              {pendingRequests.length > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {pendingRequests.length} new
                </span>
              )}
            </div>

            {collabRequests.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No collaboration requests yet.</p>
              </div>
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
                        <p className="text-sm text-gray-600 mt-1">
                          From: {request.sender.name}
                        </p>
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
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRequestAction(request._id, 'accepted')}
                          className="flex-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleRequestAction(request._id, 'rejected')}
                          className="flex-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                        >
                          Reject
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
        </div>
      </div>
    </div>
  );
}

