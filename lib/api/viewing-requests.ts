/**
 * Viewing Requests API
 * Handles property viewing request operations
 */

import apiClient from './client'

export interface ViewingRequestData {
  property_id: string
  preferred_date: string
  time_slot: 'morning' | 'afternoon' | 'evening'
  contact_number: string
  message?: string
  tenant_name: string
}

export interface ViewingRequestUpdateData {
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
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
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  landlord_notes?: string
  confirmed_date?: string
  confirmed_time?: string
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
   * Create a new viewing request
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
   * Get viewing requests for current user
   */
  getMyRequests: async (statusFilter?: string) => {
    try {
      const params = statusFilter ? { status_filter: statusFilter } : {}
      const response = await apiClient.get('/viewing-requests', { params })
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
   * Get a specific viewing request
   */
  getById: async (id: string) => {
    try {
      const response = await apiClient.get(`/viewing-requests/${id}`)
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
   * Update a viewing request (for landlords)
   */
  update: async (id: string, data: ViewingRequestUpdateData) => {
    try {
      const response = await apiClient.patch(`/viewing-requests/${id}`, data)
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
   * Cancel a viewing request (for tenants)
   */
  cancel: async (id: string) => {
    try {
      const response = await apiClient.patch(`/viewing-requests/${id}`, {
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

  /**
   * Get viewing requests for a property (for landlords)
   */
  getPropertyRequests: async (propertyId: string) => {
    try {
      const response = await apiClient.get(`/viewing-requests/property/${propertyId}`)
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
   * Get viewing requests for landlord's properties
   */
  getLandlordRequests: async (statusFilter?: string) => {
    try {
      const params = statusFilter ? { status_filter: statusFilter } : {}
      const response = await apiClient.get('/viewing-requests/landlord', { params })
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

  /**
   * Delete/Cancel a viewing request
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
  }
}
