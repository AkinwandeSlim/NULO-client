/**
 * Authentication API Module
 * Handles all auth-related API calls to FastAPI backend
 */

import apiClient, { storage } from './client';

// Types
export interface RegisterData {
  email: string;
  password: string;
  full_name: string;
  user_type: 'tenant' | 'landlord';
  phone?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user: User;
  access_token: string;
  token_type: string;
  message?: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  user_type: 'tenant' | 'landlord';
  trust_score: number;
  verification_status: string;
  created_at: string;
  tenant_profile?: TenantProfile;
  landlord_profile?: LandlordProfile;
}

export interface TenantProfile {
  budget: number | null;
  preferred_location: string | null;
  move_in_date: string | null;
  preferences: any;
  documents: any;
  profile_completion: number;
  onboarding_completed: boolean;
}

export interface LandlordProfile {
  guarantee_joined: boolean;
  guarantee_contribution: number;
}

// Auth API
export const authAPI = {
  /**
   * Register a new user
   */
  register: async (data: RegisterData): Promise<AuthResponse> => {
    console.log('🔐 [AUTH API] Attempting registration...');
    console.log('📧 [AUTH API] Email:', data.email);
    console.log('👤 [AUTH API] Full Name:', data.full_name);
    console.log('📱 [AUTH API] Phone:', data.phone);
    console.log('👥 [AUTH API] User Type:', data.user_type);
    console.log('🌐 [AUTH API] API Base URL:', apiClient.defaults.baseURL);
    console.log('🎯 [AUTH API] Full URL:', `${apiClient.defaults.baseURL}/api/v1/auth/register`);
    console.log('📦 [AUTH API] Full payload:', JSON.stringify(data, null, 2));
    
    try {
      const response = await apiClient.post<AuthResponse>('/api/v1/auth/register', data);
      
      console.log('✅ [AUTH API] Registration response:', response.data);
      
      // Store token and user
      if (response.data.success) {
        storage.setToken(response.data.access_token);
        storage.setUser(response.data.user);
        console.log('💾 [AUTH API] Token and user stored');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('❌ [AUTH API] Registration failed');
      console.error('❌ [AUTH API] Full error object:', error);
      console.error('❌ [AUTH API] Error.response:', error.response);
      console.error('❌ [AUTH API] Error.request:', error.request);
      console.error('❌ [AUTH API] Error.message:', error.message);
      console.error('❌ [AUTH API] Error.config:', error.config);
      
      if (error.response) {
        // Server responded with error
        console.error('❌ [AUTH API] Response status:', error.response.status);
        console.error('❌ [AUTH API] Response data:', error.response.data);
        console.error('❌ [AUTH API] Response headers:', error.response.headers);
        
        // Log detailed validation errors if available
        if (error.response.data?.detail) {
          console.error('❌ [AUTH API] Validation errors:', JSON.stringify(error.response.data.detail, null, 2));
        }
      } else if (error.request) {
        // Request made but no response
        console.error('❌ [AUTH API] No response received');
        console.error('❌ [AUTH API] Request:', error.request);
      } else {
        // Error setting up request
        console.error('❌ [AUTH API] Request setup error:', error.message);
      }
      
      throw error;
    }
  },

  /**
   * Login user
   */
  login: async (data: LoginData): Promise<AuthResponse> => {
    console.log('🔐 [AUTH API] Attempting login...');
    console.log('📧 [AUTH API] Email:', data.email);
    console.log('🌐 [AUTH API] API Base URL:', apiClient.defaults.baseURL);
    console.log('🎯 [AUTH API] Full URL:', `${apiClient.defaults.baseURL}/api/v1/auth/login`);
    
    try {
      const response = await apiClient.post<AuthResponse>('/api/v1/auth/login', data);
      
      console.log('✅ [AUTH API] Login response:', response.data);
      
      // Store token and user
      if (response.data.success) {
        storage.setToken(response.data.access_token);
        storage.setUser(response.data.user);
        console.log('💾 [AUTH API] Token and user stored');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('❌ [AUTH API] Login failed');
      console.error('❌ [AUTH API] Full error object:', error);
      console.error('❌ [AUTH API] Error.response:', error.response);
      console.error('❌ [AUTH API] Error.request:', error.request);
      console.error('❌ [AUTH API] Error.message:', error.message);
      console.error('❌ [AUTH API] Error.config:', error.config);
      
      if (error.response) {
        // Server responded with error
        console.error('❌ [AUTH API] Response status:', error.response.status);
        console.error('❌ [AUTH API] Response data:', error.response.data);
        console.error('❌ [AUTH API] Response headers:', error.response.headers);
      } else if (error.request) {
        // Request made but no response
        console.error(' [AUTH API] No response received');
        console.error(' [AUTH API] Request:', error.request);
      } else {
        // Error setting up request
        console.error(' [AUTH API] Request setup error:', error.message);
      }
      
      throw error;
    }
  },

  /**
   * Get current user profile
   */
  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<User>('/api/v1/auth/me');
    
    // Update stored user
    storage.setUser(response.data);
    
    return response.data;
  },

  /**
   * Logout user
   */
  logout: async (): Promise<void> => {
    try {
      console.log('🔴 [AUTH API] Attempting logout...');
      
      const response = await apiClient.post('/api/v1/auth/logout');
      
      console.log('✅ [AUTH API] Logout successful:', response.data);
    } catch (error: any) {
      // Don't throw error for logout - we always want to clear local storage
      console.warn('⚠️ [AUTH API] Logout request failed, but clearing storage anyway:', error.message);
    } finally {
      // Always clear storage regardless of API response
      console.log('🧹 [AUTH API] Clearing local storage...');
      storage.clear();
    }
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: (): boolean => {
    return !!storage.getToken();
  },

  /**
   * Get stored user
   */
  getStoredUser: (): User | null => {
    return storage.getUser();
  },

  /**
   * Sync user profile with FastAPI backend
   * Called after signup to ensure user_type is set correctly in database
   */
  syncUserProfile: async (data: {
    user_id: string;
    email: string;
    first_name: string;
    last_name: string;
    full_name: string;
    user_type: 'tenant' | 'landlord' | 'admin';
    auth_provider?: string;
  }): Promise<any> => {
    try {
      console.log('🔄 [AUTH API] Syncing user profile with backend...');
      console.log('📦 [AUTH API] Sync payload:', data);

      const response = await apiClient.post('/api/v1/auth/sync-user-profile', {
        user_id: data.user_id,
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        full_name: data.full_name,
        user_type: data.user_type,
        auth_provider: data.auth_provider || 'email'
      });

      console.log('✅ [AUTH API] User profile synced successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ [AUTH API] Failed to sync user profile');
      console.error('❌ [AUTH API] Error response:', error.response?.data);
      console.error('❌ [AUTH API] Error message:', error.message);
      
      // Non-fatal - don't throw. User is already created in Supabase
      // Backend sync is for consistency only
      console.warn('⚠️ [AUTH API] Backend sync failed (non-fatal), user still created in Supabase');
      return null;
    }
  },
};

export default authAPI;
