import express, { Request, Response, NextFunction } from 'express';
import { Message } from '../models/Message';
import { Idea } from '../models/Idea';
import { User } from '../models/User';
import { authMiddleware } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { validateObjectId } from '../utils/validation';

const router = express.Router();

// GET /api/messages - Get messages for idea or personal chat
router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw createError('User not found', 404);
    }

    const { ideaId, userId } = req.query;

    // Personal chat
    if (userId) {
      validateObjectId(userId as string, 'User ID');

      // Check if user exists
      const otherUser = await User.findById(userId);
      if (!otherUser) {
        throw createError('User not found', 404);
      }

      // Get messages between current user and other user
      const messages = await Message.find({
        $or: [
          { sender: req.user._id, recipient: userId },
          { sender: userId, recipient: req.user._id },
        ],
      })
        .populate('sender', 'name email avatarUrl')
        .populate('recipient', 'name email avatarUrl')
        .sort({ createdAt: 1 }); // Oldest first for chat

      res.json(messages);
      return;
    }

    // Group chat (idea-based)
    if (ideaId) {
      validateObjectId(ideaId as string, 'Idea ID');

      // Check if idea exists and user has access
      const idea = await Idea.findById(ideaId);
      if (!idea) {
        throw createError('Idea not found', 404);
      }

      const isOwner = idea.owner.toString() === req.user._id.toString();
      const isCollaborator = idea.collaborators.some(
        (id) => id.toString() === req.user._id.toString()
      );

      if (!isOwner && !isCollaborator) {
        throw createError('Only owners and collaborators can view messages', 403);
      }

      const messages = await Message.find({ idea: ideaId })
        .populate('sender', 'name email avatarUrl')
        .sort({ createdAt: 1 }); // Oldest first for chat

      res.json(messages);
      return;
    }

    throw createError('Either ideaId or userId is required', 400);
  } catch (error) {
    next(error);
  }
});

// GET /api/messages/conversations - Get all conversations for current user
router.get('/conversations', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw createError('User not found', 404);
    }

    // Get all personal conversations (users the current user has messaged or been messaged by)
    const personalMessages = await Message.find({
      $or: [
        { sender: req.user._id, recipient: { $exists: true } },
        { recipient: req.user._id },
      ],
    })
      .populate('sender', 'name email avatarUrl')
      .populate('recipient', 'name email avatarUrl')
      .sort({ createdAt: -1 });

    // Get unique user IDs from personal messages
    const personalChatUsers = new Map<string, { user: any; lastMessage: any; unreadCount: number }>();
    
    personalMessages.forEach((msg) => {
      const senderId = (msg.sender as any)?._id?.toString();
      const recipientId = (msg.recipient as any)?._id?.toString();
      const currentUserId = req.user!._id.toString();
      
      // Determine the other user in the conversation
      let otherUserId: string | null = null;
      let otherUser: any = null;
      
      if (senderId === currentUserId && recipientId) {
        otherUserId = recipientId;
        otherUser = msg.recipient;
      } else if (recipientId === currentUserId && senderId) {
        otherUserId = senderId;
        otherUser = msg.sender;
      }
      
      if (otherUserId && otherUser) {
        const existing = personalChatUsers.get(otherUserId);
        if (!existing || new Date(msg.createdAt) > new Date(existing.lastMessage.createdAt)) {
          personalChatUsers.set(otherUserId, {
            user: otherUser,
            lastMessage: {
              _id: msg._id.toString(),
              content: msg.content,
              sender: {
                _id: senderId,
                name: (msg.sender as any).name,
              },
              createdAt: msg.createdAt,
            },
            unreadCount: 0, // Could implement unread count later
          });
        }
      }
    });

    // Get all group conversations (ideas where user is owner or collaborator)
    const userIdeas = await Idea.find({
      $or: [
        { owner: req.user._id },
        { collaborators: req.user._id },
      ],
    })
      .populate('owner', 'name email avatarUrl')
      .populate('collaborators', 'name email avatarUrl')
      .sort({ updatedAt: -1 });

    // Get last message for each idea
    const groupChats = await Promise.all(
      userIdeas.map(async (idea) => {
        const lastMessage = await Message.findOne({ idea: idea._id })
          .populate('sender', 'name email avatarUrl')
          .sort({ createdAt: -1 })
          .limit(1);

        return {
          idea: {
            _id: idea._id,
            title: idea.title,
            owner: idea.owner,
            collaborators: idea.collaborators,
          },
          lastMessage: lastMessage || null,
          unreadCount: 0, // Could implement unread count later
        };
      })
    );

    res.json({
      personal: Array.from(personalChatUsers.values()),
      group: groupChats,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

