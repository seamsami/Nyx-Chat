import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import './styles/globals.css';

// Components
import LoginPage from './pages/LoginPage';
import ChatPage from './pages/ChatPage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';
import LoadingScreen from './components/LoadingScreen';
import ParticleBackground from './components/ParticleBackground';
import ThemeProvider from './components/ThemeProvider';
import NotificationSystem from './components/NotificationSystem';
import ErrorBoundary from './components/ErrorBoundary';

// Hooks
import { useAuth } from './hooks/useAuth';
import { useTheme } from './hooks/useTheme';
import { useSocket } from './hooks/useSocket';

// Types
import { User } from './types';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const { theme, toggleTheme } = useTheme();
  const { login, logout, checkAuth } = useAuth();
  const { socket, connect, disconnect } = useSocket();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Check if user is authenticated
        const authUser = await checkAuth();
        if (authUser) {
          setUser(authUser);
          // Connect to socket if authenticated
          connect(authUser.id);
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [checkAuth, connect, disconnect]);

  const handleLogin = async (credentials: { email: string; password: string }) => {
    try {
      const authUser = await login(credentials);
      setUser(authUser);
      connect(authUser.id);
      return authUser;
    } catch (error) {
      throw error;
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      disconnect();
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <div className="app" data-theme={theme.type}>
          <ParticleBackground />
          
          <Router>
            <AnimatePresence mode="wait">
              <Routes>
                <Route
                  path="/login"
                  element={
                    !user ? (
                      <motion.div
                        key="login"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <LoginPage onLogin={handleLogin} />
                      </motion.div>
                    ) : (
                      <Navigate to="/chat" replace />
                    )
                  }
                />
                
                <Route
                  path="/chat"
                  element={
                    user ? (
                      <motion.div
                        key="chat"
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ChatPage 
                          user={user} 
                          socket={socket}
                          onLogout={handleLogout}
                          onThemeToggle={toggleTheme}
                        />
                      </motion.div>
                    ) : (
                      <Navigate to="/login" replace />
                    )
                  }
                />
                
                <Route
                  path="/settings"
                  element={
                    user ? (
                      <motion.div
                        key="settings"
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -50 }}
                        transition={{ duration: 0.3 }}
                      >
                        <SettingsPage 
                          user={user}
                          theme={theme}
                          onThemeChange={toggleTheme}
                          onLogout={handleLogout}
                        />
                      </motion.div>
                    ) : (
                      <Navigate to="/login" replace />
                    )
                  }
                />
                
                <Route
                  path="/profile"
                  element={
                    user ? (
                      <motion.div
                        key="profile"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ProfilePage 
                          user={user}
                          onUpdateProfile={(updatedUser) => setUser(updatedUser)}
                        />
                      </motion.div>
                    ) : (
                      <Navigate to="/login" replace />
                    )
                  }
                />
                
                <Route
                  path="/"
                  element={<Navigate to={user ? "/chat" : "/login"} replace />}
                />
                
                <Route
                  path="*"
                  element={
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="min-h-screen flex items-center justify-center"
                    >
                      <div className="glass rounded-2xl p-8 text-center">
                        <h1 className="text-4xl font-bold gradient-text mb-4">404</h1>
                        <p className="text-lg text-secondary mb-6">Page not found</p>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="glass-hover px-6 py-3 rounded-lg font-medium"
                          onClick={() => window.history.back()}
                        >
                          Go Back
                        </motion.button>
                      </div>
                    </motion.div>
                  }
                />
              </Routes>
            </AnimatePresence>
          </Router>
          
          <NotificationSystem />
        </div>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;