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
    const response = await apiClient.get<FavoritesResponse>('/api/v1/favorites')
    return response.data
  },

  /**
   * Add a property to favorites
   */
  add: async (propertyId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post('/api/v1/favorites', {
      property_id: propertyId
    })
    return response.data
  },

  /**
   * Remove a property from favorites
   */
  remove: async (propertyId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete(`/api/v1/favorites/${propertyId}`)
    return response.data
  },

  /**
   * Check if a property is favorited
   */
  check: async (propertyId: string): Promise<{ is_favorite: boolean }> => {
    const response = await apiClient.get(`/api/v1/favorites/check/${propertyId}`)
    return response.data
  }
}