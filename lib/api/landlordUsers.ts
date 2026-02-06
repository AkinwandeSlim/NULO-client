/**
 * Landlord Users API Client
 * Handles all landlord user management operations (separate from verification)
 */

import apiClient from './client';

// ============================================================================
// TYPES
// ============================================================================

export interface LandlordUser {
  id: string
  email: string
  full_name: string
  phone_number?: string
  location?: string
  user_type: 'landlord'
  verification_status: 'pending' | 'approved' | 'rejected' | 'partial'
  trust_score: number
  avatar_url?: string
  created_at: string
  last_login_at?: string
  
  // Computed fields
  properties_count: number
  applications_count: number
  
  // From landlord_onboarding
  account_type?: 'individual' | 'company'
  company_name?: string
  nin_verified?: boolean
  bvn_verified?: boolean
  verification_submitted_at?: string
}

export interface LandlordStats {
  total: number
  verified: number
  pending: number
  rejected: number
  partial: number
  with_properties: number
  active_this_month: number
}

export interface LandlordDetail extends LandlordUser {
  onboarding?: any
  profile?: any
  properties?: Array<{
    id: string
    title: string
    rent_amount: number
    status: string
    verification_status: string
    created_at: string
  }>
  total_revenue?: number
}

export interface LandlordListParams {
  page?: number
  limit?: number
  search?: string
  verification_status?: 'pending' | 'approved' | 'rejected' | 'partial'
  account_type?: 'individual' | 'company'
  sort_by?: 'newest' | 'oldest' | 'name' | 'trust_score'
}

export interface LandlordListResponse {
  success: boolean
  landlords: LandlordUser[]
  pagination: {
    total: number
    page: number
    limit: number
    total_pages: number
  }
}

export interface LandlordUpdateData {
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
  FAST: 30000,     // 30s - for cached endpoints
  MEDIUM: 45000,   // 45s - for normal operations
  SLOW: 60000,     // 60s - for complex queries
}

// ============================================================================
// LANDLORD USERS API
// ============================================================================

/**
 * Get all landlords with pagination and filtering
 */
export const getAllLandlords = async (
  params: LandlordListParams = {}
): Promise<LandlordListResponse> => {
  try {
    console.log('📤 [LANDLORD-USERS API] Fetching landlords with params:', params)
    
    const response = await apiClient.get('/api/v1/admin/users/landlords', {
      params,
      timeout: TIMEOUTS.MEDIUM
    })
    
    console.log('✅ [LANDLORD-USERS API] Retrieved', response.data.pagination.total, 'landlords')
    return response.data
  } catch (error: any) {
    console.error('❌ [LANDLORD-USERS API] Error fetching landlords:', error)
    
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timed out. Please try again.')
    }
    
    throw new Error(
      error.response?.data?.detail || 
      'Failed to fetch landlords'
    )
  }
}

/**
 * Get landlord statistics
 */
export const getLandlordStats = async (): Promise<LandlordStats> => {
  try {
    console.log('📤 [LANDLORD-USERS API] Fetching landlord stats')
    
    const response = await apiClient.get('/api/v1/admin/users/landlords/stats', {
      timeout: TIMEOUTS.SLOW  // Should be cached
    })
    
    console.log('✅ [LANDLORD-USERS API] Stats retrieved:', response.data)
    return response.data
  } catch (error: any) {
    console.error('❌ [LANDLORD-USERS API] Error fetching stats:', error)
    throw new Error(
      error.response?.data?.detail || 
      'Failed to fetch landlord statistics'
    )
  }
}

/**
 * Get single landlord details
 */
export const getLandlordById = async (landlordId: string): Promise<LandlordDetail> => {
  try {
    console.log('📤 [LANDLORD-USERS API] Fetching landlord:', landlordId)
    
    const response = await apiClient.get(`/api/v1/admin/users/landlords/${landlordId}`, {
      timeout: TIMEOUTS.FAST
    })
    
    console.log('✅ [LANDLORD-USERS API] Landlord retrieved')
    return response.data.landlord
  } catch (error: any) {
    console.error('❌ [LANDLORD-USERS API] Error fetching landlord:', error)
    throw new Error(
      error.response?.data?.detail || 
      'Failed to fetch landlord details'
    )
  }
}

/**
 * Update landlord information
 */
