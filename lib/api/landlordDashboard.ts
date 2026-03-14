/**
 * Landlord Dashboard API Client
 * Handles all landlord dashboard operations and real-time data
 */

import apiClient from './client';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

export interface LandlordDashboardData {
  profile: LandlordProfile | null
  onboarding: LandlordOnboarding | null
  stats: LandlordStats
  properties: LandlordProperties[]
  recentActivity: RecentActivity[]
  notifications: Notification[]
  viewingRequests?: LandlordViewingRequest[]
  receivedApplications?: LandlordReceivedApplication[]
  agreements?: LandlordAgreement[]
  engagementMetrics?: EngagementMetrics
}

export interface LandlordProfile {
  id: string
  user_id: string
  full_name: string
  email: string
  phone_number?: string
  avatar_url?: string
  account_type: 'individual' | 'company'
  company_name?: string
  verification_status: 'pending' | 'approved' | 'rejected' | 'partial'
  verification_fee_paid: boolean
  verification_submitted_at?: string
  verification_approved_at?: string
  trust_score: number
  onboarding_started: boolean
  first_time_visit: boolean
  created_at: string
  updated_at: string
}

export interface LandlordOnboarding {
  id: string
  landlord_id: string
  current_step: number
  all_steps_completed: boolean
  onboarding_completed_at?: string
  submitted_for_review: boolean
  submitted_for_review_at?: string
  admin_review_status: 'pending' | 'approved' | 'rejected'
  admin_reviewed_at?: string
  admin_notes?: string
  document_processing_status: string
  profile_step_completed: boolean
  payment_step_completed: boolean
  property_step_completed: boolean
  protection_step_completed: boolean
  created_at: string
  last_updated_at: string
}

export interface LandlordStats {
  total_properties: number
  active_listings: number
  pending_viewings: number
  unread_messages: number
  total_conversations: number
  total_views: number
  occupancy_rate: number
  monthly_revenue: number
  avg_response_time: string
  applications_pending: number
  applications_approved: number
  properties_vacant: number
  properties_occupied: number
}

export interface LandlordProperties {
  id: string
  title: string
  property_type: string
  address: string
  city: string
  state: string
  price: number
  status: 'vacant' | 'occupied' | 'pending' | 'under_review'
  verification_status: 'pending' | 'approved' | 'rejected'
  beds: number
  baths: number
  sqft?: number
  images: string[]
  amenities: string[]
  created_at: string
  view_count: number
  application_count: number
  favorite_count: number
}

export interface RecentActivity {
  id: string
  type: 'viewing_request' | 'application' | 'message' | 'property_view' | 'verification_update'
  title: string
  description: string
  property_id?: string
  property_title?: string
  tenant_id?: string
  tenant_name?: string
  created_at: string
  read: boolean
}

export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error' | 'visit' | 'message' | 'application'
  title: string
  message: string
  link?: string  // Changed from action_url to link to match database
  read: boolean
  read_at?: string
  data?: any
  user_id: string
  created_at: string
}

export interface LandlordViewingRequest {
  id: string
  property_id: string
  tenant_id: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  preferred_date?: string
  scheduled_date?: string
  viewing_type?: 'physical' | 'virtual'
  property?: { title?: string }
  tenant?: { full_name?: string; first_name?: string }
  created_at: string
}

export interface LandlordReceivedApplication {
  id: string
  property_id: string
  tenant_id: string
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn'
  property?: { title?: string; location?: string; price?: number }
  user?: { full_name?: string }
  created_at: string
  viewed_by_landlord?: boolean
}

export interface LandlordAgreement {
  id: string
  tenant_id?: string
  property_id?: string
  status: 'ACTIVE' | 'SIGNED' | 'PENDING_LANDLORD' | 'PENDING_TENANT' | 'EXPIRED' | 'TERMINATED'
  lease_start_date?: string
  lease_end_date?: string
  rent_amount?: number
  deposit_amount?: number
  tenant?: { full_name?: string }
  property?: { title?: string }
  created_at: string
  updated_at?: string
}

export interface EngagementMetrics {
  engagement_score?: number
  trust_score?: number
  engagement_level?: string
  metrics?: {
    properties_listed?: number
    viewing_responses_count?: number
    messages_sent_count?: number
    avg_response_time_hours?: number
  }
}

