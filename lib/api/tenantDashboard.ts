/**
 * Tenant Dashboard API Client
 * 🎯 Purpose: Centralized API for all tenant dashboard data with caching
 * ✅ Features:
 *   - Single endpoint for all dashboard data
 *   - Integrated caching (5-minute TTL)
 *   - Parallel data fetches for performance
 *   - Type-safe responses
 *   - Error handling with graceful degradation
 */

import { favoritesAPI } from './favorites'
import { viewingRequestsAPI } from './viewingRequests'
import { messagesAPI } from './messages'
import { applicationsAPI, Application } from './applications'
import { agreementsAPI } from './agreements'
import { engagementAPI } from './engagement'
import { paymentsAPI } from './payments'

// ============================================================================
// TYPES
// ============================================================================

export interface TenantFavorite {
  id: string
  property_id: string
  property_title?: string
  title?: string // Alias for property_title
  property_address?: string
  address?: string // Alias
  property_city?: string
  city?: string // Alias
  property_image?: string
  images?: string[] // Alternative image format
  price?: number
  beds?: number
  bedrooms?: number // Alias
  baths?: number
  bathrooms?: number // Alias
  sqft?: number
  square_feet?: number // Alias
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
  start_date: string
  end_date: string
  payment_pending?: boolean
  created_at: string
  updated_at: string
}

export interface TenantEngagementMetrics {
  engagement_score: number
  engagement_level: 'Low' | 'Medium' | 'High';
  trust_score: number
  trust_level: 'high' | 'medium' | 'low'
  profile_completeness: number
  viewings_attended: number
  applications_submitted: number
  response_rate: number
  average_response_time: number // in minutes
  verified: boolean
  created_at: string
}

export interface TenantStats {
  totalFavorites: number
  pendingViewings: number
  confirmedViewings: number
  propertiesContacted: number
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
  applications: Application[]
  agreements: TenantAgreement[]
  engagementMetrics: TenantEngagementMetrics | null
  isComplete?: boolean // Track if all data fetches succeeded
  failedSections?: string[] // Track which sections failed
}

// ============================================================================
// CACHE
// ============================================================================

interface CachedData {
  data: TenantDashboardData
  timestamp: number
}

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const API_TIMEOUT = 60 * 1000 // 60 seconds for all APIs to complete
const INCOMPLETE_DATA_TTL = 2 * 60 * 1000 // Cache incomplete data for 2 minutes
let tenantDashboardCache: Map<string, CachedData> = new Map()

function getCacheKey(userId: string): string {
  return `tenant:dashboard:${userId}`
}

