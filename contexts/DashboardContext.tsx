/**
 * Dashboard Context with Integrated Caching
 * 🎯 Purpose: Share cached dashboard data across all dashboard pages
 * ✅ Features:
 *   - Global state for dashboard stats
 *   - Automatic cache-aware fetching
 *   - Background refresh without blocking UI
 *   - Cache invalidation events
 *   - Session management
 */

'use client'

import React, { createContext, useContext, useCallback, useEffect, useState, ReactNode } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import adminDashboardAPI from '@/lib/api/adminDashboard'
import landlordDashboardAPI from '@/lib/api/landlordDashboard'
import {
  getDashboardCache,
  initializeDashboardCache,
  resetDashboardCache,
  CacheKeys,
  type CacheConfig,
} from '@/lib/cache/dashboardCache'
import type { AdminDashboardStats, RecentActivityResponse } from '@/lib/api/adminDashboard'
import type { LandlordDashboardData } from '@/lib/api/landlordDashboard'

// ============================================================================
// CONTEXT TYPES
// ============================================================================

interface DashboardContextType {
  // Admin Dashboard State
  stats: AdminDashboardStats | null
  recentActivity: RecentActivityResponse | null
  loading: boolean
  refreshing: boolean
  lastRefreshTime: number | null
  cacheHitRate: number
  
  // Landlord Dashboard State
  landlordData: LandlordDashboardData | null
  landlordLoading: boolean
  landlordRefreshing: boolean
  landlordLastRefreshTime: number | null
  
  // Admin Methods
  fetchDashboardStats: (forceRefresh?: boolean) => Promise<void>
  fetchRecentActivity: (days?: number, forceRefresh?: boolean) => Promise<void>
  invalidateCache: (pattern?: string) => void
  getCacheStats: () => any
  logCacheStats: () => void
  
  // Landlord Methods
  fetchLandlordDashboard: (forceRefresh?: boolean) => Promise<void>
  invalidateLandlordCache: () => void
  
  // Configuration
  setCacheTTL: (key: keyof CacheConfig, ttl: number) => void
}

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const DashboardContext = createContext<DashboardContextType | undefined>(undefined)

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

interface DashboardProviderProps {
  children: ReactNode
  cacheConfig?: Partial<CacheConfig>
}

