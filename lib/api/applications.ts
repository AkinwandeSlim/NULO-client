/**
 * Applications API Module
 * Handles all application-related API calls to FastAPI backend
 * Updated to match new database schema (user_id instead of tenant_id)
 */

import apiClient from './client';

// Reference interface for JSONB references field
export interface ApplicationReference {
  name: string;
  phone: string;
  relationship: string;
}

// Types - Updated to match backend schema
export interface Application {
  id: string;
  property_id: string;
  user_id: string;  // Updated from tenant_id
  viewing_id?: string;
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn';
  message?: string;
  employment_status?: string;
  employer_name?: string;
  monthly_income?: number;
  move_in_date?: string;
  lease_duration?: string;
  number_of_occupants?: number;
  has_pets?: boolean;
  pet_details?: string;
  references?: {
    reference1?: ApplicationReference;
    reference2?: ApplicationReference;
  };
  documents?: string[];  // text array of URLs
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  viewed_by_landlord?: boolean;
  viewed_at?: string;
  created_at: string;
  updated_at: string;
  // Joined relationships
  property?: {
    id: string;
    title: string;
    description?: string;
    property_type?: string;
    address?: string;
    full_address?: string;
    location?: string;
    city?: string;
    state?: string;
    price?: number;
    security_deposit?: number;
    beds?: number;
    baths?: number;
    sqft?: number;
    amenities?: string[];
    rules?: string[];
    furnished?: boolean;
    pet_friendly?: boolean;
    images?: string[];
    video_tour_url?: string;
    status?: string;
    verification_status?: string;
    view_count?: number;
    application_count?: number;
  };
  user?: {
    id: string;
    email: string;
    full_name?: string;
    phone_number?: string;
    phone?: string;
    avatar_url?: string;
    user_type?: string;
  };
}

export interface CreateApplicationData {
  property_id: string;
  viewing_id?: string;
  message?: string;
  employment_status?: string;
  employer_name?: string;
  monthly_income?: number;
  move_in_date?: string;
  lease_duration?: string;
  number_of_occupants?: number;
  has_pets?: boolean;
  pet_details?: string;
  references?: any;
  documents?: string[];
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}

export interface ApplicationsResponse {
  success: boolean;
  applications: Application[];
  total?: number;
}

export interface ApplicationStats {
  success: boolean;
  stats: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
}

// Applications API
export const applicationsAPI = {
  /**
   * Submit new application
   * Updated to use JSON with document URLs instead of FormData
   */
  create: async (data: CreateApplicationData): Promise<Application> => {
    const response = await apiClient.post<Application>('/api/v1/applications/', data);
    return response.data;
  },

  /**
   * Get tenant's own applications
   */
  getMyApplications: async (): Promise<ApplicationsResponse> => {
    const response = await apiClient.get<ApplicationsResponse>('/api/v1/applications/my-applications');
    return response.data;
  },

  /**
   * Get applications received by landlord
   */
  getReceivedApplications: async (): Promise<ApplicationsResponse> => {
    const response = await apiClient.get<ApplicationsResponse>('/api/v1/applications/received', {
      timeout: 60000 // 60 seconds - slow endpoint
    });
    return response.data;
  },

  /**
   * Get application statistics
   */
  getStats: async (): Promise<ApplicationStats> => {
    const response = await apiClient.get<ApplicationStats>('/api/v1/applications/stats');
    return response.data;
  },

  /**
   * Get all applications for current user (tenant or landlord)
   */
  getAll: async (): Promise<ApplicationsResponse> => {
    const response = await apiClient.get<ApplicationsResponse>('/api/v1/applications/');
    return response.data;
  },

  /**
   * Get application by ID
   */
  getById: async (id: string): Promise<Application> => {
    const response = await apiClient.get<{success: boolean, application: Application}>(`/api/v1/applications/${id}`);
    return response.data.application;
  },

  /**
   * Approve application (landlord only)
   */
  approve: async (id: string): Promise<Application> => {
    const response = await apiClient.patch<{success: boolean; application: Application; message: string}>(`/api/v1/applications/${id}/approve`);
    return response.data.application;
  },

  /**
   * Reject application (landlord only)
   */
  reject: async (id: string, reason: string): Promise<Application> => {
    const response = await apiClient.patch<{success: boolean; application: Application; message: string}>(`/api/v1/applications/${id}/reject`, {
      reason,
      reason_code: 'landlord_rejected'
    });
    return response.data.application;
  },

  /**
   * Withdraw application (tenant only)
   */
  withdraw: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/applications/${id}`);
  },
};

export default applicationsAPI;
