/**
 * Tenant Dashboard API Client
 * 🎯 Purpose: Centralized API for all tenant dashboard data with caching
 * ✅ Features:
 *   - Single unified endpoint for all dashboard data
 *   - Backend parallelizes all queries via ThreadPoolExecutor
 *   - Integrated caching (5-minute TTL)
 *   - Key normalization (snake_case ↔ camelCase)
 *   - Type-safe responses with error handling
 */

import apiClient from './client'
import { Application } from './applications'

// ============================================================================
// TYPES
// ============================================================================

export interface TenantFavorite {
  id: string
  property_id: string
  /** Canonical property display name (matches backend column) */
  property_title: string
  /** Canonical property address (matches backend column) */
  property_address: string
  /** Canonical property city (matches backend column) */
  property_city: string
  /** Canonical cover image URL (matches backend column) */
  property_image: string
  price: number
  beds: number
  baths: number
  sqft: number
  location: string
  rating?: number
  avatar?: string
  landlord_name?: string
  created_at: string
}

export interface TenantViewingRequest {
  id: string
  property_id: string
  property_title: string
  property_address: string
  property?: {
    id: string
    title?: string
    address?: string
    image?: string
  }
  landlord_id: string
  landlord_name: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  preferred_date: string
  confirmed_date?: string
  time_slot: 'morning' | 'afternoon' | 'evening'
  confirmed_time?: string
  viewing_type: 'PHYSICAL' | 'VIRTUAL' | 'LIVE_VIDEO'
  created_at: string
  updated_at: string
}

export interface TenantApplication {
  id: string
  property_id: string
  property_title: string
  property_location: string
  property_price: number
  status: 'pending' | 'approved' | 'rejected'
  move_in_date: string
  created_at: string
  viewed_by_landlord: boolean
  propflow_thread_id?: string
}

export interface TenantConversation {
  id: string
  property_id: string
  property_title: string
  other_user_id: string
  landlord?: {
    id: string
    full_name?: string
    name?: string
    avatar?: string
  }
  other_user_name: string
  other_user_avatar?: string
  last_message: string
  last_message_time: string
  unread_count: number
  created_at: string
  updated_at: string
}

export interface TenantAgreement {
    id: string
    property_id: string
    property_title: string
    property?: {
        id: string
        title?: string
        location?: string
        address?: string
        image?: string
    }
    landlord_id: string
    landlord_name: string
    rent_amount: number
    deposit_amount: number
    status: 'ACTIVE' | 'SIGNED' | 'PENDING_TENANT' | 'PENDING_LANDLORD' | 'EXPIRED' | 'TERMINATED'
    lease_start_date: string
    lease_end_date: string
    payment_pending?: boolean
    payment_frequency?: 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL' | null
    expected_payment_amount?: number
    total_received_amount?: number
    reconciliation_status?: string | null
    virtual_account_number?: string | null
    virtual_account_name?: string | null
    nomba_account_ref?: string | null
    disbursement_status?: string | null
    disbursement_merchant_tx_ref?: string | null
    disbursement_amount?: number | null
    created_at: string
    updated_at: string
}

export interface TenantEngagementMetrics {
  engagement_score: number
  engagement_level: 'Low' | 'Medium' | 'High'
  trust_score: number
  trust_level: 'high' | 'medium' | 'low'
  profile_completeness: number
  viewings_attended: number
  applications_submitted: number
  response_rate: number
  average_response_time: number
  verified: boolean
  created_at: string
}

export interface TenantStats {
  totalFavorites: number
  pendingViewings: number
  confirmedViewings: number
  completedViewings: number
  propertiesContacted: number
  totalConversations: number
  unreadMessages: number
  applicationsSubmitted: number
  pendingApplications: number
  approvedApplications: number
  rejectedApplications: number
  activeAgreements: number
  pendingSignatures: number
  paymentsDue: number
  totalPayments: number
  completedPayments: number
  engagementScore: number
  trustScore: number
  engagementLevel: string
}

export interface TenantDashboardData {
  stats: TenantStats
  favorites: TenantFavorite[]
  viewingRequests: TenantViewingRequest[]
  conversations: TenantConversation[]
  applications: TenantApplication[]
  agreements: TenantAgreement[]
  engagementMetrics: TenantEngagementMetrics | null
  isComplete?: boolean
  failedSections?: string[]
}

// ============================================================================
// CACHE
// ============================================================================

interface CachedData {
  data: TenantDashboardData
  timestamp: number
}

const CACHE_TTL = 5 * 60 * 1000
let tenantDashboardCache: Map<string, CachedData> = new Map()

function getCacheKey(userId: string): string {
  return `tenant:dashboard:${userId}`
}

function getFromCache(userId: string): TenantDashboardData | null {
  const key = getCacheKey(userId)
  const cached = tenantDashboardCache.get(key)
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    if (!cached.data.isComplete) {
      console.log(`⚠️ [TENANT DASHBOARD] Incomplete cached data - forcing fresh fetch`)
      tenantDashboardCache.delete(key)
      return null
    }
    console.log(
      `💾 [TENANT DASHBOARD] Cache HIT (age: ${Math.round((Date.now() - cached.timestamp) / 1000)}s)`
    )
    return cached.data
  }
  
  if (cached) {
    console.log(`⏰ [TENANT DASHBOARD] Cache EXPIRED - fetching fresh data`)
    tenantDashboardCache.delete(key)
  }
  
  return null
}

function setCache(userId: string, data: TenantDashboardData, ttl: number = CACHE_TTL): void {
  const key = getCacheKey(userId)
  tenantDashboardCache.set(key, {
    data,
    timestamp: Date.now()
  })
  const ttlSec = Math.round(ttl / 1000)
  console.log(`💾 [TENANT DASHBOARD] Data cached successfully (TTL: ${ttlSec}s)`)
}

