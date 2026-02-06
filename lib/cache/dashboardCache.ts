/**
 * Dashboard Cache Manager
 * 🎯 Purpose: Reduce redundant API calls by implementing intelligent caching
 * ✅ Features:
 *   - In-memory cache with TTL (Time To Live)
 *   - Automatic cache expiration
 *   - Cache invalidation strategies
 *   - Debug logging for monitoring
 *   - Session-aware caching
 */

import type { AdminDashboardStats, RecentActivityResponse } from '@/lib/api/adminDashboard'

// ============================================================================
// CACHE TYPES & INTERFACES
// ============================================================================

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number // milliseconds
  expiresAt: number
  accessCount: number
  lastAccessTime: number
}

interface CacheStats {
  hits: number
  misses: number
  expirations: number
  lastCleanup: number
}

interface CacheConfig {
  dashboardStats: number // TTL in ms
  recentActivity: number
  recentSignups: number
  maxEntries: number
  cleanupInterval: number
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG: CacheConfig = {
  dashboardStats: 5 * 60 * 1000, // 5 minutes
  recentActivity: 5 * 60 * 1000, // 5 minutes
  recentSignups: 10 * 60 * 1000, // 10 minutes
  maxEntries: 50,
  cleanupInterval: 1 * 60 * 1000, // 1 minute
}

// ============================================================================
// DASHBOARD CACHE MANAGER CLASS
// ============================================================================

class DashboardCacheManager {
  private cache: Map<string, CacheEntry<any>> = new Map()
  private config: CacheConfig = DEFAULT_CONFIG
  private cacheStats: CacheStats = {
    hits: 0,
    misses: 0,
    expirations: 0,
    lastCleanup: Date.now(),
  }
  private cleanupIntervalId: NodeJS.Timeout | null = null
  private sessionId: string = ''

  constructor(config?: Partial<CacheConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.sessionId = this.generateSessionId()
    this.startCleanupInterval()
    this.logInit()
  }

  /**
   * Generate unique session ID (valid for session duration)
   */
  private generateSessionId(): string {
    if (typeof window === 'undefined') return 'server'
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Start automatic cleanup interval
   */
  private startCleanupInterval(): void {
    if (typeof window === 'undefined') return // Skip on server
    
    this.cleanupIntervalId = setInterval(() => {
      this.cleanup()
    }, this.config.cleanupInterval)
  }

  /**
   * Stop cleanup interval (call on page unload)
   */
  public stopCleanupInterval(): void {
    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId)
      this.cleanupIntervalId = null
    }
  }

