/**
 * Admin API Module
 * Handles all admin-related API calls to FastAPI backend
 */

import apiClient, { storage } from './client';

// Types
export interface AdminRegisterData {
  email: string;
  password: string;
  full_name: string;
  user_type: 'admin';
  admin_code?: string,
}

export interface AdminProfileData {
  user_id: string | undefined;
  email: string;
  full_name: string;
  role_level: number;
  permissions: {
    all: boolean;
    tenant_verification: boolean;
    landlord_verification: boolean;
    property_verification: boolean;
    user_management: boolean;
    system_settings: boolean;
  };
}

export interface AdminAuthResponse {
  success: boolean;
  user: {
    id: string;
    email: string;
    full_name: string;
    user_type: 'admin';
    created_at: string;
  };
  message?: string;
}

export interface AdminProfileResponse {
  success: boolean;
  message?: string;
  admin_profile?: {
    id: string;
    user_id: string;
    email: string;
    full_name: string;
    role_level: number;
    permissions: any;
    created_at: string;
  };
}

// Admin API
export const adminAPI = {
  /**
   * Register a new admin user
   */
  register: async (data: AdminRegisterData): Promise<AdminAuthResponse> => {
    console.log('🔐 [ADMIN API] Attempting admin registration...');
    console.log('📧 [ADMIN API] Email:', data.email);
    console.log('👤 [ADMIN API] Full Name:', data.full_name);
    console.log('👥 [ADMIN API] User Type:', data.user_type);
    console.log('🌐 [ADMIN API] API Base URL:', apiClient.defaults.baseURL);
    console.log('🎯 [ADMIN API] Full URL:', `${apiClient.defaults.baseURL}/api/v1/auth/register`);
    
    try {
      const response = await apiClient.post<AdminAuthResponse>('/api/v1/auth/register', data);
      
      console.log('✅ [ADMIN API] Admin registration response:', response.data);
      
      return response.data;
    } catch (error: any) {
      console.error('❌ [ADMIN API] Admin registration failed');
      console.error('❌ [ADMIN API] Full error object:', error);
      
      if (error.response) {
        console.error('❌ [ADMIN API] Response status:', error.response.status);
        console.error('❌ [ADMIN API] Response data:', error.response.data);
        
        // Handle specific error cases
        if (error.response.status === 400) {
          throw new Error(error.response.data.message || 'Invalid admin registration data');
        } else if (error.response.status === 409) {
          throw new Error('Admin with this email already exists');
        } else if (error.response.status === 500) {
          throw new Error('Server error during admin registration');
        }
      }
      
      throw new Error(error.message || 'Failed to register admin account');
    }
  },

  /**
   * Create admin profile in database
   */
  createProfile: async (profileData: AdminProfileData) => {
    try {
      console.log('👤 [ADMIN API] Creating admin profile...')
      console.log('🆔 [ADMIN API] User ID:', profileData.user_id)
      console.log('📧 [ADMIN API] Email:', profileData.email)
      console.log('👤 [ADMIN API] Full Name:', profileData.full_name)
      console.log('⭐ [ADMIN API] Role Level:', profileData.role_level)
      
      // Use dev route for now (no auth required)
      const response = await apiClient.post('/api/v1/admin/create-profile-dev', profileData)
      
      console.log('📊 [ADMIN API] Profile creation response:', response.data)
      return response.data
    } catch (error: any) {
      console.error('❌ [ADMIN API] Profile creation failed:', error)
      return {
        success: false,
        message: error.response?.data?.detail || error.message || 'Failed to create admin profile'
      }
    }
  },

  /**
   * Get admin profile
   */
  getProfile: async (userId: string): Promise<AdminProfileResponse> => {
    console.log('👤 [ADMIN API] Getting admin profile for user:', userId);
    
    try {
      const response = await apiClient.get<AdminProfileResponse>(`/api/v1/admin/profile/${userId}`);
      
      console.log('✅ [ADMIN API] Admin profile retrieved:', response.data);
      
      return response.data;
    } catch (error: any) {
      console.error('❌ [ADMIN API] Failed to get admin profile');
      
      if (error.response) {
        if (error.response.status === 404) {
          throw new Error('Admin profile not found');
        }
      }
      
      throw new Error(error.message || 'Failed to get admin profile');
    }
  }
};

export default adminAPI;
