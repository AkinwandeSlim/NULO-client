/**
 * Viewing Requests API Module
 * Handles all viewing request-related API calls to FastAPI backend
 */

import apiClient from './client';

// Types
export interface ViewingRequest {
  id: string;
  tenant_id: string;
  landlord_id: string;
  property_id: string;
  preferred_date: string;
  time_slot: 'morning' | 'afternoon' | 'evening';
  contact_number: string;
  tenant_name: string;
  message?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'rejected';
  landlord_notes?: string;
  confirmed_date?: string;
  confirmed_time?: string;
  created_at: string;
  updated_at?: string;
  property?: any;
  landlord?: any;
}

export interface ViewingRequestsResponse {
  success: boolean;
  viewing_requests: ViewingRequest[];
  count: number;
}

export interface ViewingRequestResponse {
  success: boolean;
  viewing_request: ViewingRequest;
}

export interface CreateViewingRequestData {
  property_id: string;
  preferred_date: string;
  time_slot: 'morning' | 'afternoon' | 'evening';
  contact_number: string;
  tenant_name: string;
  message?: string;
}

export interface UpdateViewingRequestData {
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  landlord_notes?: string;
  confirmed_date?: string;
  confirmed_time?: string;
}

// Viewing Requests API
export const viewingRequestsAPI = {
  /**
   * Get all viewing requests for current user
   */
  getAll: async (statusFilter?: string): Promise<ViewingRequestsResponse> => {
    const params = statusFilter ? { status_filter: statusFilter } : {};
    const response = await apiClient.get<ViewingRequestsResponse>(
      '/api/v1/viewing-requests',
      { params }
    );
    return response.data;
  },

  /**
   * Get specific viewing request by ID
   */
  getById: async (requestId: string): Promise<ViewingRequestResponse> => {
    const response = await apiClient.get<ViewingRequestResponse>(
      `/api/v1/viewing-requests/${requestId}`
    );
    return response.data;
  },

  /**
   * Create a new viewing request
   */
  create: async (data: CreateViewingRequestData): Promise<ViewingRequestResponse> => {
    const response = await apiClient.post<ViewingRequestResponse>(
      '/api/v1/viewing-requests',
      data
    );
    return response.data;
  },

  /**
   * Update viewing request (cancel)
   */
  update: async (
    requestId: string,
    data: UpdateViewingRequestData
  ): Promise<ViewingRequestResponse> => {
    const response = await apiClient.patch<ViewingRequestResponse>(
      `/api/v1/viewing-requests/${requestId}`,
      data
    );
    return response.data;
  },

  /**
   * Cancel viewing request
   */
  cancel: async (requestId: string): Promise<ViewingRequestResponse> => {
    return viewingRequestsAPI.update(requestId, { status: 'cancelled' });
  },

  /**
   * Delete viewing request
   */
  delete: async (requestId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete<{ success: boolean; message: string }>(
      `/api/v1/viewing-requests/${requestId}`
    );
    return response.data;
  },
};

export default viewingRequestsAPI;
