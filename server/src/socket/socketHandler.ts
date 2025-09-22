import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { logger, logActivity, logSecurity } from '../utils/logger';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
}

interface SocketUser {
  userId: string;
  username: string;
  socketId: string;
  status: 'online' | 'away' | 'busy';
  lastSeen: Date;
}

// Store connected users
const connectedUsers = new Map<string, SocketUser>();
const userSockets = new Map<string, string>(); // userId -> socketId

export const initializeSocket = (io: SocketIOServer) => {
  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        logSecurity('Socket connection without token', null, { socketId: socket.id });
        return next(new Error('Authentication token required'));
      }

      // Verify JWT token
      const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
      const decoded = jwt.verify(token, jwtSecret) as { userId: string };

      // Find user
      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive) {
        logSecurity('Socket connection with invalid user', null, { 
          socketId: socket.id, 
          userId: decoded.userId 
        });
        return next(new Error('Invalid user'));
      }

      // Attach user info to socket
      socket.userId = user._id.toString();
      socket.username = user.username;

      logger.info(`Socket authenticated: ${user.username} (${socket.id})`);
      next();
    } catch (error) {
      logSecurity('Socket authentication failed', null, { 
        socketId: socket.id, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      next(new Error('Authentication failed'));
    }
  });

  // Handle connections
  io.on('connection', async (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;
    const username = socket.username!;

    try {
      // Update user status to online
      await User.findByIdAndUpdate(userId, {
        status: 'online',
        lastSeen: new Date()
      });

      // Store connected user
      const userInfo: SocketUser = {
        userId,
        username,
        socketId: socket.id,
        status: 'online',
        lastSeen: new Date()
      };

      connectedUsers.set(socket.id, userInfo);
      userSockets.set(userId, socket.id);

      // Join user to their personal room
      socket.join(`user:${userId}`);

      // Notify other users that this user is online
      socket.broadcast.emit('user:online', {
        userId,
        username,
        status: 'online',
        lastSeen: new Date()
      });

      logActivity(userId, 'Connected to socket', { socketId: socket.id });

      // Send current online users to the newly connected user
      const onlineUsers = Array.from(connectedUsers.values()).map(user => ({
        userId: user.userId,
        username: user.username,
        status: user.status,
        lastSeen: user.lastSeen
      }));

      socket.emit('users:online', onlineUsers);

      // Handle user status updates
      socket.on('user:status', async (data: { status: 'online' | 'away' | 'busy' }) => {
        try {
          const { status } = data;
          
          // Update in database
          await User.findByIdAndUpdate(userId, { status });
          
          // Update in memory
          const userInfo = connectedUsers.get(socket.id);
          if (userInfo) {
            userInfo.status = status;
            connectedUsers.set(socket.id, userInfo);
          }

          // Broadcast status change
          socket.broadcast.emit('user:status_changed', {
            userId,
            status,
            lastSeen: new Date()
          });

          logActivity(userId, `Status changed to ${status}`);
        } catch (error) {
          logger.error('Error updating user status:', error);
          socket.emit('error', { message: 'Failed to update status' });
        }
      });

      // Handle joining chat rooms
      socket.on('chat:join', async (data: { chatId: string }) => {
        try {
          const { chatId } = data;
          
          // TODO: Verify user has access to this chat
          socket.join(`chat:${chatId}`);
          
          logActivity(userId, 'Joined chat', { chatId });
          
          // Notify others in the chat
          socket.to(`chat:${chatId}`).emit('chat:user_joined', {
            userId,
            username,
            chatId
          });
        } catch (error) {
          logger.error('Error joining chat:', error);
          socket.emit('error', { message: 'Failed to join chat' });
        }
      });

      // Handle leaving chat rooms
      socket.on('chat:leave', async (data: { chatId: string }) => {
        try {
          const { chatId } = data;
          
          socket.leave(`chat:${chatId}`);
          
          logActivity(userId, 'Left chat', { chatId });
          
          // Notify others in the chat
          socket.to(`chat:${chatId}`).emit('chat:user_left', {
            userId,
            username,
            chatId
          });
        } catch (error) {
          logger.error('Error leaving chat:', error);
        }
      });

      // Handle sending messages
      socket.on('message:send', async (data: any) => {
        try {
          const { chatId, content, type = 'text', replyTo, attachments = [] } = data;
          
          // TODO: Validate user has permission to send messages to this chat
          // TODO: Save message to database
          
          const message = {
            id: generateMessageId(),
            chatId,
            senderId: userId,
            senderUsername: username,
            content,
            type,
            replyTo,
            attachments,
            timestamp: new Date(),
            status: 'sent'
          };

          // Send to all users in the chat
          io.to(`chat:${chatId}`).emit('message:new', message);
          
          logActivity(userId, 'Sent message', { chatId, messageType: type });
        } catch (error) {
          logger.error('Error sending message:', error);
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      // Handle message editing
      socket.on('message:edit', async (data: { messageId: string; content: string }) => {
        try {
          const { messageId, content } = data;
          
          // TODO: Validate user owns this message and can edit it
          // TODO: Update message in database
          
          const updatedMessage = {
            id: messageId,
            content,
            editedAt: new Date(),
            editedBy: userId
          };

          // Broadcast to relevant chat
          // TODO: Get chatId from message
          // io.to(`chat:${chatId}`).emit('message:edited', updatedMessage);
          
          logActivity(userId, 'Edited message', { messageId });
        } catch (error) {
          logger.error('Error editing message:', error);
          socket.emit('error', { message: 'Failed to edit message' });
        }
      });

      // Handle message deletion
      socket.on('message:delete', async (data: { messageId: string }) => {
        try {
          const { messageId } = data;
          
          // TODO: Validate user owns this message or has permission to delete it
          // TODO: Delete/mark message as deleted in database
          
          // Broadcast to relevant chat
          // TODO: Get chatId from message
          // io.to(`chat:${chatId}`).emit('message:deleted', { messageId, deletedBy: userId });
          
          logActivity(userId, 'Deleted message', { messageId });
        } catch (error) {
          logger.error('Error deleting message:', error);
          socket.emit('error', { message: 'Failed to delete message' });
        }
      });

      // Handle typing indicators
      socket.on('typing:start', (data: { chatId: string }) => {
        const { chatId } = data;
        socket.to(`chat:${chatId}`).emit('typing:start', {
          userId,
          username,
          chatId
        });
      });

      socket.on('typing:stop', (data: { chatId: string }) => {
        const { chatId } = data;
        socket.to(`chat:${chatId}`).emit('typing:stop', {
          userId,
          username,
          chatId
        });
      });

      // Handle message reactions
      socket.on('message:react', async (data: { messageId: string; emoji: string; action: 'add' | 'remove' }) => {
        try {
          const { messageId, emoji, action } = data;
          
          // TODO: Update message reactions in database
          
          const reaction = {
            messageId,
            emoji,
            userId,
            username,
            action,
            timestamp: new Date()
          };

          // Broadcast to relevant chat
          // TODO: Get chatId from message
          // io.to(`chat:${chatId}`).emit('message:reaction', reaction);
          
          logActivity(userId, `${action === 'add' ? 'Added' : 'Removed'} reaction`, { 
            messageId, 
            emoji 
          });
        } catch (error) {
          logger.error('Error handling message reaction:', error);
          socket.emit('error', { message: 'Failed to update reaction' });
        }
      });

      // Handle voice/video calls
      socket.on('call:start', async (data: { chatId: string; type: 'audio' | 'video' }) => {
        try {
          const { chatId, type } = data;
          
          const callData = {
            id: generateCallId(),
            chatId,
            initiatorId: userId,
            initiatorUsername: username,
            type,
            status: 'ringing',
            startTime: new Date()
          };

          // Notify other users in the chat
          socket.to(`chat:${chatId}`).emit('call:incoming', callData);
          
          logActivity(userId, `Started ${type} call`, { chatId, callId: callData.id });
        } catch (error) {
          logger.error('Error starting call:', error);
          socket.emit('error', { message: 'Failed to start call' });
        }
      });

      socket.on('call:accept', async (data: { callId: string }) => {
        try {
          const { callId } = data;
          
          // TODO: Update call status in database
          
          // Notify call participants
          socket.broadcast.emit('call:accepted', {
            callId,
            acceptedBy: userId,
            acceptedByUsername: username
          });
          
          logActivity(userId, 'Accepted call', { callId });
        } catch (error) {
          logger.error('Error accepting call:', error);
          socket.emit('error', { message: 'Failed to accept call' });
        }
      });

      socket.on('call:decline', async (data: { callId: string }) => {
        try {
          const { callId } = data;
          
          // TODO: Update call status in database
          
          // Notify call participants
          socket.broadcast.emit('call:declined', {
            callId,
            declinedBy: userId,
            declinedByUsername: username
          });
          
          logActivity(userId, 'Declined call', { callId });
        } catch (error) {
          logger.error('Error declining call:', error);
        }
      });

      socket.on('call:end', async (data: { callId: string }) => {
        try {
          const { callId } = data;
          
          // TODO: Update call status and duration in database
          
          // Notify call participants
          socket.broadcast.emit('call:ended', {
            callId,
            endedBy: userId,
            endedByUsername: username,
            endTime: new Date()
          });
          
          logActivity(userId, 'Ended call', { callId });
        } catch (error) {
          logger.error('Error ending call:', error);
        }
      });

      // Handle WebRTC signaling for calls
      socket.on('webrtc:offer', (data: { callId: string; offer: any; targetUserId: string }) => {
        const { callId, offer, targetUserId } = data;
        const targetSocketId = userSockets.get(targetUserId);
        
        if (targetSocketId) {
          io.to(targetSocketId).emit('webrtc:offer', {
            callId,
            offer,
            fromUserId: userId,
            fromUsername: username
          });
        }
      });

      socket.on('webrtc:answer', (data: { callId: string; answer: any; targetUserId: string }) => {
        const { callId, answer, targetUserId } = data;
        const targetSocketId = userSockets.get(targetUserId);
        
        if (targetSocketId) {
          io.to(targetSocketId).emit('webrtc:answer', {
            callId,
            answer,
            fromUserId: userId,
            fromUsername: username
          });
        }
      });

      socket.on('webrtc:ice-candidate', (data: { callId: string; candidate: any; targetUserId: string }) => {
        const { callId, candidate, targetUserId } = data;
        const targetSocketId = userSockets.get(targetUserId);
        
        if (targetSocketId) {
          io.to(targetSocketId).emit('webrtc:ice-candidate', {
            callId,
            candidate,
            fromUserId: userId,
            fromUsername: username
          });
        }
      });

      // Handle disconnection
      socket.on('disconnect', async (reason) => {
        try {
          // Update user status to offline
          await User.findByIdAndUpdate(userId, {
            status: 'offline',
            lastSeen: new Date()
          });

          // Remove from connected users
          connectedUsers.delete(socket.id);
          userSockets.delete(userId);

          // Notify other users
          socket.broadcast.emit('user:offline', {
            userId,
            username,
            lastSeen: new Date()
          });

          logActivity(userId, 'Disconnected from socket', { 
            socketId: socket.id, 
            reason 
          });
        } catch (error) {
          logger.error('Error handling disconnect:', error);
        }
      });

    } catch (error) {
      logger.error('Error in socket connection handler:', error);
      socket.emit('error', { message: 'Connection error' });
      socket.disconnect();
    }
  });

  // Handle server-side events
  io.engine.on('connection_error', (err) => {
    logger.error('Socket.IO connection error:', err);
  });

  logger.info('Socket.IO server initialized');
};

// Helper functions
const generateMessageId = (): string => {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const generateCallId = (): string => {
  return `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Export utility functions
export const getConnectedUsers = (): SocketUser[] => {
  return Array.from(connectedUsers.values());
};

export const getUserSocketId = (userId: string): string | undefined => {
  return userSockets.get(userId);
};

export const isUserOnline = (userId: string): boolean => {
  return userSockets.has(userId);
};

export const sendToUser = (io: SocketIOServer, userId: string, event: string, data: any): boolean => {
  const socketId = userSockets.get(userId);
  if (socketId) {
    io.to(socketId).emit(event, data);
    return true;
  }
  return false;
};