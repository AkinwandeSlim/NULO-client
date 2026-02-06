/**
 * Admin Dashboard API Client
 * Centralized module for all admin dashboard operations
 * Handles stats, analytics, and overview data
 * 🔧 FIXED: Removed redundant timeout overrides - uses client.ts default
 */

import apiClient from './client';

// ============================================================================
// TYPES
// ============================================================================

export interface DashboardStats {
  landlords: LandlordDashboardStats
  tenants: TenantDashboardStats
  properties: PropertyDashboardStats
  onboarding: OnboardingStats
  recent_activity: RecentActivity
}

export interface LandlordDashboardStats {
  total: number
  pending_verification: number
  verified: number
  rejected: number
  pending_onboarding: number
}

export interface TenantDashboardStats {
  total: number
  pending_verification: number
  verified: number
  rejected: number
}

export interface PropertyDashboardStats {
  total: number
  total_views?: number
  pending_verification: number
  verified: number
  rejected: number
  under_review: number
}

export interface OnboardingStats {
  total_completed: number
  pending_review: number
  approved: number
  rejected: number
}

export interface RecentActivity {
  new_landlord_signups_today: number
  new_tenant_signups_today: number
  pending_landlord_verifications: number
  pending_tenant_verifications: number
  pending_property_verifications: number
}

export interface RecentSignup {
  id: string
  full_name: string
  email: string
  phone_number?: string
  account_type: 'individual' | 'company'
  company_name?: string
  verification_status: string
  created_at: string
  verification_submitted_at?: string
  onboarding_completed_at?: string
  landlord?: {
    id: string
    email: string
    full_name: string
    avatar_url?: string
    trust_score: number
  }
}

export interface RecentSignupsResponse {
  success: boolean
  submissions: RecentSignup[]
  count: number
  period_days: number
}

export interface ActivityMetrics {
  total_users: number
  active_users_today: number
  active_users_this_week: number
  active_users_this_month: number
  growth_rate: number
  new_users_this_week: number
  new_users_this_month: number
}

export interface VerificationMetrics {
  total_pending: number
  total_approved: number
  total_rejected: number
  approval_rate: number
  rejection_rate: number
  avg_processing_time_hours?: number
}

export interface PlatformOverview {
  total_users: number
  total_landlords: number
  total_tenants: number
  total_properties: number
  total_verified_users: number
  verification_rate: number
}

// ============================================================================
// API CONFIGURATION
// ============================================================================

const ENDPOINTS = {
  DASHBOARD_STATS: '/api/v1/admin/dashboard/stats',
  RECENT_SIGNUPS: '/api/v1/admin/landlord-verifications/recent',
  ACTIVITY_METRICS: '/api/v1/admin/dashboard/activity',
  VERIFICATION_METRICS: '/api/v1/admin/dashboard/verifications',
  PLATFORM_OVERVIEW: '/api/v1/admin/dashboard/overview',
}

// ============================================================================
// CORE API FUNCTIONS
// ============================================================================

/**
 * Get comprehensive dashboard statistics
 * 🔧 FIXED: Uses default 30s timeout from client.ts
 */
export const getDashboardStats = async (): Promise<DashboardStats> => {
  console.log('📤 [DASHBOARD API] Fetching dashboard stats')
  
  try {
    const response = await apiClient.get(ENDPOINTS.DASHBOARD_STATS)
    
    console.log('✅ [DASHBOARD API] Dashboard stats loaded:', response.data)
    return response.data
  } catch (error: any) {
    console.error('❌ [DASHBOARD API] Error fetching dashboard stats:', error)
    throw new Error(error.response?.data?.detail || 'Failed to fetch dashboard statistics')
  }
}

/**
 * Get recent landlord signups
 * @param days - Number of days to look back (default: 7)
 * 🔧 FIXED: Uses default 30s timeout from client.ts
 */
export const getRecentSignups = async (days: number = 7): Promise<RecentSignupsResponse> => {
  console.log(`📤 [DASHBOARD API] Fetching recent signups (last ${days} days)`)
  
  try {
    const response = await apiClient.get(`${ENDPOINTS.RECENT_SIGNUPS}?days=${days}`)
    
    console.log('✅ [DASHBOARD API] Recent signups loaded:', response.data)
    return response.data
  } catch (error: any) {
    console.error('❌ [DASHBOARD API] Error fetching recent signups:', error)
    // Return empty data instead of throwing to prevent dashboard from breaking
    return {
      success: false,
      submissions: [],
      count: 0,
      period_days: days
    }
  }
}

/**
 * Get activity metrics (users, engagement)
 * 🔧 FIXED: Uses default 30s timeout from client.ts
 */