  /**
   * Clean up expired cache entries
   */
  private cleanup(): void {
    const now = Date.now()
    let expiredCount = 0

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
        expiredCount++
        this.cacheStats.expirations++
      }
    }

    if (expiredCount > 0) {
      console.log(
        `🧹 [CACHE] Cleaned up ${expiredCount} expired entries. Cache size: ${this.cache.size}`
      )
    }

    this.cacheStats.lastCleanup = now
  }

  /**
   * Get value from cache
   */
  public get<T>(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) {
      this.cacheStats.misses++
      console.log(`❌ [CACHE] MISS: ${key}`)
      return null
    }

    const now = Date.now()

    // Check if expired
    if (now > entry.expiresAt) {
      this.cache.delete(key)
      this.cacheStats.expirations++
      this.cacheStats.misses++
      console.log(`⏰ [CACHE] EXPIRED: ${key} (age: ${Math.round((now - entry.timestamp) / 1000)}s)`)
      return null
    }

    // Update access info
    entry.accessCount++
    entry.lastAccessTime = now
    const ageSeconds = Math.round((now - entry.timestamp) / 1000)

    this.cacheStats.hits++
    console.log(
      `✅ [CACHE] HIT: ${key} (age: ${ageSeconds}s, accesses: ${entry.accessCount})`
    )

    return entry.data
  }

  /**
   * Set value in cache
   */
  public set<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now()
    const actualTtl = ttl || this.config.dashboardStats
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      ttl: actualTtl,
      expiresAt: now + actualTtl,
      accessCount: 0,
      lastAccessTime: now,
    }

    this.cache.set(key, entry)

    console.log(
      `💾 [CACHE] SET: ${key} (TTL: ${Math.round(actualTtl / 1000)}s, size: ${this.cache.size})`
    )

    // Enforce max entries
    if (this.cache.size > this.config.maxEntries) {
      this.evictLRU()
    }
  }

  /**
   * Evict Least Recently Used (LRU) entry
   */
  private evictLRU(): void {
    let lruKey: string | null = null
    let lruTime = Date.now()

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessTime < lruTime) {
        lruTime = entry.lastAccessTime
        lruKey = key
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey)
      console.log(`🗑️  [CACHE] Evicted LRU entry: ${lruKey}`)
    }
  }

  /**
   * Check if cache entry exists and is valid
   */
  public has(key: string): boolean {
    const entry = this.cache.get(key)

    if (!entry) return false

    const now = Date.now()
    if (now > entry.expiresAt) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  /**
   * Invalidate single cache entry
   */
  public invalidate(key: string): void {
    if (this.cache.has(key)) {
      this.cache.delete(key)
      console.log(`🚫 [CACHE] Invalidated: ${key}`)
    }
  }

  /**
   * Invalidate multiple entries by pattern
   */
  public invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern)
    let invalidatedCount = 0

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
        invalidatedCount++
      }
    }

    if (invalidatedCount > 0) {
      console.log(`🚫 [CACHE] Invalidated ${invalidatedCount} entries matching "${pattern}"`)
    }
  }

  /**
   * Clear entire cache
   */
  public clear(): void {
    const size = this.cache.size
    this.cache.clear()
    console.log(`🧨 [CACHE] Cleared all ${size} entries`)
  }

  /**
   * Get cache statistics
   */
  public getStats(): CacheStats & { size: number; hitRate: number } {
    const total = this.cacheStats.hits + this.cacheStats.misses
    const hitRate = total > 0 ? (this.cacheStats.hits / total) * 100 : 0

    return {
      ...this.cacheStats,
      size: this.cache.size,
      hitRate,
    }
  }

  /**
   * Log cache statistics
   */
  public logStats(): void {
    const stats = this.getStats()
    console.log(`
📊 [CACHE STATS]
  Size: ${stats.size}/${this.config.maxEntries}
  Hits: ${stats.hits} | Misses: ${stats.misses}
  Hit Rate: ${stats.hitRate.toFixed(1)}%
  Expirations: ${stats.expirations}
  Last Cleanup: ${new Date(stats.lastCleanup).toLocaleTimeString()}
    `)
  }

  /**
   * Log initialization
   */
  private logInit(): void {
    console.log(`
🚀 [CACHE] Dashboard Cache Manager Initialized
  Session ID: ${this.sessionId}
  Dashboard Stats TTL: ${Math.round(this.config.dashboardStats / 1000)}s
  Recent Activity TTL: ${Math.round(this.config.recentActivity / 1000)}s
  Max Entries: ${this.config.maxEntries}
  Cleanup Interval: ${Math.round(this.config.cleanupInterval / 1000)}s
    `)
  }

  /**
   * Reset statistics
   */
  public resetStats(): void {
    this.cacheStats = {
      hits: 0,
      misses: 0,
      expirations: 0,
      lastCleanup: Date.now(),
    }
    console.log(`🔄 [CACHE] Statistics reset`)
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let cacheManagerInstance: DashboardCacheManager | null = null

export function initializeDashboardCache(config?: Partial<CacheConfig>): DashboardCacheManager {
  if (!cacheManagerInstance) {
    cacheManagerInstance = new DashboardCacheManager(config)
  }
  return cacheManagerInstance
}

export function getDashboardCache(): DashboardCacheManager {
  if (!cacheManagerInstance) {
    cacheManagerInstance = new DashboardCacheManager()
  }
  return cacheManagerInstance
}

export function resetDashboardCache(): void {
  if (cacheManagerInstance) {
    cacheManagerInstance.clear()
    cacheManagerInstance.stopCleanupInterval()
    cacheManagerInstance = null
  }
}

// ============================================================================
// CACHE KEY GENERATORS
// ============================================================================

export const CacheKeys = {
  dashboardStats: () => 'dashboard:stats',
  recentActivity: (days: number) => `dashboard:activity:${days}d`,
  recentSignups: (days: number) => `dashboard:signups:${days}d`,
  tenantsList: (page: number, limit: number) => `dashboard:tenants:${page}:${limit}`,
  landlordsList: (page: number, limit: number) => `dashboard:landlords:${page}:${limit}`,
  propertyDetail: (id: string) => `dashboard:property:${id}`,
  verificationDetail: (id: string, type: string) => `dashboard:verification:${type}:${id}`,
}

// ============================================================================
// EXPORT
// ============================================================================

export type { CacheEntry, CacheStats, CacheConfig }
export default getDashboardCache
