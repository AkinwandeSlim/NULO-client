/**
 * Properties API - Database-Aligned & Optimized
 * All field names match the exact Supabase database schema
 */

import apiClient from './client';
import axios, { CancelTokenSource } from 'axios';
import optimizedPropertyCache from '../cache/propertyCache';
import type {
  Property,
  PropertySearchParams,
  PropertySearchResponse,
  CreatePropertyData,
  UpdatePropertyData,
  PopularLocationsResponse,
} from '../types/property';

// ============================================================================
// REQUEST CANCELLATION MANAGER
// ============================================================================

class RequestManager {
  private static activeRequests = new Map<string, CancelTokenSource>();
  
  static createCancelToken(key: string): CancelTokenSource {
    this.cancel(key);
    const source = axios.CancelToken.source();
    this.activeRequests.set(key, source);
    return source;
  }
  
  static cancel(key: string): void {
    const source = this.activeRequests.get(key);
    if (source) {
      source.cancel('Request cancelled due to new request');
      this.activeRequests.delete(key);
    }
  }
  
  static cleanup(key: string): void {
    this.activeRequests.delete(key);
  }
}

// ============================================================================
// PROPERTIES API
// ============================================================================

export const propertiesAPI = {
  /**
   * Search properties with filters - ULTRA-OPTIMIZED
   * Database fields used:
   * - location, city, state (for location search)
   * - price (for price range)
   * - beds, baths (for bedroom/bathroom filters)
   * - property_type (for type filter)
   * - status = 'vacant' (only show available properties)
   * - featured (for featured sort)
   * - created_at (for newest sort)
   */
  search: async (
    params: PropertySearchParams,
    options?: {
      skipCache?: boolean;
      signal?: AbortSignal;
    }
  ): Promise<PropertySearchResponse> => {
    const startTime = performance.now();
    
    try {
      console.log('🔍 [PROPERTIES API] Searching with params:', params);
      
      // OPTIMIZATION 1: Check cache first
      if (!options?.skipCache) {
        const cacheKey = optimizedPropertyCache.generateCacheKey(params);
        const cached = await optimizedPropertyCache.get(cacheKey);
        
        if (cached) {
          const duration = performance.now() - startTime;
          console.log(`🎯 [CACHE HIT] ${duration.toFixed(0)}ms:`, cacheKey);
          return {
            ...cached,
            performance: {
              ...cached.performance,
              cache_hit: true,
              execution_time: duration / 1000
            }
          };
        }
      }
      
      // OPTIMIZATION 2: Build query with database-aligned field names
      const queryParams = new URLSearchParams();
      
      // Location search (searches in location, city, state fields)
      if (params.location) {
        queryParams.append('location', params.location);
      }
      
      // Price range
      if (params.min_price !== undefined) {
        queryParams.append('min_price', params.min_price.toString());
      }
      if (params.max_price !== undefined) {
        queryParams.append('max_price', params.max_price.toString());
      }
      
      // Bedrooms (minimum beds)
      if (params.bedrooms !== undefined) {
        queryParams.append('bedrooms', params.bedrooms.toString());
      }
      
      // Bathrooms (minimum baths)
      if (params.bathrooms !== undefined) {
        queryParams.append('bathrooms', params.bathrooms.toString());
      }
      
      // Property type
      if (params.property_type && params.property_type !== 'all') {
        queryParams.append('property_type', params.property_type);
      }
      
      // Additional filters
      if (params.furnished !== undefined) {
        queryParams.append('furnished', params.furnished.toString());
      }
      if (params.pet_friendly !== undefined) {
        queryParams.append('pet_friendly', params.pet_friendly.toString());
      }
      if (params.parking_required !== undefined) {
        queryParams.append('parking_required', params.parking_required.toString());
      }
      
      // Sorting
      if (params.sort) {
        queryParams.append('sort', params.sort);
      }
      
      // Pagination
      if (params.page !== undefined) {
        queryParams.append('page', params.page.toString());
      }
      if (params.limit !== undefined) {
        queryParams.append('limit', params.limit.toString());
      }
      
      // OPTIMIZATION 4: Create cancellable request with LONGER timeout
      const requestKey = `search_${queryParams.toString()}`;
      const cancelToken = RequestManager.createCancelToken(requestKey);
      
      // OPTIMIZATION 4: Use optimized HTTP client with EXTENDED timeout (30s for slow Supabase)
      const searchClient = axios.create({
        baseURL: apiClient.defaults.baseURL,
        headers: apiClient.defaults.headers,
        timeout: 60000, // 60 seconds for slow backend queries
      });
      
      const url = `/api/v1/properties/search?${queryParams.toString()}`;
      console.log('🚀 [API REQUEST]:', url);
      
      const response = await searchClient.get(url, {
        cancelToken: cancelToken.token,
        signal: options?.signal,
      });
      
      RequestManager.cleanup(requestKey);
      
      const serverData = response.data;
      const duration = performance.now() - startTime;
      
      // OPTIMIZATION 5: Cache the response - BUT NOT if empty results
      // Empty results might be temporary (backend still processing or data issue)
      // So we skip caching for empty results to avoid stale cache issues
      const cacheKey = optimizedPropertyCache.generateCacheKey(params);
      const cacheTtl = serverData.optimization?.client_cache_ttl || 300;
      
      // Only cache if we have results or if it's not a location search
      const hasResults = serverData.properties && serverData.properties.length > 0;
      const hasLocationFilter = params.location && params.location.length > 0;
      const shouldCache = hasResults || !hasLocationFilter;
      
      if (shouldCache) {
        optimizedPropertyCache.set(cacheKey, serverData, cacheTtl, params).catch(err => {
          console.warn('Failed to cache response:', err);
        });
      } else {
        console.warn('⚠️ [CACHE] Skipping cache for empty location search:', params.location);
      }
      
      // OPTIMIZATION 6: Prefetch next page
      if (params.page && params.page < (serverData.pagination?.total_pages || 1)) {
        setTimeout(() => {
          optimizedPropertyCache.prefetchNext(
            params.page!,
            params,
            async (nextParams) => {
              try {
                if (!nextParams) {
                  return {
                    success: true,
                    properties: [],
                    pagination: {
                      total: 0,
                      page: 1,
                      limit: 20,
                      total_pages: 1
                    },
                    filters: {},
                    sorting: {}
                  };
                }
                return await propertiesAPI.search(nextParams, { skipCache: true });
              } catch {
                return {
                  success: true,
                  properties: [],
                  pagination: {
                    total: 0,
                    page: 1,
                    limit: nextParams.limit || 20,
                    total_pages: 1
                  },
                  filters: {},
                  sorting: {}
                };
              }
            }
          ).catch(() => {});
        }, 100);
      }
      
      console.log(`✅ [SEARCH COMPLETE] ${duration.toFixed(0)}ms - ${serverData.properties?.length || 0} results`);
      
      return {
        ...serverData,
        performance: {
          ...serverData.performance,
          cache_hit: false,
          execution_time: duration / 1000
        }
      };
      
    } catch (error: any) {
      // ✅ Check for cancellation first - these are expected, not errors
      if (axios.isCancel(error) || error.name === 'AbortError') {
        const cancelError = new Error('Search cancelled') as any
        cancelError.isCancelled = true
        throw cancelError
      }
      
      // Only log actual errors, not cancellations
      console.error('❌ [SEARCH ERROR]:', error.message)
      
      // 🔄 Timeout: Could be transient, inform user
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        throw new Error('Search timed out. The server is taking too long. Please try again or refine your search.');
      }
      
      // 🌐 Network issues: More helpful error messages
      if (error.code === 'ECONNRESET') {
        throw new Error('Connection lost. Please check your network and try again.');
      }
      
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        throw new Error('Cannot reach the server. Please check your connection.');
      }
      
      // Return specific backend error if available
      throw new Error(error.response?.data?.detail || 'Failed to search properties. Please try again.');
    }
  },

  /**
   * Get property by ID with retry logic and better timeout handling
   * Returns full property with landlord info and favorited status
   */
  getById: async (
    id: string,
    options?: { skipCache?: boolean }
  ): Promise<Property> => {
    let lastError: any;
    let retries = 2;
    
    while (retries >= 0) {
      try {
        console.log(`🔍 [PROPERTY DETAIL] Fetching property: ${id} (retry ${2 - retries}/2)`);
        
        if (!options?.skipCache) {
          const cacheKey = `property_${id}`;
          const cached = await optimizedPropertyCache.get(cacheKey);
          if (cached) {
            console.log(`🎯 [CACHE HIT] Property: ${id}`);
            return cached;
          }
        }
        
        // Create a dedicated client with longer timeout for property details
        const propertyClient = axios.create({
          baseURL: apiClient.defaults.baseURL,
          headers: apiClient.defaults.headers,
          timeout: 45000, // 45 seconds - longer than default but not too long
        });
        
        // Add auth token to property client
        const cachedToken = localStorage.getItem('sb-access-token');
        if (cachedToken) {
          propertyClient.defaults.headers.Authorization = `Bearer ${cachedToken}`;
        }
        
        const response = await propertyClient.get<Property>(`/api/v1/properties/${id}`);
        const property = response.data;
        
        const cacheKey = `property_${id}`;
        optimizedPropertyCache.set(cacheKey, property, 600).catch(() => {});
        
        console.log(`✅ [PROPERTY DETAIL] Successfully fetched: ${id}`);
        return property;
        
      } catch (error: any) {
        lastError = error;
        console.error(`❌ [GET PROPERTY ERROR] (retry ${2 - retries}/2):`, error.message);
        
        // Don't retry for certain errors
        if (error.response?.status === 404) {
          throw new Error('Property not found');
        }
        
        if (error.response?.status === 403) {
          throw new Error('Access denied for this property');
        }
        
        // Retry on timeout or network errors
        if ((error.code === 'ECONNABORTED' || 
             error.message?.includes('timeout') ||
             error.code === 'ECONNRESET' ||
             error.code === 'ENOTFOUND' ||
             error.message?.includes('Network Error')) && retries > 0) {
          
          console.log(`⏱️ [PROPERTY DETAIL] Network/timeout error - retrying... (${retries} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (2 - retries))); // Exponential backoff
          retries--;
          continue;
        }
        
        // Break for non-retriable errors or if out of retries
        break;
      }
    }
    
    // If we get here, all retries failed
    console.error(`❌ [PROPERTY DETAIL] Final error after retries:`, lastError.message);
    
    // Provide more helpful error messages
    if (lastError.code === 'ECONNABORTED' || lastError.message?.includes('timeout')) {
      throw new Error('Property details are taking too long to load. Please check your connection and try again.');
    }
    
    if (lastError.code === 'ECONNRESET' || lastError.message?.includes('Network Error')) {
      throw new Error('Network connection lost while loading property. Please check your internet and try again.');
    }
    
    if (lastError.code === 'ENOTFOUND') {
      throw new Error('Cannot reach the property server. Please try again in a moment.');
    }
    
    throw new Error(lastError.response?.data?.detail || 'Failed to fetch property details. Please try again.');
  },

  /**
   * Create new property
   * Database fields automatically handled:
   * - id (generated)
   * - landlord_id (from auth)
   * - created_at, updated_at (auto)
   * - status (defaults to 'vacant')
   * - featured (defaults to false)
   * - verification_status (defaults to 'pending')
   */
  // create: async (data: CreatePropertyData | FormData): Promise<Property> => {
  //   try {
  //     console.log('📤 [CREATE PROPERTY]');
      
  //     const response = await apiClient.post<Property>('/api/v1/properties', data, {
  //       headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
  //       timeout: 60000
  //     });
      
  //     // Invalidate search cache
  //     await optimizedPropertyCache.clear();
      
  //     console.log('✅ [PROPERTY CREATED]:', response.data.id);
  //     return response.data;
  //   } catch (error: any) {
  //     console.error('❌ [CREATE ERROR]:', error.message);
  //     throw new Error(error.response?.data?.detail || 'Failed to create property');
  //   }
  // },

create: async (data: CreatePropertyData | FormData): Promise<Property> => {
  try {
    console.log('📤 [CREATE PROPERTY]');
    
    // ✅ Always get a fresh token before creating a property (expensive operation)
    const { createClient } = await import('@/utils/supabase/client')
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    const headers: Record<string, string> = {}
    if (data instanceof FormData) {
      headers['Content-Type'] = 'multipart/form-data'
    }
    // ✅ Attach fresh token directly — bypasses stale cache
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`
    }
    
    const response = await apiClient.post<Property>('/api/v1/properties', data, {
      headers,
      timeout: 60000
    });
    
    await optimizedPropertyCache.clear();
    console.log('✅ [PROPERTY CREATED]:', response.data.id);
    return response.data;
  } catch (error: any) {
    console.error('❌ [CREATE ERROR]:', error.message);
    throw new Error(error.response?.data?.detail || 'Failed to create property');
  }
},




  /**
   * Update property
   * Updated to use PUT method to match backend endpoint
   * Only landlord can update their own properties
   */
  update: async (id: string, data: UpdatePropertyData | FormData): Promise<Property> => {
    try {
      console.log('📝 [UPDATE PROPERTY]:', id);
      
      const response = await apiClient.put<Property>(`/api/v1/properties/${id}`, data, {
        headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
      });
      
      // Invalidate caches
      await Promise.all([
        optimizedPropertyCache.delete(`property_${id}`),
        optimizedPropertyCache.clear()
      ]);
      
      console.log('✅ [PROPERTY UPDATED]');
      return response.data;
    } catch (error: any) {
      console.error('❌ [UPDATE ERROR]:', error.message);
      
      if (error.response?.status === 403) {
        throw new Error('You do not have permission to update this property');
      }
      
      if (error.response?.status === 404) {
        throw new Error('Property not found');
      }
      
      throw new Error(error.response?.data?.detail || 'Failed to update property');
    }
  },

  /**
   * Delete property (soft delete)
   * Sets status to 'inactive'
   */
  delete: async (id: string): Promise<void> => {
    try {
      console.log('🗑️ [DELETE PROPERTY]:', id);
      
      await apiClient.delete(`/api/v1/properties/${id}`);
      
      await Promise.all([
        optimizedPropertyCache.delete(`property_${id}`),
        optimizedPropertyCache.clear()
      ]);
      
      console.log('✅ [PROPERTY DELETED]');
    } catch (error: any) {
      console.error('❌ [DELETE ERROR]:', error.message);
      
      if (error.response?.status === 403) {
        throw new Error('You do not have permission to delete this property');
      }
      
      throw new Error(error.response?.data?.detail || 'Failed to delete property');
    }
  },

  /**
   * Get landlord's properties with status filtering
   * Updated to support new status_filter parameter
   */
  getMyProperties: async (
    page: number = 1,
    limit: number = 20,
    statusFilter?: string,
    options?: { skipCache?: boolean }
  ): Promise<PropertySearchResponse> => {
    try {
      if (!options?.skipCache) {
        const cacheKey = `my_properties_${page}_${limit}_${statusFilter || 'all'}`;
        const cached = await optimizedPropertyCache.get(cacheKey);
        if (cached) {
          console.log(`🎯 [CACHE HIT] My properties`);
          return cached;
        }
      }
      
      const params: any = { page, limit };
      // Only send status_filter when a real status is chosen.
      // 'all' is a UI concept — do not send it to the backend.
      if (statusFilter && statusFilter !== 'all') {
        params.status_filter = statusFilter;
      }
      
      const response = await apiClient.get<PropertySearchResponse>('/api/v1/properties/my-properties', {
        params
      });
      
      const cacheKey = `my_properties_${page}_${limit}_${statusFilter || 'all'}`;
      // Only cache if we actually got results back — never cache an empty landlord list.
      // An empty result is more likely a query bug or transient backend issue than
      // a legitimate "you have no properties" state.
      const hasProperties = (response.data as any)?.properties?.length > 0;
      if (hasProperties) {
        optimizedPropertyCache.set(cacheKey, response.data, 300).catch(() => {});
      }
      
      return response.data;
    } catch (error: any) {
      console.error('❌ [GET MY PROPERTIES ERROR]:', error.message);
      throw new Error(error.response?.data?.detail || 'Failed to fetch properties');
    }
  },

  /**
   * Get featured properties
   * Filters by featured=true and status='vacant'
   */
  getFeatured: async (limit: number = 6): Promise<Property[]> => {
    try {
      const cacheKey = `featured_${limit}`;
      const cached = await optimizedPropertyCache.get(cacheKey);
      if (cached) {
        console.log(`🎯 [CACHE HIT] Featured properties`);
        return cached.properties;
      }
      
      const response = await apiClient.get<{ properties: Property[] }>('/api/v1/properties/featured', {
        params: { limit }
      });
      
      optimizedPropertyCache.set(cacheKey, response.data, 300).catch(() => {});
      
      return response.data.properties;
    } catch (error: any) {
      console.error('❌ [GET FEATURED ERROR]:', error.message);
      throw new Error('Failed to fetch featured properties');
    }
  },

  /**
   * Get popular locations with property counts and coordinates
   * NEW: Aligns with /locations/popular endpoint
   */
  getPopularLocations: async (limit: number = 10): Promise<PopularLocationsResponse> => {
    try {
      const cacheKey = `popular_locations_${limit}`;
      const cached = await optimizedPropertyCache.get(cacheKey);
      if (cached) {
        console.log(`🎯 [CACHE HIT] Popular locations`);
        return cached;
      }
      
      const response = await apiClient.get('/api/v1/properties/locations/popular', {
        params: { limit }
      });
      
      optimizedPropertyCache.set(cacheKey, response.data, 600).catch(() => {}); // Cache for 10 minutes
      
      return response.data;
    } catch (error: any) {
      console.error('❌ [GET POPULAR LOCATIONS ERROR]:', error.message);
      throw new Error(error.response?.data?.detail || 'Failed to fetch popular locations');
    }
  },

  /**
   * Toggle favorite
   * Adds or removes from favorites table
   */
  toggleFavorite: async (propertyId: string, isFavorited: boolean): Promise<{ is_favorited: boolean }> => {
    try {
      // ✅ Early return if no propertyId
      if (!propertyId) {
        throw new Error('Property ID is required');
      }

      console.log(`🔄 [FAVORITE] Toggling property ${propertyId}, currently favorited: ${isFavorited}`);

      if (isFavorited) {
        // ✅ Remove from favorites: DELETE /api/v1/favorites/{propertyId}
        try {
          console.log(`🗑️ [FAVORITE] Attempting DELETE /api/v1/favorites/${propertyId}`);
          await apiClient.delete(`/api/v1/favorites/${propertyId}`);
          console.log(`✅ [FAVORITE] Removed property ${propertyId} from favorites`);
          return { is_favorited: false };
        } catch (deleteError: any) {
          console.error(`❌ [DELETE ERROR]`, {
            status: deleteError.response?.status,
            data: deleteError.response?.data,
            message: deleteError.message
          });
          // If 404, property wasn't in favorites - that's okay
          if (deleteError.response?.status === 404) {
            console.log(`ℹ️ [FAVORITE] Property ${propertyId} not in favorites`);
            return { is_favorited: false };
          }
          throw deleteError;
        }
      } else {
        // ✅ Add to favorites: POST /api/v1/favorites/ with body
        try {
          const payload = { property_id: propertyId };
          console.log(`📮 [FAVORITE] Attempting POST /api/v1/favorites/`, payload);
          await apiClient.post(`/api/v1/favorites/`, payload);
          console.log(`✅ [FAVORITE] Added property ${propertyId} to favorites`);
          return { is_favorited: true };
        } catch (postError: any) {
          console.error(`❌ [POST ERROR]`, {
            status: postError.response?.status,
            data: postError.response?.data,
            message: postError.message
          });
          // If 400, property might already be favorited - that's okay
          if (postError.response?.status === 400) {
            console.log(`ℹ️ [FAVORITE] Property ${propertyId} already in favorites`);
            return { is_favorited: true };
          }
          throw postError;
        }
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || error.message || 'Unknown error';
      console.error(`❌ [TOGGLE FAVORITE ERROR]: ${errorMsg}`);
      console.error(`   Status: ${error.response?.status}`);
      console.error(`   Property ID: ${propertyId}, Currently Favorited: ${isFavorited}`);
      throw new Error(errorMsg);
    }
  },

  /**
   * Get user's favorited properties
   */
  getFavorites: async (page: number = 1, limit: number = 20): Promise<PropertySearchResponse> => {
    let lastError: any;
    let retries = 2;
    
    while (retries >= 0) {
      try {
        // 🚀 PERFORMANCE: Use 15s timeout for favorites (accounts for DB queries)
        const response = await apiClient.get<PropertySearchResponse>('/api/v1/favorites/', {
          params: { page, limit },
          timeout: 15000 // 15 seconds - enough for compound DB queries
        });
        
        return response.data;
      } catch (error: any) {
        lastError = error;
        console.error(`❌ [GET FAVORITES ERROR] (retry ${2 - retries}/2):`, error.message);
        
        // Handle non-retriable errors immediately
        if (error.response?.status === 401) {
          console.log('🔒 [FAVORITES] Unauthorized');
          throw new Error('Unauthorized to fetch favorites');
        }
        
        if (error.response?.status === 404) {
          console.log('📭 [FAVORITES] Not found');
          return {
            success: true,
            properties: [],
            pagination: {
              total: 0,
              page: 1,
              limit: 20,
              total_pages: 1
            }
          };
        }
        
        // For timeout errors, retry if we have retries left
        if ((error.code === 'ECONNABORTED' || error.message?.includes('timeout')) && retries > 0) {
          console.log(`⏱️ [FAVORITES] Timeout - retrying... (${retries} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 500 * (2 - retries))); // Exponential backoff
          retries--;
          continue;
        }
        
        // If we've exhausted retries or it's a different error, break out
        break;
      }
    }
    
    // If we get here, all retries failed or it was a non-retriable error
    console.error(`❌ [FAVORITES] Final error after retries:`, lastError.message);
    throw new Error(`Failed to fetch favorites: ${lastError.message}`);
  },

  /**
   * Clear all caches
   */
  clearCache: async (): Promise<void> => {
    console.log('🗑️ [CLEARING CACHE]');
    await optimizedPropertyCache.clear();
  },

  /**
   * Get cache statistics
   */
  getCacheStats: () => {
    return optimizedPropertyCache.getStats();
  }
};

export default propertiesAPI;























// /**
//  * Properties API Module
//  * Handles all property-related API calls to FastAPI backend
//  */

// import apiClient from './client';
// import axios from 'axios';
// import propertyCache from '../cache/propertyCache';

// // Types
// export interface Property {
//   id: string;
//   title: string;
//   description: string;
//   location: string;
//   price: number;
//   beds: number;
//   baths: number;
//   square_feet: number;
//   property_type: string;
//   amenities: string[];
//   images: string[];
//   landlord_id: string;
//   status: string;
//   created_at: string;
//   updated_at: string;
//   featured?: boolean;
//   is_favorited?: boolean;
//   latitude?: number;
//   longitude?: number;
// }

// export interface PropertySearchParams {
//   location?: string;
//   min_price?: number;
//   max_price?: number;
//   bedrooms?: number;
//   bathrooms?: number;
//   property_type?: string;
//   sort?: string;
//   page?: number;
//   limit?: number;
// }

// export interface PropertySearchResponse {
//   success: boolean;
//   properties: Property[];
//   pagination: {
//     total: number;
//     page: number;
//     limit: number;
//     total_pages: number;
//   };
// }

// export interface CreatePropertyData {
//   title: string;
//   description: string;
//   location: string;
//   price: number;
//   bedrooms: number;
//   bathrooms: number;
//   square_feet: number;
//   property_type: string;
//   amenities?: string[];
//   images?: string[];
// }

// // Properties API - OPTIMIZED VERSION
// export const propertiesAPI = {
//   /**
//    * Search properties with filters - OPTIMIZED
//    */
//   search: async (params: PropertySearchParams): Promise<PropertySearchResponse> => {
//     try {
//       console.log('🔍 [PROPERTIES API] Searching with params:', params)
      
//       // OPTIMIZATION 1: Check simple cache first
//       const cacheKey = propertyCache.generateCacheKey(params)
//       const cached = propertyCache.get(cacheKey)
//       if (cached) {
//         console.log('🎯 [PROPERTIES API] Cache hit for:', cacheKey)
//         return cached
//       }
      
//       // Build query string for GET request
//       const queryParams = new URLSearchParams()
      
//       if (params.location) queryParams.append('location', params.location)
//       if (params.min_price) queryParams.append('min_price', params.min_price.toString())
//       if (params.max_price) queryParams.append('max_price', params.max_price.toString())
//       if (params.bedrooms) queryParams.append('bedrooms', params.bedrooms.toString())
//       if (params.bathrooms) queryParams.append('bathrooms', params.bathrooms.toString())
//       if (params.property_type) queryParams.append('property_type', params.property_type)
//       if (params.sort) queryParams.append('sort', params.sort)
//       if (params.page) queryParams.append('page', params.page.toString())
//       if (params.limit) queryParams.append('limit', params.limit.toString())
      
//       // OPTIMIZATION 2: Use optimized timeout
//       const searchClient = axios.create({
//         baseURL: apiClient.defaults.baseURL,
//         headers: apiClient.defaults.headers,
//         timeout: 10000, // 10 seconds - backend is now optimized
//       })
      
//       console.log('🚀 [PROPERTIES API] Making GET request to:', `/api/v1/properties/search?${queryParams.toString()}`)
      
//       const response = await searchClient.get(`/api/v1/properties/search?${queryParams.toString()}`)
      
//       // OPTIMIZATION 3: Cache the response with server-provided TTL
//       const serverData = response.data
//       const cacheTtl = serverData.optimization?.client_cache_ttl || 300 // 5 minutes default
//       propertyCache.set(cacheKey, serverData, cacheTtl, params)
      
//       console.log('✅ [PROPERTIES API] Search successful, cached for', cacheTtl, 'seconds')
//       return serverData
      
//     } catch (error: any) {
//       console.error(' [PROPERTIES API] Search failed:', error.message)
      
//       // OPTIMIZATION 4: Handle timeout gracefully
//       if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
//         console.warn(' Search timeout - this might be due to slow network or heavy filters')
//         throw new Error('Search request timed out. Please try again with fewer filters or check your connection.')
//       }
      
//       // Handle network errors
//       if (error.code === 'ECONNRESET' || error.code === 'ENOTFOUND') {
//         throw new Error('Network error. Please check your internet connection and try again.')
//       }
      
//       throw new Error('Failed to search properties. Please try again.')
//     }
//   },

//   /**
//    * Get property by ID
//    */
//   getById: async (id: string): Promise<Property> => {
//     const response = await apiClient.get<Property>(`/api/v1/properties/${id}`);
//     return response.data;
//   },

//   /**
//    * Create new property (landlord only)
//    */
//   create: async (data: CreatePropertyData | FormData): Promise<Property> => {
//     const response = await apiClient.post<Property>('/api/v1/properties', data, {
//       headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
//       timeout: 60000 // 60 seconds for file uploads
//     });
//     return response.data;
//   },

//   /**
//    * Update property (landlord only)
//    */
//   update: async (id: string, data: Partial<CreatePropertyData>): Promise<Property> => {
//     const response = await apiClient.patch<Property>(`/api/v1/properties/${id}`, data);
//     return response.data;
//   },

//   /**
//    * Delete property (landlord only)
//    */
//   delete: async (id: string): Promise<void> => {
//     await apiClient.delete(`/api/v1/properties/${id}`);
//   },

//   /**
//    * Get landlord's properties
//    */
//   getMyProperties: async (page: number = 1, limit: number = 20): Promise<PropertySearchResponse> => {
//     const response = await apiClient.get<PropertySearchResponse>('/api/v1/properties/my-properties', {
//       params: { page, limit }
//     });
//     return response.data;
//   },
// };

// export default propertiesAPI;
