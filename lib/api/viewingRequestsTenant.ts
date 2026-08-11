/**
 * Viewing Requests API — TENANT / MODAL
 *
 * Canonical name: viewingRequestsTenant.ts
 *
 * USED BY:
 *   - components/rental/ViewingRequestModal.tsx
 *   - lib/api/index.ts (re-exported as viewingRequestsAPI for property detail page)
 *
 * Response shape: { success, data, error } — intentional, matches modal's if (response.success) pattern.
 *
 * DO NOT import this in landlord pages — use lib/api/viewingRequests.ts (camelCase) instead.
 */

import apiClient from './client'

export interface ViewingRequestData {
  property_id: string
  preferred_date: string
  time_slot: 'morning' | 'afternoon' | 'evening'
  contact_number: string
  message?: string
  tenant_name: string
  viewing_type?: 'PHYSICAL' | 'VIRTUAL' | 'LIVE_VIDEO'  // ✅ Added — was missing, caused viewing_type to be dropped
}

export interface ViewingRequestUpdateData {
  status?: 'pending' | 'confirmed' | 'reschedule_proposed' | 'cancelled' | 'completed' | 'no_show'
  landlord_notes?: string
  confirmed_date?: string
  confirmed_time?: string
}

export interface ViewingRequest {
  id: string
  property_id: string
  tenant_id: string
  landlord_id: string
  preferred_date: string
  time_slot: string
  contact_number: string
  message?: string
  tenant_name: string
  viewing_type?: 'PHYSICAL' | 'VIRTUAL' | 'LIVE_VIDEO'
  status: 'pending' | 'confirmed' | 'reschedule_proposed' | 'cancelled' | 'completed' | 'no_show'
  landlord_notes?: string
  confirmed_date?: string
  confirmed_time?: string
  // Confirmed-only details. The backend masks these to null unless the viewing
  // is confirmed, so they can never leak before the appointment is fixed.
  safety_instructions?: string
  caretaker_name?: string
  caretaker_phone?: string
  meeting_url?: string
  created_at: string
  updated_at: string
  property?: {
    id: string
    title: string
    address: string
    price: number
    beds: number
    baths: number
    images: string[]
  }
  tenant?: {
    id: string
    first_name: string
    last_name: string
    phone_number: string
    avatar_url?: string
  }
}

export const viewingRequestsAPI = {
  /**
   * Create a new viewing request (tenant submits via modal)
   */
  create: async (data: ViewingRequestData) => {
    try {
      const response = await apiClient.post('/api/v1/viewing-requests', data)
      return {
        success: true,
        data: response.data
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to create viewing request'
      }
    }
  },

  /**
   * Get viewing requests for current tenant
   */
  // Alias for getMyRequests — used by tenant/viewings/page.tsx
  getAll: async (statusFilter?: string) => {
    try {
      const params = statusFilter ? { status_filter: statusFilter } : {}
      const response = await apiClient.get('/api/v1/viewing-requests/', { params })
      return { success: true, data: response.data }
    } catch (error: any) {
      return { success: false, error: error.response?.data?.detail || 'Failed to get viewing requests' }
    }
  },

  getMyRequests: async (statusFilter?: string) => {
    try {
      const params = statusFilter ? { status_filter: statusFilter } : {}
      const response = await apiClient.get('/api/v1/viewing-requests', { params })
      return {
        success: true,
        data: response.data
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to get viewing requests'
      }
    }
  },

  /**
   * Get a specific viewing request by ID
   */
  getById: async (id: string) => {
    try {
      const response = await apiClient.get(`/api/v1/viewing-requests/${id}`)
      return {
        success: true,
        data: response.data
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to get viewing request'
      }
    }
  },

  /**
   * Update a viewing request
   */
  update: async (id: string, data: ViewingRequestUpdateData) => {
    try {
      const response = await apiClient.patch(`/api/v1/viewing-requests/${id}`, data)
      return {
        success: true,
        data: response.data
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to update viewing request'
      }
    }
  },

  /**
   * Cancel a viewing request (tenant)
   */
  cancel: async (id: string) => {
    try {
      const response = await apiClient.patch(`/api/v1/viewing-requests/${id}`, {
        status: 'cancelled'
      })
      return {
        success: true,
        data: response.data
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to cancel viewing request'
      }
    }
  },

  respondToReschedule: async (id: string, decision: 'accept' | 'decline') => {
    try {
      const response = await apiClient.post(`/api/v1/viewing-requests/${id}/reschedule-decision`, { decision })
      return { success: true, data: response.data }
    } catch (error: any) {
      return { success: false, error: error.response?.data?.detail || 'Failed to respond to reschedule' }
    }
  },

  /**
   * Delete a viewing request
   */
  delete: async (requestId: string) => {
    try {
      const response = await apiClient.delete(`/api/v1/viewing-requests/${requestId}`)
      return {
        success: true,
        data: response.data
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to delete viewing request'
      }
    }
  },

  /**
   * Get viewing requests for a specific property (landlord)
   * Note: prefer getLandlordRequests() — this endpoint may not exist on backend
   */
  getPropertyRequests: async (propertyId: string) => {
    try {
      const response = await apiClient.get(`/api/v1/viewing-requests/property/${propertyId}`)
      return {
        success: true,
        data: response.data
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to get property viewing requests'
      }
    }
  },

  /**
   * Get all viewing requests for landlord's properties
   * Note: for landlord pages, prefer using viewingRequests.ts (camelCase) getLandlord() instead
   */
  getLandlordRequests: async (statusFilter?: string) => {
    try {
      const params = statusFilter ? { status_filter: statusFilter } : {}
      const response = await apiClient.get('/api/v1/viewing-requests/landlord', { params })
      return {
        success: true,
        data: response.data
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to get landlord viewing requests'
      }
    }
  },
}

export default viewingRequestsAPI
