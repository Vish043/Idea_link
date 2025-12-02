import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import api from '../utils/api';
import { useToast } from '../hooks/useToast';

interface Message {
  _id: string;
  sender: {
    _id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  content: string;
  createdAt: string;
}

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'personal' | 'group';
  ideaId?: string;
  userId?: string;
  otherUserName?: string;
  ideaTitle?: string;
}

export default function ChatModal({
  isOpen,
  onClose,
  type,
  ideaId,
  userId,
  otherUserName,
  ideaTitle,
}: ChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { showError } = useToast();

  useEffect(() => {
    if (!isOpen) return;

    const token = localStorage.getItem('token');
    if (!token) {
      showError('Please login to use chat');
      onClose();
      return;
    }

    // Get current user ID from token
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setCurrentUserId(payload.userId);
    } catch (e) {
      // Fallback: fetch from API
      api.get('/auth/me').then((res) => {
        setCurrentUserId(res.data.id);
      });
    }

    // Initialize Socket.IO connection
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const newSocket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      setConnected(true);
      if (type === 'group' && ideaId) {
        newSocket.emit('joinIdeaRoom', { ideaId });
      } else if (type === 'personal') {
        newSocket.emit('joinPersonalRoom');
      }
      fetchMessages();
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
    });

    newSocket.on('joinedRoom', () => {
      fetchMessages();
    });

    newSocket.on('newMessage', (message: Message) => {
      console.log('Received newMessage event:', message);
      setMessages((prev) => {
        // Check if message already exists to prevent duplicates
        const exists = prev.some((m) => m._id === message._id);
        if (exists) {
          console.log('Message already exists, skipping');
          return prev;
        }
        
        // For personal chat, filter messages to only show those in this conversation
        if (type === 'personal' && userId) {
          // If currentUserId is not set yet, still allow messages from the other user
          if (!currentUserId) {
            // Check if message is from the other user (userId) - this is a message TO us
            const isFromOtherUser = message.sender._id === userId;
            if (isFromOtherUser) {
              console.log('Adding message from other user (currentUserId not set yet)');
              return [...prev, message];
            }
            // If not from other user and we don't know currentUserId, skip for now
            console.log('Skipping message - not from other user and currentUserId not set');
            return prev;
          }
          
          // Message should be either:
          // 1. From the other user (userId) to current user
          // 2. From current user to the other user (userId)
          const isFromOtherUser = message.sender._id === userId;
          const isFromCurrentUser = message.sender._id === currentUserId;
          
          console.log('Message check:', { 
            isFromOtherUser, 
            isFromCurrentUser, 
            senderId: message.sender._id, 
            userId, 
            currentUserId 
          });
          
          // Only add if it's part of this conversation
          if (!isFromOtherUser && !isFromCurrentUser) {
            console.log('Message not part of this conversation, skipping');
            return prev; // Not a message in this conversation
          }
          
          console.log('Adding message to conversation');
        }
        
        // For group chat, all messages are valid
        return [...prev, message];
      });
      scrollToBottom();
    });

    newSocket.on('error', (error: { message: string }) => {
      showError(error.message);
    });

    setSocket(newSocket);

    return () => {
      if (type === 'group' && ideaId) {
        newSocket.emit('leaveIdeaRoom', { ideaId });
      }
      newSocket.disconnect();
    };
  }, [isOpen, type, ideaId, userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      let response;
      if (type === 'group' && ideaId) {
        response = await api.get(`/messages?ideaId=${ideaId}`);
      } else if (type === 'personal' && userId) {
        response = await api.get(`/messages?userId=${userId}`);
      } else {
        return;
      }
      
      // Remove duplicates and sort by creation time
      const uniqueMessages = response.data
        .filter((msg: Message, index: number, self: Message[]) => 
          index === self.findIndex((m) => m._id === msg._id)
        )
        .sort((a: Message, b: Message) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      
      setMessages(uniqueMessages);
      setTimeout(() => scrollToBottom(), 100);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to load messages';
      showError(errorMessage);
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || !connected) return;

    const messageContent = newMessage.trim();
    setNewMessage(''); // Clear input immediately for better UX

    try {
      if (type === 'group' && ideaId) {
        socket.emit('sendMessage', { ideaId, content: messageContent });
      } else if (type === 'personal' && userId) {
        socket.emit('sendPersonalMessage', { recipientId: userId, content: messageContent });
      }
    } catch (err: any) {
      showError('Failed to send message');
      setNewMessage(messageContent); // Restore message on error
    }
  };

  if (!isOpen) return null;

  const chatTitle = type === 'group' ? ideaTitle || 'Group Chat' : `Chat with ${otherUserName || 'User'}`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl h-[600px] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{chatTitle}</h2>
            <p className={`text-sm ${connected ? 'text-green-600' : 'text-red-600'}`}>
              {connected ? '● Connected' : '● Disconnected'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
              <p className="text-gray-600">Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwnMessage = message.sender._id === currentUserId;
              return (
                <div
                  key={message._id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      isOwnMessage
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-gray-900 border border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {!isOwnMessage && (
                        <span className="text-xs font-semibold">{message.sender.name}</span>
                      )}
                      <span className="text-xs opacity-70">
                        {new Date(message.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-sm">{message.content}</p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={!connected}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || !connected}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

