import apiClient from './client'

export interface Favorite {
  id: string
  user_id: string
  property_id: string
  created_at: string
  property?: any
}

export interface FavoritesResponse {
  success: boolean
  favorites: any[]
  total: number
  count: number
}

export const favoritesAPI = {
  /**
   * Get all favorites for the current user
   */
  getAll: async (): Promise<FavoritesResponse> => {
    const response = await apiClient.get<FavoritesResponse>('/api/v1/favorites/')
    return response.data
  },

  /**
   * Fast version for dashboard - adaptive timeout for Nigeria connectivity
   */
  getAllFast: async (): Promise<FavoritesResponse> => {
    try {
      // First try with short timeout (10s) for responsive UX
      const response = await apiClient.get<FavoritesResponse>('/api/v1/favorites/', { timeout: 10000 })
      return response.data
    } catch (error: any) {
      // If it's a timeout, try once more with longer timeout for poor connectivity
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        try {
          const response = await apiClient.get<FavoritesResponse>('/api/v1/favorites/', { timeout: 25000 })
          return response.data
        } catch (retryError: any) {
          try {
            // Final fallback to standard method for reliability
            const response = await apiClient.get<FavoritesResponse>('/api/v1/favorites/')
            return response.data
          } catch (finalError: any) {
            return { success: false, favorites: [], total: 0, count: 0 }
          }
        }
      }
      // For other errors, return empty immediately
      return { success: false, favorites: [], total: 0, count: 0 }
    }
  },

/**
   * Add a property to favorites.
   * Returns alreadySaved: true if the server says it's a duplicate —
   * this is treated as SUCCESS so the heart stays red.
   */
  add: async (propertyId: string): Promise<{ success: boolean; message: string; alreadySaved?: boolean }> => {
    try {
      const response = await apiClient.post('/api/v1/favorites/', { property_id: propertyId })
      return response.data
    } catch (error: any) {
      const status = error?.response?.status
      const detail: string = error?.response?.data?.detail || error?.response?.data?.message || ''
      
      // Backend returns 400 or 409 with "already saved/exists" message — treat as success
      if (status === 409 || status === 400 || detail.toLowerCase().includes('already')) {
        console.log(`ℹ️ [FAVORITES API] Already saved on server (${status}) — returning alreadySaved`)
        return { success: true, message: detail, alreadySaved: true }
      }
      throw error
    }
  },

  remove: async (propertyId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete(`/api/v1/favorites/${propertyId}/`)
    return response.data
  },

  check: async (propertyId: string): Promise<{ is_favorite: boolean }> => {
    const response = await apiClient.get(`/api/v1/favorites/check/${propertyId}/`)
    return response.data
  }
}