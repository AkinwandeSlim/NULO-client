/**
 * Landlord Verification API Client
 * Centralized module for landlord verification operations
 * 🔧 FIXED: Removed hardcoded 25s timeouts - uses default 30s from client.ts
 */

import apiClient from './client';

// ============================================================================
// TYPES
// ============================================================================

export interface VerificationStats {
  total: number
  pending: number
  in_review: number
  approved: number
  rejected: number
  needs_correction: number
  not_submitted: number
  awaiting_submission?: number
}

export interface LandlordVerification {
  id: string
  landlord_id: string
  landlord?: {
    id: string
    email: string
    full_name: string
    avatar_url?: string
    trust_score: number
  }
  account_type: 'individual' | 'company'  // Backend maps from landlord_type
  company_name?: string
  admin_review_status: string
  submitted_for_review: boolean
  submitted_for_review_at?: string
  admin_reviewed_at?: string
  admin_reviewed_by?: string  // Backend maps from admin_reviewer_id
  admin_notes?: string  // Backend maps from admin_feedback
  phone_number?: string  // Backend maps from phone
  created_at: string
  updated_at: string
  last_updated_at?: string
  // Additional fields from backend detail endpoint
  document_jobs?: any[]
  first_property?: any
  documents_count?: {
    total: number
    completed: number
    processing: number
    failed: number
  }
  // Backend-specific fields
  full_name?: string
  email?: string
  phone?: string
  landlord_type?: 'individual' | 'company'
  admin_feedback?: string
  admin_reviewer_id?: string
  onboarding_completed_at?: string
  submitted_at?: string
  verification_submitted_at?: string
  // Account details
  account_name?: string
  account_number?: string
  bank_name?: string
  // Profile details
  date_of_birth?: string
  // Document verification
  id_document_type?: string
  id_document_number?: string
  id_document_url?: string
  id_document_verified?: boolean
  selfie_url?: string
  selfie_verified?: boolean
  nin?: string
  nin_document_url?: string
  nin_verified?: boolean
  proof_of_address_url?: string
  company_registration_url?: string
  property_ownership_proof?: string
  bvn?: string
  bvn_verified?: boolean
  // Bank verification
  bank_statement_url?: string
  bank_verification_status?: string
  // Company details (if applicable)
  company_address?: string
  company_rc_number?: string
  // Guarantor details
  has_guarantor?: boolean
  guarantor_name?: string
  guarantor_email?: string
  guarantor_phone?: string
  guarantor_address?: string
  guarantor_relationship?: string
  guarantor_id_url?: string
  // Insurance
  has_insurance?: boolean
  insurance_provider?: string
  insurance_policy_number?: string
  insurance_expiry_date?: string
  insurance_document_url?: string
  // Processing status
  document_processing_status?: string
  all_steps_completed?: boolean
  current_step?: number
  profile_step_completed?: boolean
  property_step_completed?: boolean
  payment_step_completed?: boolean
  protection_step_completed?: boolean
  // Cache and metadata
  document_extraction_cache?: any
  documents?: any
  processing_queue_id?: string
  ip_address?: string
  user_agent?: string
}

export interface VerificationDetail extends LandlordVerification {
  // Additional enriched data
  employment_history?: any[]
  properties?: any[]
}

export interface VerificationDetailResponse {
  success: boolean
  verification: VerificationDetail
}

export interface VerificationListResponse {
  success: boolean
  verifications: LandlordVerification[]
  total: number
  page: number
  limit: number
}

export interface ReviewVerificationPayload {
  admin_review_status: 'approved' | 'rejected' | 'needs_correction'
  admin_feedback?: string
}

export interface RequestCorrectionPayload {
  correction_notes: string
  fields_needing_correction: string[]
}


// ============================================================================
// API CONFIGURATION
// ============================================================================

const ENDPOINTS = {
  VERIFICATION_QUEUE: '/api/v1/admin/landlord-verifications',
  VERIFICATION_STATS: '/api/v1/admin/landlord-verifications/stats',
  VERIFICATION_DETAIL: (id: string) => `/api/v1/admin/landlord-verifications/${id}`,
  REVIEW_VERIFICATION: (id: string) => `/api/v1/admin/landlord-verifications/${id}/review`,
  REQUEST_CORRECTION: (id: string) => `/api/v1/admin/landlord-verifications/${id}/request-correction`,
}

