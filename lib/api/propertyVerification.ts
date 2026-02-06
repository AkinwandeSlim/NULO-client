/**
 * Property Verification API Client
 * Handles admin approval/rejection of property listings submitted by landlords
 */

import apiClient from './client';

// ============================================================================
// TYPES
// ============================================================================

export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  address: string;
  full_address: string;
  city: string;
  state: string;
  country: string;
  property_type: string;
  beds: number;
  baths: number;
  sqft: number;
  furnished: boolean;
  parking_spaces: number;
  security_deposit: number;
  amenities: string[];
  images: string[];
  landlord_id: string;
  status: string;
  verification_status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
  view_count: number;
  featured: boolean;
  
  // Joined landlord info
  landlord?: {
    id: string;
    email: string;
    full_name: string;
    verification_status: string;
  };
}

export interface PropertyListResponse {
  properties: Property[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface PropertyVerificationAction {
  action: 'approve' | 'reject';
  rejection_reason?: string;
}

export interface BulkPropertyAction {
  property_ids: string[];
  action: 'approve' | 'reject';
  rejection_reason?: string;
}

export interface PropertyStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  under_review: number;
}

export interface PropertyFilters {
  verification_status?: 'pending' | 'approved' | 'rejected' | 'under_review';
  property_type?: string;
  city?: string;
  state?: string;
  price_min?: number;
  price_max?: number;
  bedrooms?: number;
  bathrooms?: number;
  furnished?: boolean;
  featured?: boolean;
  landlord_verification_status?: string;
  date_from?: string;
  date_to?: string;
}

// ============================================================================
// TIMEOUT CONFIGURATION
// ============================================================================

const TIMEOUTS = {
  FAST: 15000,     // 15s - for single operations
  MEDIUM: 30000,   // 30s - for list operations
  SLOW: 45000,     // 45s - for complex queries
};

// ============================================================================
// PROPERTY VERIFICATION API
// ============================================================================

/**
 * Get properties pending verification
 */
export const getPendingProperties = async (
  page: number = 1,
  limit: number = 20
): Promise<PropertyListResponse> => {
  try {
    console.log(`📤 [PROPERTY-VERIFICATION] Fetching pending properties (page ${page})`);
    
    const response = await apiClient.get('/api/v1/admin/properties/pending', {
      params: { page, limit },
      timeout: TIMEOUTS.MEDIUM
    });
    
    console.log(`✅ [PROPERTY-VERIFICATION] Retrieved ${response.data.properties.length} pending properties`);
    return response.data;
  } catch (error: any) {
    console.error('❌ [PROPERTY-VERIFICATION] Error fetching pending properties:', error);
    throw new Error(
      error.response?.data?.detail || 
      'Failed to fetch pending properties'
    );
  }
};

/**
 * Get all properties with optional filtering
 */
export const getAllProperties = async (
  filters: PropertyFilters = {},
  page: number = 1,
  limit: number = 20
): Promise<PropertyListResponse> => {
  try {
    console.log('📤 [PROPERTY-VERIFICATION] Fetching all properties with filters:', filters);
    
    const response = await apiClient.get('/api/v1/admin/properties/all', {
      params: { ...filters, page, limit },
      timeout: TIMEOUTS.MEDIUM
    });
    
    console.log(`✅ [PROPERTY-VERIFICATION] Retrieved ${response.data.properties.length} properties`);
    // Log first property to see structure
    if (response.data.properties.length > 0) {
      console.log('🔍 [PROPERTY-VERIFICATION] Sample property:', JSON.stringify(response.data.properties[0], null, 2));
    }
    return response.data;
  } catch (error: any) {
    console.error('❌ [PROPERTY-VERIFICATION] Error fetching properties:', error);
    throw new Error(
      error.response?.data?.detail || 
      'Failed to fetch properties'
    );
  }
};

/**
 * Get property verification statistics
 */
export const getPropertyStats = async (): Promise<PropertyStats> => {
  try {
    console.log('📤 [PROPERTY-VERIFICATION] Fetching property stats');
    
    const response = await apiClient.get('/api/v1/admin/properties/stats', {
      timeout: TIMEOUTS.FAST
    });
    
    console.log('✅ [PROPERTY-VERIFICATION] Stats retrieved:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ [PROPERTY-VERIFICATION] Error fetching stats:', error);
    throw new Error(
      error.response?.data?.detail || 
      'Failed to fetch property statistics'
    );
  }
};

/**
 * Get single property details
 */
export const getPropertyById = async (propertyId: string): Promise<Property> => {
  try {
    console.log(`📤 [PROPERTY-VERIFICATION] Fetching property: ${propertyId}`);
    
    const response = await apiClient.get(`/api/v1/admin/properties/${propertyId}`, {
      timeout: TIMEOUTS.FAST
    });
    
    console.log('✅ [PROPERTY-VERIFICATION] Property retrieved');
    return response.data.property;
  } catch (error: any) {
    console.error('❌ [PROPERTY-VERIFICATION] Error fetching property:', error);
    throw new Error(
      error.response?.data?.detail || 
      'Failed to fetch property details'
    );
  }
};

/**
 * Approve or reject a property
 */
export const verifyProperty = async (
  propertyId: string,
  action: PropertyVerificationAction
): Promise<{ success: boolean; message: string; property: Property }> => {
  try {
    console.log(`📤 [PROPERTY-VERIFICATION] ${action.action}ing property: ${propertyId}`);
    
    const response = await apiClient.post(
      `/api/v1/admin/properties/${propertyId}/verify`,
      action,
      { timeout: TIMEOUTS.FAST }
    );
    
    console.log(`✅ [PROPERTY-VERIFICATION] Property ${action.action}ed successfully`);
    return response.data;
  } catch (error: any) {
    console.error('❌ [PROPERTY-VERIFICATION] Error verifying property:', error);
    throw new Error(
      error.response?.data?.detail || 
      `Failed to ${action.action} property`
    );
  }
};

/**
 * Bulk approve/reject properties
 */
export const bulkPropertyAction = async (
  action: BulkPropertyAction
): Promise<{ success: boolean; message: string; processed_count: number; failed_count: number }> => {
  try {
    console.log(`📤 [PROPERTY-VERIFICATION] Bulk ${action.action}ing ${action.property_ids.length} properties`);
    
    const response = await apiClient.post(
      '/api/v1/admin/properties/bulk-action',
      action,
      { timeout: TIMEOUTS.SLOW }
    );
    
    console.log(`✅ [PROPERTY-VERIFICATION] Bulk action completed: ${response.data.processed_count} processed`);
    return response.data;
  } catch (error: any) {
    console.error('❌ [PROPERTY-VERIFICATION] Error performing bulk action:', error);
    throw new Error(
      error.response?.data?.detail || 
      `Failed to ${action.action} properties`
    );
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format property price for display
 */
export const formatPrice = (amount: number): string => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Get verification status badge styling
 */
export const getVerificationStatusBadge = (status: string) => {
  switch (status) {
    case 'approved':
      return {
        className: 'bg-green-100 text-green-800 border-green-200',
        icon: '✓',
        text: 'Approved'
      };
    case 'rejected':
      return {
        className: 'bg-red-100 text-red-800 border-red-200',
        icon: '✗',
        text: 'Rejected'
      };
    case 'pending':
      return {
        className: 'bg-orange-100 text-orange-800 border-orange-200',
        icon: '⏳',
        text: 'Pending'
      };
    case 'under_review':
      return {
        className: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: '👁',
        text: 'Under Review'
      };
    default:
      return {
        className: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: '?',
        text: 'Unknown'
      };
  }
};

/**
 * Format property address
 */
export const formatAddress = (property: Property): string => {
  return `${property.address}, ${property.city}, ${property.state}`;
};

/**
 * Check if property has images
 */
export const hasImages = (property: Property): boolean => {
  return property.images && property.images.length > 0;
};

/**
 * Get primary image URL
 */
export const getPrimaryImage = (property: Property): string => {
  if (hasImages(property)) {
    return property.images[0];
  }
  return '/images/property-placeholder.jpg'; // Add a placeholder image
};

// ============================================================================
// EXPORT AS OBJECT (for default import)
// ============================================================================

const propertyVerificationAPI = {
  // Core operations
  getPendingProperties,
  getAllProperties,
  getPropertyStats,
  getPropertyById,
  verifyProperty,
  bulkPropertyAction,
  
  // Helper functions
  formatPrice,
  getVerificationStatusBadge,
  formatAddress,
  hasImages,
  getPrimaryImage,
};

export default propertyVerificationAPI;