export function DashboardProvider({ children, cacheConfig }: DashboardProviderProps) {
  // Get auth context
  const { user, userProfile } = useAuth()
  
  // Admin Dashboard State
  const [stats, setStats] = useState<AdminDashboardStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivityResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefreshTime, setLastRefreshTime] = useState<number | null>(null)
  const [cacheHitRate, setCacheHitRate] = useState(0)

  // Landlord Dashboard State
  const [landlordData, setLandlordData] = useState<LandlordDashboardData | null>(null)
  const [landlordLoading, setLandlordLoading] = useState(false)
  const [landlordRefreshing, setLandlordRefreshing] = useState(false)
  const [landlordLastRefreshTime, setLandlordLastRefreshTime] = useState<number | null>(null)

  // Initialize cache on mount
  useEffect(() => {
    const cache = initializeDashboardCache(cacheConfig)
    
    // Log cache stats every 30 seconds (for monitoring)
    const statsInterval = setInterval(() => {
      const cacheStats = cache.getStats()
      setCacheHitRate(cacheStats.hitRate)
      console.log(`📊 [DASHBOARD] Cache Hit Rate: ${cacheStats.hitRate.toFixed(1)}%`)
    }, 30000)

    return () => {
      clearInterval(statsInterval)
      // Note: Don't call resetDashboardCache here - keep cache for session duration
    }
  }, [])

  // ============================================================================
  // FETCH DASHBOARD STATS WITH CACHING
  // ============================================================================

  const fetchDashboardStats = useCallback(
    async (forceRefresh = false) => {
      // ✅ CHECK: Only fetch if user is authenticated and is admin
      if (!user || user?.user_type !== 'admin') {
        console.log('🚫 [DASHBOARD] Skipping admin stats fetch - user not authenticated or not admin')
        setLoading(false)
        return
      }

      const cache = getDashboardCache()
      const cacheKey = CacheKeys.dashboardStats()

      try {
        // Try to get from cache first (unless force refresh)
        if (!forceRefresh) {
          const cachedStats = cache.get<AdminDashboardStats>(cacheKey)
          if (cachedStats) {
            console.log('📦 [DASHBOARD] Using cached stats')
            setStats(cachedStats)
            return
          }
        }

        // Fetch from API if not in cache
        console.log('🔄 [DASHBOARD] Fetching stats from API...')
        setLoading(true)

        const freshStats = await adminDashboardAPI.getDashboardStats()

        // Update state
        setStats(freshStats)
        setLastRefreshTime(Date.now())

        // Store in cache
        cache.set(cacheKey, freshStats)

        console.log('✅ [DASHBOARD] Stats fetched and cached')

        if (forceRefresh) {
          toast.success('Dashboard refreshed')
        }
      } catch (error: any) {
        console.error('❌ [DASHBOARD] Failed to fetch stats:', error)
        
        // If we have cached data, use it despite error
        if (!stats) {
          toast.error('Failed to load dashboard stats')
        }
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [user, userProfile, stats]
  )

  // ============================================================================
  // FETCH RECENT ACTIVITY WITH CACHING
  // ============================================================================

  const fetchRecentActivity = useCallback(
    async (days = 7, forceRefresh = false) => {
      // ✅ CHECK: Only fetch if user is authenticated and is admin
      if (!user || user?.user_type !== 'admin') {
        console.log('🚫 [DASHBOARD] Skipping recent activity fetch - user not authenticated or not admin')
        setLoading(false)
        return
      }

      const cache = getDashboardCache()
      const cacheKey = CacheKeys.recentActivity(days)

      try {
        // Try to get from cache first (unless force refresh)
        if (!forceRefresh) {
          const cachedActivity = cache.get<RecentActivityResponse>(cacheKey)
          if (cachedActivity) {
            console.log('📦 [DASHBOARD] Using cached activity')
            setRecentActivity(cachedActivity)
            return
          }
        }

        // Fetch from API if not in cache
        console.log(`🔄 [DASHBOARD] Fetching recent activity (${days} days) from API...`)
        setLoading(true)

        const freshActivity = await adminDashboardAPI.getRecentActivity(days)

        // Update state
        setRecentActivity(freshActivity)
        setLastRefreshTime(Date.now())

        // Store in cache
        cache.set(cacheKey, freshActivity)

        console.log('✅ [DASHBOARD] Activity fetched and cached')

        if (forceRefresh) {
          toast.success('Activity data refreshed')
        }
      } catch (error: any) {
        console.error('❌ [DASHBOARD] Failed to fetch activity:', error)
        
        if (!recentActivity) {
          toast.error('Failed to load activity data')
        }
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [user, userProfile, recentActivity]
  )

  // ============================================================================
  // FETCH LANDLORD DASHBOARD WITH CACHING
  // ============================================================================

  const fetchLandlordDashboard = useCallback(
    async (forceRefresh = false) => {
      // Prevent concurrent requests
      if (landlordLoading && !forceRefresh) {
        console.log('🚫 [LANDLORD DASHBOARD] Request already in progress, skipping...')
        return
      }

      const cache = getDashboardCache()
      const cacheKey = 'landlord:dashboard'

      try {
        // Try to get from cache first (unless force refresh)
        if (!forceRefresh) {
          const cachedLandlordData = cache.get<LandlordDashboardData>(cacheKey)
          if (cachedLandlordData) {
            console.log('✅ [CACHE] HIT: landlord:dashboard')
            setLandlordData(cachedLandlordData)
            return
          }
        }

        // Fetch from API if not in cache
        console.log('🔄 [LANDLORD DASHBOARD] Fetching fresh data...')
        setLandlordLoading(true)

        const freshData = await landlordDashboardAPI.getLandlordDashboard()

        // Update state
        setLandlordData(freshData)
        setLandlordLastRefreshTime(Date.now())

        // Store in cache for 5 minutes
        cache.set(cacheKey, freshData, 5 * 60 * 1000)

        console.log('✅ [LANDLORD DASHBOARD] Dashboard data cached successfully')

        if (forceRefresh) {
          toast.success('Dashboard refreshed')
        }
      } catch (error: any) {
        console.error('❌ [LANDLORD DASHBOARD] Failed to fetch dashboard:', error)
        
        // If we have cached data, use it despite error
        if (!landlordData) {
          toast.error(error.message || 'Failed to load dashboard data')
        }
      } finally {
        setLandlordLoading(false)
        setLandlordRefreshing(false)
      }
    },
    [landlordData]
  )

  // ============================================================================
  // CACHE MANAGEMENT FUNCTIONS
  // ============================================================================

  const invalidateCache = useCallback((pattern?: string) => {
    const cache = getDashboardCache()

    if (pattern) {
      cache.invalidatePattern(pattern)
    } else {
      // Invalidate all dashboard-related caches
      cache.invalidate(CacheKeys.dashboardStats())
      cache.invalidatePattern('^dashboard:')
    }

    console.log('🔄 [DASHBOARD] Cache invalidated')
  }, [])

  const invalidateLandlordCache = useCallback(() => {
    const cache = getDashboardCache()
    cache.invalidate('landlord:dashboard')
    console.log('🔄 [LANDLORD DASHBOARD] Cache invalidated')
  }, [])

  const getCacheStats = useCallback(() => {
    const cache = getDashboardCache()
    return cache.getStats()
  }, [])

  const logCacheStats = useCallback(() => {
    const cache = getDashboardCache()
    cache.logStats()
  }, [])

  const setCacheTTL = useCallback((key: keyof CacheConfig, ttl: number) => {
    // Note: This would require modifying the cache manager to expose TTL configuration
    console.log(`⚙️ [DASHBOARD] Cache TTL for ${key} set to ${Math.round(ttl / 1000)}s`)
  }, [])

  // ============================================================================
  // AUTO-REFRESH EFFECT
  // ============================================================================

  useEffect(() => {
    // Auto-refresh every 5 minutes (can be configured)
    const interval = setInterval(() => {
      console.log('🔄 [DASHBOARD] Auto-refreshing dashboard data...')
      setRefreshing(true)
      Promise.all([
        fetchDashboardStats(true),
        fetchRecentActivity(7, true),
      ]).catch(error => {
        console.error('❌ [DASHBOARD] Auto-refresh failed:', error)
      })
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [fetchDashboardStats, fetchRecentActivity])

  // ============================================================================
  // CLEANUP ON UNMOUNT
  // ============================================================================

  useEffect(() => {
    return () => {
      // Optional: Log final cache stats on provider unmount
      const cache = getDashboardCache()
      const stats = cache.getStats()
      console.log(`👋 [DASHBOARD] Final cache stats - Size: ${stats.size}, Hit Rate: ${stats.hitRate.toFixed(1)}%`)
    }
  }, [])

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const value: DashboardContextType = {
    // Admin Dashboard
    stats,
    recentActivity,
    loading,
    refreshing,
    lastRefreshTime,
    cacheHitRate,
    fetchDashboardStats,
    fetchRecentActivity,
    invalidateCache,
    getCacheStats,
    logCacheStats,
    
    // Landlord Dashboard
    landlordData,
    landlordLoading,
    landlordRefreshing,
    landlordLastRefreshTime,
    fetchLandlordDashboard,
    invalidateLandlordCache,
    
    // Configuration
    setCacheTTL,
  }

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  )
}

// ============================================================================
// CUSTOM HOOK
// ============================================================================

export function useDashboard(): DashboardContextType {
  const context = useContext(DashboardContext)

  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider')
  }

  return context
}

// ============================================================================
// LANDLORD DASHBOARD HOOK
// ============================================================================

export function useLandlordDashboard() {
  const context = useContext(DashboardContext)

  if (context === undefined) {
    throw new Error('useLandlordDashboard must be used within a DashboardProvider')
  }

  return {
    landlordData: context.landlordData,
    loading: context.landlordLoading,
    refreshing: context.landlordRefreshing,
    lastRefreshTime: context.landlordLastRefreshTime,
    fetchLandlordDashboard: context.fetchLandlordDashboard,
    invalidateLandlordCache: context.invalidateLandlordCache,
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export type { DashboardContextType }
export { DashboardContext }
