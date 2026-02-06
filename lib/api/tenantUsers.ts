/**
 * Tenant Users API Client
 * Handles all tenant user management operations
 */

import apiClient from './client';

// ============================================================================
// TYPES
// ============================================================================

export interface TenantUser {
  id: string
  email: string
  full_name: string
  phone_number?: string
  location?: string
  user_type: 'tenant'
  verification_status: 'pending' | 'approved' | 'rejected' | 'partial'
  trust_score: number
  avatar_url?: string
  created_at: string
  last_login_at?: string
  
  // Computed fields
  applications_count: number
  favorites_count: number
  
  // From tenant_profile
  budget?: number
  preferred_location?: string
  profile_completion: number
  onboarding_completed: boolean
}

export interface TenantStats {
  total: number
  verified: number
  pending: number
  rejected: number
  partial: number
  with_applications: number
  active_this_month: number
}

export interface TenantDetail extends TenantUser {
  profile?: any
  applications?: Array<{
    id: string
    property_id: string
    status: string
    created_at: string
  }>
  favorites?: Array<{
    property_id: string
    created_at: string
  }>
}

export interface TenantListParams {
  page?: number
  limit?: number
  search?: string
  verification_status?: 'pending' | 'approved' | 'rejected' | 'partial'
  sort_by?: 'newest' | 'oldest' | 'name' | 'trust_score'
}

export interface TenantListResponse {
  success: boolean
  tenants: TenantUser[]
  pagination: {
    total: number
    page: number
    limit: number
    total_pages: number
  }
}

export interface TenantUpdateData {
  full_name?: string
  phone_number?: string
  location?: string
  verification_status?: 'pending' | 'approved' | 'rejected' | 'partial'
  trust_score?: number
  avatar_url?: string
}

// ============================================================================
// TIMEOUT CONFIGURATION
// ============================================================================

const TIMEOUTS = {
  FAST: 15000,     // 15s - for cached endpoints
  MEDIUM: 20000,   // 20s - for normal operations
  SLOW: 25000,     // 25s - for complex queries
  LONG: 30000,
}

// ============================================================================
// TENANT USERS API
// ============================================================================

/**
 * Get all tenants with pagination and filtering
 */
export const getAllTenants = async (
  params: TenantListParams = {}
): Promise<TenantListResponse> => {
  try {
    console.log('📤 [TENANT-USERS API] Fetching tenants with params:', params)
    
    const response = await apiClient.get('/api/v1/admin/users/tenants', {
      params,
      timeout: TIMEOUTS.MEDIUM
    })
    
    console.log('✅ [TENANT-USERS API] Retrieved', response.data.pagination.total, 'tenants')
    return response.data
  } catch (error: any) {
    console.error('❌ [TENANT-USERS API] Error fetching tenants:', error)
    
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timed out. Please try again.')
    }
    
    throw new Error(
      error.response?.data?.detail || 
      'Failed to fetch tenants'
    )
  }
}

/**
 * Get tenant statistics
 */
export const getTenantStats = async (): Promise<TenantStats> => {
  try {
    console.log('📤 [TENANT-USERS API] Fetching tenant stats')
    
    const response = await apiClient.get('/api/v1/admin/users/tenants/stats', {
      timeout: TIMEOUTS.MEDIUM // Should be cached
    })
    
    console.log('✅ [TENANT-USERS API] Stats retrieved:', response.data)
    return response.data
  } catch (error: any) {
    console.error('❌ [TENANT-USERS API] Error fetching stats:', error)
    throw new Error(
      error.response?.data?.detail || 
      'Failed to fetch tenant statistics'
    )
  }
}

/**
 * Get single tenant details
 */
export const getTenantById = async (tenantId: string): Promise<TenantDetail> => {
  try {
    console.log('📤 [TENANT-USERS API] Fetching tenant:', tenantId)
    
    const response = await apiClient.get(`/api/v1/admin/users/tenants/${tenantId}`, {
      timeout: TIMEOUTS.FAST
    })
    
    console.log('✅ [TENANT-USERS API] Tenant retrieved')
    return response.data.tenant
  } catch (error: any) {
    console.error('❌ [TENANT-USERS API] Error fetching tenant:', error)
    throw new Error(
      error.response?.data?.detail || 
      'Failed to fetch tenant details'
    )
  }
}

/**
 * Update tenant information
 */