export const getActivityMetrics = async (): Promise<ActivityMetrics> => {
  console.log('📤 [DASHBOARD API] Fetching activity metrics')
  
  try {
    const response = await apiClient.get(ENDPOINTS.ACTIVITY_METRICS)
    
    console.log('✅ [DASHBOARD API] Activity metrics loaded')
    return response.data
  } catch (error: any) {
    console.error('❌ [DASHBOARD API] Error fetching activity metrics:', error)
    // Return default metrics
    return {
      total_users: 0,
      active_users_today: 0,
      active_users_this_week: 0,
      active_users_this_month: 0,
      growth_rate: 0,
      new_users_this_week: 0,
      new_users_this_month: 0
    }
  }
}

/**
 * Get verification metrics
 * 🔧 FIXED: Uses default 30s timeout from client.ts
 */
export const getVerificationMetrics = async (): Promise<VerificationMetrics> => {
  console.log('📤 [DASHBOARD API] Fetching verification metrics')
  
  try {
    const response = await apiClient.get(ENDPOINTS.VERIFICATION_METRICS)
    
    console.log('✅ [DASHBOARD API] Verification metrics loaded')
    return response.data
  } catch (error: any) {
    console.error('❌ [DASHBOARD API] Error fetching verification metrics:', error)
    return {
      total_pending: 0,
      total_approved: 0,
      total_rejected: 0,
      approval_rate: 0,
      rejection_rate: 0
    }
  }
}

/**
 * Get platform overview (high-level stats)
 * 🔧 FIXED: Uses default 30s timeout from client.ts
 */
export const getPlatformOverview = async (): Promise<PlatformOverview> => {
  console.log('📤 [DASHBOARD API] Fetching platform overview')
  
  try {
    const response = await apiClient.get(ENDPOINTS.PLATFORM_OVERVIEW)
    
    console.log('✅ [DASHBOARD API] Platform overview loaded')
    return response.data
  } catch (error: any) {
    console.error('❌ [DASHBOARD API] Error fetching platform overview:', error)
    return {
      total_users: 0,
      total_landlords: 0,
      total_tenants: 0,
      total_properties: 0,
      total_verified_users: 0,
      verification_rate: 0
    }
  }
}

/**
 * Refresh all dashboard data (force cache invalidation)
 * 🔧 FIXED: Uses default 30s timeout from client.ts
 */
export const refreshDashboard = async (): Promise<{
  stats: DashboardStats
  recentSignups: RecentSignupsResponse
}> => {
  console.log('📤 [DASHBOARD API] Refreshing all dashboard data')
  
  try {
    const [stats, recentSignups] = await Promise.all([
      getDashboardStats(),
      getRecentSignups()
    ])
    
    console.log('✅ [DASHBOARD API] Dashboard refreshed')
    return { stats, recentSignups }
  } catch (error: any) {
    console.error('❌ [DASHBOARD API] Error refreshing dashboard:', error)
    throw new Error('Failed to refresh dashboard')
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate total pending verifications across all types
 */
export const getTotalPendingVerifications = (stats: DashboardStats): number => {
  return (
    stats.landlords.pending_verification +
    stats.tenants.pending_verification +
    stats.properties.pending_verification
  )
}

/**
 * Calculate total verified users (landlords + tenants)
 */
export const getTotalVerifiedUsers = (stats: DashboardStats): number => {
  return stats.landlords.verified + stats.tenants.verified
}

/**
 * Calculate total users (landlords + tenants)
 */
export const getTotalUsers = (stats: DashboardStats): number => {
  return stats.landlords.total + stats.tenants.total
}

/**
 * Calculate verification rate (percentage of verified users)
 */
export const getVerificationRate = (stats: DashboardStats): number => {
  const total = getTotalUsers(stats)
  if (total === 0) return 0
  
  const verified = getTotalVerifiedUsers(stats)
  return Math.round((verified / total) * 100)
}

/**
 * Check if there are any pending actions requiring attention
 */
export const hasPendingActions = (stats: DashboardStats): boolean => {
  return (
    stats.landlords.pending_verification > 0 ||
    stats.tenants.pending_verification > 0 ||
    stats.properties.pending_verification > 0 ||
    stats.landlords.pending_onboarding > 0
  )
}

/**
 * Get count of urgent items (pending > 5)
 */
export const getUrgentCount = (stats: DashboardStats): number => {
  let count = 0
  
  if (stats.landlords.pending_verification > 5) count++
  if (stats.tenants.pending_verification > 5) count++
  if (stats.properties.pending_verification > 5) count++
  
  return count
}

/**
 * Format activity summary message
 */
export const getActivitySummary = (stats: DashboardStats): string => {
  const newLandlords = stats.recent_activity.new_landlord_signups_today
  const newTenants = stats.recent_activity.new_tenant_signups_today
  
  if (newLandlords === 0 && newTenants === 0) {
    return 'No new signups today'
  }
  
  const parts: string[] = []
  if (newLandlords > 0) parts.push(`${newLandlords} new landlord${newLandlords > 1 ? 's' : ''}`)
  if (newTenants > 0) parts.push(`${newTenants} new tenant${newTenants > 1 ? 's' : ''}`)
  
  return parts.join(' and ') + ' today'
}

/**
 * Get priority level for dashboard alerts
 */
export const getPriorityLevel = (stats: DashboardStats): 'low' | 'medium' | 'high' | 'urgent' => {
  const pending = getTotalPendingVerifications(stats)
  
  if (pending === 0) return 'low'
  if (pending < 5) return 'medium'
  if (pending < 10) return 'high'
  return 'urgent'
}

/**
 * Check if signup is recent (within last 24 hours)
 */
export const isRecentSignup = (signup: RecentSignup): boolean => {
  const signupDate = new Date(signup.created_at)
  const now = new Date()
  const hoursDiff = (now.getTime() - signupDate.getTime()) / (1000 * 60 * 60)
  
  return hoursDiff <= 24
}

/**
 * Format signup for display
 */
export const formatSignupDisplay = (signup: RecentSignup): string => {
  const name = signup.account_type === 'company' && signup.company_name
    ? `${signup.company_name} (${signup.full_name})`
    : signup.full_name
  
  const date = new Date(signup.created_at).toLocaleDateString()
  return `${name} - ${date}`
}

/**
 * Get status badge color for recent signups
 */
export const getSignupStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    pending: 'orange',
    approved: 'green',
    rejected: 'red',
    partial: 'yellow'
  }
  
  return colors[status] || 'gray'
}

