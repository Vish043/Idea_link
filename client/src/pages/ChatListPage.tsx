import { useEffect, useState } from 'react';
import { useToast } from '../hooks/useToast';
import api from '../utils/api';
import ChatModal from '../components/ChatModal';

interface PersonalChat {
  user: {
    _id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  lastMessage: {
    _id: string;
    content: string;
    sender: {
      _id: string;
      name: string;
    };
    createdAt: string;
  };
  unreadCount: number;
}

interface GroupChat {
  idea: {
    _id: string;
    title: string;
    owner: {
      _id: string;
      name: string;
    };
    collaborators: Array<{
      _id: string;
      name: string;
    }>;
  };
  lastMessage: {
    _id: string;
    content: string;
    sender: {
      _id: string;
      name: string;
    };
    createdAt: string;
  } | null;
  unreadCount: number;
}

interface Conversations {
  personal: PersonalChat[];
  group: GroupChat[];
}

export default function ChatListPage() {
  const [conversations, setConversations] = useState<Conversations>({ personal: [], group: [] });
  const [loading, setLoading] = useState(true);
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatType, setChatType] = useState<'personal' | 'group'>('personal');
  const [chatUserId, setChatUserId] = useState<string | null>(null);
  const [chatIdeaId, setChatIdeaId] = useState<string | null>(null);
  const [chatIdeaTitle, setChatIdeaTitle] = useState<string | null>(null);
  const [chatUserName, setChatUserName] = useState<string | null>(null);
  const { showError } = useToast();

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/messages/conversations');
      setConversations(response.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to load conversations';
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPersonalChat = (userId: string, userName: string) => {
    setChatType('personal');
    setChatUserId(userId);
    setChatIdeaId(null);
    setChatUserName(userName);
    setChatIdeaTitle(null);
    setShowChatModal(true);
  };

  const handleOpenGroupChat = (ideaId: string, ideaTitle: string) => {
    setChatType('group');
    setChatIdeaId(ideaId);
    setChatUserId(null);
    setChatIdeaTitle(ideaTitle);
    setChatUserName(null);
    setShowChatModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">My Chats</h1>
          <p className="text-sm sm:text-base text-gray-600">View and manage all your conversations</p>
        </div>

        {/* Personal Chats */}
        {conversations.personal.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Personal Chats</h2>
            <div className="space-y-2 sm:space-y-3">
              {conversations.personal.map((chat) => (
                <div
                  key={chat.user._id}
                  onClick={() => handleOpenPersonalChat(chat.user._id, chat.user.name)}
                  className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      {chat.user.avatarUrl ? (
                        <img
                          src={chat.user.avatarUrl}
                          alt={chat.user.name}
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-indigo-100 flex items-center justify-center text-base sm:text-lg font-bold text-indigo-600 flex-shrink-0">
                          {chat.user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate">{chat.user.name}</h3>
                        <p className="text-xs sm:text-sm text-gray-600 truncate">
                          {chat.lastMessage.content}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(chat.lastMessage.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {chat.unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full flex-shrink-0">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Group Chats */}
        {conversations.group.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Group Chats</h2>
            <div className="space-y-2 sm:space-y-3">
              {conversations.group.map((chat) => (
                <div
                  key={chat.idea._id}
                  onClick={() => handleOpenGroupChat(chat.idea._id, chat.idea.title)}
                  className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate">{chat.idea.title}</h3>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">
                        Owner: {chat.idea.owner.name} • {chat.idea.collaborators.length} collaborator(s)
                      </p>
                      {chat.lastMessage && (
                        <>
                          <p className="text-xs sm:text-sm text-gray-600 truncate mt-1">
                            {chat.lastMessage.sender.name}: {chat.lastMessage.content}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(chat.lastMessage.createdAt).toLocaleString()}
                          </p>
                        </>
                      )}
                    </div>
                    {chat.unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full flex-shrink-0">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {conversations.personal.length === 0 && conversations.group.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-8 sm:p-12 text-center">
            <div className="text-4xl sm:text-6xl mb-4">💬</div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No conversations yet</h3>
            <p className="text-sm sm:text-base text-gray-600">
              Start chatting by accepting collaboration requests or joining idea discussions.
            </p>
          </div>
        )}
      </div>

      {/* Chat Modal */}
      <ChatModal
        isOpen={showChatModal}
        onClose={() => {
          setShowChatModal(false);
          setChatUserId(null);
          setChatIdeaId(null);
          setChatIdeaTitle(null);
          setChatUserName(null);
          fetchConversations(); // Refresh conversations after closing chat
        }}
        type={chatType}
        ideaId={chatIdeaId || undefined}
        userId={chatUserId || undefined}
        otherUserName={chatUserName || undefined}
        ideaTitle={chatIdeaTitle || undefined}
      />
    </div>
  );
}