// ============================================================================
// CORE API FUNCTIONS - 🔧 FIXED: No timeout overrides
// ============================================================================

/**
 * Get verification statistics
 * 🔧 FIXED: Uses default 30s timeout from client.ts
 */
export const getVerificationStats = async (): Promise<VerificationStats> => {
  console.log('📤 [VERIFICATION API] Fetching verification stats')
  
  try {
    const response = await apiClient.get(ENDPOINTS.VERIFICATION_STATS)
    
    console.log('✅ [VERIFICATION API] Stats retrieved:', response.data)
    return response.data
  } catch (error: any) {
    console.error('❌ [VERIFICATION API] Error fetching stats:', error)
    throw new Error(error.response?.data?.detail || 'Failed to fetch verification statistics')
  }
}

/**
 * Get all landlord verifications (queue)
 * 🔧 FIXED: Uses default 30s timeout from client.ts
 * 
 * @param status - Filter by status
 * @param page - Page number (default 1)
 * @param limit - Items per page (default 50)
 */
export const getAllLandlordVerifications = async (
  status?: string,
  page: number = 1,
  limit: number = 50
): Promise<{ verifications: LandlordVerification[], total: number, page: number, limit: number }> => {
  console.log('📤 [VERIFICATION API] Fetching all landlord verifications')
  
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(status && { status_filter: status })
    })
    
    const response = await apiClient.get(
      `${ENDPOINTS.VERIFICATION_QUEUE}?${params.toString()}`
    )
    
    console.log('✅ [VERIFICATION API] Verifications retrieved:', response.data?.verifications?.length)
    return response.data
  } catch (error: any) {
    console.error('❌ [VERIFICATION API] Error fetching verifications:', error)
    throw new Error(error.response?.data?.detail || 'Request timed out. The server might be slow. Please try again.')
  }
}

/**
 * Get landlords awaiting submission (in onboarding, haven't submitted docs)
 */
export const getAwaitingSubmissionLandlords = async (
  page: number = 1,
  limit: number = 50
): Promise<{ verifications: LandlordVerification[], total: number, page: number, limit: number }> => {
  console.log('📤 [VERIFICATION API] Fetching landlords awaiting submission')
  
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    })
    
    const response = await apiClient.get(
      `${ENDPOINTS.VERIFICATION_QUEUE}/awaiting-submission?${params.toString()}`
    )
    
    console.log('✅ [VERIFICATION API] Awaiting submission landlords retrieved:', response.data?.verifications?.length)
    return response.data
  } catch (error: any) {
    console.error('❌ [VERIFICATION API] Error fetching awaiting submission landlords:', error)
    throw new Error(error.response?.data?.detail || 'Failed to fetch awaiting submission landlords')
  }
}

/**
 * Get verification detail by ID
 * 🔧 FIXED: Uses default 30s timeout from client.ts
 */
export const getVerificationDetail = async (verificationId: string): Promise<VerificationDetailResponse> => {
  console.log(`📤 [VERIFICATION API] Fetching verification detail for ID: ${verificationId}`)
  
  try {
    const response = await apiClient.get(ENDPOINTS.VERIFICATION_DETAIL(verificationId))
    
    console.log('✅ [VERIFICATION API] Verification detail retrieved')
    return response.data
  } catch (error: any) {
    console.error('❌ [VERIFICATION API] Error fetching verification detail:', error)
    throw new Error(error.response?.data?.detail || 'Failed to fetch verification details')
  }
}

/**
 * Review a landlord verification
 * 🔧 FIXED: Uses default 30s timeout from client.ts
 */