export interface OnboardingStep {
  step: number
  title: string
  description: string
  completed: boolean
  can_access: boolean
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Normalise backend snake_case keys to camelCase
 * The backend returns snake_case JSON keys, but TypeScript interface uses camelCase
 */
const normaliseDashboardKeys = (raw: any): LandlordDashboardData => {
  return {
    ...raw,
    // Normalise snake_case keys the backend added to camelCase
    viewingRequests:       raw.viewingRequests       ?? raw.viewing_requests       ?? [],
    receivedApplications:  raw.receivedApplications  ?? raw.received_applications  ?? [],
    agreements:            raw.agreements             ?? [],
  } as LandlordDashboardData
}

/**
 * Get comprehensive landlord dashboard data
 * 🚀 OPTIMIZED: Adaptive timeout for Nigeria connectivity
 */
export const getLandlordDashboard = async (): Promise<LandlordDashboardData> => {
  try {
    console.log('📤 [LANDLORD DASHBOARD API] Fetching dashboard data...')
    
    // Adaptive timeout strategy for Nigeria connectivity
    try {
      // First try with short timeout (10s) for responsive UX
      const response = await apiClient.get('/api/v1/landlord/dashboard', {
        timeout: 10000
      })
      console.log('✅ [LANDLORD DASHBOARD API] Dashboard data retrieved (fast)')
      return normaliseDashboardKeys(response.data)
    } catch (error: any) {
      // If it's a timeout, try once more with longer timeout for poor connectivity
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        console.log('📡 [LANDLORD DASHBOARD] First attempt timed out, retrying with longer timeout...')
        try {
          const response = await apiClient.get('/api/v1/landlord/dashboard', {
            timeout: 25000
          })
          console.log('✅ [LANDLORD DASHBOARD API] Dashboard data retrieved (retry)')
          return normaliseDashboardKeys(response.data)
        } catch (retryError: any) {
          try {
            // Final fallback to standard method for reliability
            const response = await apiClient.get('/api/v1/landlord/dashboard', {
              timeout: 30000
            })
            console.log('✅ [LANDLORD DASHBOARD API] Dashboard data retrieved (fallback)')
            return normaliseDashboardKeys(response.data)
          } catch (finalError: any) {
            console.log('❌ [LANDLORD DASHBOARD] All attempts failed')
            throw new Error('Dashboard is taking too long to load. Please try again.')
          }
        }
      }
      // For other errors, throw immediately
      throw error
    }
  } catch (error: any) {
    console.error('❌ [LANDLORD DASHBOARD API] Error fetching dashboard:', error)
    
    // 🚀 PERFORMANCE: Return fallback data on timeout instead of throwing
    if (error.response?.status === 401) {
      console.log('🔒 [LANDLORD DASHBOARD] Unauthorized - user may not be landlord')
      throw new Error('You must be logged in as a landlord to access dashboard')
    }
    
    if (error.response?.status === 500) {
      console.log('🔥 [LANDLORD DASHBOARD] Server error')
      throw new Error('Server error loading dashboard. Please try again.')
    }
    
    // Handle timeout - throw so DashboardContext keeps landlordData=null
    // and page.tsx shows "Could not load" retry screen (better than broken banner)
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      console.log('⏱️ [LANDLORD DASHBOARD] Request timeout - backend is slow, user should retry')
      throw new Error('Dashboard is taking too long to load. Please try again.')
    }
    
    throw new Error(
      error.response?.data?.detail || 
      'Failed to fetch dashboard data'
    )
  }
}

/**
 * Get landlord profile information
 */
export const getLandlordProfile = async (): Promise<LandlordProfile> => {
  try {
    console.log('📤 [LANDLORD DASHBOARD API] Fetching profile...')
    
    const response = await apiClient.get('/api/v1/landlord/profile')
    
    console.log('✅ [LANDLORD DASHBOARD API] Profile retrieved')
    return response.data.profile
  } catch (error: any) {
    console.error('❌ [LANDLORD DASHBOARD API] Error fetching profile:', error)
    throw new Error(
      error.response?.data?.detail || 
      'Failed to fetch profile'
    )
  }
}

/**
 * Get landlord onboarding status
 */
export const getLandlordOnboarding = async (): Promise<LandlordOnboarding> => {
  try {
    console.log('📤 [LANDLORD DASHBOARD API] Fetching onboarding status...')
    
    const response = await apiClient.get('/api/v1/landlord/onboarding')
    
    console.log('✅ [LANDLORD DASHBOARD API] Onboarding status retrieved')
    return response.data.onboarding
  } catch (error: any) {
    console.error('❌ [LANDLORD DASHBOARD API] Error fetching onboarding:', error)
    throw new Error(
      error.response?.data?.detail || 
      'Failed to fetch onboarding status'
    )
  }
}

/**
 * Get landlord statistics
 */
export const getLandlordStats = async (): Promise<LandlordStats> => {
  try {
    console.log('📤 [LANDLORD DASHBOARD API] Fetching stats...')
    
    const response = await apiClient.get('/api/v1/landlord/stats')
    
    console.log('✅ [LANDLORD DASHBOARD API] Stats retrieved')
    return response.data.stats
  } catch (error: any) {
    console.error('❌ [LANDLORD DASHBOARD API] Error fetching stats:', error)
    throw new Error(
      error.response?.data?.detail || 
      'Failed to fetch statistics'
    )
  }
}