export const updateLandlord = async (
  landlordId: string,
  updateData: LandlordUpdateData
): Promise<{ success: boolean; message: string; landlord: LandlordUser }> => {
  try {
    console.log('📤 [LANDLORD-USERS API] Updating landlord:', landlordId)
    console.log('📝 [LANDLORD-USERS API] Update data:', updateData)
    
    const response = await apiClient.patch(
      `/api/v1/admin/users/landlords/${landlordId}`,
      updateData,
      {
        timeout: TIMEOUTS.MEDIUM
      }
    )
    
    console.log('✅ [LANDLORD-USERS API] Landlord updated successfully')
    return response.data
  } catch (error: any) {
    console.error('❌ [LANDLORD-USERS API] Error updating landlord:', error)
    throw new Error(
      error.response?.data?.detail || 
      'Failed to update landlord'
    )
  }
}

/**
 * Soft delete landlord
 */
export const deleteLandlord = async (
  landlordId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    console.log('📤 [LANDLORD-USERS API] Deleting landlord:', landlordId)
    
    const response = await apiClient.delete(
      `/api/v1/admin/users/landlords/${landlordId}`,
      {
        timeout: TIMEOUTS.MEDIUM
      }
    )
    
    console.log('✅ [LANDLORD-USERS API] Landlord deleted successfully')
    return response.data
  } catch (error: any) {
    console.error('❌ [LANDLORD-USERS API] Error deleting landlord:', error)
    throw new Error(
      error.response?.data?.detail || 
      'Failed to delete landlord'
    )
  }
}

/**
 * Search landlords
 */
export const searchLandlords = async (
  searchQuery: string,
  filters?: Partial<LandlordListParams>
): Promise<LandlordListResponse> => {
  try {
    console.log('📤 [LANDLORD-USERS API] Searching landlords:', searchQuery)
    
    return await getAllLandlords({
      search: searchQuery,
      ...filters
    })
  } catch (error: any) {
    console.error('❌ [LANDLORD-USERS API] Error searching landlords:', error)
    throw error
  }
}

/**
 * Get landlords by verification status
 */
export const getLandlordsByStatus = async (
  status: 'pending' | 'approved' | 'rejected' | 'partial',
  params?: Partial<LandlordListParams>
): Promise<LandlordListResponse> => {
  try {
    console.log('📤 [LANDLORD-USERS API] Fetching landlords by status:', status)
    
    return await getAllLandlords({
      verification_status: status,
      ...params
    })
  } catch (error: any) {
    console.error('❌ [LANDLORD-USERS API] Error fetching landlords by status:', error)
    throw error
  }
}

/**
 * Get landlords by account type
 */
export const getLandlordsByAccountType = async (
  accountType: 'individual' | 'company',
  params?: Partial<LandlordListParams>
): Promise<LandlordListResponse> => {
  try {
    console.log('📤 [LANDLORD-USERS API] Fetching landlords by account type:', accountType)
    
    return await getAllLandlords({
      account_type: accountType,
      ...params
    })
  } catch (error: any) {
    console.error('❌ [LANDLORD-USERS API] Error fetching landlords by account type:', error)
    throw error
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if landlord is verified
 */
export const isLandlordVerified = (landlord: LandlordUser): boolean => {
  return landlord.verification_status === 'approved'
}

/**
 * Check if landlord has pending verification
 */
export const hasPendingVerification = (landlord: LandlordUser): boolean => {
  return landlord.verification_status === 'pending'
}

/**
 * Check if landlord is rejected
 */
export const isLandlordRejected = (landlord: LandlordUser): boolean => {
  return landlord.verification_status === 'rejected'
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
 * Format landlord name
 */
export const formatLandlordName = (landlord: LandlordUser): string => {
  if (landlord.account_type === 'company' && landlord.company_name) {
    return landlord.company_name
  }
  return landlord.full_name || 'Unknown Landlord'
}

/**
 * Get landlord display info
 */
export const getLandlordDisplayInfo = (landlord: LandlordUser) => {
  return {
    name: formatLandlordName(landlord),
    subtitle: landlord.account_type === 'company' ? landlord.full_name : landlord.email,
    isCompany: landlord.account_type === 'company',
    isVerified: isLandlordVerified(landlord),
    statusColor: getStatusColor(landlord.verification_status)
  }
}

// ============================================================================
// EXPORT AS OBJECT (for default import)
// ============================================================================

const landlordUsersAPI = {
  // Core operations
  getAllLandlords,
  getLandlordStats,
  getLandlordById,
  updateLandlord,
  deleteLandlord,
  
  // Search and filter
  searchLandlords,
  getLandlordsByStatus,
  getLandlordsByAccountType,
  
  // Helpers
  isLandlordVerified,
  hasPendingVerification,
  isLandlordRejected,
  getStatusColor,
  formatLandlordName,
  getLandlordDisplayInfo
}

export default landlordUsersAPI