export const reviewVerification = async (
  verificationId: string,
  payload: ReviewVerificationPayload
): Promise<{ message: string, verification: LandlordVerification }> => {
  console.log(`📤 [VERIFICATION API] Reviewing verification: ${verificationId}`)
  
  try {
    const response = await apiClient.post(
      ENDPOINTS.REVIEW_VERIFICATION(verificationId),
      payload
    )
    
    console.log('✅ [VERIFICATION API] Verification reviewed successfully')
    return response.data
  } catch (error: any) {
    console.error('❌ [VERIFICATION API] Error reviewing verification:', error)
    throw new Error(error.response?.data?.detail || 'Failed to review verification')
  }
}

/**
 * Request correction on a landlord verification
 * 🔧 FIXED: Uses default 30s timeout from client.ts
 */
export const requestCorrection = async (
  verificationId: string,
  payload: RequestCorrectionPayload
): Promise<{ message: string, verification: LandlordVerification }> => {
  console.log(`📤 [VERIFICATION API] Requesting correction for: ${verificationId}`)
  
  try {
    const response = await apiClient.post(
      ENDPOINTS.REQUEST_CORRECTION(verificationId),
      payload
    )
    
    console.log('✅ [VERIFICATION API] Correction requested successfully')
    return response.data
  } catch (error: any) {
    console.error('❌ [VERIFICATION API] Error requesting correction:', error)
    throw new Error(error.response?.data?.detail || 'Failed to request correction')
  }
}

/**
 * Approve a landlord verification
 * Convenience wrapper around reviewVerification
 */
export const approveLandlordVerification = async (
  verificationId: string,
  adminNotes?: string
): Promise<{ message: string, verification: LandlordVerification }> => {
  return reviewVerification(verificationId, {
    admin_review_status: 'approved',
    admin_feedback: adminNotes
  })
}

/**
 * Reject a landlord verification
 * Convenience wrapper around reviewVerification
 */
export const rejectLandlordVerification = async (
  verificationId: string,
  adminNotes?: string
): Promise<{ message: string, verification: LandlordVerification }> => {
  return reviewVerification(verificationId, {
    admin_review_status: 'rejected',
    admin_feedback: adminNotes
  })
}

/**
 * Get verification detail by ID - Alias for consistency
 */
export const getLandlordVerificationDetail = getVerificationDetail

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get status badge color
 */
export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    pending: 'orange',
    in_review: 'blue',
    approved: 'green',
    rejected: 'red',
    needs_correction: 'yellow'
  }
  
  return colors[status] || 'gray'
}

/**
 * Get status display text
 */
export const getStatusText = (status: string): string => {
  const texts: Record<string, string> = {
    pending: 'Pending Review',
    in_review: 'In Review',
    approved: 'Approved',
    rejected: 'Rejected',
    needs_correction: 'Needs Correction',
    not_submitted: 'Not Submitted'
  }
  
  return texts[status] || status
}

/**
 * Check if verification can be reviewed
 */
export const canBeReviewed = (verification: LandlordVerification): boolean => {
  return verification.submitted_for_review && 
         ['pending', 'in_review', 'needs_correction'].includes(verification.admin_review_status)
}

/**
 * Format date for display
 */
export const formatVerificationDate = (dateString?: string): string => {
  if (!dateString) return 'N/A'
  
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Calculate verification urgency
 */
export const getVerificationUrgency = (verification: LandlordVerification): 'low' | 'medium' | 'high' => {
  if (!verification.submitted_for_review_at) return 'low'
  
  const submittedDate = new Date(verification.submitted_for_review_at)
  const now = new Date()
  const hoursDiff = (now.getTime() - submittedDate.getTime()) / (1000 * 60 * 60)
  
  if (hoursDiff > 48) return 'high'
  if (hoursDiff > 24) return 'medium'
  return 'low'
}

// ============================================================================
// EXPORT AS OBJECT (for default import)
// ============================================================================

const verificationAPI = {
  // Core operations
  getVerificationStats,
  getAllLandlordVerifications,
  getAwaitingSubmissionLandlords,
  getVerificationDetail,
  getLandlordVerificationDetail,
  reviewVerification,
  approveLandlordVerification,
  rejectLandlordVerification,
  requestCorrection,
  
  // Helper functions
  getStatusColor,
  getStatusText,
  canBeReviewed,
  formatVerificationDate,
  getVerificationUrgency,
}

export default verificationAPI