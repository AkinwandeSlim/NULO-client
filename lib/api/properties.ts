/**
 * Properties API Module
 * Handles all property-related API calls to FastAPI backend
 */

import apiClient from './client';

// Types
export interface Property {
  id: string;
  title: string;
  description: string;
  location: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  square_feet: number;
  property_type: string;
  amenities: string[];
  images: string[];
  landlord_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface PropertySearchParams {
  location?: string;
  min_price?: number;
  max_price?: number;
  bedrooms?: number;
  bathrooms?: number;
  property_type?: string;
  page?: number;
  limit?: number;
}

export interface PropertySearchResponse {
  success: boolean;
  properties: Property[];
  total: number;
  page: number;
  limit: number;
}

export interface CreatePropertyData {
  title: string;
  description: string;
  location: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  square_feet: number;
  property_type: string;
  amenities?: string[];
  images?: string[];
}

// Properties API
export const propertiesAPI = {
  /**
   * Search properties with filters
   */
  search: async (params: PropertySearchParams = {}): Promise<PropertySearchResponse> => {
    const response = await apiClient.get<PropertySearchResponse>('/api/v1/properties/search', {
      params,
    });
    return response.data;
  },

  /**
   * Get property by ID
   */
  getById: async (id: string): Promise<Property> => {
    const response = await apiClient.get<Property>(`/api/v1/properties/${id}`);
    return response.data;
  },

  /**
   * Create new property (landlord only)
   */
  create: async (data: CreatePropertyData | FormData): Promise<Property> => {
    const response = await apiClient.post<Property>('/api/v1/properties', data, {
      headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
      timeout: 60000 // 60 seconds for file uploads
    });
    return response.data;
  },

  /**
   * Update property (landlord only)
   */
  update: async (id: string, data: Partial<CreatePropertyData>): Promise<Property> => {
    const response = await apiClient.patch<Property>(`/api/v1/properties/${id}`, data);
    return response.data;
  },

  /**
   * Delete property (landlord only)
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/properties/${id}`);
  },

  /**
   * Get landlord's properties
   */
  getMyProperties: async (page: number = 1, limit: number = 20): Promise<PropertySearchResponse> => {
    const response = await apiClient.get<PropertySearchResponse>('/api/v1/properties/my-properties', {
      params: { page, limit }
    });
    return response.data;
  },
};

export default propertiesAPI;