function getFromCache(userId: string): TenantDashboardData | null {
  const key = getCacheKey(userId)
  const cached = tenantDashboardCache.get(key)
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
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
  console.log(`💾 [TENANT DASHBOARD] Data cached successfully (TTL: ${ttlSec}s, Complete: ${data.isComplete ?? true})`)
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
// API CLIENT
// ============================================================================

class TenantDashboardClient {
  /**
   * Fetch all tenant dashboard data with caching
   * 🚀 Parallel fetches for performance
   * 💾 Automatic caching with 5-minute TTL
   */
  async getTenantDashboard(userId: string, forceRefresh = false): Promise<TenantDashboardData> {
    console.log(`\n📊 [TENANT DASHBOARD] Fetching dashboard for user: ${userId}`)
    
    // Check cache first (unless forced refresh)
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
      console.log(`🔄 [TENANT DASHBOARD] Cache miss or expired - fetching fresh data in parallel`)
      
      // Track which sections failed
      const failedSections: string[] = []
      
      // 🚀 Fetch ALL dashboard data in parallel with generous 30-second timeout
      const [
        favoritesResult,
        viewingsResult,
        conversationsResult,
        applicationsResult,
        agreementsResult,
        engagementResult
      ] = await Promise.allSettled([
        this.withTimeout(this.fetchFavorites(), 'favorites', API_TIMEOUT),
        this.withTimeout(this.fetchViewingRequests(), 'viewings', API_TIMEOUT),
        this.withTimeout(this.fetchConversations(), 'conversations', API_TIMEOUT),
        this.withTimeout(this.fetchApplications(), 'applications', API_TIMEOUT),
        this.withTimeout(this.fetchAgreements(), 'agreements', API_TIMEOUT),
        this.withTimeout(this.fetchEngagementMetrics(userId), 'engagement', API_TIMEOUT)
      ])

      // Extract results with error tracking
      const favorites = this.extractResult(favoritesResult, [], failedSections, 'favorites')
      const viewingRequests = this.extractResult(viewingsResult, [], failedSections, 'viewings')
      const conversations = this.extractResult(conversationsResult, [], failedSections, 'conversations')
      const applications = this.extractResult(applicationsResult, [], failedSections, 'applications')
      const agreements = this.extractResult(agreementsResult, [], failedSections, 'agreements')
      const engagementMetrics = this.extractResult(engagementResult, null, failedSections, 'engagement')

      // Calculate stats
      const stats = await this.calculateStats(
        favorites,
        viewingRequests,
        conversations,
        applications,
        agreements,
        engagementMetrics
      )

      // Build response with all data (complete or partial)
      const dashboardData: TenantDashboardData = {
        stats,
        favorites,
        viewingRequests,
        conversations,
        applications,
        agreements,
        engagementMetrics,
        isComplete: failedSections.length === 0, // Complete only if all successful
        failedSections: failedSections.length > 0 ? failedSections : undefined
      }

      // Cache the data with appropriate TTL
      const ttl = dashboardData.isComplete ? CACHE_TTL : INCOMPLETE_DATA_TTL
      setCache(userId, dashboardData, ttl)
      
      if (dashboardData.isComplete) {
        console.log(`✅ [TENANT DASHBOARD] Successfully loaded ALL dashboard data (30s timeout)`)
      } else {
        console.log(`⚠️ [TENANT DASHBOARD] Partial data loaded - failed sections: ${failedSections.join(', ')}`)
      }
      
      return dashboardData
    } catch (error) {
      console.error(`❌ [TENANT DASHBOARD] Error fetching dashboard:`, error)
      throw new Error(`Failed to fetch tenant dashboard: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async fetchFavorites(): Promise<TenantFavorite[]> {
    try {
      const data = await favoritesAPI.getAll()
      const favorites = Array.isArray(data?.favorites)
        ? data.favorites
        : []
      
      return favorites.map((fav: any) => ({
        id: fav.id,
        property_id: fav.property_id,
        property_title: fav.property?.title || 'Unknown Property',
        property_address: fav.property?.address || '',
        property_city: fav.property?.city || '',
        property_image: fav.property?.images?.[0],
        price: fav.property?.price || 0,
        beds: fav.property?.beds || 0,
        baths: fav.property?.baths || 0,
        created_at: fav.created_at
      }))
    } catch (error) {
      console.error('❌ Failed to fetch favorites:', error)
      return []
    }
  }

  private async fetchViewingRequests(): Promise<TenantViewingRequest[]> {
    try {
      const data = await viewingRequestsAPI.getAll()
      const viewings = Array.isArray(data?.viewing_requests)
        ? data.viewing_requests
        : []

      return viewings.map((viewing: any) => ({
        id: viewing.id,
        property_id: viewing.property_id,
        property_title: viewing.property?.title || 'Unknown Property',
        property_address: viewing.property?.address || '',
        landlord_id: viewing.landlord_id,
        landlord_name: viewing.landlord?.full_name || 'Unknown Landlord',
        status: viewing.status || 'pending',
        preferred_date: viewing.preferred_date,
        confirmed_date: viewing.confirmed_date,
        time_slot: viewing.time_slot || 'morning',
        confirmed_time: viewing.confirmed_time,
        viewing_type: viewing.viewing_type || 'PHYSICAL',
        created_at: viewing.created_at,
        updated_at: viewing.updated_at
      }))
    } catch (error) {
      console.error('❌ Failed to fetch viewing requests:', error)
      return []
    }
  }

  private async fetchConversations(): Promise<TenantConversation[]> {
    try {

/*    const data = await messagesAPI.getConversations()
      const conversations = Array.isArray(data?.conversations)
        ? data.conversations
        : []    */

      const conversations = await messagesAPI.getConversations()

      return conversations.map((conv: any) => ({
        id: conv.id,
        property_id: conv.property_id || '',
        property_title: conv.property?.title || '',
        other_user_id: conv.other_user_id,
        other_user_name: conv.other_user?.full_name || 'Unknown User',
        other_user_avatar: conv.other_user?.avatar_url,
        last_message: conv.last_message || '',
        last_message_time: conv.last_message_time || conv.updated_at,
        unread_count: conv.unread_count || 0,
        created_at: conv.created_at,
        updated_at: conv.updated_at
      }))
    } catch (error) {
      console.error('❌ Failed to fetch conversations:', error)
      return []
    }
  }

  private async fetchApplications(): Promise<Application[]> {
    try {
      const data = await applicationsAPI.getMyApplications()
      return Array.isArray(data?.applications)
        ? data.applications
        : []
    } catch (error) {
      console.error('❌ Failed to fetch applications:', error)
      return []
    }
  }

  private async fetchAgreements(): Promise<TenantAgreement[]> {
    try {
      const data = await agreementsAPI.getMyAgreements()
      const agreements = Array.isArray(data?.agreements)
        ? data.agreements
        : []

      return agreements.map((agreement: any) => ({
        id: agreement.id,
        property_id: agreement.property_id,
        property_title: agreement.property?.title || 'Unknown Property',
        landlord_id: agreement.landlord_id,
        landlord_name: agreement.landlord?.full_name || 'Unknown Landlord',
        rent_amount: agreement.rent_amount || 0,
        deposit_amount: agreement.deposit_amount || 0,
        status: agreement.status || 'PENDING_TENANT',
        start_date: agreement.start_date,
        end_date: agreement.end_date,
        payment_pending: agreement.payment_pending || false,
        created_at: agreement.created_at,
        updated_at: agreement.updated_at
      }))
    } catch (error) {
      console.error('❌ Failed to fetch agreements:', error)
      return []
    }
  }

  private async fetchEngagementMetrics(userId: string): Promise<TenantEngagementMetrics | null> {
    try {
      const data = await engagementAPI.getEngagementMetrics(userId)
      const engagementData = data as any
      return {
        engagement_score: engagementData?.engagement_score || engagementData?.engagement || 0,
        engagement_level: engagementData?.engagement_level?.toLowerCase() || 'low',
        trust_score: engagementData?.trust_score || 0,
        trust_level: engagementData?.trust_level?.toLowerCase() || 'low',
        profile_completeness: engagementData?.profile_completeness || 0,
        viewings_attended: engagementData?.viewings_attended || engagementData?.viewings || 0,
        applications_submitted: engagementData?.applications_submitted || engagementData?.applications || 0,
        response_rate: engagementData?.response_rate || 0,
        average_response_time: engagementData?.average_response_time || 0,
        verified: engagementData?.verified || false,
        created_at: engagementData?.created_at || new Date().toISOString()
      }
    } catch (error) {
      console.error('❌ Failed to fetch engagement metrics:', error)
      return null
    }
  }

  private extractResult<T>(result: PromiseSettledResult<T>, defaultValue: T, failedSections: string[], sectionName: string): T {
    if (result.status === 'fulfilled') {
      return result.value
    }
    console.error(`❌ [${sectionName.toUpperCase()}] Failed to fetch:`, result.reason)
    failedSections.push(sectionName)
    return defaultValue
  }

  private async withTimeout<T>(promise: Promise<T>, sectionName: string, timeout: number = API_TIMEOUT): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => 
        setTimeout(() => reject(new Error(`${sectionName} API timeout (${timeout}ms)`)), timeout)
      )
    ])
  }

  /**
   * Fetch slow APIs separately if needed (optional lazy loading)
   * Uses 30-second timeout to match main dashboard API timeout
   */
  async fetchSlowAPIs(userId: string): Promise<{ applications: Application[]; agreements: TenantAgreement[]; engagementMetrics: TenantEngagementMetrics | null }> {
    try {
      const [appResult, agrResult, engResult] = await Promise.allSettled([
        this.withTimeout(this.fetchApplications(), 'applications', API_TIMEOUT),
        this.withTimeout(this.fetchAgreements(), 'agreements', API_TIMEOUT),
        this.withTimeout(this.fetchEngagementMetrics(userId), 'engagement', API_TIMEOUT)
      ])

      return {
        applications: appResult.status === 'fulfilled' ? appResult.value : [],
        agreements: agrResult.status === 'fulfilled' ? agrResult.value : [],
        engagementMetrics: engResult.status === 'fulfilled' ? engResult.value : null
      }
    } catch (error) {
      console.error('❌ Error fetching slow APIs:', error)
      return { applications: [], agreements: [], engagementMetrics: null }
    }
  }

  private async calculateStats(
    favorites: TenantFavorite[],
    viewingRequests: TenantViewingRequest[],
    conversations: TenantConversation[],
    applications: Application[],
    agreements: TenantAgreement[],
    engagementMetrics: TenantEngagementMetrics | null
  ): Promise<TenantStats> {
    const pendingViewings = viewingRequests.filter(v => v.status === 'pending').length
    const confirmedViewings = viewingRequests.filter(v => v.status === 'confirmed').length
    const pendingApplications = applications.filter(a => a.status === 'pending').length
    const approvedApplications = applications.filter(a => a.status === 'approved').length
    const rejectedApplications = applications.filter(a => a.status === 'rejected').length
    const activeAgreements = agreements.filter(a => a.status === 'ACTIVE').length
    const pendingSignatures = agreements.filter(a => a.status === 'PENDING_TENANT').length
    const paymentsDue = agreements.filter(a => a.status === 'ACTIVE' && a.payment_pending).length
    const unreadMessages = conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0)

    // Fetch payment stats
    let totalPayments = 0
    let completedPayments = 0
    
    try {
      const paymentsResponse = await paymentsAPI.getMyPayments()
      if (paymentsResponse.success && paymentsResponse.payments) {
        totalPayments = paymentsResponse.payments.length
        completedPayments = paymentsResponse.payments.filter(p => p.status === 'released').length
      }
    } catch (error) {
      console.error('Failed to fetch payment stats:', error)
    }

    return {
      totalFavorites: favorites.length,
      pendingViewings,
      confirmedViewings,
      propertiesContacted: viewingRequests.length,
      unreadMessages,
      applicationsSubmitted: applications.length,
      pendingApplications,
      approvedApplications,
      rejectedApplications,
      activeAgreements,
      pendingSignatures,
      paymentsDue,
      totalPayments,
      completedPayments,
      engagementScore: engagementMetrics?.engagement_score || 0,
      trustScore: engagementMetrics?.trust_score || 0,
      engagementLevel: engagementMetrics?.engagement_level || 'none'
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
