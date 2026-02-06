/**
 * Simple in-memory cache for properties search
 */

interface CacheEntry {
  data: any;
  timestamp: number;
  params: string;
}

class PropertiesCache {
  private cache = new Map<string, CacheEntry>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes TTL

  private getCacheKey(params: any): string {
    return JSON.stringify(params);
  }

  get(params: any): any | null {
    const key = this.getCacheKey(params);
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Check if cache is still valid
    if (Date.now() - entry.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }
    
    console.log('📦 [CACHE] Cache hit for properties search');
    return entry.data;
  }

  set(params: any, data: any): void {
    const key = this.getCacheKey(params);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      params: key
    });
    
    console.log('💾 [CACHE] Cached properties search result');
    
    // Clean up old entries periodically
    if (this.cache.size > 10) {
      this.cleanup();
    }
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.TTL) {
        this.cache.delete(key);
      }
    }
    console.log('🧹 [CACHE] Cleaned up expired cache entries');
  }

  clear(): void {
    this.cache.clear();
    console.log('🗑️ [CACHE] Cleared all cache entries');
  }
}

export const propertiesCache = new PropertiesCache();
