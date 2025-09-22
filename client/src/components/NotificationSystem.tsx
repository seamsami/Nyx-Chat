import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  persistent?: boolean;
}

interface NotificationSystemProps {
  maxNotifications?: number;
}

const NotificationSystem: React.FC<NotificationSystemProps> = ({ 
  maxNotifications = 5 
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Add notification function
  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: Notification = {
      id,
      duration: 5000, // Default 5 seconds
      ...notification,
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev];
      // Keep only the latest notifications
      return updated.slice(0, maxNotifications);
    });

    // Auto-remove notification after duration (if not persistent)
    if (!newNotification.persistent && newNotification.duration) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }
  }, [maxNotifications]);

  // Remove notification function
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Expose functions globally for easy access
  useEffect(() => {
    // Create global notification functions
    (window as any).notify = {
      success: (title: string, message: string, options?: Partial<Notification>) =>
        addNotification({ type: 'success', title, message, ...options }),
      error: (title: string, message: string, options?: Partial<Notification>) =>
        addNotification({ type: 'error', title, message, ...options }),
      warning: (title: string, message: string, options?: Partial<Notification>) =>
        addNotification({ type: 'warning', title, message, ...options }),
      info: (title: string, message: string, options?: Partial<Notification>) =>
        addNotification({ type: 'info', title, message, ...options }),
      custom: addNotification,
      remove: removeNotification,
      clear: clearAll,
    };

    return () => {
      delete (window as any).notify;
    };
  }, [addNotification, removeNotification, clearAll]);

  // Get notification styles based on type
  const getNotificationStyles = (type: Notification['type']) => {
    const baseStyles = "glass border-l-4 shadow-lg";
    
    switch (type) {
      case 'success':
        return `${baseStyles} border-l-green-500 bg-green-500/10`;
      case 'error':
        return `${baseStyles} border-l-red-500 bg-red-500/10`;
      case 'warning':
        return `${baseStyles} border-l-yellow-500 bg-yellow-500/10`;
      case 'info':
        return `${baseStyles} border-l-blue-500 bg-blue-500/10`;
      default:
        return `${baseStyles} border-l-gray-500 bg-gray-500/10`;
    }
  };

  // Get notification icon
  const getNotificationIcon = (type: Notification['type']) => {
    const iconClass = "w-5 h-5 flex-shrink-0";
    
    switch (type) {
      case 'success':
        return (
          <svg className={`${iconClass} text-green-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className={`${iconClass} text-red-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'warning':
        return (
          <svg className={`${iconClass} text-yellow-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'info':
        return (
          <svg className={`${iconClass} text-blue-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className={`${iconClass} text-gray-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {notifications.map((notification, index) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 300, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.9 }}
            transition={{ 
              duration: 0.3,
              delay: index * 0.1,
              ease: "easeOut"
            }}
            className={`${getNotificationStyles(notification.type)} rounded-xl p-4 pointer-events-auto`}
          >
            <div className="flex items-start space-x-3">
              {/* Icon */}
              <div className="flex-shrink-0 mt-0.5">
                {getNotificationIcon(notification.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-white mb-1">
                  {notification.title}
                </h4>
                <p className="text-sm text-gray-300 leading-relaxed">
                  {notification.message}
                </p>

                {/* Action Button */}
                {notification.action && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={notification.action.onClick}
                    className="mt-3 text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors duration-200"
                  >
                    {notification.action.label}
                  </motion.button>
                )}
              </div>

              {/* Close Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => removeNotification(notification.id)}
                className="flex-shrink-0 p-1 text-gray-400 hover:text-white transition-colors duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
            </div>

            {/* Progress Bar (for timed notifications) */}
            {!notification.persistent && notification.duration && (
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: notification.duration / 1000, ease: "linear" }}
                className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-b-xl"
              />
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Clear All Button (when multiple notifications) */}
      {notifications.length > 1 && (
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={clearAll}
          className="w-full py-2 px-4 glass-hover rounded-xl text-sm font-medium text-gray-300 hover:text-white transition-all duration-300 pointer-events-auto"
        >
          Clear All ({notifications.length})
        </motion.button>
      )}
    </div>
  );
};

// Extend Window interface for TypeScript
declare global {
  interface Window {
    notify?: {
      success: (title: string, message: string, options?: Partial<Notification>) => void;
      error: (title: string, message: string, options?: Partial<Notification>) => void;
      warning: (title: string, message: string, options?: Partial<Notification>) => void;
      info: (title: string, message: string, options?: Partial<Notification>) => void;
      custom: (notification: Omit<Notification, 'id'>) => void;
      remove: (id: string) => void;
      clear: () => void;
    };
  }
}

export default NotificationSystem;