function invalidateCache(userId?: string): void {
  if (userId) {
    const key = getCacheKey(userId)
    tenantDashboardCache.delete(key)
    console.log(`🔄 [TENANT DASHBOARD] Cache invalidated for user: ${userId}`)
  } else {
    tenantDashboardCache.clear()
    console.log(`🔄 [TENANT DASHBOARD] All cache cleared`)
  }
}

// ============================================================================
// KEY NORMALIZATION
// ============================================================================

/**
 * Normalise backend snake_case keys to camelCase
 * Backend returns viewing_requests, conversations, etc. in snake_case
 * TypeScript interface expects camelCase
 * This function handles both formats with defensive fallback chains
 */
const normaliseDashboardKeys = (raw: any): TenantDashboardData => {
  // 🐛 DEBUG: Log what backend actually sent
  console.log('🔍 [TENANT DASHBOARD] Raw backend response:', {
    hasStats: !!raw.stats,
    statsKeys: raw.stats ? Object.keys(raw.stats) : [],
    hasFavorites: !!raw.favorites,
    hasViewingRequests: !!(raw.viewingRequests || raw.viewing_requests),
    hasConversations: !!raw.conversations,
    hasApplications: !!raw.applications,
    hasAgreements: !!raw.agreements,
  })
  
  // ✅ FIX: Provide sensible defaults for ALL stats fields
  const defaultStats: TenantStats = {
    totalFavorites: 0,
    pendingViewings: 0,
    confirmedViewings: 0,
    completedViewings: 0,
    propertiesContacted: 0,
    totalConversations: 0,
    unreadMessages: 0,
    applicationsSubmitted: 0,
    pendingApplications: 0,
    approvedApplications: 0,
    rejectedApplications: 0,
    activeAgreements: 0,
    pendingSignatures: 0,
    paymentsDue: 0,
    totalPayments: 0,
    completedPayments: 0,
    engagementScore: 0,
    trustScore: 50,
    engagementLevel: 'none',
  }
  
  return {
    ...raw,
    stats: raw.stats ? { ...defaultStats, ...raw.stats } : defaultStats,
    favorites: raw.favorites || [],
    viewingRequests: raw.viewingRequests ?? raw.viewing_requests ?? [],
    conversations: raw.conversations ?? [],
    applications: raw.applications ?? [],
    agreements: raw.agreements ?? [],
    engagementMetrics: raw.engagementMetrics || null,
    isComplete: raw.isComplete ?? true,
    failedSections: raw.failedSections
  } as TenantDashboardData
}

// ============================================================================
// API CLIENT
// ============================================================================

class TenantDashboardClient {
  /**
   * Fetch all tenant dashboard data from unified backend endpoint
   * Backend parallelizes all queries via ThreadPoolExecutor
   */
  async getTenantDashboard(userId: string, forceRefresh = false): Promise<TenantDashboardData> {
    const apiCallStartTime = Date.now();
    console.log(`\n📊 [TENANT DASHBOARD] Fetching dashboard for user: ${userId}`)
    
    if (!forceRefresh) {
      const cached = getFromCache(userId)
      if (cached) {
        return cached
      }
    } else {
      console.log(`🔄 [TENANT DASHBOARD] Force refresh requested`)
      invalidateCache(userId)
    }
    
    try {
      console.log(`📤 [TENANT DASHBOARD] Calling /api/v1/tenant/dashboard`)
      
      const requestStartTime = Date.now();
      const response = await apiClient.get('/api/v1/tenant/dashboard', {
        timeout: 30000
      })
      const requestElapsed = Date.now() - requestStartTime;
      
      console.log(`✅ [TENANT DASHBOARD] Data retrieved from backend in ${requestElapsed}ms`)
      
      const dashboardData = normaliseDashboardKeys(response.data)
      
      if (dashboardData.isComplete) {
        setCache(userId, dashboardData, CACHE_TTL)
        console.log(`✅ [TENANT DASHBOARD] Successfully loaded ALL dashboard data`)
      } else {
        setCache(userId, dashboardData, 30 * 1000)
        console.log(`⚠️ [TENANT DASHBOARD] Partial data loaded - failed sections: ${(dashboardData.failedSections || []).join(', ')}`)
      }
      
      const totalElapsed = Date.now() - apiCallStartTime;
      console.log(`⏱️ [TENANT DASHBOARD] Total operation time: ${totalElapsed}ms`);
      
      return dashboardData
    } catch (error: any) {
      const totalElapsed = Date.now() - apiCallStartTime;
      console.error(`❌ [TENANT DASHBOARD] Error fetching dashboard after ${totalElapsed}ms:`, error)
      
      if (error.response?.status === 401) {
        throw new Error('You must be logged in as a tenant to access dashboard')
      }
      
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        throw new Error('Dashboard is taking too long to load. Please try again.')
      }
      
      throw new Error(
        error.response?.data?.detail || 
        'Failed to fetch dashboard data'
      )
    }
  }

  /**
   * Force refresh dashboard data (bypass cache)
   */
  async refreshTenantDashboard(userId: string): Promise<TenantDashboardData> {
    return this.getTenantDashboard(userId, true)
  }

  /**
   * Invalidate cache for user
   */
  invalidateUserCache(userId: string): void {
    invalidateCache(userId)
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      cacheSize: tenantDashboardCache.size,
      cachedUsers: Array.from(tenantDashboardCache.keys()),
      ttl: CACHE_TTL
    }
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export const tenantDashboardAPI = new TenantDashboardClient()
export default tenantDashboardAPI