/**
 * Get landlord properties
 */
export const getLandlordProperties = async (): Promise<LandlordProperties[]> => {
  try {
    console.log('📤 [LANDLORD DASHBOARD API] Fetching properties...')
    
    const response = await apiClient.get('/api/v1/landlord/properties')
    
    console.log('✅ [LANDLORD DASHBOARD API] Properties retrieved:', response.data.properties.length)
    return response.data.properties
  } catch (error: any) {
    console.error('❌ [LANDLORD DASHBOARD API] Error fetching properties:', error)
    throw new Error(
      error.response?.data?.detail || 
      'Failed to fetch properties'
    )
  }
}

/**
 * Get recent activity
 */
export const getRecentActivity = async (limit: number = 10): Promise<RecentActivity[]> => {
  try {
    console.log('📤 [LANDLORD DASHBOARD API] Fetching recent activity...')
    
    const response = await apiClient.get(`/api/v1/landlord/activity?limit=${limit}`)
    
    console.log('✅ [LANDLORD DASHBOARD API] Activity retrieved:', response.data.activity.length)
    return response.data.activity
  } catch (error: any) {
    console.error('❌ [LANDLORD DASHBOARD API] Error fetching activity:', error)
    throw new Error(
      error.response?.data?.detail || 
      'Failed to fetch recent activity'
    )
  }
}

/**
 * Get notifications
 */
export const getNotifications = async (): Promise<Notification[]> => {
  try {
    console.log('📤 [LANDLORD DASHBOARD API] Fetching notifications...')
    
    const response = await apiClient.get('/api/v1/landlord/notifications')
    
    console.log('✅ [LANDLORD DASHBOARD API] Notifications retrieved:', response.data.notifications.length)
    return response.data.notifications
  } catch (error: any) {
    console.error('❌ [LANDLORD DASHBOARD API] Error fetching notifications:', error)
    throw new Error(
      error.response?.data?.detail || 
      'Failed to fetch notifications'
    )
  }
}

/**
 * Mark notification as read
 */
export const markNotificationRead = async (notificationId: string): Promise<void> => {
  try {
    console.log('📤 [LANDLORD DASHBOARD API] Marking notification as read:', notificationId)
    
    await apiClient.patch(`/api/v1/landlord/notifications/${notificationId}/read`)
    
    console.log('✅ [LANDLORD DASHBOARD API] Notification marked as read')
  } catch (error: any) {
    console.error('❌ [LANDLORD DASHBOARD API] Error marking notification as read:', error)
    throw new Error(
      error.response?.data?.detail || 
      'Failed to mark notification as read'
    )
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if landlord is verified
 */
export const isLandlordVerified = (profile: LandlordProfile): boolean => {
  return profile.verification_status === 'approved'
}

/**
 * Check if onboarding is completed
 */
export const isOnboardingCompleted = (onboarding: LandlordOnboarding): boolean => {
  return onboarding.all_steps_completed && onboarding.submitted_for_review
}

/**
 * Get onboarding progress percentage
 */
export const getOnboardingProgress = (onboarding: LandlordOnboarding): number => {
  const steps = [
    onboarding.profile_step_completed,
    onboarding.payment_step_completed,
    onboarding.property_step_completed,
    onboarding.protection_step_completed
  ]
  
  const completed = steps.filter(Boolean).length
  return (completed / steps.length) * 100
}

/**
 * Get verification status color
 */
export const getVerificationStatusColor = (status: string): string => {
  const colorMap: { [key: string]: string } = {
    approved: 'green',
    pending: 'orange',
    rejected: 'red',
    partial: 'yellow'
  }
  return colorMap[status] || 'gray'
}

/**
 * Get property status color
 */
export const getPropertyStatusColor = (status: string): string => {
  const colorMap: { [key: string]: string } = {
    vacant: 'blue',
    occupied: 'green',
    pending: 'orange',
    under_review: 'yellow'
  }
  return colorMap[status] || 'gray'
}

/**
 * Format currency
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format date
 */
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// ============================================================================
// EXPORT AS OBJECT
// ============================================================================

const landlordDashboardAPI = {
  // Core data fetching
  getLandlordDashboard,
  getLandlordProfile,
  getLandlordOnboarding,
  getLandlordStats,
  getLandlordProperties,
  getRecentActivity,
  getNotifications,
  
  // Actions
  markNotificationRead,
  
  // Helpers
  isLandlordVerified,
  isOnboardingCompleted,
  getOnboardingProgress,
  getVerificationStatusColor,
  getPropertyStatusColor,
  formatCurrency,
  formatDate
}

export default landlordDashboardAPI