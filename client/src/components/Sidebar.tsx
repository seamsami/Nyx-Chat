import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Chat } from '../types';

interface SidebarProps {
  user: User;
  chats: Chat[];
  activeChat: Chat | null;
  onlineUsers: string[];
  onChatSelect: (chat: Chat) => void;
  onNewChat: () => void;
  onSearch: () => void;
  onSettings: () => void;
  onLogout: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  user,
  chats,
  activeChat,
  onlineUsers,
  onChatSelect,
  onNewChat,
  onSearch,
  onSettings,
  onLogout,
  collapsed,
  onToggleCollapse
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'groups' | 'direct'>('all');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter chats based on search query and filter type
  const filteredChats = chats.filter(chat => {
    const matchesSearch = chat.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         chat.participants.some(p => p.userId.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesFilter = (() => {
      switch (filter) {
        case 'unread': return chat.unreadCount > 0;
        case 'groups': return chat.type === 'group' || chat.type === 'channel';
        case 'direct': return chat.type === 'direct';
        default: return true;
      }
    })();

    return matchesSearch && matchesFilter;
  });

  const formatLastMessage = (chat: Chat) => {
    if (!chat.lastMessage) return 'No messages yet';
    
    const { content, type, senderId } = chat.lastMessage;
    const isOwn = senderId === user.id;
    const prefix = isOwn ? 'You: ' : '';
    
    switch (type) {
      case 'image': return `${prefix}📷 Photo`;
      case 'video': return `${prefix}🎥 Video`;
      case 'audio': return `${prefix}🎵 Audio`;
      case 'file': return `${prefix}📎 File`;
      default: return `${prefix}${content}`;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className={`h-full glass border-r border-gray-700 flex flex-col transition-all duration-300 ${
      collapsed ? 'w-20' : 'w-80'
    }`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-3"
            >
              <div className="relative">
                <img
                  src={user.avatar || `https://ui-avatars.com/api/?name=${user.username}&background=6366f1&color=fff`}
                  alt={user.username}
                  className="w-10 h-10 rounded-full border-2 border-purple-500"
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900"></div>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-white truncate">{user.username}</h2>
                <p className="text-xs text-gray-400 truncate">{user.status}</p>
              </div>
            </motion.div>
          )}
          
          <div className="flex items-center space-x-2">
            {!collapsed && (
              <>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onNewChat}
                  className="p-2 glass-hover rounded-lg transition-all duration-200"
                  title="New Chat"
                >
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="p-2 glass-hover rounded-lg transition-all duration-200 relative"
                  title="User Menu"
                >
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                  
                  <AnimatePresence>
                    {showUserMenu && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute right-0 top-full mt-2 w-48 glass rounded-xl border border-gray-600 py-2 z-50"
                      >
                        <button
                          onClick={() => {
                            onSettings();
                            setShowUserMenu(false);
                          }}
                          className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700/50 transition-colors duration-200 flex items-center space-x-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>Settings</span>
                        </button>
                        <button
                          onClick={() => {
                            onLogout();
                            setShowUserMenu(false);
                          }}
                          className="w-full px-4 py-2 text-left text-red-400 hover:bg-gray-700/50 transition-colors duration-200 flex items-center space-x-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          <span>Logout</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              </>
            )}
            
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onToggleCollapse}
              className="p-2 glass-hover rounded-lg transition-all duration-200"
              title={collapsed ? "Expand" : "Collapse"}
            >
              <svg 
                className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </motion.button>
          </div>
        </div>

        {/* Search Bar */}
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-4"
          >
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-10 glass rounded-xl border border-gray-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 text-white placeholder-gray-400"
              />
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </motion.div>
        )}

        {/* Filter Tabs */}
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-4 flex space-x-1 glass rounded-lg p-1"
          >
            {[
              { key: 'all', label: 'All', icon: '💬' },
              { key: 'unread', label: 'Unread', icon: '🔴' },
              { key: 'groups', label: 'Groups', icon: '👥' },
              { key: 'direct', label: 'Direct', icon: '👤' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all duration-200 ${
                  filter === tab.key
                    ? 'bg-purple-500 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                <span className="mr-1">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence>
          {filteredChats.map((chat, index) => (
            <motion.div
              key={chat.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onChatSelect(chat)}
              className={`p-4 border-b border-gray-700/50 cursor-pointer transition-all duration-200 hover:bg-gray-700/30 ${
                activeChat?.id === chat.id ? 'bg-purple-500/20 border-r-2 border-r-purple-500' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                {/* Chat Avatar */}
                <div className="relative flex-shrink-0">
                  {chat.type === 'group' ? (
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {chat.name?.charAt(0).toUpperCase() || 'G'}
                      </span>
                    </div>
                  ) : (
                    <img
                      src={chat.avatar || `https://ui-avatars.com/api/?name=${chat.name}&background=random`}
                      alt={chat.name}
                      className="w-12 h-12 rounded-full"
                    />
                  )}
                  
                  {/* Online Indicator */}
                  {chat.type === 'direct' && chat.participants.some(p => 
                    p.userId !== user.id && onlineUsers.includes(p.userId)
                  ) && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900"></div>
                  )}
                  
                  {/* Unread Badge */}
                  {chat.unreadCount > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                    >
                      <span className="text-xs text-white font-bold">
                        {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                      </span>
                    </motion.div>
                  )}
                </div>

                {/* Chat Info */}
                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-white truncate">
                        {chat.name || 'Unknown Chat'}
                      </h3>
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {chat.lastMessage && formatTime(chat.lastMessage.timestamp)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-400 truncate">
                        {formatLastMessage(chat)}
                      </p>
                      
                      <div className="flex items-center space-x-1 flex-shrink-0">
                        {chat.settings.muted && (
                          <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                          </svg>
                        )}
                        {chat.settings.pinned && (
                          <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M16,12V4H17V2H7V4H8V12L6,14V16H11.2V22H12.8V16H18V14L16,12Z" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Empty State */}
        {filteredChats.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-8 text-center"
          >
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-700 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-gray-400 text-sm">
              {searchQuery ? 'No chats found' : 'No conversations yet'}
            </p>
            {!searchQuery && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onNewChat}
                className="mt-4 px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium"
              >
                Start a conversation
              </motion.button>
            )}
          </motion.div>
        )}
      </div>

      {/* Collapsed Mode Icons */}
      {collapsed && (
        <div className="p-2 space-y-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onNewChat}
            className="w-full p-3 glass-hover rounded-lg transition-all duration-200"
            title="New Chat"
          >
            <svg className="w-6 h-6 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onSearch}
            className="w-full p-3 glass-hover rounded-lg transition-all duration-200"
            title="Search"
          >
            <svg className="w-6 h-6 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onSettings}
            className="w-full p-3 glass-hover rounded-lg transition-all duration-200"
            title="Settings"
          >
            <svg className="w-6 h-6 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </motion.button>
        </div>
      )}
    </div>
  );
};

export default Sidebar;