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
  property_title?: string
  title?: string
  property_address?: string
  address?: string
  property_city?: string
  city?: string
  property_image?: string
  images?: string[]
  price?: number
  beds?: number
  bedrooms?: number
  baths?: number
  bathrooms?: number
  sqft?: number
  square_feet?: number
  location?: string
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
  return {
    ...raw,
    stats: raw.stats || {},
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
      
      const response = await apiClient.get('/api/v1/tenant/dashboard', {
        timeout: 30000
      })
      
      console.log(`✅ [TENANT DASHBOARD] Data retrieved from backend`)
      
      const dashboardData = normaliseDashboardKeys(response.data)
      
      if (dashboardData.isComplete) {
        setCache(userId, dashboardData, CACHE_TTL)
        console.log(`✅ [TENANT DASHBOARD] Successfully loaded ALL dashboard data`)
      } else {
        setCache(userId, dashboardData, 30 * 1000)
        console.log(`⚠️ [TENANT DASHBOARD] Partial data loaded - failed sections: ${(dashboardData.failedSections || []).join(', ')}`)
      }
      
      return dashboardData
    } catch (error: any) {
      console.error(`❌ [TENANT DASHBOARD] Error fetching dashboard:`, error)
      
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
