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
  },

  /**
   * Get list of all admin accounts (Super Admin only)
   * Returns: { success, admins[], total }
   */
  async getAdminAccounts(limit: number = 50, offset: number = 0) {
    try {
      console.log('📋 [ADMIN API] Fetching admin accounts...')
      
      const response = await apiClient.get('/api/v1/admin/role-accounts', {
        params: { limit, offset }
      })

      console.log('✅ [ADMIN API] Admin accounts retrieved:', {
        total: response.data.total,
        count: response.data.admins?.length || 0
      })

      return response.data
    } catch (error: any) {
      console.error('❌ [ADMIN API] Failed to fetch admin accounts:', error.response?.data || error.message)
      throw error
    }
  },

  /**
   * Update admin role level (Super Admin only)
   * role_level: 1=super_admin, 2=admin, 3=limited_admin
   */
  async updateAdminRole(
    adminId: string,
    roleLevel: 1 | 2 | 3,
    reason?: string
  ) {
    try {
      console.log(`🔄 [ADMIN API] Updating admin ${adminId} to role level ${roleLevel}...`)

      const response = await apiClient.post(`/api/v1/admin/admin-accounts/${adminId}/role`, {
        role_level: roleLevel,
        reason: reason
      })

      console.log('✅ [ADMIN API] Admin role updated:', response.data)
      return response.data
    } catch (error: any) {
      console.error('❌ [ADMIN API] Failed to update admin role:', error.response?.data || error.message)
      throw error
    }
  },

  /**
   * Delete admin account (Super Admin only)
   * Soft delete - removes from admins table only
   */
  async deleteAdmin(adminId: string) {
    try {
      console.log(`🗑️ [ADMIN API] Deleting admin ${adminId}...`)

      const response = await apiClient.delete(`/api/v1/admin/admin-accounts/${adminId}`)

      console.log('✅ [ADMIN API] Admin deleted:', response.data)
      return response.data
    } catch (error: any) {
      console.error('❌ [ADMIN API] Failed to delete admin:', error.response?.data || error.message)
      throw error
    }
  },

  /**
   * Get current user's admin role level
   * Returns: role_level (1, 2, or 3) or undefined if not admin
   */
  async getCurrentAdminRole() {
    try {
      console.log('🔍 [ADMIN API] Fetching current admin role...')

      const response = await apiClient.get('/api/v1/admin/current-role')

      console.log('✅ [ADMIN API] Current role:', response.data.role_level)
      return response.data.role_level
    } catch (error: any) {
      if (error.response?.status === 404) {
        // User is not an admin
        return undefined
      }
      console.warn('⚠️ [ADMIN API] Could not fetch current admin role:', error.message)
      return undefined
    }
  }
}

export default adminAPI;
