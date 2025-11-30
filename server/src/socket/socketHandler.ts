import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { verifyToken } from '../middleware/auth';
import { User, IUser } from '../models/User';
import { Idea } from '../models/Idea';
import { Message } from '../models/Message';

interface AuthenticatedSocket extends Socket {
  user?: IUser;
}

interface JoinIdeaRoomPayload {
  ideaId: string;
}

interface SendMessagePayload {
  ideaId: string;
  content: string;
}

export const initializeSocket = (httpServer: HTTPServer): SocketIOServer => {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Authentication middleware for Socket.IO
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = verifyToken(token);
      if (!decoded) {
        return next(new Error('Authentication error: Invalid token'));
      }

      const user = await User.findById(decoded.userId).select('-passwordHash');
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`✅ User connected: ${socket.user?.email} (${socket.id})`);

    // Join idea room
    socket.on('joinIdeaRoom', async (payload: JoinIdeaRoomPayload) => {
      try {
        if (!socket.user) {
          socket.emit('error', { message: 'User not authenticated' });
          return;
        }

        const { ideaId } = payload;

        if (!ideaId) {
          socket.emit('error', { message: 'Idea ID is required' });
          return;
        }

        // Validate ObjectId format
        const objectIdRegex = /^[0-9a-fA-F]{24}$/;
        if (!objectIdRegex.test(ideaId)) {
          socket.emit('error', { message: 'Invalid Idea ID format' });
          return;
        }

        // Check if idea exists and user has access
        const idea = await Idea.findById(ideaId);
        if (!idea) {
          socket.emit('error', { message: 'Idea not found' });
          return;
        }

        const isOwner = idea.owner.toString() === socket.user._id.toString();
        const isCollaborator = idea.collaborators.some(
          (id) => id.toString() === socket.user!._id.toString()
        );

        if (!isOwner && !isCollaborator) {
          socket.emit('error', { message: 'Access denied: You are not a member of this idea' });
          return;
        }

        // Join the room
        const roomName = `idea:${ideaId}`;
        socket.join(roomName);

        console.log(`📥 User ${socket.user.email} joined room: ${roomName}`);

        // Confirm join
        socket.emit('joinedRoom', { ideaId, room: roomName });
      } catch (error) {
        console.error('Error joining room:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // Send message
    socket.on('sendMessage', async (payload: SendMessagePayload) => {
      try {
        if (!socket.user) {
          socket.emit('error', { message: 'User not authenticated' });
          return;
        }

        const { ideaId, content } = payload;

        if (!ideaId || !content) {
          socket.emit('error', { message: 'Idea ID and content are required' });
          return;
        }

        if (typeof content !== 'string' || content.trim().length === 0) {
          socket.emit('error', { message: 'Message content cannot be empty' });
          return;
        }

        // Validate ObjectId format
        const objectIdRegex = /^[0-9a-fA-F]{24}$/;
        if (!objectIdRegex.test(ideaId)) {
          socket.emit('error', { message: 'Invalid Idea ID format' });
          return;
        }

        // Check if idea exists
        const idea = await Idea.findById(ideaId);
        if (!idea) {
          socket.emit('error', { message: 'Idea not found' });
          return;
        }

        // Verify user is owner or collaborator
        const isOwner = idea.owner.toString() === socket.user._id.toString();
        const isCollaborator = idea.collaborators.some(
          (id) => id.toString() === socket.user!._id.toString()
        );

        if (!isOwner && !isCollaborator) {
          socket.emit('error', { message: 'Access denied: Only owners and collaborators can send messages' });
          return;
        }

        // Check if socket is in the room
        const roomName = `idea:${ideaId}`;
        const rooms = Array.from(socket.rooms);
        if (!rooms.includes(roomName)) {
          socket.emit('error', { message: 'You must join the room before sending messages' });
          return;
        }

        // Save message to database
        const message = new Message({
          idea: ideaId,
          sender: socket.user._id,
          content: content.trim(),
        });

        await message.save();
        await message.populate('sender', 'name email avatarUrl');

        // Prepare message payload
        const messagePayload = {
          _id: message._id.toString(),
          idea: ideaId,
          sender: {
            _id: message.sender._id.toString(),
            name: (message.sender as any).name,
            email: (message.sender as any).email,
            avatarUrl: (message.sender as any).avatarUrl || '',
          },
          content: message.content,
          createdAt: message.createdAt,
        };

        // Broadcast to all clients in the room (including sender)
        io.to(roomName).emit('newMessage', messagePayload);

        console.log(`💬 Message sent in room ${roomName} by ${socket.user.email}`);
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Leave idea room
    socket.on('leaveIdeaRoom', (payload: JoinIdeaRoomPayload) => {
      try {
        const { ideaId } = payload;
        if (ideaId) {
          const roomName = `idea:${ideaId}`;
          socket.leave(roomName);
          console.log(`📤 User ${socket.user?.email} left room: ${roomName}`);
          socket.emit('leftRoom', { ideaId, room: roomName });
        }
      } catch (error) {
        console.error('Error leaving room:', error);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.user?.email} (${socket.id})`);
    });
  });

  return io;
};

