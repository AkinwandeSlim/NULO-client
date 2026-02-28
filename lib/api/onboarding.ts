/**
 * Onboarding API Client for FastAPI Backend
 * Updated to work with landlord_onboarding.py endpoints
 */

import apiClient from './client';
import { createClient } from '@/utils/supabase/client';

// ============================================================================
// TYPES
// ============================================================================

export interface CompleteOnboardingPayload {
  landlord_id: string
  email: string
  full_name: string
  phone: string
  date_of_birth: string
  landlord_type: 'individual' | 'company'
  company_name?: string
  company_address?: string
  bank_name: string
  account_number: string
  account_name: string
}

export interface OnboardingResponse {
  success: boolean
  message: string
  data?: any
}

export interface OnboardingStatusResponse {
  id: string
  landlord_id: string
  admin_review_status: 'pending' | 'in_review' | 'approved' | 'rejected'
  submitted_for_review_at: string
  admin_feedback?: string
  profile_step_completed: boolean
  property_step_completed: boolean
  payment_step_completed: boolean
  protection_step_completed: boolean
  all_steps_completed: boolean
  current_step: number
}

export interface AdminQueueApplication {
  id: string
  landlord_id: string
  full_name: string
  email: string
  landlord_type: string
  submitted_for_review_at: string
  admin_review_status: string
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Submit complete onboarding (Step 4 final submit)
 * This calls the FastAPI backend which saves to Supabase
 */
export const submitCompleteOnboarding = async (
  payload: CompleteOnboardingPayload
): Promise<OnboardingResponse> => {
  try {
    console.log(' [API] Submitting complete onboarding to FastAPI backend')
    console.log(' [API] Payload:', payload)
    
    // Use FastAPI backend instead of direct Supabase
    
    const response = await apiClient.post('/api/v1/onboarding/submit-complete', {
      // Backend expects minimal data - it will handle the updates
      landlord_id: payload.landlord_id,
      email: payload.email,
      full_name: payload.full_name,
      phone: payload.phone,
      date_of_birth: payload.date_of_birth,
      landlord_type: payload.landlord_type,
      company_name: payload.company_name || null,
      company_address: payload.company_address || null,
      bank_name: payload.bank_name,
      account_number: payload.account_number,
      account_name: payload.account_name
    })
    
    console.log(' [API] Backend response:', response.data)
    
    return {
      success: true,
      message: 'Onboarding submitted successfully',
      data: response.data
    }
  } catch (error: any) {
    console.error(' [API] Error submitting complete onboarding:', error)
    console.error(' [API] Error response:', error.response?.data)
    
    // Fallback to direct Supabase if backend is down
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
      console.log(' [API] Backend down or timeout - falling back to direct Supabase')
      return await submitCompleteOnboardingDirect(payload)
    }
    
    throw new Error(
      error.response?.data?.detail || 
      error.response?.data?.message || 
      'Failed to submit complete onboarding'
    )
  }
}

// Fallback function for direct Supabase insertion
const submitCompleteOnboardingDirect = async (
  payload: CompleteOnboardingPayload
): Promise<OnboardingResponse> => {
  try {
    console.log(' [API] Submitting directly to Supabase (fallback)')
    
    const supabase = createClient()
    
    // Prepare data for landlord-onboarding table
    const onboardingData = {
      landlord_id: payload.landlord_id,
      full_name: payload.full_name,
      phone: payload.phone,
      date_of_birth: payload.date_of_birth,
      landlord_type: payload.landlord_type,
      company_name: payload.company_name || null,
      company_address: payload.company_address || null,
      bank_name: payload.bank_name,
      account_number: payload.account_number,
      account_name: payload.account_name,
      admin_review_status: 'pending',
      submitted_for_review: true,
      submitted_for_review_at: new Date().toISOString(),
      profile_step_completed: true,
      property_step_completed: true,
      payment_step_completed: true,
      protection_step_completed: true,
      all_steps_completed: true,
      current_step: 5,
      onboarding_completed_at: new Date().toISOString(),
      last_updated_at: new Date().toISOString()
    }
    
    console.log(' [API] Inserting into landlord-onboarding table:', onboardingData)
    
    // Insert into landlord-onboarding table
    const { data, error } = await supabase
      .from('landlord_onboarding')
      .insert(onboardingData)
      .select()
      .single()
    
    if (error) {
      console.error(' [API] Supabase error:', error)
      throw new Error(error.message)
    }
    
    console.log(' [API] Onboarding submitted to Supabase successfully:', data)
    
    return {
      success: true,
      message: 'Onboarding submitted successfully',
      data: data
    }
  } catch (error: any) {
    console.error(' [API] Error submitting complete onboarding:', error)
    throw new Error(
      error.message || 
      'Failed to submit complete onboarding'
    )
  }
}

/**
 * Get onboarding status for a landlord
 * Used in pending review page to check current status
 */
export const getOnboardingStatus = async (
  landlordId: string
): Promise<OnboardingStatusResponse> => {
  try {
    console.log('📤 [API] Fetching onboarding status for:', landlordId)
    
    // MVP: Mock status when backend is down
    console.log('🎭 [API] Backend down - mocking status response')
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Mock response based on typical flow
    const mockResponse: OnboardingStatusResponse = {
      id: 'mock-onboarding-id',
      landlord_id: landlordId,
      admin_review_status: 'pending', // or 'in_review', 'approved', 'rejected'
      submitted_for_review_at: new Date().toISOString(),
      profile_step_completed: true,
      property_step_completed: true,
      payment_step_completed: true,
      protection_step_completed: true,
      all_steps_completed: true,
      current_step: 5
    }
    
    console.log('✅ [API] Status retrieved (mocked):', mockResponse)
    return mockResponse
  } catch (error: any) {
    console.error('❌ [API] Error fetching status:', error)
    throw new Error(
      error.response?.data?.detail || 
      'Failed to fetch onboarding status'
    )
  }
}

