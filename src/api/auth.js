import apiClient from './client';

export const authAPI = {
  // Admin login
  login: async (credentials) => {
    try {
      console.log('🔑 Attempting login with:', { email: credentials.email });
      const response = await apiClient.post('/api/admin/auth/login', credentials);
      
      console.log('📝 Login response:', {
        success: response.data.success,
        hasToken: !!response.data.token,
        hasAdmin: !!response.data.admin
      });
      
      // Store token and user data
      if (response.data.success && response.data.token) {
        console.log('💾 Storing token and admin data in localStorage');
        localStorage.setItem('admin_token', response.data.token);
        localStorage.setItem('admin_user', JSON.stringify(response.data.admin));
        
        // Verify storage worked
        const storedToken = localStorage.getItem('admin_token');
        const storedAdmin = localStorage.getItem('admin_user');
        console.log('✅ Storage verification:', {
          tokenStored: !!storedToken,
          adminStored: !!storedAdmin
        });
      }
      
      return response.data;
    } catch (error) {
      console.log('❌ Login error:', error.response?.data || error.message);
      throw {
        message: error.response?.data?.message || error.message || 'Login failed',
        status: error.response?.status
      };
    }
  },

  // Get admin profile
  getProfile: async () => {
    try {
      const response = await apiClient.get('/api/admin/auth/profile');
      return response.data;
    } catch (error) {
      throw {
        message: error.response?.data?.message || error.message || 'Failed to get profile',
        status: error.response?.status
      };
    }
  },

  // Admin logout
  logout: async () => {
    try {
      await apiClient.post('/api/admin/auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error.message);
    } finally {
      // Always clear local storage
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
    }
  },

  // Check if admin is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem('admin_token');
    const user = localStorage.getItem('admin_user');
    return !!(token && user);
  },

  // Check if token is expired (basic check)
  isTokenExpired: () => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      console.log('🚫 No token found for expiry check');
      return true;
    }
    
    try {
      // Decode JWT payload (basic check without verification)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      const isExpired = payload.exp < currentTime;
      
      console.log('⏰ Token expiry check:', {
        expires: new Date(payload.exp * 1000).toLocaleString(),
        current: new Date().toLocaleString(),
        isExpired
      });
      
      return isExpired;
    } catch (error) {
      console.log('❌ Error decoding token:', error.message);
      return true; // If can't decode, consider expired
    }
  },

  // Get stored admin data
  getStoredAdmin: () => {
    try {
      const user = localStorage.getItem('admin_user');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Error parsing stored admin data:', error);
      return null;
    }
  },

  // Get stored token
  getStoredToken: () => {
    return localStorage.getItem('admin_token');
  }
};