// ============================================================================
// COMPUTED STATS HELPERS
// ============================================================================

/**
 * Calculate growth indicators
 */
export const getGrowthIndicators = (stats: DashboardStats): {
  totalGrowth: number
  landlordGrowth: number
  tenantGrowth: number
  hasGrowth: boolean
} => {
  const totalGrowth = 
    stats.recent_activity.new_landlord_signups_today +
    stats.recent_activity.new_tenant_signups_today
  
  return {
    totalGrowth,
    landlordGrowth: stats.recent_activity.new_landlord_signups_today,
    tenantGrowth: stats.recent_activity.new_tenant_signups_today,
    hasGrowth: totalGrowth > 0
  }
}

/**
 * Get verification queue summary
 */
export const getVerificationQueue = (stats: DashboardStats): {
  total: number
  byType: {
    landlords: number
    tenants: number
    properties: number
  }
  hasQueue: boolean
} => {
  const total = getTotalPendingVerifications(stats)
  
  return {
    total,
    byType: {
      landlords: stats.landlords.pending_verification,
      tenants: stats.tenants.pending_verification,
      properties: stats.properties.pending_verification
    },
    hasQueue: total > 0
  }
}

/**
 * Get platform health status
 */
export const getPlatformHealth = (stats: DashboardStats): {
  status: 'excellent' | 'good' | 'fair' | 'needs-attention'
  message: string
  indicators: {
    activeUsers: boolean
    verificationBacklog: boolean
    growthRate: boolean
  }
} => {
  const verificationRate = getVerificationRate(stats)
  const pendingCount = getTotalPendingVerifications(stats)
  const hasGrowth = getGrowthIndicators(stats).hasGrowth
  
  let status: 'excellent' | 'good' | 'fair' | 'needs-attention'
  let message: string
  
  if (verificationRate > 80 && pendingCount < 5) {
    status = 'excellent'
    message = 'Platform is running smoothly'
  } else if (verificationRate > 60 && pendingCount < 10) {
    status = 'good'
    message = 'Platform is performing well'
  } else if (verificationRate > 40 || pendingCount < 20) {
    status = 'fair'
    message = 'Some areas need attention'
  } else {
    status = 'needs-attention'
    message = 'Action required on pending items'
  }
  
  return {
    status,
    message,
    indicators: {
      activeUsers: getTotalUsers(stats) > 0,
      verificationBacklog: pendingCount < 10,
      growthRate: hasGrowth
    }
  }
}

// ============================================================================
// EXPORT AS OBJECT (for default import)
// ============================================================================

const dashboardAPI = {
  // Core operations
  getDashboardStats,
  getRecentSignups,
  getActivityMetrics,
  getVerificationMetrics,
  getPlatformOverview,
  refreshDashboard,
  
  // Computed stats
  getTotalPendingVerifications,
  getTotalVerifiedUsers,
  getTotalUsers,
  getVerificationRate,
  getGrowthIndicators,
  getVerificationQueue,
  getPlatformHealth,
  
  // Status checks
  hasPendingActions,
  getUrgentCount,
  getPriorityLevel,
  isRecentSignup,
  
  // Display helpers
  getActivitySummary,
  formatSignupDisplay,
  getSignupStatusColor,
}

export default dashboardAPI