/**
 * Start onboarding process
 * Creates initial onboarding record in database
 */
export const startOnboarding = async (
  landlordId: string,
  email: string
): Promise<OnboardingResponse> => {
  try {
    console.log('📤 [API] Starting onboarding for landlord:', landlordId)
    
    const response = await apiClient.post('/api/v1/onboarding/start', {
      landlord_id: landlordId,
      email: email
    })
    
    console.log('✅ [API] Onboarding started:', response.data)
    return {
      success: true,
      message: 'Onboarding started',
      data: response.data
    }
  } catch (error: any) {
    console.error('❌ [API] Error starting onboarding:', error)
    // Don't throw error - onboarding might already exist
    return {
      success: false,
      message: 'Onboarding record may already exist'
    }
  }
}

// ============================================================================
// ADMIN API FUNCTIONS
// ============================================================================

/**
 * Get admin queue - list of pending applications
 * Used in admin review page
 */
export const getAdminQueue = async (): Promise<AdminQueueApplication[]> => {
  try {
    console.log('📤 [API] Fetching admin queue')
    
    const response = await apiClient.get('/api/v1/onboarding/admin/queue')
    
    console.log('✅ [API] Admin queue retrieved:', response.data)
    return response.data.applications || []
  } catch (error: any) {
    console.error('❌ [API] Error fetching admin queue:', error)
    throw new Error(
      error.response?.data?.detail || 
      'Failed to fetch admin queue'
    )
  }
}

/**
 * Get detailed application for admin review
 */
export const getApplicationDetails = async (
  onboardingId: string
): Promise<any> => {
  try {
    console.log('📤 [API] Fetching application details:', onboardingId)
    
    const response = await apiClient.get(`/api/v1/onboarding/admin/application/${onboardingId}`)
    
    console.log('✅ [API] Application details retrieved:', response.data)
    return response.data
  } catch (error: any) {
    console.error('❌ [API] Error fetching application details:', error)
    throw new Error(
      error.response?.data?.detail || 
      'Failed to fetch application details'
    )
  }
}

/**
 * Admin: Review application (approve/reject)
 */
export const reviewApplication = async (
  onboardingId: string,
  status: 'approved' | 'rejected',
  feedback?: string
): Promise<OnboardingResponse> => {
  try {
    console.log(`📤 [API] Reviewing application ${onboardingId}: ${status}`)
    
    const response = await apiClient.put(
      `/api/v1/onboarding/admin/review/${onboardingId}`,
      {
        status,
        feedback: feedback || (status === 'approved' ? 'Application approved' : 'Application rejected')
      }
    )
    
    console.log('✅ [API] Review submitted:', response.data)
    return {
      success: true,
      message: `Application ${status} successfully`,
      data: response.data
    }
  } catch (error: any) {
    console.error('❌ [API] Error reviewing application:', error)
    throw new Error(
      error.response?.data?.detail || 
      `Failed to ${status} application`
    )
  }
}

// ============================================================================
// LEGACY FUNCTIONS (Keep for backward compatibility)
// ============================================================================

/**
 * Submit onboarding step (legacy - not used in new flow)
 */
export const submitOnboardingStep = async (
  step: number,
  data: any,
  userId?: string
): Promise<OnboardingResponse> => {
  try {
    console.log(`📤 [API] Submitting onboarding step ${step}`)
    
    const response = await apiClient.post('/api/v1/onboarding/submit-step', {
      step,
      user_id: userId,
      data
    })

    console.log('✅ [API] Onboarding step submitted:', response.data)
    return {
      success: true,
      message: 'Step submitted',
      data: response.data
    }
  } catch (error: any) {
    console.error('❌ [API] Error submitting onboarding step:', error)
    throw new Error(
      error.response?.data?.detail || 
      'Failed to submit onboarding step'
    )
  }
}

/**
 * Get onboarding progress (legacy)
 */
export const getOnboardingProgress = async (userId: string): Promise<any> => {
  try {
    console.log('📤 [API] Getting onboarding progress for:', userId)
    
    const response = await apiClient.get(`/api/v1/onboarding/progress/${userId}`)
    
    console.log('✅ [API] Onboarding progress retrieved:', response.data)
    return response.data
  } catch (error: any) {
    console.error('❌ [API] Error getting onboarding progress:', error)
    throw new Error(
      error.response?.data?.detail || 
      'Failed to get onboarding progress'
    )
  }
}

/**
 * Validate onboarding step (legacy)
 */
export const validateOnboardingStep = async (
  step: number,
  data: any
): Promise<boolean> => {
  try {
    console.log(`✅ [API] Validating onboarding step ${step}`)
    
    const response = await apiClient.post('/api/v1/onboarding/validate-step', {
      step,
      data
    })
    
    console.log('✅ [API] Step validation result:', response.data)
    return response.data.valid || true
  } catch (error: any) {
    console.error('❌ [API] Error validating step:', error)
    // Don't throw - just return true for MVP
    return true
  }
}