export const updateTenant = async (
  tenantId: string,
  updateData: TenantUpdateData
): Promise<{ success: boolean; message: string; tenant: TenantUser }> => {
  try {
    console.log('📤 [TENANT-USERS API] Updating tenant:', tenantId)
    console.log('📝 [TENANT-USERS API] Update data:', updateData)
    
    const response = await apiClient.patch(
      `/api/v1/admin/users/tenants/${tenantId}`,
      updateData,
      {
        timeout: TIMEOUTS.MEDIUM
      }
    )
    
    console.log('✅ [TENANT-USERS API] Tenant updated successfully')
    return response.data
  } catch (error: any) {
    console.error('❌ [TENANT-USERS API] Error updating tenant:', error)
    throw new Error(
      error.response?.data?.detail || 
      'Failed to update tenant'
    )
  }
}

/**
 * Soft delete tenant
 */
export const deleteTenant = async (
  tenantId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    console.log('📤 [TENANT-USERS API] Deleting tenant:', tenantId)
    
    const response = await apiClient.delete(
      `/api/v1/admin/users/tenants/${tenantId}`,
      {
        timeout: TIMEOUTS.MEDIUM
      }
    )
    
    console.log('✅ [TENANT-USERS API] Tenant deleted successfully')
    return response.data
  } catch (error: any) {
    console.error('❌ [TENANT-USERS API] Error deleting tenant:', error)
    throw new Error(
      error.response?.data?.detail || 
      'Failed to delete tenant'
    )
  }
}

/**
 * Search tenants
 */
export const searchTenants = async (
  searchQuery: string,
  filters?: Partial<TenantListParams>
): Promise<TenantListResponse> => {
  try {
    console.log('📤 [TENANT-USERS API] Searching tenants:', searchQuery)
    
    return await getAllTenants({
      search: searchQuery,
      ...filters
    })
  } catch (error: any) {
    console.error('❌ [TENANT-USERS API] Error searching tenants:', error)
    throw error
  }
}

/**
 * Get tenants by verification status
 */
export const getTenantsByStatus = async (
  status: 'pending' | 'approved' | 'rejected' | 'partial',
  params?: Partial<TenantListParams>
): Promise<TenantListResponse> => {
  try {
    console.log('📤 [TENANT-USERS API] Fetching tenants by status:', status)
    
    return await getAllTenants({
      verification_status: status,
      ...params
    })
  } catch (error: any) {
    console.error('❌ [TENANT-USERS API] Error fetching tenants by status:', error)
    throw error
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if tenant is verified
 */
export const isTenantVerified = (tenant: TenantUser): boolean => {
  return tenant.verification_status === 'approved'
}

/**
 * Check if tenant has pending verification
 */
export const hasPendingVerification = (tenant: TenantUser): boolean => {
  return tenant.verification_status === 'pending'
}

/**
 * Check if tenant is rejected
 */
export const isTenantRejected = (tenant: TenantUser): boolean => {
  return tenant.verification_status === 'rejected'
}

/**
 * Get status badge color
 */
export const getStatusColor = (status: string): string => {
  const colorMap: { [key: string]: string } = {
    approved: 'green',
    pending: 'orange',
    rejected: 'red',
    partial: 'yellow'
  }
  return colorMap[status] || 'gray'
}

/**
 * Check if profile is complete
 */
export const isProfileComplete = (tenant: TenantUser): boolean => {
  return tenant.profile_completion >= 100
}

/**
 * Get tenant display info
 */
export const getTenantDisplayInfo = (tenant: TenantUser) => {
  return {
    name: tenant.full_name || 'Unknown Tenant',
    subtitle: tenant.email,
    isVerified: isTenantVerified(tenant),
    profileComplete: isProfileComplete(tenant),
    statusColor: getStatusColor(tenant.verification_status)
  }
}

// ============================================================================
// EXPORT AS OBJECT
// ============================================================================

const tenantUsersAPI = {
  // Core operations
  getAllTenants,
  getTenantStats,
  getTenantById,
  updateTenant,
  deleteTenant,
  
  // Search and filter
  searchTenants,
  getTenantsByStatus,
  
  // Helpers
  isTenantVerified,
  hasPendingVerification,
  isTenantRejected,
  getStatusColor,
  isProfileComplete,
  getTenantDisplayInfo
}

export default tenantUsersAPI