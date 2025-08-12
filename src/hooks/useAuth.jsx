import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionCheckInterval, setSessionCheckInterval] = useState(null);

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('🔄 Initializing auth state...');
        const token = authAPI.getStoredToken();
        const storedAdmin = authAPI.getStoredAdmin();
        
        console.log('📋 Stored token exists:', !!token);
        console.log('👤 Stored admin exists:', !!storedAdmin);
        console.log('⏰ Token expired:', token ? authAPI.isTokenExpired() : 'No token');
        
        if (token && storedAdmin && !authAPI.isTokenExpired()) {
          console.log('✅ Valid stored auth found, setting admin');
          // Set admin immediately for better UX
          setAdmin(storedAdmin);
          setLoading(false); // Set loading to false immediately since we have valid stored auth
          
          // Verify token is still valid in background
          try {
            console.log('🔍 Verifying token with backend...');
            const profile = await authAPI.getProfile();
            console.log('📋 Profile response:', profile);
            if (profile.success) {
              console.log('✅ Token verified, updating admin data');
              console.log('👤 New admin data:', profile.admin);
              // Update with fresh admin data
              setAdmin(profile.admin);
              // Update stored admin data
              localStorage.setItem('admin_user', JSON.stringify(profile.admin));
              console.log('💾 Admin data updated in state and localStorage');
            }
          } catch (error) {
            // Token invalid or expired, clear auth
            console.log('❌ Token verification failed, clearing auth:', error.message);
            await authAPI.logout();
            setAdmin(null);
            setLoading(false);
          }
        } else {
          // No valid stored auth or token expired
          if (token && authAPI.isTokenExpired()) {
            console.log('⏰ Token expired, clearing auth');
            await authAPI.logout();
          } else if (!token) {
            console.log('🚫 No token found');
          } else if (!storedAdmin) {
            console.log('🚫 No stored admin found');
          }
          setAdmin(null);
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        setAdmin(null);
        setLoading(false);
      }
      // Note: setLoading(false) is now called in each branch above for better control
    };

    initializeAuth();
  }, []);

  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await authAPI.login(credentials);
      
      if (result.success) {
        setAdmin(result.admin);
        return { success: true };
      } else {
        setError(result.message || 'Login failed');
        return { success: false, message: result.message };
      }
    } catch (error) {
      const errorMessage = error.message || 'Login failed';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await authAPI.logout();
      setAdmin(null);
      setError(null);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    admin,
    loading,
    error,
    login,
    logout,
    clearError,
    isAuthenticated: !!admin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
