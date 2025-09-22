import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Socket } from 'socket.io-client';
import { User, Chat, Message } from '../types';

// Components
import Sidebar from '../components/Sidebar';
import ChatHeader from '../components/ChatHeader';
import MessageList from '../components/MessageList';
import MessageInput from '../components/MessageInput';
import UserProfile from '../components/UserProfile';
import CallInterface from '../components/CallInterface';
import FilePreview from '../components/FilePreview';
import EmojiPicker from '../components/EmojiPicker';
import SearchModal from '../components/SearchModal';
import SettingsModal from '../components/SettingsModal';

interface ChatPageProps {
  user: User;
  socket: Socket | null;
  onLogout: () => void;
  onThemeToggle: () => void;
}

const ChatPage: React.FC<ChatPageProps> = ({ 
  user, 
  socket, 
  onLogout, 
  onThemeToggle 
}) => {
  // State Management
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // UI State
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Call State
  const [activeCall, setActiveCall] = useState<any>(null);
  const [incomingCall, setIncomingCall] = useState<any>(null);
  
  // File State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize chat data
  useEffect(() => {
    const initializeChat = async () => {
      try {
        // Fetch user's chats
        const response = await fetch('/api/chats', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const chatData = await response.json();
        setChats(chatData);
        
        // Set first chat as active if available
        if (chatData.length > 0) {
          setActiveChat(chatData[0]);
          await loadMessages(chatData[0].id);
        }
      } catch (error) {
        console.error('Failed to load chats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeChat();
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Message events
    socket.on('message:new', (message: Message) => {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
    });

    socket.on('message:edit', (updatedMessage: Message) => {
      setMessages(prev => 
        prev.map(msg => msg.id === updatedMessage.id ? updatedMessage : msg)
      );
    });

    socket.on('message:delete', (messageId: string) => {
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    });

    // Typing events
    socket.on('typing:start', (userId: string) => {
      setTypingUsers(prev => [...prev.filter(id => id !== userId), userId]);
    });

    socket.on('typing:stop', (userId: string) => {
      setTypingUsers(prev => prev.filter(id => id !== userId));
    });

    // User status events
    socket.on('user:online', (userId: string) => {
      setOnlineUsers(prev => [...prev.filter(id => id !== userId), userId]);
    });

    socket.on('user:offline', (userId: string) => {
      setOnlineUsers(prev => prev.filter(id => id !== userId));
    });

    // Call events
    socket.on('call:incoming', (callData: any) => {
      setIncomingCall(callData);
    });

    socket.on('call:accepted', (callData: any) => {
      setActiveCall(callData);
      setIncomingCall(null);
    });

    socket.on('call:ended', () => {
      setActiveCall(null);
      setIncomingCall(null);
    });

    return () => {
      socket.off('message:new');
      socket.off('message:edit');
      socket.off('message:delete');
      socket.off('typing:start');
      socket.off('typing:stop');
      socket.off('user:online');
      socket.off('user:offline');
      socket.off('call:incoming');
      socket.off('call:accepted');
      socket.off('call:ended');
    };
  }, [socket]);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load messages for a specific chat
  const loadMessages = async (chatId: string) => {
    try {
      const response = await fetch(`/api/chats/${chatId}/messages`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const messageData = await response.json();
      setMessages(messageData);
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  // Send a new message
  const sendMessage = async (content: string, type: string = 'text') => {
    if (!activeChat || !socket) return;

    const message: Partial<Message> = {
      chatId: activeChat.id,
      senderId: user.id,
      content,
      type: type as any,
      timestamp: new Date(),
      status: 'sending',
      reactions: [],
      attachments: [],
      metadata: {
        edited: false,
        forwarded: false,
        priority: 'normal',
        tags: [],
        mentions: [],
        links: []
      }
    };

    // Add message optimistically
    setMessages(prev => [...prev, message as Message]);
    scrollToBottom();

    // Send via socket
    socket.emit('message:send', message);
  };

  // Handle typing indicators
  const handleTyping = () => {
    if (!socket || !activeChat) return;

    socket.emit('typing:start', { chatId: activeChat.id, userId: user.id });

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing:stop', { chatId: activeChat.id, userId: user.id });
    }, 1000);
  };

  // Handle chat selection
  const handleChatSelect = async (chat: Chat) => {
    setActiveChat(chat);
    await loadMessages(chat.id);
  };

  // Handle file upload
  const handleFileUpload = (file: File) => {
    setSelectedFile(file);
    
    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Start voice/video call
  const startCall = (type: 'audio' | 'video') => {
    if (!socket || !activeChat) return;

    socket.emit('call:start', {
      chatId: activeChat.id,
      type,
      initiatorId: user.id
    });
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      {/* Sidebar */}
      <motion.div
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`${sidebarCollapsed ? 'w-20' : 'w-80'} transition-all duration-300`}
      >
        <Sidebar
          user={user}
          chats={chats}
          activeChat={activeChat}
          onlineUsers={onlineUsers}
          onChatSelect={handleChatSelect}
          onNewChat={() => {}}
          onSearch={() => setShowSearchModal(true)}
          onSettings={() => setShowSettingsModal(true)}
          onLogout={onLogout}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </motion.div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeChat ? (
          <>
            {/* Chat Header */}
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <ChatHeader
                chat={activeChat}
                onlineUsers={onlineUsers}
                onVoiceCall={() => startCall('audio')}
                onVideoCall={() => startCall('video')}
                onShowProfile={() => setShowUserProfile(true)}
                onThemeToggle={onThemeToggle}
              />
            </motion.div>

            {/* Messages Area */}
            <div className="flex-1 flex">
              {/* Message List */}
              <div className="flex-1 flex flex-col">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="flex-1 overflow-hidden"
                >
                  <MessageList
                    messages={messages}
                    currentUser={user}
                    typingUsers={typingUsers}
                    onReply={(message) => {}}
                    onReact={(messageId, emoji) => {}}
                    onEdit={(messageId, content) => {}}
                    onDelete={(messageId) => {}}
                  />
                  <div ref={messagesEndRef} />
                </motion.div>

                {/* Message Input */}
                <motion.div
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  <MessageInput
                    onSendMessage={sendMessage}
                    onTyping={handleTyping}
                    onFileUpload={handleFileUpload}
                    onEmojiClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    disabled={!activeChat}
                  />
                </motion.div>
              </div>

              {/* User Profile Sidebar */}
              <AnimatePresence>
                {showUserProfile && (
                  <motion.div
                    initial={{ x: 300, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 300, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-80 border-l border-gray-700"
                  >
                    <UserProfile
                      chat={activeChat}
                      onClose={() => setShowUserProfile(false)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        ) : (
          // No Chat Selected
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex-1 flex items-center justify-center"
          >
            <div className="text-center">
              <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <span className="text-4xl">💬</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">
                Welcome to Nyx Chat
              </h2>
              <p className="text-gray-400 mb-8">
                Select a conversation to start messaging
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium"
                onClick={() => {}}
              >
                Start New Chat
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Modals and Overlays */}
      <AnimatePresence>
        {/* Emoji Picker */}
        {showEmojiPicker && (
          <EmojiPicker
            onEmojiSelect={(emoji) => {
              // Handle emoji selection
              setShowEmojiPicker(false);
            }}
            onClose={() => setShowEmojiPicker(false)}
          />
        )}

        {/* Search Modal */}
        {showSearchModal && (
          <SearchModal
            onClose={() => setShowSearchModal(false)}
            onSelectResult={(result) => {
              // Handle search result selection
              setShowSearchModal(false);
            }}
          />
        )}

        {/* Settings Modal */}
        {showSettingsModal && (
          <SettingsModal
            user={user}
            onClose={() => setShowSettingsModal(false)}
            onSave={(settings) => {
              // Handle settings save
              setShowSettingsModal(false);
            }}
          />
        )}

        {/* File Preview */}
        {selectedFile && (
          <FilePreview
            file={selectedFile}
            preview={filePreview}
            onSend={(file, caption) => {
              // Handle file send
              setSelectedFile(null);
              setFilePreview(null);
            }}
            onCancel={() => {
              setSelectedFile(null);
              setFilePreview(null);
            }}
          />
        )}

        {/* Active Call Interface */}
        {activeCall && (
          <CallInterface
            call={activeCall}
            user={user}
            onEndCall={() => {
              socket?.emit('call:end', { callId: activeCall.id });
              setActiveCall(null);
            }}
            onToggleAudio={() => {}}
            onToggleVideo={() => {}}
            onToggleScreen={() => {}}
          />
        )}

        {/* Incoming Call */}
        {incomingCall && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <div className="glass rounded-2xl p-8 text-center max-w-sm mx-4">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
                <span className="text-2xl">📞</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Incoming {incomingCall.type} call
              </h3>
              <p className="text-gray-400 mb-6">
                From {incomingCall.initiator?.username}
              </p>
              <div className="flex space-x-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    socket?.emit('call:decline', { callId: incomingCall.id });
                    setIncomingCall(null);
                  }}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-medium"
                >
                  Decline
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    socket?.emit('call:accept', { callId: incomingCall.id });
                    setActiveCall(incomingCall);
                    setIncomingCall(null);
                  }}
                  className="flex-1 py-3 bg-green-500 text-white rounded-xl font-medium"
                >
                  Accept
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatPage;