/**
 * Viewing Requests API — LANDLORD
 *
 * Canonical name: viewingRequestsLandlord.ts
 *
 * USED BY:
 *   - app/(dashboard)/landlord/viewings/page.tsx
 *
 * Response shape: throws on error, returns typed objects directly (no { success } wrapper).
 *
 * DO NOT import this in tenant pages or ViewingRequestModal —
 * use lib/api/viewing-requests.ts (kebab-case) instead, which has the { success, data } wrapper.
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
  status: 'pending' | 'confirmed' | 'reschedule_proposed' | 'cancelled' | 'completed' | 'no_show';
  landlord_notes?: string;
  confirmed_date?: string;
  confirmed_time?: string;
  safety_instructions?: string;
  caretaker_name?: string;
  caretaker_phone?: string;
  meeting_url?: string;
  no_show_reason?: string;
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
  viewing_type?: 'PHYSICAL' | 'VIRTUAL' | 'LIVE_VIDEO';
  message?: string;
}

export interface LandlordReviewData {
  status: 'confirmed' | 'reschedule_proposed' | 'cancelled' | 'completed' | 'no_show';
  landlord_notes?: string;
  confirmed_date?: string;
  confirmed_time?: string;
  safety_instructions?: string;
  caretaker_name?: string;
  caretaker_phone?: string;
  meeting_url?: string;
  no_show_reason?: string;
}

export interface UpdateViewingRequestData {
  status: 'pending' | 'confirmed' | 'reschedule_proposed' | 'cancelled' | 'completed' | 'no_show';
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
      '/api/v1/viewing-requests/',
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

  /**
   * Get all viewing requests for landlord's properties
   */
  getLandlord: async (statusFilter?: string): Promise<ViewingRequestsResponse> => {
    const params = statusFilter ? { status_filter: statusFilter } : {};
    const response = await apiClient.get<ViewingRequestsResponse>(
      '/api/v1/viewing-requests/landlord',
      { params, timeout: 60000 } // 60 second timeout for this endpoint
    );
    return response.data;
  },

  /**
   * Landlord confirms or cancels a viewing request
   */
  review: async (
    requestId: string,
    data: LandlordReviewData
  ): Promise<ViewingRequestResponse> => {
    const response = await apiClient.patch<ViewingRequestResponse>(
      `/api/v1/viewing-requests/${requestId}/review`,
      data
    );
    return response.data;
  },

  /**
   * Trigger a notification batch for a viewing (landlord-only)
   */
  sendSms: async (
    requestId: string,
    notificationType: 'confirmation' | 'reminder_24h' | 'reminder_1h' | 'interest'
  ): Promise<{ status: string; type: string }> => {
    const response = await apiClient.post<{ status: string; type: string }>(
      `/api/v1/viewing-requests/${requestId}/send-sms?notification_type=${notificationType}`
    );
    return response.data;
  },
};

export default viewingRequestsAPI;
